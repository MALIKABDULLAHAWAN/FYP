#!/bin/bash

# Script to create and setup the backend repository
# Run this script after creating the GitHub repository manually

echo "🚀 Setting up Dhyan Voice Assistant Backend Repository..."

# Repository details
REPO_NAME="dhyan-voice-assistant-backend"
REPO_URL="https://github.com/yourusername/$REPO_NAME.git"  # Replace 'yourusername' with your GitHub username

echo "📁 Creating local repository directory..."
mkdir -p $REPO_NAME
cd $REPO_NAME

# Initialize git
echo "🔧 Initializing git repository..."
git init
git branch -M main

# Create README
echo "📝 Creating README.md..."
cat > README.md << 'EOF'
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

## 🛠️ Local Development

### Prerequisites
- Python 3.11+
- PostgreSQL (optional, uses SQLite by default)
- Groq API key

### Setup
```bash
# Clone repository
git clone $REPO_URL
cd $REPO_NAME

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

# Start development server
python manage.py runserver
```

## 🌐 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /ready` - Database connectivity check

### Voice Assistant
- `POST /api/v1/voice/command/` - Process voice command
- `POST /api/v1/voice/process-audio/` - Process audio file

## 🔧 Environment Variables

### Required
```bash
DJANGO_SECRET_KEY=your-super-secret-key
GROQ_API_KEY=your-groq-api-key
```

### Optional
```bash
DJANGO_DEBUG=0
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```
EOF

echo "✅ README.md created!"

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Django
*.log
*.pot
*.pyc
__pycache__/
local_settings.py
db.sqlite3
db.sqlite3-journal
media/
staticfiles/

# Environment variables
.env
.env.local
.env.production.local

# Virtual environment
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Python
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Audio cache
audio_cache/*.mp3
voice_cache/*.mp3
media/voice_cache/*.mp3

# Temporary files
*.tmp
*.temp
EOF

echo "✅ .gitignore created!"

echo "📋 Next steps:"
echo "1. Copy all files from your Backend/ folder to this directory"
echo "2. Run: git add ."
echo "3. Run: git commit -m 'Initial backend setup with voice assistant'"
echo "4. Create GitHub repository: $REPO_NAME"
echo "5. Run: git remote add origin $REPO_URL"
echo "6. Run: git push -u origin main"

echo ""
echo "🎯 Repository ready for: $REPO_NAME"
echo "📁 Location: $(pwd)"
echo ""
echo "🚀 After pushing to GitHub, deploy to Railway:"
echo "   1. Go to railway.app"
echo "   2. Deploy from GitHub repo"
echo "   3. Select: $REPO_NAME"
echo "   4. Add environment variables"
echo "   5. Deploy automatically"
EOF

chmod +x create-backend-repo.sh