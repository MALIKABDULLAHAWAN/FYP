"""
DHYAN Voice Assistant Service
Integrated from Aura voice agent with enhancements
"""

import os
import threading
import random
import subprocess
import time
import queue
import hashlib
import uuid
import re
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
from gtts import gTTS
import speech_recognition as sr
import warnings

# Suppress warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Load environment variables
load_dotenv()

class VoiceAssistantService:
    """
    Enhanced Voice Assistant for DHYAN
    - Speech recognition
    - AI responses via Groq
    - Text-to-speech
    - Music playback
    - Child-friendly responses
    """
    
    def __init__(self):
        # Initialize Groq client only if API key is available
        api_key = os.getenv("GROQ_API_KEY")
        if api_key and api_key != "your_groq_api_key_here":
            self.client = Groq(api_key=api_key)
            self.ai_available = True
        else:
            self.client = None
            self.ai_available = False
            
        self.conversation_history = []
        self.current_playback_process = None
        self.global_stop_event = threading.Event()
        self.processing_lock = threading.Lock()
        
        # Directories
        self.base_dir = Path(__file__).parent.parent.parent
        self.music_dir = self.base_dir / "voice_music"
        self.temp_dir = self.base_dir / "voice_temp"
        self.audio_cache = self.base_dir / "voice_cache"
        
        # Create directories
        self.music_dir.mkdir(exist_ok=True)
        self.temp_dir.mkdir(exist_ok=True)
        self.audio_cache.mkdir(exist_ok=True)
        
        # DHYAN System Message - Child-friendly
        self.system_message = {
            "role": "system",
            "content": (
                "You are Dhyan, a friendly, encouraging, and playful AI companion for children with autism and learning differences. "
                "You help them learn, play games, practice speech, and feel confident. "
                "Keep responses short (2-4 sentences), use positive reinforcement, and be patient and kind. "
                "Use simple language suitable for children ages 5-12. "
                "You can: play games, tell jokes, sing songs, help with homework, encourage them, and be their friend. "
                "Always be supportive and celebrate their efforts!"
            )
        }
        
        # Thinking messages for kids
        self.thinking_messages = [
            "Hmm, let me think about that! 🧠",
            "Oh! That's a good question! Let me see... 🤔",
            "Give me a second, I'm thinking hard! 💭",
            "Wow, that's interesting! Let me find the answer! ✨",
            "Hold on, I'm using my brain power! 🧩",
            "Just a moment, I'm looking it up! 🔍",
            "Let me think about that one! 🌟",
        ]
        
        # Pre-cache thinking messages
        self.thinking_audio_cache = {}
        self._pre_cache_thinking_messages()
        
    def _pre_cache_thinking_messages(self):
        """Pre-generate thinking audio files"""
        for msg in self.thinking_messages[:3]:  # Cache first 3
            try:
                audio_file = self._get_audio_path(msg)
                if not audio_file.exists():
                    self._generate_audio(msg, audio_file)
                self.thinking_audio_cache[msg] = audio_file
            except Exception as e:
                print(f"[VoiceAssistant] Failed to cache thinking message: {e}")
    
    def _get_md5_hash(self, text):
        """Generate MD5 hash for text"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    def _get_audio_path(self, text):
        """Get cached audio file path for text"""
        safe_name = f"response_{self._get_md5_hash(text)}.mp3"
        return self.audio_cache / safe_name
    
    def _generate_audio(self, text, output_path=None):
        """Generate audio from text using gTTS"""
        if output_path is None:
            output_path = self._get_audio_path(text)
        
        if output_path.exists():
            return str(output_path)
        
        try:
            tts = gTTS(text=text, lang="en", slow=False)
            tts.save(str(output_path))
            return str(output_path)
        except Exception as e:
            print(f"[VoiceAssistant] Audio generation failed: {e}")
            return None
    
    def _play_audio(self, file_path):
        """Play audio file"""
        if self.global_stop_event.is_set():
            return
        
        try:
            # Stop any current playback
            if self.current_playback_process:
                try:
                    self.current_playback_process.terminate()
                except:
                    pass
            
            # Use mpg123 for playback (cross-platform support)
            self.current_playback_process = subprocess.Popen(
                ["mpg123", "-q", str(file_path)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            self.current_playback_process.wait()
        except Exception as e:
            print(f"[VoiceAssistant] Audio playback failed: {e}")
    
    def transcribe_audio(self, audio_path):
        """Transcribe audio file to text"""
        recognizer = sr.Recognizer()
        
        try:
            with sr.AudioFile(str(audio_path)) as source:
                audio = recognizer.record(source)
            
            text = recognizer.recognize_google(audio, language="en-US")
            print(f"[VoiceAssistant] Transcribed: '{text}'")
            return text
        except sr.UnknownValueError:
            return None
        except sr.RequestError as e:
            print(f"[VoiceAssistant] Recognition error: {e}")
            return None
    
    def _chunk_text(self, text, max_sentences=2):
        """Split text into chunks for sequential playback"""
        # Clean up text
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Split by sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Group into chunks
        chunks = []
        for i in range(0, len(sentences), max_sentences):
            chunk = ' '.join(sentences[i:i+max_sentences])
            if chunk:
                chunks.append(chunk)
        
        return chunks if chunks else [text]
    
    def get_ai_response(self, command, child_age=8):
        """Get AI response from Groq with child-friendly formatting"""
        
        # Special commands
        cmd_lower = command.lower().strip()
        
        if cmd_lower in ['hello', 'hi', 'hey', 'hey dhyan']:
            greetings = [
                "Hello there! 🌟 I'm Dhyan! How can I help you today?",
                "Hi friend! 😊 What would you like to do?",
                "Hey! Ready to learn and have fun? 🎮",
            ]
            return random.choice(greetings), None
        
        if 'joke' in cmd_lower or 'funny' in cmd_lower:
            jokes = [
                "Why don't scientists trust atoms? Because they make up everything! 😄",
                "What do you call a fake noodle? An impasta! 🍝",
                "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
                "What do you call a bear with no teeth? A gummy bear! 🐻",
            ]
            return random.choice(jokes), None
        
        if 'song' in cmd_lower or 'sing' in cmd_lower:
            songs = [
                "🎵 Twinkle twinkle little star, how I wonder what you are! 🌟",
                "🎵 The itsy bitsy spider went up the water spout! 🕷️",
                "🎵 If you're happy and you know it, clap your hands! 👏",
            ]
            return random.choice(songs), None
        
        if 'encourage' in cmd_lower or "i'm sad" in cmd_lower:
            encouragements = [
                "You are amazing just the way you are! Keep trying, you can do it! 💪",
                "Every expert was once a beginner. You're doing great! 🌟",
                "Believe in yourself! You have special talents that make you unique! ✨",
                "Mistakes help us learn. Don't give up - you're getting better every day! 🌈",
            ]
            return random.choice(encouragements), None
        
        # FALLBACK: If AI is not available, use pre-programmed responses
        if not self.ai_available:
            fallback_responses = [
                "I can tell jokes, sing songs, and encourage you! Try saying 'tell me a joke' or 'sing a song'! 🎉",
                "I love chatting with you! Ask me for a joke or some encouragement! 😊",
                "I'm here to make you smile! What would you like - a joke, a song, or some encouragement? 🌟",
                "You're awesome! I can tell jokes, sing songs, or give you a pep talk. What would you like? 💪",
                "Hi friend! I'm Dhyan! I can tell jokes 🎭, sing songs 🎵, or encourage you 💪. What would you like?",
            ]
            return random.choice(fallback_responses), None
        
        # Build conversation context
        messages = [self.system_message]
        
        # Add recent history (last 3 exchanges)
        for msg in self.conversation_history[-6:]:
            messages.append(msg)
        
        messages.append({"role": "user", "content": command})
        
        try:
            response = self.client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                max_tokens=150,
                temperature=0.7,
            )
            
            full_response = response.choices[0].message.content
            
            # Clean up response
            full_response = re.sub(r'\*\*', '', full_response)  # Remove markdown
            full_response = re.sub(r'\n+', ' ', full_response)  # Remove extra newlines
            
            return full_response, None
            
        except Exception as e:
            print(f"[VoiceAssistant] API error: {e}")
            return "Oops! My brain needs a quick rest. Can you try again? 🧠💤", None
    
    def process_command(self, command_text, generate_audio=True):
        """
        Process a voice/text command
        
        Args:
            command_text: The text command to process
            generate_audio: Whether to generate and return audio
            
        Returns:
            dict with response_text, audio_path, and metadata
        """
        # Get AI response
        response_text, _ = self.get_ai_response(command_text)
        
        # Update conversation history
        self.conversation_history.append({"role": "user", "content": command_text})
        self.conversation_history.append({"role": "assistant", "content": response_text})
        
        # Keep only last 10 exchanges
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]
        
        result = {
            'command': command_text,
            'response': response_text,
            'audio_path': None,
            'chunks': [],
        }
        
        # Generate audio if requested
        if generate_audio:
            # Chunk the response for better playback
            chunks = self._chunk_text(response_text)
            result['chunks'] = chunks
            
            # Generate audio for each chunk
            audio_paths = []
            for chunk in chunks:
                audio_path = self._generate_audio(chunk)
                if audio_path:
                    audio_paths.append(audio_path)
            
            if audio_paths:
                result['audio_path'] = audio_paths[0]
                result['audio_paths'] = audio_paths
        
        return result
    
    def process_audio_command(self, audio_file_path, child_id=None):
        """
        Process an audio file command
        
        Args:
            audio_file_path: Path to the audio file
            child_id: Optional child ID for personalized responses
            
        Returns:
            dict with transcribed text, response, and audio
        """
        # Transcribe audio
        command_text = self.transcribe_audio(audio_file_path)
        
        if not command_text:
            return {
                'success': False,
                'error': 'Could not understand audio',
                'transcription': None,
                'response': "I didn't catch that. Can you speak a bit louder? 🎤",
            }
        
        # Process the command
        result = self.process_command(command_text, generate_audio=True)
        result['success'] = True
        result['transcription'] = command_text
        
        return result
    
    def play_thinking_sound(self):
        """Play a random thinking message"""
        if self.thinking_audio_cache:
            msg = random.choice(list(self.thinking_audio_cache.keys()))
            audio_path = self.thinking_audio_cache[msg]
            if audio_path.exists():
                self._play_audio(audio_path)
    
    def stop_playback(self):
        """Stop current audio playback"""
        self.global_stop_event.set()
        if self.current_playback_process:
            try:
                self.current_playback_process.terminate()
            except:
                pass
        time.sleep(0.2)
        self.global_stop_event.clear()
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []

# Singleton instance
_voice_assistant = None

def get_voice_assistant():
    """Get or create voice assistant singleton"""
    global _voice_assistant
    if _voice_assistant is None:
        _voice_assistant = VoiceAssistantService()
    return _voice_assistant
