# Dhyan AI Integration Guide

Comprehensive guide for the AI integration improvements in the Dhyan platform.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [AI Agents](#ai-agents)
4. [Backend API](#backend-api)
5. [Frontend Integration](#frontend-integration)
6. [Voice Agent](#voice-agent)
7. [Setup Instructions](#setup-instructions)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Dhyan platform features a comprehensive AI integration with:

- **6 AI Agents**: Specialized for different learning and therapy needs
- **Unified AI Service**: Centralized backend AI processing
- **Voice Integration**: Speech recognition and voice commands
- **Response Caching**: Improved performance with intelligent caching
- **Fallback Handling**: Graceful degradation when AI is unavailable

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                           │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ AIAgentPanel    │  │ useVoiceAI Hook  │  │ aiService   │  │
│  │ (Enhanced)      │  │                  │  │ (Enhanced)  │  │
│  └────────┬────────┘  └────────┬───────┘  └──────┬──────┘  │
│           │                      │                 │       │
│           └──────────────────────┼─────────────────┘       │
│                                  │                          │
└──────────────────────────────────┼──────────────────────────┘
                                   │
                          ┌────────▼────────┐
                          │   REST API      │
                          │  /api/therapy   │
                          └────────┬────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────┐
│                         BACKEND  │                         │
│                                  │                          │
│  ┌─────────────────────────────┼───────────────────────┐  │
│  │                     DJANGO                             │  │
│  │  ┌─────────────┐  ┌──────────▼─────────┐  ┌──────────┐│  │
│  │  │ AI Endpoints│  │ UnifiedAIService   │  │ Voice    ││  │
│  │  │             │  │                    │  │ Service  ││  │
│  │  │ /ai/chat    │  │ - Agent Registry   │  │          ││  │
│  │  │ /ai/agents  │  │ - Response Cache   │  │ /voice/* ││  │
│  │  │ /ai/hint    │  │ - Fallbacks        │  │          ││  │
│  │  └─────────────┘  └────────────────────┘  └──────────┘│  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────┼───────────────────────────┐  │
│  │              FLASK VOICE AGENT (Standalone)            │  │
│  │  - Speech Recognition   │  - Speaker Verification       │  │
│  │  - Music Playback       │  - TTS with Effects           │  │
│  └───────────────────────────┴───────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## AI Agents

| Agent | Key | Avatar | Purpose | Best For |
|-------|-----|--------|---------|----------|
| **Buddy** | `buddy` | 🎮 | Learning companion | General help, educational games |
| **Story Weaver** | `story_weaver` | 📚 | Storyteller | Creative stories, imagination |
| **Math Wizard** | `math_wizard` | 🔢 | Math tutor | Numbers, calculations, logic |
| **Cozy** | `cozy` | 🧸 | Therapy companion | Emotional support, calming |
| **Artie** | `artie` | 🎨 | Creativity coach | Art, drawing, creative projects |
| **Professor Paws** | `professor_paws` | 🔬 | Science explorer | Facts, nature, curiosity |
| **Aura** | `voice_assistant` | 🎙️ | Voice assistant | Voice commands, quick answers |

---

## Backend API

### AI Chat Endpoint
```
POST /api/therapy/ai/chat
Authorization: Bearer <token>

{
  "message": "What is 5 + 3?",
  "agent": "math_wizard",
  "history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"}
  ],
  "stream": false
}
```

**Response:**
```json
{
  "text": "5 + 3 = 8! Great job asking about addition! 🌟",
  "agent": "math_wizard",
  "model": "llama-3.3-70b-versatile",
  "processing_time": 0.85,
  "cached": false
}
```

### All AI Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/therapy/ai/chat` | POST | Main AI chat |
| `/api/therapy/ai/agents` | GET | List all agents |
| `/api/therapy/ai/health` | GET | Check AI status |
| `/api/therapy/ai/game-question` | POST | Generate game question |
| `/api/therapy/ai/hint` | POST | Get personalized hint |
| `/api/therapy/ai/continue-story` | POST | Continue story |
| `/api/therapy/ai/encouragement` | POST | Get encouragement |
| `/api/therapy/ai/explain` | POST | Explain concept |
| `/api/therapy/ai/generate-content` | POST | Generate story/poem |

### Voice Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/therapy/voice/command` | POST | Text voice command |
| `/api/therapy/voice/audio` | POST | Process audio file |
| `/api/therapy/voice/stop` | POST | Stop playback |
| `/api/therapy/voice/status` | GET | Check voice status |

---

## Frontend Integration

### Using the Enhanced AI Service

```javascript
import { 
  callAIChat, 
  getAllAIAgents, 
  generateGameQuestion,
  getPersonalizedHint 
} from '../services/aiServiceEnhanced';

// Chat with an agent
const response = await callAIChat(
  "What is 5 + 3?",
  "math_wizard",
  conversationHistory
);
console.log(response.text); // "5 + 3 = 8! 🌟"

// Generate a game question
const question = await generateGameQuestion("math", "easy", "math_wizard");

// Get hint after wrong answer
const hint = await getPersonalizedHint("math", "What is 5+3?", 2);
```

### Using the Voice AI Hook

```javascript
import useVoiceAI from '../hooks/useVoiceAI';

function MyComponent() {
  const {
    isRecording,
    isProcessing,
    transcript,
    error,
    startRecording,
    stopRecording,
    processVoiceCommand
  } = useVoiceAI();

  const handleVoice = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      const result = await processVoiceCommand(audioBlob);
      console.log(result.text); // Transcribed text
    } else {
      await startRecording();
    }
  };

  return (
    <button onClick={handleVoice}>
      {isRecording ? '⏹️ Stop' : '🎙️ Record'}
    </button>
  );
}
```

### Using the Enhanced AI Panel

```javascript
import AIAgentPanelEnhanced from '../components/AIAgentPanelEnhanced';

function App() {
  return (
    <AIAgentPanelEnhanced 
      initialAgent="buddy"
      onClose={() => setShowPanel(false)}
    />
  );
}
```

---

## Voice Agent

The voice agent is a standalone Flask application that provides:

### Features
- **Speech Recognition**: Google Speech Recognition API
- **Speaker Verification**: SpeechBrain ECAPA-TDNN embeddings
- **Music Playback**: YouTube audio download and playback
- **Text-to-Speech**: gTTS with pitch/speed effects
- **Thinking Messages**: Playful audio while processing

### Running the Voice Agent

```bash
# Initialize directories only
python manage.py voice_agent_server --init-only

# Run voice agent (development, no SSL)
python manage.py voice_agent_server --no-ssl --port 5000

# Run voice agent (production)
python manage.py voice_agent_server --port 5000
```

### Speaker Enrollment

```bash
curl -X POST -F "audio=@sample.wav" -F "name=john" \
  http://localhost:5000/enroll_speaker
```

### Voice Commands

| Command | Action |
|---------|--------|
| "Play this song [name]" | Downloads and plays music |
| "Stop" | Stops playback |
| "Explain in detail [topic]" | Detailed 8-line answer |
| Any question | AI-powered response (4 lines) |

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Run Migrations

```bash
python manage.py migrate
```

### 4. Start Django Server

```bash
python manage.py runserver
```

### 5. Start Voice Agent (Optional)

```bash
python manage.py voice_agent_server --no-ssl
```

### 6. Configure Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with API URL
npm run dev
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | - | Groq API key (required) |
| `AI_MODEL_DEFAULT` | llama-3.3-70b-versatile | Default AI model |
| `AI_TEMPERATURE` | 0.7 | Response randomness |
| `AI_MAX_TOKENS` | 1024 | Max response length |
| `AI_CACHE_ENABLED` | 1 | Enable response caching |
| `VOICE_AGENT_ENABLED` | 1 | Enable voice features |
| `VOICE_AGENT_PORT` | 5000 | Voice agent port |
| `SPEAKER_VERIFICATION_THRESHOLD` | 0.30 | Speaker match threshold |

### Frontend Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | http://localhost:8000/api | Backend API URL |
| `VITE_GROQ_API_KEY` | - | Groq API key (optional) |

---

## Troubleshooting

### AI Service Not Available
- Check `GROQ_API_KEY` is set correctly
- Verify network connectivity
- Check `/api/therapy/ai/health` endpoint

### Voice Recording Not Working
- Ensure HTTPS (or localhost) for microphone access
- Check browser permissions
- Verify `pyaudio` is installed

### Speaker Verification Failing
- Enroll speakers first with `/enroll_speaker`
- Check audio quality (16kHz, mono)
- Lower threshold if needed: `SPEAKER_VERIFICATION_THRESHOLD=0.25`

### Cache Not Working
- Ensure Django cache is configured
- Check Redis/Memcached connection
- Verify `AI_CACHE_ENABLED=1`

---

## API Keys

### Groq API
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up and create API key
3. Add to `.env`: `GROQ_API_KEY=gsk_...`

### Gemini API (Optional)
1. Visit [Google AI Studio](https://makersuite.google.com)
2. Create API key
3. Add to `.env`: `GEMINI_API_KEY=...`

---

## Performance Tips

1. **Enable Caching**: Set `AI_CACHE_ENABLED=1` for faster responses
2. **Use Appropriate Agents**: Match agent to task (math_wizard for math)
3. **Limit Conversation History**: Send only last 10 messages
4. **Pre-generate Content**: Use `/ai/generate-content` to cache stories

---

## Security Considerations

- Never commit `.env` files
- Use HTTPS in production for voice features
- Implement rate limiting on AI endpoints
- Validate and sanitize all user inputs
- Store speaker embeddings securely
