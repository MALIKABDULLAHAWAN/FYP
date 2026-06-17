# Dhyan Voice Assistant Backend

A Django REST API backend for the Dhyan therapy platform with advanced voice assistant capabilities powered by Groq AI.

## 🎯 Features

- **Voice Assistant (Aura)**: Advanced AI voice assistant with Groq integration
- **Multi-language Support**: English and Urdu voice responses
- **Audio Generation**: Text-to-speech with gTTS and audio caching
- **User Management**: JWT authentication and role-based access
- **Therapy Sessions**: Game session tracking and progress monitoring
- **RESTful API**: Comprehensive API for frontend integration

## 🚀 Quick Deploy

### Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/django)

### Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## 🛠️ Local Development

### Prerequisites
- Python 3.11+
- PostgreSQL (optional, uses SQLite by default)
- Groq API key

### Setup
```bash
# Clone repository
git clone https://github.com/yourusername/dhyan-voice-assistant-backend.git
cd dhyan-voice-assistant-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.production .env
# Edit .env with your values

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

## 🌐 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /ready` - Database connectivity check

### Authentication
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/refresh/` - Token refresh
- `POST /api/v1/auth/register/` - User registration

### Voice Assistant
- `POST /api/v1/voice/command/` - Process voice command
- `POST /api/v1/voice/process-audio/` - Process audio file

### Therapy & Games
- `GET /api/v1/therapy/games/` - Available games
- `POST /api/v1/therapy/sessions/` - Start game session

## 🔧 Environment Variables

### Required
```bash
DJANGO_SECRET_KEY=your-super-secret-key
GROQ_API_KEY=your-groq-api-key
```

### Optional
```bash
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
DATABASE_URL=postgresql://user:pass@host:port/db
```

## 🎵 Voice Assistant Features

### Aura AI Assistant
- **Natural Conversations**: Powered by Groq's Llama 3.3 70B model
- **Voice Synthesis**: High-quality text-to-speech with gTTS
- **Audio Caching**: Efficient MP3 caching system
- **Multi-language**: English and Urdu support
- **Real-time Processing**: Fast response times with async processing

### Voice Commands
- General questions and conversations
- Jokes and stories
- Weather information
- Fun facts and trivia
- Therapy-related guidance

## 🏗️ Architecture

### Apps Structure
```
├── accounts/          # User management & authentication
├── audit/            # Activity logging and audit trails
├── compliance/       # Compliance and regulatory features
├── core/            # Django settings and configuration
├── patients/        # Patient profiles and management
├── therapy/         # Therapy sessions and games
└── voice_assistant/ # Voice AI and audio processing
```

### Key Technologies
- **Django 5.0.8**: Web framework
- **Django REST Framework**: API development
- **PostgreSQL**: Production database
- **Groq API**: AI language model
- **gTTS**: Text-to-speech synthesis
- **pygame**: Audio playback
- **JWT**: Authentication tokens

## 📱 Frontend Integration

This backend is designed to work with the Dhyan frontend deployed on Vercel:
- Dynamic API URL configuration
- CORS properly configured
- Audio file serving for voice responses
- Real-time voice command processing

## 🔒 Security Features

- JWT token authentication
- CORS protection
- CSRF protection
- Environment-based configuration
- Secure file upload handling
- Rate limiting ready

## 📊 Monitoring & Health

- Health check endpoints
- Database connectivity monitoring
- Audio cache management
- Error logging and tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For deployment issues or questions:
1. Check the deployment logs
2. Verify environment variables
3. Test the health endpoint
4. Check CORS configuration

## 🔗 Related Repositories

- Frontend: [Dhyan Frontend Repository]
- Documentation: [API Documentation]