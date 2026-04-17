# 🧠 DHYAN — AI-Powered Pediatric Therapy Platform

**DHYAN** is a full-stack web application designed to assist therapists, parents, and caregivers in delivering structured, data-driven therapy for children with developmental needs. It combines ABA-based therapy games, AI-powered speech analysis, and real-time progress tracking in a single platform.

---

## ✨ Key Features

### 🎮 Therapy Games
- **Multiple game types** with ABA prompt-fading (Full Model → Independent)
- **Global child selection** — select a child once, used across all games
- **Real-time scoring** — therapist scores each trial (success / partial / fail)
- **Session summaries** with accuracy metrics and trial-by-trial breakdown

### 🗣️ Speech Therapy Module
- **5 clinically distinct activities**, each targeting a different skill:

  | Activity | Skill Targeted |
  |----------|---------------|
  | 🗣️ Repetition Practice | Articulation, phonology, verbal memory |
  | 🖼️ Picture Naming | Word retrieval, expressive vocabulary |
  | ❓ Question & Answer | Comprehension, reasoning, formulation |
  | 📖 Story Retell | Narrative sequencing, connected speech |
  | 🧠 Category Naming | Semantic fluency, divergent retrieval |

- **Voice-enabled prompts (TTS)** — prompts are spoken aloud for children using Web Speech API
- **AI speech analysis pipeline** — automatic ASR transcription, speech metrics (WPM, pause ratio, latency), keyword matching, and AI-generated clinical feedback
- **4-level ABA prompt hierarchy** — Full Model, Partial, Visual/Gestural, Independent

### 👥 User Management
- **Role-based access control** — Admin, Therapist, Parent, Supervisor
- **JWT authentication** with token refresh
- **Child profiles** linked to therapists and parents

### 📊 Dashboard & Progress
- **Session history** with detailed trial data
- **Per-child speech progress** metrics over time
- **Therapist notes** and scoring per trial

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, React Router 7 |
| **Backend** | Django 5.0, Django REST Framework |
| **Database** | PostgreSQL (Supabase cloud) |
| **Auth** | SimpleJWT (access + refresh tokens) |
| **ASR Engine** | faster-whisper (base model) |
| **Audio Processing** | pydub, Python wave module |
| **TTS** | Web Speech API (browser-native) |
| **Deployment** | Docker support included |

---

## 📁 Project Structure

```
DHYAN-FYP/
├── Backend/                  # Django REST API
│   ├── accounts/             # User auth, roles, RBAC
│   ├── patients/             # Child profiles & therapist assignments
│   ├── therapy/              # Game engine, sessions, trials
│   ├── speech/               # Speech therapy module
│   │   ├── processing/       # ASR, VAD, feature extraction, feedback
│   │   └── management/       # Seed commands
│   ├── compliance/           # Consent & data policies
│   ├── audit/                # Audit logging
│   └── core/                 # Django settings, URLs
├── frontend/                 # React + Vite SPA
│   └── src/
│       ├── pages/            # Login, Signup, Dashboard, Games
│       │   └── games/        # SpeechTherapy, game components
│       ├── components/       # GenericGame, shared UI
│       ├── hooks/            # useAuth, useChild (global context)
│       └── api/              # API client functions
├── Presentations/            # Project presentations
└── SRS/                      # Software Requirements Specification
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL (local or Supabase)

### Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv ../.venv
../.venv/Scripts/Activate.ps1     # Windows
# source ../.venv/bin/activate    # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations & seed data
python manage.py migrate
python manage.py seed_roles
python manage.py seed_speech_activities
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API URL

# Start dev server
npm run dev
```

### Environment Variables

Create `.env` files in both `Backend/` and `frontend/` directories. Refer to `.env.example` files for the required variables.

---

## 🐳 Docker

```bash
cd Backend
docker-compose up --build
```

---

## 👨‍💻 Authors

- **Malik Abdullah Awan** — [GitHub](https://github.com/MalikAbdullahAwan)

---

## 📄 License

This project is developed as a Final Year Project (FYP) for academic purposes.
