"""
Voice Agent Service - Flask-based voice assistant
Based on user's provided code
"""

import os
import threading
import random
import subprocess
import time
import queue
import hashlib
import uuid
import numpy as np
import torch
import torchaudio
import yt_dlp
import speech_recognition as sr
from flask import Flask, request, render_template, jsonify
from dotenv import load_dotenv
from groq import Groq
from gtts import gTTS
from speechbrain.inference import SpeakerRecognition
from pydub import AudioSegment
import wave
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

load_dotenv()

app = Flask(__name__, template_folder='templates')

# Initialize Groq client
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None

SYSTEM_MESSAGE = {
    "role": "system",
    "content": (
        "You are Dhyan Voice Assistant, a friendly and helpful assistant with a cute and playful personality. "
        "You aim to assist children and users with a wide range of questions and tasks, "
        "providing clear and concise answers with a touch of fun."
    )
}

# Global state
conversation_history = []
current_playback_process = None
global_stop_event = threading.Event()
processing_lock = threading.Lock()

# Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MUSIC_DIR = os.path.join(BASE_DIR, "music")
TEMP_DIR = os.path.join(BASE_DIR, "temp")
AUDIO_CACHE = os.path.join(BASE_DIR, "audio_cache")
ENROLL_DIR = os.path.join(BASE_DIR, "enrolled_references")

for dir_path in [MUSIC_DIR, TEMP_DIR, AUDIO_CACHE, ENROLL_DIR]:
    os.makedirs(dir_path, exist_ok=True)

# Speaker verification
verifier = None
try:
    verifier = SpeakerRecognition.from_hparams(
        source="speechbrain/spkrec-ecapa-voxceleb",
        savedir=os.path.join(BASE_DIR, "pretrained_models", "spkrec-ecapa-voxceleb")
    )
except Exception as e:
    print(f"[VoiceAgent] Speaker verification disabled: {e}")

EXPECTED_SAMPLE_RATE = 16000

# Load enrolled speakers
registered_speakers = {}
if os.path.isdir(ENROLL_DIR):
    for fn in os.listdir(ENROLL_DIR):
        if fn.endswith("_embedding.npy"):
            name = fn.replace("_embedding.npy", "")
            registered_speakers[name] = np.load(os.path.join(ENROLL_DIR, fn))

# Helper functions
def get_md5_hash(text):
    return hashlib.md5(text.encode('utf-8')).hexdigest()

def generate_audio(text, output_file):
    if not os.path.isabs(output_file):
        output_file = os.path.join(AUDIO_CACHE, output_file)
    if os.path.exists(output_file):
        return output_file
    
    try:
        tts = gTTS(text=text, lang="en")
        temp_file = os.path.join(TEMP_DIR, "temp.mp3")
        tts.save(temp_file)
        
        # Apply effects
        audio = AudioSegment.from_mp3(temp_file)
        audio = audio._spawn(audio.raw_data, overrides={'frame_rate': int(audio.frame_rate * 1.15)})
        audio = audio.speedup(playback_speed=1.1)
        audio.export(output_file, format="mp3")
        
        os.remove(temp_file)
        return output_file
    except Exception as e:
        print(f"[VoiceAgent] Audio generation error: {e}")
        return None

def play_audio(file_path):
    global current_playback_process
    if global_stop_event.is_set():
        return
    
    try:
        current_playback_process = subprocess.Popen(["mpg123", "-q", file_path])
        current_playback_process.wait()
    except FileNotFoundError:
        try:
            current_playback_process = subprocess.Popen(["ffplay", "-nodisp", "-autoexit", file_path])
            current_playback_process.wait()
        except:
            pass

def compute_embedding(audio_path):
    if not verifier:
        return None
    try:
        sig, sr_rate = torchaudio.load(audio_path)
        if sr_rate != EXPECTED_SAMPLE_RATE:
            sig = torchaudio.transforms.Resample(sr_rate, EXPECTED_SAMPLE_RATE)(sig)
        if sig.shape[0] > 1:
            sig = sig.mean(dim=0, keepdim=True)
        with torch.no_grad():
            emb = verifier.encode_batch(sig)
        return emb.mean(dim=1).squeeze(0).cpu().numpy()
    except Exception as e:
        return None

def verify_speaker(audio_path, threshold=0.30):
    if not registered_speakers or not verifier:
        return None
    
    emb = compute_embedding(audio_path)
    if emb is None:
        return None

    def cosine(a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    best_name, best_score = None, 0.0
    for name, ref in registered_speakers.items():
        score = cosine(emb, ref)
        if score > best_score:
            best_score, best_name = score, name

    return best_name if best_score >= threshold else None

def is_valid_wav(file_path):
    try:
        with wave.open(file_path, 'rb') as wav_file:
            wav_file.getparams()
        return True
    except:
        return False

def convert_to_wav(input_path, output_path):
    try:
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio.export(output_path, format="wav")
        return True
    except:
        return False

def transcribe_audio(audio_path):
    r = sr.Recognizer()
    
    if not is_valid_wav(audio_path):
        converted_path = os.path.join(TEMP_DIR, f"converted_{uuid.uuid4()}.wav")
        if not convert_to_wav(audio_path, converted_path):
            return None
        audio_path = converted_path
    
    try:
        with sr.AudioFile(audio_path) as source:
            audio = r.record(source)
        return r.recognize_google(audio)
    except:
        return None
    finally:
        if 'converted_path' in locals() and os.path.exists(converted_path):
            os.remove(converted_path)

# Thinking messages
thinking_messages = [
    "Hmm, let me put on my thinking cap for this one!",
    "Oh dear, that's a tricky one. Let me see...",
    "This one is a bit of a brain teaser, give me a sec!",
    "Hold on, I'm crunching the numbers in my head!",
    "Let me think, that's a challenging question!",
    "Hold tight, I'm sprinkling some magic dust on that answer!",
    "Just a moment, I'm mixing up a potion of ideas!",
    "Give me a second, I'm busy doodling clever thoughts!"
]

# Pre-generate audio files
thinking_audio_files = {}
for msg in thinking_messages:
    safe_name = "thinking_" + get_md5_hash(msg) + ".mp3"
    audio_path = generate_audio(msg, safe_name)
    if audio_path:
        thinking_audio_files[msg] = audio_path

default_message = "Hi, I'm Dhyan Voice Assistant! I'm here to chat, tell jokes, and help you learn!"
default_audio_file = generate_audio(default_message, "default.mp3")

def thinking_loop(stop_event, first_chunk_ready_event):
    while not stop_event.is_set() and not first_chunk_ready_event.is_set():
        msg = random.choice(thinking_messages)
        thinking_audio = thinking_audio_files.get(msg)
        if thinking_audio and os.path.exists(thinking_audio):
            try:
                proc = subprocess.Popen(["mpg123", "-q", thinking_audio])
                while proc.poll() is None:
                    if stop_event.is_set() or first_chunk_ready_event.is_set():
                        proc.terminate()
                        break
                    time.sleep(0.1)
            except:
                time.sleep(1)

def conversion_thread(chunks, out_queue, first_chunk_ready_event):
    for chunk in chunks:
        if global_stop_event.is_set():
            break
        safe_name = "response_" + get_md5_hash(chunk) + ".mp3"
        audio_path = generate_audio(chunk, safe_name)
        if audio_path:
            if not first_chunk_ready_event.is_set():
                first_chunk_ready_event.set()
            out_queue.put(audio_path)
    out_queue.put(None)

def playback_thread(in_queue):
    while not global_stop_event.is_set():
        file_path = in_queue.get()
        if file_path is None:
            break
        play_audio(file_path)

def search_and_play_song(song_name):
    global current_playback_process
    global_stop_event.set()
    time.sleep(0.2)
    global_stop_event.clear()

    song_hash = get_md5_hash(song_name)
    song_path = os.path.join(MUSIC_DIR, f"{song_hash}.mp3")

    if os.path.exists(song_path):
        play_audio(song_path)
        return "Playing your song!"

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': song_path.replace(".mp3", ".%(ext)s"),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            search_query = f"ytsearch:{song_name} official audio"
            ydl.extract_info(search_query, download=True)
    except Exception as e:
        return f"Error fetching song: {str(e)}"

    play_audio(song_path)
    return "Playing your song!"

def process_user_command(new_command):
    global conversation_history, current_playback_process

    global_stop_event.set()
    time.sleep(0.2)
    global_stop_event.clear()

    if new_command.lower() == "stop":
        if current_playback_process:
            current_playback_process.terminate()
        return "Stopped."

    if new_command.lower().startswith("play this song"):
        song_name = new_command[len("play this song"):].strip()
        return search_and_play_song(song_name)

    cmd_lower = new_command.lower()
    additional_instruction = ""
    chunk_size = 3
    required_lines = 4

    if "detail" in cmd_lower or "explain in detail" in cmd_lower:
        additional_instruction = " Please provide a detailed explanation that is at most 8 lines."
        chunk_size = 2
        required_lines = 8
    else:
        additional_instruction = " Please provide a short and to-the-point answer that is at most 4 lines."

    with processing_lock:
        try:
            if not client:
                return "AI service is not configured. Please set GROQ_API_KEY."
            
            messages = [SYSTEM_MESSAGE] + conversation_history + [
                {"role": "user", "content": new_command + additional_instruction}
            ]
            chat_completion = client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile"
            )
            full_response = chat_completion.choices[0].message.content
        except Exception as e:
            return f"Oops! Something went wrong: {str(e)}"

        lines = full_response.splitlines()
        if len(lines) <= 1:
            sentences = full_response.split('. ')
            lines = [s.strip() for s in sentences if s.strip()]
        limited_lines = lines[:required_lines]

        chunks = [
            "\n".join(limited_lines[i:i+chunk_size])
            for i in range(0, len(limited_lines), chunk_size)
        ]

        chunks_queue = queue.Queue()
        first_chunk_ready_event = threading.Event()

        conv_thread = threading.Thread(
            target=conversion_thread,
            args=(chunks, chunks_queue, first_chunk_ready_event)
        )
        conv_thread.start()

        thinking_stop_event = threading.Event()
        think_thread = threading.Thread(
            target=thinking_loop,
            args=(thinking_stop_event, first_chunk_ready_event)
        )
        think_thread.start()

        while not first_chunk_ready_event.is_set() and not global_stop_event.is_set():
            time.sleep(0.1)
        thinking_stop_event.set()
        think_thread.join()

        play_thread = threading.Thread(target=playback_thread, args=(chunks_queue,))
        play_thread.start()

        conv_thread.join()
        play_thread.join()

        conversation_history.append({"role": "user", "content": new_command + additional_instruction})
        conversation_history.append({"role": "assistant", "content": full_response})

        return "\n".join(limited_lines)

# Flask routes
@app.route('/')
def index():
    return render_template('voice_interface.html')

@app.route('/command', methods=['POST'])
def process_command():
    new_command = request.form.get('command', '').strip()
    response_text = process_user_command(new_command)
    return render_template('index.html', response=response_text)

@app.route('/api/command', methods=['POST'])
def api_command():
    data = request.get_json()
    new_command = data.get('command', '').strip()
    response_text = process_user_command(new_command)
    return jsonify({'response': response_text})

@app.route('/process_audio', methods=['POST'])
def process_audio():
    if 'audio' not in request.files:
        return jsonify({'status': 'error', 'message': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    path = os.path.join(TEMP_DIR, f"input_{uuid.uuid4()}.wav")
    audio_file.save(path)

    # Skip speaker verification if no speakers enrolled
    if registered_speakers:
        speaker = verify_speaker(path)
        if not speaker:
            os.remove(path)
            return jsonify({'status': 'error', 'message': 'Unrecognized speaker'}), 403

    text = transcribe_audio(path)
    if not text:
        os.remove(path)
        return jsonify({'status': 'error', 'message': 'Could not understand the audio'}), 400

    response_text = process_user_command(text)
    os.remove(path)
    return jsonify({'status': 'success', 'text': text, 'response': response_text})

@app.route('/enroll_speaker', methods=['POST'])
def enroll_speaker():
    if 'audio' not in request.files or 'name' not in request.form:
        return jsonify({'status': 'error', 'message': 'Audio file and name required'}), 400
    
    audio_file = request.files['audio']
    name = request.form['name']
    
    path = os.path.join(TEMP_DIR, f"enroll_{uuid.uuid4()}.wav")
    audio_file.save(path)
    
    emb = compute_embedding(path)
    if emb is not None:
        np.save(os.path.join(ENROLL_DIR, f"{name}_embedding.npy"), emb)
        registered_speakers[name] = emb
        os.remove(path)
        return jsonify({'status': 'success', 'message': f'Speaker {name} enrolled'})
    
    os.remove(path)
    return jsonify({'status': 'error', 'message': 'Failed to compute embedding'}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'ai_available': client is not None,
        'speakers_enrolled': len(registered_speakers)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
