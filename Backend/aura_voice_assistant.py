import os
import threading
import random
import subprocess
import time
import queue
import hashlib
import uuid
import numpy as np

try:
    import torch
    import torchaudio
    from speechbrain.inference import SpeakerRecognition
    SPEAKER_VERIFICATION_AVAILABLE = True
except Exception as e:
    print(f"[WARNING] Speaker verification disabled: {e}")
    SPEAKER_VERIFICATION_AVAILABLE = False

import yt_dlp
import speech_recognition as sr
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
from gtts import gTTS
from pydub import AudioSegment
import pygame
import wave
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

load_dotenv()

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)

SYSTEM_MESSAGE = {
    "role": "system",
    "content": (
        "You are Aura, a friendly and helpful voice assistant with a cute and playful personality. "
        "You aim to assist users with a wide range of questions and tasks, "
        "providing clear and concise answers with a touch of fun. "
        "\n\nIMPORTANT CAPABILITIES YOU HAVE:\n"
        "- You CAN play songs! When a user asks you to play a song, tell them to say 'play this song [song name]' "
        "and you will search for it on YouTube and play it for them.\n"
        "- You have voice output - you speak your responses out loud.\n"
        "- You can understand voice commands.\n"
        "\nWhen users ask about playing music, encourage them to use the 'play this song' command format."
    )
}

conversation_history = []
current_playback_process = None
global_stop_event = threading.Event()
processing_lock = threading.Lock()

MUSIC_DIR = os.path.join(os.getcwd(), "music")
os.makedirs(MUSIC_DIR, exist_ok=True)

TEMP_DIR = os.path.join(os.getcwd(), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

AUDIO_CACHE = os.path.join(os.getcwd(), "audio_cache")
os.makedirs(AUDIO_CACHE, exist_ok=True)

if SPEAKER_VERIFICATION_AVAILABLE:
    try:
        verifier = SpeakerRecognition.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir="pretrained_models/spkrec-ecapa-voxceleb"
        )
        EXPECTED_SAMPLE_RATE = 16000
    except Exception as e:
        print(f"[WARNING] Could not load speaker verification model: {e}")
        SPEAKER_VERIFICATION_AVAILABLE = False
else:
    verifier = None
    EXPECTED_SAMPLE_RATE = 16000

ENROLL_DIR = "enrolled_references"
registered_speakers = {}

if os.path.isdir(ENROLL_DIR):
    for fn in os.listdir(ENROLL_DIR):
        if fn.endswith("_embedding.npy"):
            name = fn.replace("_embedding.npy", "")
            registered_speakers[name] = np.load(os.path.join(ENROLL_DIR, fn))
    print(f"[DEBUG] Loaded speakers: {list(registered_speakers.keys())}")
else:
    print("[DEBUG] No enrolled_references folder found. Speaker verification disabled.")


def get_md5_hash(text):
    return hashlib.md5(text.encode('utf-8')).hexdigest()


def generate_audio(text, output_file):
    if not os.path.isabs(output_file):
        output_file = os.path.join(AUDIO_CACHE, output_file)

    if os.path.exists(output_file):
        print(f"[DEBUG] Audio file already exists: {output_file}")
        return

    print(f"[DEBUG] Generating audio for text: '{text}' -> {output_file}")
    tts = gTTS(text=text, lang="en", slow=False, tld='com')
    tts.save(output_file)


def play_audio(file_path):
    global current_playback_process
    if global_stop_event.is_set():
        return

    print(f"[DEBUG] Playing audio: {file_path}")

    try:
        pygame.mixer.music.load(file_path)
        pygame.mixer.music.set_volume(0.8)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            if global_stop_event.is_set():
                pygame.mixer.music.stop()
                break
            time.sleep(0.1)

        print(f"[DEBUG] Playback completed successfully: {file_path}")
    except Exception as e:
        print(f"[DEBUG] Playback error: {e}")


def compute_embedding(audio_path):
    if not SPEAKER_VERIFICATION_AVAILABLE:
        return None

    sig, sr_rate = torchaudio.load(audio_path)

    if sr_rate != EXPECTED_SAMPLE_RATE:
        sig = torchaudio.transforms.Resample(sr_rate, EXPECTED_SAMPLE_RATE)(sig)

    if sig.shape[0] > 1:
        sig = sig.mean(dim=0, keepdim=True)

    with torch.no_grad():
        emb = verifier.encode_batch(sig)

    return emb.mean(dim=1).squeeze(0).cpu().numpy()


def verify_speaker(audio_path, threshold=0.30):
    if not registered_speakers:
        print("[DEBUG] No registered speakers available.")
        return None

    try:
        emb = compute_embedding(audio_path)
    except Exception as e:
        print(f"[DEBUG] Embedding error: {e}")
        return None

    def cosine(a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    best_name, best_score = None, 0.0

    for name, ref in registered_speakers.items():
        score = cosine(emb, ref)
        print(f"[DEBUG] Similarity {name}: {score:.3f}")
        if score > best_score:
            best_score, best_name = score, name

    if best_score >= threshold:
        print(f"[DEBUG] Verified speaker: {best_name} ({best_score:.3f})")
        return best_name

    print(f"[DEBUG] No match above threshold {threshold}")
    return None


def is_valid_wav(file_path):
    try:
        with wave.open(file_path, 'rb') as wav_file:
            wav_file.getparams()
        return True
    except wave.Error:
        return False


def convert_to_wav(input_path, output_path):
    try:
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio.export(output_path, format="wav")
        print(f"[DEBUG] Converted {input_path} to {output_path}")
        return True
    except Exception as e:
        print(f"[DEBUG] Conversion error: {e}")
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

        text = r.recognize_google(audio)
        print(f"[DEBUG] Transcribed text: {text}")
        return text

    except sr.UnknownValueError:
        print("[DEBUG] Speech recognition could not understand the audio.")
        return None

    except sr.RequestError as e:
        print(f"[DEBUG] Speech recognition request failed: {e}")
        return None

    finally:
        if 'converted_path' in locals() and os.path.exists(converted_path):
            os.remove(converted_path)


default_message = "Hi, I'm Aura, your personal assistant!"
default_audio_file = os.path.join(AUDIO_CACHE, "default.mp3")

if not os.path.exists(default_audio_file):
    generate_audio(default_message, "default.mp3")

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

thinking_audio_files = {}

for msg in thinking_messages:
    safe_name = "thinking_" + get_md5_hash(msg) + ".mp3"
    generate_audio(msg, safe_name)
    thinking_audio_files[msg] = os.path.join(AUDIO_CACHE, safe_name)


def get_random_thinking_message():
    msg = random.choice(thinking_messages)
    return msg, thinking_audio_files[msg]


def thinking_loop(stop_event, first_chunk_ready_event):
    while not stop_event.is_set() and not first_chunk_ready_event.is_set():
        msg, thinking_audio = get_random_thinking_message()
        print(f"[DEBUG] (Thinking Loop) Playing: '{msg}'")

        try:
            pygame.mixer.music.load(thinking_audio)
            pygame.mixer.music.play()

            while pygame.mixer.music.get_busy():
                if stop_event.is_set() or first_chunk_ready_event.is_set():
                    pygame.mixer.music.stop()
                    break

                time.sleep(0.1)

        except Exception as e:
            print(f"[DEBUG] Thinking loop error: {e}")
            time.sleep(1)


def conversion_thread(chunks, out_queue, first_chunk_ready_event):
    for chunk in chunks:
        if global_stop_event.is_set():
            print("[DEBUG] Conversion halted due to stop flag.")
            break

        safe_name = "response_" + get_md5_hash(chunk) + ".mp3"
        generate_audio(chunk, safe_name)

        if not first_chunk_ready_event.is_set():
            first_chunk_ready_event.set()

        out_queue.put(os.path.join(AUDIO_CACHE, safe_name))

    out_queue.put((None, None))


def playback_thread(in_queue):
    while not global_stop_event.is_set():
        file_path = in_queue.get()

        if file_path == (None, None) or file_path is None:
            print("[DEBUG] No more chunks to play.")
            break

        print(f"[DEBUG] Playing response audio: {file_path}")
        play_audio(file_path)


def startup():
    print("[DEBUG] Starting up Aura")
    if os.path.exists(default_audio_file):
        play_audio(default_audio_file)


def search_and_play_song(song_name):
    global current_playback_process

    global_stop_event.set()
    time.sleep(0.2)
    global_stop_event.clear()

    song_hash = get_md5_hash(song_name)
    song_path = os.path.join(MUSIC_DIR, f"{song_hash}.mp3")

    if os.path.exists(song_path):
        print(f"[DEBUG] Playing cached song: {song_path}")
        play_audio(song_path)
        return "Playing your song!"

    print(f"[DEBUG] Searching for song: {song_name}")

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
            info = ydl.extract_info(search_query, download=True)

            if 'entries' in info and len(info['entries']) > 0:
                print(f"[DEBUG] Found song: {info['entries'][0]['title']}")
            else:
                return "Couldn't find the song."

    except Exception as e:
        print(f"[DEBUG] Error while downloading song: {str(e)}")
        return "Error while fetching the song."

    print(f"[DEBUG] Playing downloaded song: {song_path}")
    play_audio(song_path)
    return "Playing your song!"


def process_user_command(new_command):
    global conversation_history, current_playback_process

    global_stop_event.set()
    time.sleep(0.2)
    global_stop_event.clear()

    if new_command.lower() == "stop":
        print("[DEBUG] Stop command received. Terminating current playback.")
        if current_playback_process is not None:
            current_playback_process.terminate()
        return "Stopped."

    if new_command.lower().startswith("play this song"):
        song_name = new_command[len("play this song"):].strip()
        return search_and_play_song(song_name)

    cmd_lower = new_command.lower()

    if cmd_lower in ("one more", "ones more"):
        if conversation_history:
            for msg in reversed(conversation_history):
                if msg["role"] == "user":
                    new_command = msg["content"] + " " + new_command
                    print(f"[DEBUG] Modified command for context: '{new_command}'")
                    break

    additional_instruction = ""
    chunk_size = 10
    required_lines = 4

    if "detail" in cmd_lower or "explain in detail" in cmd_lower or "explain briefly" in cmd_lower:
        additional_instruction = " Please provide a detailed explanation that is at most 8 lines and include one concise summary line at the end."
        chunk_size = 8
        required_lines = 8
    else:
        additional_instruction = " Please provide a short and to-the-point answer that is at most 4 lines."

    with processing_lock:
        print(f"[DEBUG] Calling API for processing command: {new_command}")

        try:
            messages = [SYSTEM_MESSAGE] + conversation_history + [
                {"role": "user", "content": new_command + additional_instruction}
            ]

            chat_completion = client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile"
            )

            full_response = chat_completion.choices[0].message.content
            print(f"[DEBUG] API Response: {full_response}")

        except Exception as e:
            full_response = f"Oops! Something went wrong: {str(e)}"
            print(f"[DEBUG] API Error: {full_response}")

        lines = full_response.splitlines()

        if len(lines) <= 1:
            sentences = full_response.split('. ')
            lines = [s.strip() for s in sentences if s.strip()]

        limited_lines = lines[:required_lines]
        limited_response = "\n".join(limited_lines)

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

        first_chunk_ready_event.wait()

        play_thread = threading.Thread(target=playback_thread, args=(chunks_queue,))
        play_thread.start()

        conv_thread.join()
        play_thread.join()

        conversation_history.append({"role": "user", "content": new_command + additional_instruction})
        conversation_history.append({"role": "assistant", "content": full_response})

        return limited_response


@app.route('/')
def index():
    return render_template('aura.html')


@app.route('/api/command', methods=['POST'])
def process_command():
    data = request.get_json()
    new_command = data.get('command', '').strip()

    if not new_command:
        return jsonify({'status': 'error', 'message': 'No command provided'}), 400

    print(f"[DEBUG] Received command: '{new_command}'")
    response_text = process_user_command(new_command)

    return jsonify({'status': 'success', 'response': response_text})


@app.route('/api/process_audio', methods=['POST'])
def process_audio():
    print(f"[DEBUG] Request files: {request.files}")

    if 'audio' not in request.files:
        print("[DEBUG] No audio file in request")
        return jsonify({'status': 'error', 'message': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    print(f"[DEBUG] Audio file received: {audio_file.filename}")

    path = os.path.join(TEMP_DIR, f"input_command_{uuid.uuid4()}.wav")
    audio_file.save(path)

    print(f"[DEBUG] Received audio file: {path}")

    if not registered_speakers:
        print("[DEBUG] No enrolled speakers, skipping verification.")
    else:
        speaker = verify_speaker(path)
        if not speaker:
            print("[DEBUG] Speaker not recognized.")
            os.remove(path)
            return jsonify({'status': 'error', 'message': 'Unrecognized speaker'}), 403

    text = transcribe_audio(path)

    if not text:
        print("[DEBUG] Failed to transcribe audio.")
        os.remove(path)
        return jsonify({'status': 'error', 'message': 'Could not understand the audio'}), 400

    echo_file = os.path.join(TEMP_DIR, f"echo_{uuid.uuid4()}.mp3")
    generate_audio(f"You said: {text}", echo_file)
    play_audio(echo_file)
    os.remove(echo_file)

    print(f"[DEBUG] Recognized voice command: {text}")

    response_text = process_user_command(text)
    os.remove(path)

    return jsonify({'status': 'success', 'text': text, 'response': response_text})


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Aura is running'})


if __name__ == '__main__':
    startup()
    app.run(host='0.0.0.0', port=5001, debug=True)
