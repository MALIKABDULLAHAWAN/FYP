import os
import threading
import random
import time
import queue
import hashlib
import uuid
from pathlib import Path
from django.http import FileResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from groq import Groq
from gtts import gTTS
import pygame
import speech_recognition as sr
from django.core.files.storage import default_storage
from django.conf import settings

groq_client = None


def get_groq_client():
    global groq_client
    if groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            groq_client = Groq(api_key=api_key)
    return groq_client

pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)

SYSTEM_MESSAGE_EN = {
    "role": "system",
    "content": (
        "You are Aura, a friendly and helpful voice assistant with a cute and playful personality. "
        "You aim to assist users with a wide range of questions and tasks, "
        "providing clear and concise answers with a touch of fun. "
        "\n\nYou have voice output capabilities and can understand voice commands. "
        "You can help with general questions, provide information, tell jokes, stories, and have conversations. "
        "\nKeep responses short and to the point (2-4 sentences max). "
        "Be helpful, friendly, and engaging without being repetitive about your capabilities."
    )
}

SYSTEM_MESSAGE_UR = {
    "role": "system",
    "content": (
        "آپ اورا ہیں، ایک دوستانہ اور مددگار آواز کی معاون جو ایک پیاری اور کھیل کی شخصیت رکھتی ہے۔ "
        "آپ کا مقصد صارفین کی مختلف سوالات اور کاموں میں مدد کرنا ہے، "
        "واضح اور مختصر جوابات فراہم کرنا جن میں تھوڑا سا مزہ ہو۔ "
        "\n\nآپ کے پاس آواز کی صلاحیات ہیں اور آپ آواز کے احکامات سمجھ سکتی ہیں۔ "
        "آپ عام سوالات میں مدد کر سکتی ہیں، معلومات فراہم کر سکتی ہیں، مذاق اور کہانیاں سنا سکتی ہیں۔ "
        "\nجوابات مختصر اور نکتہ پر رکھیں (زیادہ سے زیادہ 2-4 جملے)۔ "
        "مددگار، دوستانہ اور دلچسپ رہیں لیکن اپنی صلاحیات کے بارے میں بار بار نہ بتائیں۔"
    )
}

conversation_history = {}
global_stop_event = threading.Event()
processing_lock = threading.Lock()

AUDIO_CACHE = os.path.join(settings.MEDIA_ROOT, "voice_cache")
os.makedirs(AUDIO_CACHE, exist_ok=True)

thinking_messages = [
    "Hmm, let me put on my thinking cap for this one!",
    "Oh dear, that's a tricky one. Let me see...",
    "This one is a bit of a brain teaser, give me a sec!",
    "Hold on, I'm crunching the numbers in my head!",
    "Let me think, that's a challenging question!",
]


def get_md5_hash(text):
    return hashlib.md5(text.encode('utf-8')).hexdigest()


def generate_audio(text, output_file):
    if not os.path.isabs(output_file):
        output_file = os.path.join(AUDIO_CACHE, output_file)

    if os.path.exists(output_file):
        return output_file

    try:
        tts = gTTS(text=text, lang="en", slow=False, tld='com')
        tts.save(output_file)
        return output_file
    except Exception as e:
        print(f"[ERROR] Audio generation failed: {e}")
        return None


def play_audio(file_path):
    if global_stop_event.is_set():
        return

    try:
        pygame.mixer.music.load(file_path)
        pygame.mixer.music.set_volume(0.8)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            if global_stop_event.is_set():
                pygame.mixer.music.stop()
                break
            time.sleep(0.1)
    except Exception as e:
        print(f"[ERROR] Playback error: {e}")


def transcribe_audio(audio_file):
    try:
        r = sr.Recognizer()
        with sr.AudioFile(audio_file) as source:
            audio = r.record(source)
        text = r.recognize_google(audio)
        return text
    except Exception as e:
        print(f"[ERROR] Transcription failed: {e}")
        return None


def process_command(user_id, command, language="en"):
    global conversation_history, global_stop_event

    global_stop_event.set()
    time.sleep(0.2)
    global_stop_event.clear()

    if user_id not in conversation_history:
        conversation_history[user_id] = []

    with processing_lock:
        try:
            # Select system message based on language
            system_message = SYSTEM_MESSAGE_UR if language == "ur" else SYSTEM_MESSAGE_EN
            
            messages = [system_message] + conversation_history[user_id][-10:] + [
                {"role": "user", "content": command}
            ]

            client = get_groq_client()
            if client is None:
                lower_command = command.lower()
                if any(word in lower_command for word in ["hello", "hi", "hey", "salam", "assalam"]):
                    response_text = "Hello! I’m Aura, and I’m here with you. How can I help today?" if language != "ur" else "السلام علیکم! میں اورا ہوں، آپ کی مدد کے لیے حاضر ہوں۔ آج میں آپ کی کیا مدد کر سکتی ہوں؟"
                else:
                    response_text = "I’m here, but my AI key isn’t configured yet. Please set GROQ_API_KEY to enable full responses." if language != "ur" else "میں حاضر ہوں، لیکن میرا AI key ابھی configured نہیں ہے۔ مکمل جوابات کے لیے GROQ_API_KEY سیٹ کریں۔"
            else:
                chat_completion = client.chat.completions.create(
                    messages=messages,
                    model="llama-3.3-70b-versatile"
                )

                response_text = chat_completion.choices[0].message.content

            conversation_history[user_id].append({"role": "user", "content": command})
            conversation_history[user_id].append({"role": "assistant", "content": response_text})

            # Generate and play audio response
            audio_file = generate_audio_response(response_text, language)
            if audio_file:
                play_audio(audio_file)

            return response_text

        except Exception as e:
            error_msg = f"خرابی: {str(e)}" if language == "ur" else f"Error: {str(e)}"
            return error_msg


def _audio_path_from_filename(filename):
    safe_name = Path(filename).name
    audio_path = os.path.join(AUDIO_CACHE, safe_name)
    if not os.path.isfile(audio_path):
        raise Http404("Audio file not found")
    return audio_path


def generate_audio_response(text, language="en"):
    """Generate audio file for response text"""
    try:
        text_hash = get_md5_hash(f"{text}_{language}")
        audio_file = os.path.join(AUDIO_CACHE, f"response_{text_hash}.mp3")
        
        if not os.path.exists(audio_file):
            # Use appropriate language for gTTS
            lang_code = "ur" if language == "ur" else "en"
            tld = "com.pk" if language == "ur" else "com"
            
            tts = gTTS(text=text, lang=lang_code, slow=False, tld=tld)
            tts.save(audio_file)
            print(f"[DEBUG] Generated audio ({language}): {audio_file}")
        
        return audio_file
    except Exception as e:
        print(f"[ERROR] Audio generation failed: {e}")
        return None


@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def voice_command(request):
    """Process voice command"""
    if request.method == 'OPTIONS':
        return Response({'status': 'ok'})
    
    try:
        data = request.data
        command = data.get('command', '').strip()
        language = data.get('language', 'en')

        if not command:
            return Response(
                {'error': 'No command provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_id = getattr(request.user, 'id', 'anonymous')
        print(f"[VOICE] Processing command from user {user_id} ({language}): {command}")
        
        response_text = process_command(user_id, command, language)
        
        print(f"[VOICE] Response: {response_text}")

        # Generate audio file for the response
        audio_file = generate_audio_response(response_text, language)
        audio_url = None
        if audio_file:
            # Create URL for the audio file
            audio_filename = os.path.basename(audio_file)
            audio_url = f"/api/v1/voice/audio/{audio_filename}/"

        return Response({
            'status': 'success',
            'response': response_text,
            'audio_url': audio_url
        })

    except Exception as e:
        print(f"[VOICE ERROR] {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def serve_audio(request, filename):
    """Stream a generated voice response audio file."""
    try:
        audio_path = _audio_path_from_filename(filename)
        return FileResponse(open(audio_path, 'rb'), content_type='audio/mpeg')
    except Http404:
        raise
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def process_audio(request):
    """Process audio file"""
    try:
        if 'audio' not in request.FILES:
            return Response(
                {'error': 'No audio file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        audio_file = request.FILES['audio']
        temp_path = os.path.join(AUDIO_CACHE, f"temp_{uuid.uuid4()}.wav")

        with open(temp_path, 'wb') as f:
            for chunk in audio_file.chunks():
                f.write(chunk)

        text = transcribe_audio(temp_path)

        if not text:
            os.remove(temp_path)
            return Response(
                {'error': 'Could not understand the audio'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_id = getattr(request.user, 'id', 'anonymous')
        response_text = process_command(user_id, text)

        os.remove(temp_path)

        return Response({
            'status': 'success',
            'text': text,
            'response': response_text
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def voice_health(request):
    """Check voice assistant health"""
    return Response({
        'status': 'ok',
        'message': 'Voice Assistant is running'
    })
