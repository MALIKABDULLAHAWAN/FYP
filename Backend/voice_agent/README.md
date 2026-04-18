# Voice Agent - AI Voice Assistant

A Flask-based voice-enabled AI assistant with speaker recognition capabilities.

## Features

- **Voice Command Processing**: Record and process voice commands via web interface
- **Speaker Verification**: Uses SpeechBrain for speaker recognition and verification
- **AI-Powered Responses**: Groq API integration with Llama 3.3 70B model
- **Text-to-Speech**: Cute, playful voice responses using gTTS with audio effects
- **Music Playback**: Search and play songs from YouTube
- **Multi-threaded Audio**: Thinking messages while processing responses

## Setup

### Prerequisites

Install system dependencies:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y sox mpg123 ffmpeg

# macOS
brew install sox mpg123 ffmpeg

# Windows (using chocolatey)
choco install sox mpg123 ffmpeg
```

### Python Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the `voice_agent` directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

## Running the Voice Agent

```bash
cd Backend/voice_agent
python app.py
```

The server will start on `https://localhost:5000` (with self-signed SSL certificate).

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web interface |
| `/command` | POST | Process text command |
| `/process_audio` | POST | Process voice command (multipart/form-data with audio file) |
| `/enroll_speaker` | POST | Enroll a new speaker for voice verification |
| `/health` | GET | Health check and enrolled speakers info |

## Speaker Enrollment

To enroll a new speaker, send a POST request to `/enroll_speaker`:

```bash
curl -X POST -F "audio=@sample.wav" -F "name=john" http://localhost:5000/enroll_speaker
```

## Voice Commands

- **"Play this song [song name]"** - Downloads and plays music from YouTube
- **"Stop"** - Stops current audio playback
- **"Explain in detail [topic]"** - Get detailed 8-line responses
- **Any question** - Get AI-powered responses (max 4 lines by default)

## Directory Structure

```
voice_agent/
├── app.py              # Main Flask application
├── templates/
│   └── index.html      # Web interface
├── music/              # Cached music downloads
├── temp/               # Temporary audio files
├── audio_cache/        # Cached TTS audio
├── enrolled_references/ # Speaker embedding files
└── pretrained_models/  # SpeechBrain models
```

## Notes

- First-time setup will download SpeechBrain models (~30MB)
- Audio files are cached to avoid regenerating TTS
- Speaker verification is skipped if no speakers are enrolled
- SSL is enabled with adhoc certificate for microphone access in browsers
