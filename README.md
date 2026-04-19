# 🧠 DHYAN — AI-Powered Pediatric Therapy & Learning Platform

**DHYAN** is a state-of-the-art, adaptive therapy ecosystem designed to bridge the gap between clinical ABA therapy and engaging, gamified learning. It empowers children with developmental needs through immersive 3D interactions, persistent AI companionship, and real-time clinical intelligence.

---

## 💎 Premium Features (Apotheosis Edition)

### 🤖 Dhyan: The Persistent AI Companion
*   **Global Presence**: Dhyan resides within the `TherapyFlow`, guiding children from the welcome screen to the final reward.
*   **Intelligent Encouragement**: Uses specialized speech synthesis with adaptive pitch and rate to provide a "Gentle & Professional" voice.
*   **Prompt Handoff**: Seamlessly transitions between therapeutic prompts and motivational coaching.

### 🎮 The Magical Activities Suite
*   **15+ High-Fidelity Games**: Including Physics-based Drag-and-Drop, Object Discovery with Magnifying Glass, and AI-Powered Speech Sparkles.
*   **Glassmorphic UI**: A premium visual design language inspired by modern aesthetics, featuring ambient particles, floating orbs, and blurred backgrounds.
*   **Session Persistence**: Advanced state recovery ensures children never lose progress, even during browser refreshes.

### 📖 The 3D Sticker Book & Missions
*   **Tangible Rewards**: A physical-book experience using 3D CSS transforms and rare shimmer effects for achievement stickers.
*   **Daily Mission Engine**: Encourages consistent engagement through randomized daily goals (e.g., "Find 10 Animals").
*   **Golden Synthesis**: A secret, high-tier reward for completing all daily missions.

### 📈 Clinical Intelligence Console
*   **Radar Analytics**: Visualize Cognitive, Social, and Motor progress via interactive multi-axis charts.
*   **AI Clinical Feedback**: Automatically generates detailed observations on speech latency, articulation, and vocabulary growth.
*   **Longitudinal Trends**: Monitor a child's therapeutic journey across weeks and months.

---

## 🏗️ Technical Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| **Core** | React 19 + Vite | High-performance reactive UI |
| **Physics** | Framer Motion | Fluid, physics-based interactions |
| **State** | React Hooks + Context | Global Child & Auth management |
| **Audio** | Web Audio API / Synth | Custom ASMR audio feedback system |
| **Optimization** | React.lazy / Suspense | Dynamic code splitting & bundle optimization |
| **Backend** | Django + DRF | Secure, HIPA-ready clinical data storage |
| **AI Vision** | Groq / Whisper | High-accuracy speech and image validation |

---

## 📁 System Walkthrough
```
DHYAN-FYP/
├── Backend/                  # Clinical Data Layer & AI Services
├── frontend/                 # High-Fidelity Experience Layer
│   ├── src/
│   │   ├── services/         # MissionService, AudioFeedback, VisualEffects
│   │   ├── components/       # StickerBook, AICompanion, GlassmorphicUI
│   │   └── pages/games/      # High-fidelity therapeutic modules
```

---

## 🚀 Getting Started

1. **Clone & Install**: Follow the instructions in the `Getting Started` section below.
2. **Clinical Seeding**: Run `python manage.py seed_clinical_assets` to populate the library with verified therapy imagery.
3. **Launch**: Use `npm run dev` to experience the platform at its peak.

---

## 🛡️ Clinical Compliance
DHYAN is built with a focus on data privacy and professional accountability, featuring full audit logging and role-based consent management.

---

### **Experience the Future of Pediatric Therapy.**
Developed by [Malik Abdullah Awan](https://github.com/MalikAbdullahAwan).
