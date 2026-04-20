# Backend Repository Setup Guide

## Repository Name Suggestions:
- `dhyan-voice-assistant-backend`
- `dhyan-therapy-backend`
- `dhyan-api-server`
- `aura-voice-backend`

## Files to Copy to New Repository:

### Core Backend Files:
```
Backend/
├── accounts/
├── audit/
├── compliance/
├── core/
├── patients/
├── therapy/
├── voice_assistant/
├── manage.py
├── requirements.txt
├── railway.toml
├── render.yaml
├── .env.production
├── deploy.sh
├── README.md
└── .gitignore
```

### Steps to Create New Repo:

1. **Create new GitHub repository:**
   - Go to github.com
   - Click "New repository"
   - Name: `dhyan-voice-assistant-backend`
   - Description: "Django backend for Dhyan voice assistant with Groq AI integration"
   - Make it Public or Private
   - Initialize with README

2. **Clone the new repository:**
   ```bash
   git clone https://github.com/yourusername/dhyan-voice-assistant-backend.git
   cd dhyan-voice-assistant-backend
   ```

3. **Copy backend files:**
   - Copy all files from `Backend/` folder to the new repo root
   - Don't include the `Backend/` folder itself, just its contents

4. **Initialize git and push:**
   ```bash
   git add .
   git commit -m "Initial backend setup with voice assistant and deployment configs"
   git push origin main
   ```

## Environment Variables for Deployment:
```
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=0
GROQ_API_KEY=your-groq-api-key
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

## Deploy to Railway:
1. Go to railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Select your new backend repository
4. Add environment variables
5. Deploy automatically