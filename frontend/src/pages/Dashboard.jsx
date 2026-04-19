import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useVoiceAPI } from "../hooks/useVoiceAPI";
import { getDashboardStats, getSessionHistory, getChildProgress } from "../api/games";
import { listChildren } from "../api/patients";
import { SkeletonStatCards, SkeletonTable } from "../components/Skeleton";
import UiIcon from "../components/ui/UiIcon";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as RechartsContainer, AreaChart, Area } from "recharts";
import ProgressRing from "../components/ProgressRing";
import { AnimalStickers, FruitStickers, ShapeStickers, VehicleStickers, ObjectStickers, NumberStickers, PatternStickers } from "../components/Stickers";
import {
  AmbientParticles,
  ConfettiExplosion,
  SmoothButton,
  Sticker3D,
  SpringContainer,
  FloatingEmoji,
  MagicalSparkles,
  SuccessBurst,
  FloatingOrbs,
  BouncingStars,
  PulsingHeart
} from "../components/AmbientEffects";
import { MusicPlayer, MusicPlayerButton } from "../components/MusicPlayer";
import AIAgentPanel, { AIAgentButton } from "../components/AIAgentPanel";
import "../styles/professional.css";
import "../styles/ai-agents.css";
import "../styles/game-enhancements.css";
import "./Dashboard.css";
import { CONTENT_LIBRARY } from '../data/contentLibrary';

// Library of Content - MASSIVELY EXPANDED

// Voice Agent with Full Interactive System
function VoiceAgent({ userName, stats }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [emotion, setEmotion] = useState("happy");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);
  const [currentMode, setCurrentMode] = useState("chat"); // chat, song, poem, story, book, game
  const [currentContent, setCurrentContent] = useState(null);
  const [contentIndex, setContentIndex] = useState(0);
  
  // NEW: Enhanced Game State with Timer and Power-ups
  const [gameState, setGameState] = useState({
    isPlaying: false,
    type: null,
    currentQuestion: null,
    score: 0,
    streak: 0,
    questionsAnswered: 0,
    waitingForAnswer: false,
    difficulty: 'easy',
    // NEW: Timer system
    timeRemaining: 0,
    totalTime: 0,
    timerActive: false,
    // NEW: Power-ups
    powerUps: {
      timeFreeze: 0,
      doublePoints: 0,
      hint: 0,
      skip: 0,
      extraLife: 0
    },
    activePowerUp: null,
    // NEW: Game stats
    wrongAttempts: 0,
    hintsUsed: 0,
    startTime: null,
    endTime: null
  });

  // ENHANCED: Achievement and reward system
  const [achievements, setAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [particles, setParticles] = useState([]);

  // ENHANCED: Emoji reactions and mood
  const [currentMood, setCurrentMood] = useState("happy");
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  // ENHANCED: Voice customization
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);

  // NEW: Daily Challenges System
  const [dailyChallenges, setDailyChallenges] = useState([
    { id: 1, title: "Answer 5 riddles", target: 5, current: 0, reward: "🏅 Riddle Master", completed: false },
    { id: 2, title: "Score 30 points", target: 30, current: 0, reward: "⭐ Point Collector", completed: false },
    { id: 3, title: "Play for 10 minutes", target: 10, current: 0, reward: "⏰ Time Keeper", completed: false }
  ]);
  const [showChallengeComplete, setShowChallengeComplete] = useState(null);

  // NEW: Streak Calendar System
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    weeklyProgress: [true, true, false, true, true, false, false] // Mon-Sun
  });
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  // NEW: Avatar Personalization
  const [selectedAvatar, setSelectedAvatar] = useState("🐰");
  const [avatarOptions] = useState(["🐰", "🐻", "🐱", "🐶", "🦁", "🐼", "🦄", "🦊"]);
  const [selectedTheme, setSelectedTheme] = useState("pink");
  const [themeOptions] = useState([
    { name: "pink", bg: "#fff5f7", accent: "#ff9a9e" },
    { name: "blue", bg: "#f0f9ff", accent: "#66a6ff" },
    { name: "green", bg: "#f0fff4", accent: "#84fab0" },
    { name: "purple", bg: "#faf5ff", accent: "#a18cd1" }
  ]);

  // NEW: Progress Tracking
  const [learningProgress, setLearningProgress] = useState({
    gamesPlayed: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    timeSpent: 0,
    subjects: { math: 0, reading: 0, logic: 0, memory: 0 }
  });

  // NEW: Breathing Exercise State
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState("inhale"); // inhale, hold, exhale

  // NEW: AI Difficulty Tracking
  const [userSkillLevel, setUserSkillLevel] = useState({
    overall: 1, // 1-5
    math: 1,
    logic: 1,
    memory: 1
  });
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(true);

  // NEW: Story Creator State
  const [storyCreatorActive, setStoryCreatorActive] = useState(false);
  const [createdStory, setCreatedStory] = useState({
    character: null,
    setting: null,
    problem: null,
    resolution: null,
    fullStory: null
  });

  // NEW: Reward Shop State
  const [rewardShopOpen, setRewardShopOpen] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [equippedItems, setEquippedItems] = useState({
    background: null,
    frame: null,
    badge: null
  });

  // NEW: Sound Effects System
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const audioContextRef = useRef(null);

  // NEW: Seasonal Content
  const [currentSeason, setCurrentSeason] = useState('spring'); // spring, summer, fall, winter
  const [seasonalContent, setSeasonalContent] = useState({
    spring: { theme: 'blossom', songs: [], colors: ['#FFB6C1', '#98FB98'] },
    summer: { theme: 'sunshine', songs: [], colors: ['#FFD700', '#87CEEB'] },
    fall: { theme: 'harvest', songs: [], colors: ['#FF8C00', '#8B4513'] },
    winter: { theme: 'snowflake', songs: [], colors: ['#E0FFFF', '#B0E0E6'] }
  });

  // NEW: Voice Emotion State
  const [detectedEmotion, setDetectedEmotion] = useState('neutral');
  const [emotionHistory, setEmotionHistory] = useState([]);

  const recognitionRef = useRef(null);
  const wakeWordRecognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const autoPlayRef = useRef(false);

  // NEW: Audio playback for songs
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const audioRef = useRef(null);

  // NEW: Music Player State
  const [musicPlayerOpen, setMusicPlayerOpen] = useState(false);

  // NEW: Confetti State
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  // NEW: Trigger Big Celebration
  const triggerCelebration = useCallback(() => {
    setConfettiTrigger(true);
    setTimeout(() => setConfettiTrigger(false), 100);
  }, []);

  // NEW: Wake word detection
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [showWakeWordIndicator, setShowWakeWordIndicator] = useState(false);
  const wakeWordTimeoutRef = useRef(null);

  // Add system log
  const addLog = useCallback((type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [...prev.slice(-9), { type, message, timestamp }]);
  }, []);

  // ENHANCED: Particle system for celebrations
  const createParticles = useCallback((x, y, type = 'confetti') => {
    const colors = ['#ff9a9e', '#fecfef', '#a18cd1', '#fbc2eb', '#84fab0', '#8fd3f4', '#fa709a', '#fee140'];
    const emojis = ['🎉', '⭐', '🎊', '✨', '🌟', '💫', '🎈', '🏆'];
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 100,
      y: y + (Math.random() - 0.5) * 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: type === 'emoji' ? emojis[Math.floor(Math.random() * emojis.length)] : null,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 1,
      velocity: {
        x: (Math.random() - 0.5) * 10,
        y: -5 - Math.random() * 10
      },
      life: 1.0
    }));
    setParticles(prev => [...prev, ...newParticles]);

    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);
  }, []);

  // ENHANCED: Floating emoji animation
  const addFloatingEmoji = useCallback((emoji, mood = 'happy') => {
    const id = Date.now();
    const newEmoji = {
      id,
      emoji,
      x: 50 + Math.random() * 200,
      y: 100,
      mood
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 3000);
  }, []);

  // FIX: Stop all speech MUST be defined BEFORE speak
  const stopSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    autoPlayRef.current = false;
  }, []);

  // OPTIMIZED: Cache preferred voice for faster speech
  const preferredVoiceRef = useRef(null);

  // OPTIMIZED: Speak with voice caching and faster settings - DEFINED EARLY
  const speak = useCallback((text, emotionType = "happy", onEndCallback = null) => {
    if (!synthRef.current) {
      addLog("error", "Speech synthesis not available");
      return;
    }

    stopSpeech();

    setEmotion(emotionType);
    setCurrentMessage(text);
    setIsSpeaking(true);
    addLog("info", `Speaking: ${text.slice(0, 30)}...`);

    const utterance = new SpeechSynthesisUtterance(text);
    // ENHANCED: Voice settings with user customization
    const baseRate = currentMode === "song" ? 0.9 : currentMode === "poem" ? 0.95 : currentMode === "story" ? 1.0 : 1.1;
    const basePitch = emotionType === "excited" ? 1.3 : emotionType === "thinking" ? 1.0 : emotionType === "story" ? 1.1 : emotionType === "celebrating" ? 1.25 : 1.15;

    utterance.rate = Math.max(0.5, Math.min(2.0, baseRate * voiceSpeed));
    utterance.pitch = Math.max(0.5, Math.min(2.0, basePitch * voicePitch));
    utterance.volume = 0.95;

    // OPTIMIZED: Cache voice selection (only search once)
    if (!preferredVoiceRef.current) {
      const voices = synthRef.current.getVoices();
      preferredVoiceRef.current = voices.find(v =>
        v.name.includes("Samantha") ||
        v.name.includes("Google US English") ||
        v.name.includes("Microsoft Zira") ||
        v.name.includes("Victoria") ||
        v.name.includes("Karen")
      ) || voices.find(v => v.lang === "en-US" || v.lang === "en-GB");
    }
    if (preferredVoiceRef.current) {
      utterance.voice = preferredVoiceRef.current;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [addLog, stopSpeech, currentMode]);

  // ENHANCED: Achievement unlock system - DEFINED AFTER speak
  const unlockAchievement = useCallback((title, description, icon) => {
    const achievement = { title, description, icon, unlockedAt: new Date() };
    setAchievements(prev => {
      if (prev.find(a => a.title === title)) return prev;
      return [...prev, achievement];
    });
    setShowAchievement(achievement);
    speak(`Achievement unlocked: ${title}! ${description}`, "celebrating");
    createParticles(200, 200, 'emoji');

    setTimeout(() => setShowAchievement(null), 5000);
  }, [speak, createParticles]);

  // Start listening - DEFINED EARLY (before handleWakeWordDetected uses it)
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      speak("Sorry, voice recognition is not supported in your browser. But you can still click my buttons!", "thinking");
      return;
    }

    try {
      stopSpeech();
      recognitionRef.current.start();
    } catch (e) {
      addLog("error", "Failed to start listening");
    }
  }, [addLog, speak, stopSpeech]);

  // NEW: Wake word detection function
  const detectWakeWord = useCallback((transcript) => {
    const lowerTranscript = transcript.toLowerCase().trim();
    const wakeWords = [
      'hey dhyan', 'hi dhyan', 'hello dhyan', 'okay dhyan', 'yo dhyan',
      'dhyan', 'dylan', 'dian', 'dhayan', 'dayan'
    ];

    return wakeWords.some(word => lowerTranscript.includes(word));
  }, []);

  // OPTIMIZED: Handle wake word detected - FASTER (500ms instead of 2500ms)
  const handleWakeWordDetected = useCallback(() => {
    setWakeWordDetected(true);
    setShowWakeWordIndicator(true);
    setIsListeningForWakeWord(false);

    // Stop wake word listening
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
    }

    // Visual feedback
    setEmotion("excited");

    // Speak greeting
    speak(`Yes ${userName || 'friend'}! I'm here!`, "excited");

    // Start regular listening MUCH FASTER (500ms instead of 2500ms)
    setTimeout(() => {
      startListening();
    }, 500);

    // Hide indicator faster (3000ms instead of 5000ms)
    wakeWordTimeoutRef.current = setTimeout(() => {
      setShowWakeWordIndicator(false);
      setWakeWordDetected(false);
    }, 3000);
  }, [speak, startListening, userName]);

  // NEW: Start wake word listening
  const startWakeWordListening = useCallback(() => {
    if (!wakeWordRecognitionRef.current || !wakeWordEnabled) return;

    try {
      wakeWordRecognitionRef.current.start();
      setIsListeningForWakeWord(true);
      addLog("info", "Wake word listening started...");
    } catch (e) {
      // Already started or other error
    }
  }, [addLog, wakeWordEnabled]);

  // NEW: Stop wake word listening
  const stopWakeWordListening = useCallback(() => {
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListeningForWakeWord(false);
  }, []);

  // NEW: Toggle wake word - FIXED: Added visual feedback
  const toggleWakeWord = useCallback(() => {
    setWakeWordEnabled(prev => {
      const newValue = !prev;
      if (newValue) {
        const msg = "🎧 Wake word enabled! Say 'Hey Dhyan' anytime to call me!";
        setCurrentMessage(msg);
        speak(msg, "happy");
        startWakeWordListening();
      } else {
        const msg = "🔇 Wake word disabled. Click the microphone when you need me!";
        setCurrentMessage(msg);
        speak(msg, "thinking");
        stopWakeWordListening();
      }
      return newValue;
    });
  }, [speak, startWakeWordListening, stopWakeWordListening, setCurrentMessage]);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setEmotion("thinking");
        addLog("info", "Listening for voice command...");
      };
      
      recognitionRef.current.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        addLog("info", `Heard: "${command}"`);
        processCommand(command);
      };
      
      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setEmotion("happy");
        addLog("error", `Listening error: ${event.error}`);
        if (event.error === 'not-allowed') {
          speak("Please allow microphone access so I can hear your commands!", "thinking");
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setEmotion("happy");
        // Restart wake word listening if enabled
        if (wakeWordEnabled && !isSpeaking) {
          setTimeout(() => {
            startWakeWordListening();
          }, 500);
        }
      };

      // NEW: Initialize wake word recognition (separate instance for continuous listening)
      wakeWordRecognitionRef.current = new SpeechRecognition();
      wakeWordRecognitionRef.current.continuous = true;
      wakeWordRecognitionRef.current.interimResults = true;
      wakeWordRecognitionRef.current.lang = 'en-US';

      wakeWordRecognitionRef.current.onstart = () => {
        setIsListeningForWakeWord(true);
        addLog("info", "🔊 Wake word listening active...");
      };

      wakeWordRecognitionRef.current.onresult = (event) => {
        const results = event.results;
        for (let i = event.resultIndex; i < results.length; i++) {
          const transcript = results[i][0].transcript;
          const isFinal = results[i].isFinal;

          if (detectWakeWord(transcript)) {
            if (isFinal || transcript.length > 10) {
              addLog("success", `🎯 Wake word detected: "${transcript}"`);
              handleWakeWordDetected();
              break;
            }
          }
        }
      };

      // FIX: Add retry counter to prevent infinite loops
      const wakeWordRetryCount = { current: 0 };
      const MAX_WAKE_WORD_RETRIES = 3;

      wakeWordRecognitionRef.current.onerror = (event) => {
        // Don't log expected errors
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          addLog("error", `Wake word error: ${event.error}`);
        }

        // FIX: Don't restart on network errors (requires internet) or after max retries
        if (event.error === 'network') {
          addLog("error", "Network error - speech recognition requires internet");
          wakeWordRetryCount.current = 0; // Reset counter
          return; // Don't restart
        }

        if (event.error === 'not-allowed') {
          addLog("error", "Microphone permission denied - please allow microphone access");
          return; // Don't restart
        }

        // Only restart if we haven't exceeded max retries
        if (wakeWordEnabled && wakeWordRetryCount.current < MAX_WAKE_WORD_RETRIES) {
          wakeWordRetryCount.current++;
          addLog("info", `Restarting wake word (attempt ${wakeWordRetryCount.current}/${MAX_WAKE_WORD_RETRIES})...`);
          setTimeout(() => {
            startWakeWordListening();
          }, 2000); // FIX: Increased delay to 2s
        } else if (wakeWordRetryCount.current >= MAX_WAKE_WORD_RETRIES) {
          addLog("error", "Max wake word retries reached - speech recognition disabled");
          setWakeWordEnabled(false);
          wakeWordRetryCount.current = 0;
        }
      };

      wakeWordRecognitionRef.current.onend = () => {
        setIsListeningForWakeWord(false);
        // FIX: Only auto-restart if enabled AND we haven't hit max retries
        if (wakeWordEnabled && !isListening && !wakeWordDetected && wakeWordRetryCount.current < MAX_WAKE_WORD_RETRIES) {
          setTimeout(() => {
            startWakeWordListening();
          }, 1500); // FIX: Increased delay to 1.5s
        }
      };

      // Start wake word listening initially
      if (wakeWordEnabled) {
        setTimeout(() => {
          startWakeWordListening();
        }, 2000);
      }
    }

    return () => {
      stopSpeech();
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
    };
  }, [addLog, stopSpeech, detectWakeWord, handleWakeWordDetected, startWakeWordListening, wakeWordEnabled, isSpeaking, isListening, wakeWordDetected]);

  // OPTIMIZED: Pre-computed game data for faster access
  const gameDataRef = useRef(CONTENT_LIBRARY.games);

  // OPTIMIZED: Faster game question loading - DEFINED BEFORE startGame
  const nextQuestion = useCallback((gameType) => {
    const games = gameDataRef.current;
    let question = null;
    let questionText = "";

    switch(gameType) {
      case 'riddle':
        question = games.riddles[Math.floor(Math.random() * games.riddles.length)];
        questionText = `Riddle: ${question.question}`;
        break;
      case 'trivia':
        question = games.trivia[Math.floor(Math.random() * games.trivia.length)];
        questionText = `Trivia: ${question.question}`;
        break;
      case 'math':
        const difficulty = gameState.difficulty || 'easy';
        question = games.math[difficulty][Math.floor(Math.random() * games.math[difficulty].length)];
        questionText = `Math: ${question.question}`;
        break;
      case 'spelling':
        question = games.spelling[Math.floor(Math.random() * games.spelling.length)];
        questionText = `Spell: ${question.word}. Hint: ${question.hint}`;
        break;
      case 'wordScramble':
        question = games.wordScramble[Math.floor(Math.random() * games.wordScramble.length)];
        questionText = `Unscramble: ${question.scrambled}`;
        break;
      case 'animalSounds':
        question = games.animalSounds[Math.floor(Math.random() * games.animalSounds.length)];
        questionText = `What animal says ${question.sound}?`;
        break;
      case 'colors':
        question = games.colors[Math.floor(Math.random() * games.colors.length)];
        questionText = `What color is this? Hint: ${question.hint}`;
        break;
      case 'shapes':
        question = games.shapes[Math.floor(Math.random() * games.shapes.length)];
        questionText = `What shape is this? Hint: ${question.hint}`;
        break;
      case 'patterns':
        question = games.patterns[Math.floor(Math.random() * games.patterns.length)];
        questionText = `What comes next in this pattern: ${question.sequence.join(' ')} ?`;
        break;
      case 'memory':
        const memoryItems = games.memory.slice(0, 4);
        question = {
          items: memoryItems,
          target: memoryItems[Math.floor(Math.random() * memoryItems.length)]
        };
        questionText = `I will show you some pictures. Remember them! Look at the ${memoryItems.map(i => i.name).join(', ')}. Now, what was the ${question.target.category}?`;
        break;
    }

    setGameState(prev => ({ ...prev, currentQuestion: question, waitingForAnswer: true }));
    speak(questionText, "excited");
  }, [gameState.difficulty, speak]);

  // OPTIMIZED: Game Functions with faster startup - DEFINED AFTER nextQuestion
  const startGame = useCallback((gameType) => {
    const initialPowerUps = {
      timeFreeze: 2,
      doublePoints: 2,
      hint: 3,
      skip: 1,
      extraLife: 1
    };
    
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      type: gameType, 
      score: 0, 
      streak: 0, 
      questionsAnswered: 0,
      wrongAttempts: 0,
      hintsUsed: 0,
      powerUps: initialPowerUps,
      activePowerUp: null,
      startTime: Date.now()
    }));
    setCurrentMode("game");
    addLog("info", `Game: ${gameType}`);

    // FASTER: 300ms instead of 1000ms
    setTimeout(() => {
      nextQuestion(gameType);
    }, 300);
  }, [addLog, nextQuestion]);

  // NEW: Timer Functions
  const startTimer = useCallback((seconds) => {
    setGameState(prev => ({
      ...prev,
      timeRemaining: seconds,
      totalTime: seconds,
      timerActive: true
    }));
  }, []);

  const stopTimer = useCallback(() => {
    setGameState(prev => ({ ...prev, timerActive: false }));
  }, []);

  const usePowerUp = useCallback((powerUpType) => {
    if (gameState.powerUps[powerUpType] > 0) {
      setGameState(prev => ({
        ...prev,
        powerUps: { ...prev.powerUps, [powerUpType]: prev.powerUps[powerUpType] - 1 },
        activePowerUp: powerUpType
      }));
      
      // Apply power-up effects
      switch(powerUpType) {
        case 'timeFreeze':
          stopTimer();
          speak("Time frozen! You have 10 extra seconds! ⏱️", "excited");
          setTimeout(() => {
            setGameState(prev => ({ ...prev, timerActive: true }));
          }, 10000);
          break;
        case 'doublePoints':
          speak("Double points activated! Next answer worth 20 points! 2️⃣", "excited");
          break;
        case 'hint':
          const hint = gameState.currentQuestion?.hint || "Think carefully!";
          speak(`Hint: ${hint} 💡`, "thinking");
          setGameState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
          break;
        case 'skip':
          speak("Question skipped! Moving to next one! ⏭️", "happy");
          nextQuestion(gameState.type);
          break;
        case 'extraLife':
          speak("Extra life ready! You can make one mistake! ❤️", "happy");
          break;
      }
    }
  }, [gameState.powerUps, gameState.currentQuestion, gameState.type, nextQuestion, speak, stopTimer]);

  // ENHANCED: Get contextual praise for the game type
  const getContextualPraise = useCallback((gameType, streak) => {
    const metadata = CONTENT_LIBRARY.games.gameMetadata?.[gameType];
    if (metadata && metadata.praiseMessages) {
      const index = (streak - 1) % metadata.praiseMessages.length;
      return metadata.praiseMessages[index];
    }
    return "Correct! Well done!";
  }, []);

  // ENHANCED: Get educational fact for memory game items
  const getMemoryFact = useCallback((item) => {
    if (item.fact) {
      return ` Did you know? ${item.fact}`;
    }
    return "";
  }, []);

  const checkAnswer = useCallback((userAnswer) => {
    if (!gameState.currentQuestion || !gameState.waitingForAnswer) return;
    
    const correct = gameState.currentQuestion.answer.toLowerCase().trim();
    const user = userAnswer.toLowerCase().trim();
    const isCorrect = user.includes(correct) || correct.includes(user);
    
    if (isCorrect) {
      const newStreak = gameState.streak + 1;
      // ENHANCED: Double points power-up
      const basePoints = 10 + (newStreak >= 3 ? 5 : 0);
      const doubleMultiplier = gameState.activePowerUp === 'doublePoints' ? 2 : 1;
      const newScore = gameState.score + (basePoints * doubleMultiplier);
      const bonus = newStreak >= 3 ? ` ${newStreak} in a row! Keep it up!` : "";

      // ENHANCED: Particle effects for correct answer
      createParticles(150 + Math.random() * 100, 100, 'emoji');
      addFloatingEmoji('🎯', 'excited');

      // ENHANCED: Achievement unlocks
      if (newStreak === 3) unlockAchievement("On Fire!", "Answered 3 questions correctly in a row!", "🔥");
      if (newStreak === 5) {
        unlockAchievement("Unstoppable!", "Answered 5 questions correctly in a row!", "⚡");
        triggerCelebration(); // BIG CELEBRATION!
      }
      if (newScore >= 50) {
        unlockAchievement("High Scorer!", "Scored 50 points in one game!", "🏆");
        triggerCelebration(); // BIG CELEBRATION!
      }

      // ENHANCED: Contextual praise based on game type
      const praise = getContextualPraise(gameState.type, newStreak);
      let fact = "";
      
      // Add educational fact for memory game
      if (gameState.type === 'memory' && gameState.currentQuestion.target?.fact) {
        fact = getMemoryFact(gameState.currentQuestion.target);
      }

      const doubleMsg = doubleMultiplier > 1 ? " Double points! 🎉" : "";
      speak(`${praise}${bonus}${doubleMsg}${fact}`, "celebrating");
      setGameState(prev => ({
        ...prev,
        score: newScore,
        streak: newStreak,
        questionsAnswered: prev.questionsAnswered + 1,
        waitingForAnswer: false,
        activePowerUp: null // Reset power-up after use
      }));
      setTotalScore(prev => prev + newScore);
      setSessionStreak(prev => prev + 1);
    } else {
      // ENHANCED: Extra Life power-up
      if (gameState.activePowerUp === 'extraLife' || gameState.powerUps.extraLife > 0) {
        speak("Oops! But your extra life saved you! Try again! ❤️", "thinking");
        setGameState(prev => ({
          ...prev,
          powerUps: { ...prev.powerUps, extraLife: prev.powerUps.extraLife - 1 },
          wrongAttempts: prev.wrongAttempts + 1,
          activePowerUp: null
        }));
        return; // Don't end turn, let them try again
      }
      
      addFloatingEmoji('💭', 'thinking');
      speak(`Not quite! The answer was: ${gameState.currentQuestion.answer}. Let's try another one!`, "thinking");
      setGameState(prev => ({ 
        ...prev, 
        streak: 0, 
        questionsAnswered: prev.questionsAnswered + 1, 
        wrongAttempts: prev.wrongAttempts + 1,
        waitingForAnswer: false 
      }));
      setSessionStreak(0);
    }
    
    // OPTIMIZED: Faster game flow (1500ms instead of 3000ms)
    setTimeout(() => {
      if (gameState.questionsAnswered < 4) {
        nextQuestion(gameState.type);
      } else {
        endGame();
      }
    }, 1500);
  }, [gameState, speak, nextQuestion, unlockAchievement, createParticles, addFloatingEmoji, triggerCelebration]);
  
  const endGame = useCallback(() => {
    const finalScore = gameState.score;
    const message = finalScore >= 40 ? `Amazing! You scored ${finalScore} points! You're a genius!` :
                   finalScore >= 20 ? `Great job! You scored ${finalScore} points!` :
                   `You scored ${finalScore} points. Keep practicing!`;
    speak(message, "celebrating");

    // NEW: Update daily challenges
    setDailyChallenges(prev => prev.map(challenge => {
      if (challenge.id === 2) { // Score challenge
        const newCurrent = challenge.current + finalScore;
        if (newCurrent >= challenge.target && !challenge.completed) {
          unlockAchievement(challenge.reward, `Completed: ${challenge.title}`, "🏅");
          return { ...challenge, current: newCurrent, completed: true };
        }
        return { ...challenge, current: newCurrent };
      }
      return challenge;
    }));

    // NEW: Update learning progress
    setLearningProgress(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      correctAnswers: prev.correctAnswers + Math.floor(finalScore / 10)
    }));

    setGameState({ isPlaying: false, type: null, currentQuestion: null, score: 0, streak: 0, questionsAnswered: 0, waitingForAnswer: false, difficulty: 'easy' });
    setCurrentMode("chat");
  }, [gameState.score, unlockAchievement, speak]);

  // FIX: Add refs for breathing exercise cleanup
  const breathingIntervalRef = useRef(null);
  const breathingTimeoutRef = useRef(null);

  // NEW: Breathing Exercise - FIXED: Added visual feedback
  const startBreathingExercise = useCallback(() => {
    // Clear any existing breathing timers
    if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    if (breathingTimeoutRef.current) clearTimeout(breathingTimeoutRef.current);

    setBreathingActive(true);
    setBreathingPhase("inhale");
    const startMsg = "🧘 Let's take a deep breath together. Breathe in slowly... hold... and breathe out. Feel your body relax.";
    setCurrentMessage(startMsg);
    speak(startMsg, "calm");

    const cycle = ["inhale", "hold", "exhale", "hold"];
    const phaseEmojis = { "inhale": "🌬️", "hold": "⏸️", "exhale": "💨" };
    let step = 0;

    breathingIntervalRef.current = setInterval(() => {
      step = (step + 1) % 4;
      const phase = cycle[step];
      setBreathingPhase(phase);

      let msg;
      if (step === 0) msg = `${phaseEmojis.inhale} Breathe in...`;
      else if (step === 1) msg = `${phaseEmojis.hold} Hold...`;
      else if (step === 2) msg = `${phaseEmojis.exhale} Breathe out...`;
      else msg = `${phaseEmojis.hold} Hold...`;
      
      setCurrentMessage(msg);
      if (step !== 3) speak(msg, "calm");
    }, 4000);

    // Stop after 2 minutes
    breathingTimeoutRef.current = setTimeout(() => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
        breathingIntervalRef.current = null;
      }
      setBreathingActive(false);
      const endMsg = "✨ Great job! You did a wonderful job relaxing. Feel free to come back anytime you need to calm down.";
      setCurrentMessage(endMsg);
      speak(endMsg, "happy");
      unlockAchievement("Zen Master", "Completed a breathing exercise!", "🧘");
    }, 120000);
  }, [speak, unlockAchievement, setCurrentMessage]);

  // FIX: Cleanup breathing timers on unmount
  useEffect(() => {
    return () => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
      }
      if (breathingTimeoutRef.current) {
        clearTimeout(breathingTimeoutRef.current);
      }
    };
  }, []);

  // NEW: AI Difficulty Adjustment
  const adjustDifficulty = useCallback((gameType, performance) => {
    if (!adaptiveDifficulty) return;

    setUserSkillLevel(prev => {
      const subject = gameType === 'math' ? 'math' :
                     gameType === 'riddle' || gameType === 'trivia' ? 'logic' :
                     gameType === 'memory' ? 'memory' : 'overall';

      const currentLevel = prev[subject];
      let newLevel = currentLevel;

      if (performance > 0.8 && currentLevel < 5) newLevel = currentLevel + 1;
      else if (performance < 0.4 && currentLevel > 1) newLevel = currentLevel - 1;

      return { ...prev, [subject]: newLevel };
    });
  }, [adaptiveDifficulty]);

  // NEW: Claim Daily Reward
  const claimDailyReward = useCallback(() => {
    if (dailyRewardClaimed) {
      speak("You've already claimed your daily reward! Come back tomorrow!", "thinking");
      return;
    }

    const reward = Math.floor(Math.random() * 50) + 10;
    setTotalScore(prev => prev + reward);
    setDailyRewardClaimed(true);
    createParticles(200, 200, 'emoji');
    speak(`Daily reward claimed! You got ${reward} bonus points! Great job keeping your streak!`, "celebrating");
    unlockAchievement("Daily Player", "Claimed daily reward!", "📅");
  }, [dailyRewardClaimed, speak, unlockAchievement, createParticles]);

  // NEW: Update Streak
  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();
    const lastActive = streakData.lastActiveDate;

    if (lastActive === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = streakData.currentStreak;
    if (lastActive === yesterday.toDateString()) {
      newStreak += 1;
    } else if (lastActive !== today) {
      newStreak = 1;
    }

    setStreakData(prev => ({
      ...prev,
      currentStreak: newStreak,
      longestStreak: Math.max(prev.longestStreak, newStreak),
      lastActiveDate: today
    }));

    if (newStreak === 7) unlockAchievement("Week Warrior", "7 day streak!", "🔥");
    if (newStreak === 30) unlockAchievement("Monthly Master", "30 day streak!", "👑");
  }, [streakData.lastActiveDate, unlockAchievement]);

  // NEW: Change Avatar - FIXED: Added visual feedback
  const changeAvatar = useCallback((avatar) => {
    setSelectedAvatar(avatar);
    const msg = `🎉 Your new friend ${avatar} is ready to play!`;
    setCurrentMessage(msg);
    speak(msg, "happy");
    createParticles(150, 150, 'emoji');
  }, [speak, createParticles, setCurrentMessage]);

  // NEW: Change Theme
  const changeTheme = useCallback((theme) => {
    setSelectedTheme(theme.name);
    speak(`Theme changed to ${theme.name}! Looking beautiful!`, "happy");
  }, [speak]);

  // NEW: Story Creator Functions
  const startStoryCreator = useCallback(() => {
    setStoryCreatorActive(true);
    setCreatedStory({ character: null, setting: null, problem: null, resolution: null, fullStory: null });
    speak("Let's create a magical story together! First, pick a character. Say: brave knight, clever fox, or kind princess!", "excited");
  }, [speak]);

  const processStoryStep = useCallback((input) => {
    const lower = input.toLowerCase();

    if (!createdStory.character) {
      let character = null;
      if (lower.includes('knight')) character = { name: 'Brave Knight', emoji: '🛡️', trait: 'brave' };
      else if (lower.includes('fox')) character = { name: 'Clever Fox', emoji: '🦊', trait: 'clever' };
      else if (lower.includes('princess')) character = { name: 'Kind Princess', emoji: '👸', trait: 'kind' };
      else if (lower.includes('dragon')) character = { name: 'Friendly Dragon', emoji: '🐉', trait: 'friendly' };
      else if (lower.includes('robot')) character = { name: 'Smart Robot', emoji: '🤖', trait: 'smart' };

      if (character) {
        setCreatedStory(prev => ({ ...prev, character }));
        speak(`Great choice! ${character.name} it is! Now, where does the story happen? Say: enchanted forest, space station, or underwater kingdom!`, "excited");
      } else {
        speak("I didn't catch that. Please say: brave knight, clever fox, kind princess, friendly dragon, or smart robot!", "thinking");
      }
      return;
    }

    if (!createdStory.setting) {
      let setting = null;
      if (lower.includes('forest')) setting = { name: 'Enchanted Forest', description: 'magical woods with talking trees' };
      else if (lower.includes('space')) setting = { name: 'Space Station', description: 'floating among the stars' };
      else if (lower.includes('underwater')) setting = { name: 'Underwater Kingdom', description: 'deep beneath the ocean waves' };
      else if (lower.includes('castle')) setting = { name: 'Crystal Castle', description: 'sparkling towers in the clouds' };
      else if (lower.includes('jungle')) setting = { name: 'Mystic Jungle', description: 'lush green wilderness full of secrets' };

      if (setting) {
        setCreatedStory(prev => ({ ...prev, setting }));
        speak(`What an amazing place! Now, what problem does ${createdStory.character.name} face? Say: lost treasure, evil villain, or big storm!`, "thinking");
      } else {
        speak("I didn't understand. Please say: enchanted forest, space station, underwater kingdom, crystal castle, or mystic jungle!", "thinking");
      }
      return;
    }

    if (!createdStory.problem) {
      let problem = null;
      if (lower.includes('treasure') || lower.includes('lost')) problem = { name: 'Lost Treasure', description: 'must find the hidden treasure' };
      else if (lower.includes('villain') || lower.includes('evil')) problem = { name: 'Evil Villain', description: 'must stop the wicked villain' };
      else if (lower.includes('storm')) problem = { name: 'Big Storm', description: 'must survive the terrible storm' };
      else if (lower.includes('puzzle') || lower.includes('riddle')) problem = { name: 'Ancient Puzzle', description: 'must solve the mystery' };
      else if (lower.includes('monster')) problem = { name: 'Sleepy Monster', description: 'must help the grumpy monster' };

      if (problem) {
        setCreatedStory(prev => ({ ...prev, problem }));
        speak(`Oh no! ${problem.name}! How does ${createdStory.character.name} solve it? Say: uses magic, makes friends, or never gives up!`, "excited");
      } else {
        speak("Please tell me the problem! Say: lost treasure, evil villain, big storm, ancient puzzle, or sleepy monster!", "thinking");
      }
      return;
    }

    if (!createdStory.resolution) {
      let resolution = null;
      if (lower.includes('magic')) resolution = { name: 'Uses Magic', description: 'uses special powers to save the day' };
      else if (lower.includes('friends') || lower.includes('help')) resolution = { name: 'Makes Friends', description: 'friends come together to help' };
      else if (lower.includes('never') || lower.includes('gives up')) resolution = { name: 'Never Gives Up', description: 'keeps trying until they succeed' };
      else if (lower.includes('smart') || lower.includes('clever')) resolution = { name: 'Clever Idea', description: 'thinks of a brilliant solution' };
      else if (lower.includes('kind') || lower.includes('love')) resolution = { name: 'Kindness Wins', description: 'shows kindness and saves the day' };

      if (resolution) {
        const fullStory = `Once upon a time, there was ${createdStory.character.name} who was very ${createdStory.character.trait}. 
          One day, in the ${createdStory.setting.name} where ${createdStory.setting.description}, 
          they faced a big challenge: ${createdStory.problem.description}. 
          But ${createdStory.character.name} didn't give up! In the end, they ${resolution.description}.
          And they all lived happily ever after! The End.`;

        setCreatedStory(prev => ({ ...prev, resolution, fullStory }));
        speak(fullStory, "story");
        unlockAchievement("Storyteller", "Created your own magical story!", "📚");
        createParticles(200, 200, 'emoji');
      } else {
        speak("How was the problem solved? Say: uses magic, makes friends, never gives up, clever idea, or kindness wins!", "thinking");
      }
    }
  }, [createdStory, speak, unlockAchievement, createParticles]);

  // NEW: Reward Shop Functions
  const toggleRewardShop = useCallback(() => {
    setRewardShopOpen(prev => !prev);
    if (!rewardShopOpen) {
      speak("Welcome to the Reward Shop! Spend your points on cool items!", "excited");
    }
  }, [rewardShopOpen, speak]);

  const purchaseItem = useCallback((item) => {
    if (purchasedItems.includes(item.id)) {
      speak(`You already own the ${item.name}!`, "thinking");
      return;
    }

    if (totalScore < item.cost) {
      speak(`You need ${item.cost - totalScore} more points to buy the ${item.name}! Keep playing games!`, "thinking");
      return;
    }

    setTotalScore(prev => prev - item.cost);
    setPurchasedItems(prev => [...prev, item.id]);
    speak(`Congratulations! You bought the ${item.name}!`, "celebrating");
    createParticles(200, 200, 'emoji');
  }, [totalScore, purchasedItems, speak, createParticles]);

  const equipItem = useCallback((item) => {
    setEquippedItems(prev => ({ ...prev, [item.type]: item.id }));
    speak(`You equipped the ${item.name}! Looking great!`, "happy");
  }, [speak]);

  // NEW: Sound Effects Functions
  const playSoundEffect = useCallback((type) => {
    if (!soundEnabled) return;

    try {
      // Create simple beep sounds using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'correct') {
        // Happy ascending sound
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(soundVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === 'wrong') {
        // Low descending sound
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(soundVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === 'achievement') {
        // Victory fanfare
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3); // C6
        gainNode.gain.setValueAtTime(soundVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else if (type === 'click') {
        // Short click
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(soundVolume * 0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [soundEnabled, soundVolume]);

  // NEW: Detect Season
  const detectSeason = useCallback(() => {
    const month = new Date().getMonth();
    let season = 'spring';
    if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else if (month >= 11 || month <= 1) season = 'winter';
    setCurrentSeason(season);
  }, []);

  // NEW: Simple Emotion Detection from Voice
  const detectEmotionFromVoice = useCallback((transcript) => {
    const lower = transcript.toLowerCase();
    let emotion = 'neutral';

    if (lower.match(/yay|awesome|great|happy|love|fun|excited/)) emotion = 'happy';
    else if (lower.match(/sad|upset|cry|hurt|sorry/)) emotion = 'sad';
    else if (lower.match(/mad|angry|hate|frustrated|annoyed/)) emotion = 'angry';
    else if (lower.match(/scared|afraid|frightened|nervous/)) emotion = 'fear';
    else if (lower.match(/wow|amazing|cool|whoa/)) emotion = 'surprised';

    setDetectedEmotion(emotion);
    setEmotionHistory(prev => [...prev.slice(-9), { emotion, timestamp: Date.now() }]);

    // Respond to emotions
    if (emotion === 'sad') {
      speak("I can tell you might be feeling a bit down. Would you like to try a calming breathing exercise?", "calm");
    } else if (emotion === 'angry') {
      speak("It sounds like you're frustrated. Let's take a deep breath together and play something fun!", "calm");
    } else if (emotion === 'happy') {
      speak("I love hearing how happy you are! Let's keep having fun!", "excited");
    }
  }, [speak]);

  // Process voice/text commands
  const processCommand = useCallback((command) => {
    addLog("info", `Processing command: ${command}`);
    
    // If in game and waiting for answer, check if it's an answer
    if (gameState.isPlaying && gameState.waitingForAnswer) {
      checkAnswer(command);
      return;
    }
    
    // Stop command
    if (command.includes("stop") || command.includes("quiet") || command.includes("shush") || command.includes("end game")) {
      if (gameState.isPlaying) {
        endGame();
        return;
      }
      stopSpeech();
      speak("Okay, I'll stop speaking now.", "happy");
      setCurrentMode("chat");
      return;
    }
    
    // Greeting commands
    if (command.includes("hello") || command.includes("hi") || command.includes("hey")) {
      speak(`Hello ${userName || "friend"}! I'm Dhyan, your interactive learning companion. I can tell stories, sing songs, play games, and even read books to you!`, "happy");
      return;
    }
    
    // Help command
    if (command.includes("help") || command.includes("what can you do")) {
      speak("I can do many things! Say 'sing a song' to hear a song, 'tell me a story' for stories, 'read a poem' for poems, 'read a book' for book excerpts, 'play a game' for fun games, 'math quiz' for math practice, or 'tell me my stats' to hear your progress!", "thinking");
      return;
    }
    
    // Game commands
    if (command.includes("play a game") || command.includes("lets play") || command.includes("game time")) {
      speak("Let's play! I can play riddles, trivia, word scramble, or animal sounds. Which game would you like? Say 'riddles', 'trivia', 'word scramble', or 'animal sounds'!", "excited");
      return;
    }
    
    if (command.includes("riddle")) {
      speak("Great choice! Let's solve some riddles! I'll ask you 5 riddles. Here we go!", "excited");
      startGame('riddle');
      return;
    }
    
    if (command.includes("trivia")) {
      speak("Trivia time! Let's test your knowledge with 5 fun questions!", "excited");
      startGame('trivia');
      return;
    }
    
    if (command.includes("math") || command.includes("numbers")) {
      speak("Math practice! I'll give you addition, subtraction, multiplication, and division problems. Let's go!", "excited");
      setGameState(prev => ({ ...prev, difficulty: command.includes('hard') ? 'hard' : command.includes('medium') ? 'medium' : 'easy' }));
      startGame('math');
      return;
    }
    
    if (command.includes("spelling")) {
      speak("Spelling bee! I'll say a word, you spell it out loud. Let's begin!", "excited");
      startGame('spelling');
      return;
    }
    
    if (command.includes("word scramble") || command.includes("scramble")) {
      speak("Word scramble! I'll give you mixed up letters. Unscramble them to find the word!", "excited");
      startGame('wordScramble');
      return;
    }
    
    if (command.includes("animal sounds") || command.includes("animal game")) {
      speak("Animal sounds game! I'll make an animal sound, you tell me which animal it is!", "excited");
      startGame('animalSounds');
      return;
    }

    // NEW: Story Creator command
    if (command.includes("create story") || command.includes("make story") || command.includes("story creator")) {
      startStoryCreator();
      return;
    }

    // NEW: Process story creator inputs
    if (storyCreatorActive && !createdStory.fullStory) {
      processStoryStep(command);
      return;
    }
    
    // Song commands
    if (command.includes("song") || command.includes("sing") || command.includes("music")) {
      const song = CONTENT_LIBRARY.songs[Math.floor(Math.random() * CONTENT_LIBRARY.songs.length)];
      setCurrentMode("song");
      setCurrentContent(song);
      speak(`Here's a song called "${song.title}"!`, "excited", () => {
        setTimeout(() => {
          speak(song.lyrics, "excited");
        }, 500);
      });
      return;
    }
    
    // Poem commands
    if (command.includes("poem") || command.includes("poetry") || command.includes("verse")) {
      const poem = CONTENT_LIBRARY.poems[Math.floor(Math.random() * CONTENT_LIBRARY.poems.length)];
      setCurrentMode("poem");
      setCurrentContent(poem);
      speak(`Here's a beautiful poem by ${poem.author} called "${poem.title}".`, "thinking", () => {
        setTimeout(() => {
          speak(poem.text, "thinking");
        }, 500);
      });
      return;
    }
    
    // Story commands
    if (command.includes("story") || command.includes("tale") || command.includes("adventure")) {
      const story = CONTENT_LIBRARY.stories[Math.floor(Math.random() * CONTENT_LIBRARY.stories.length)];
      setCurrentMode("story");
      setCurrentContent(story);
      speak(`Here's a story called "${story.title}".`, "story", () => {
        setTimeout(() => {
          speak(story.content, "story");
        }, 500);
      });
      return;
    }
    
    // Book/Novel commands
    if (command.includes("book") || command.includes("novel") || command.includes("read") || command.includes("chapter")) {
      const book = CONTENT_LIBRARY.books[Math.floor(Math.random() * CONTENT_LIBRARY.books.length)];
      setCurrentMode("book");
      setCurrentContent(book);
      speak(`Let me read you an excerpt from "${book.title}" by ${book.author}.`, "thinking", () => {
        setTimeout(() => {
          speak(book.excerpt, "story");
        }, 500);
      });
      return;
    }
    
    // Stats commands
    if (command.includes("stats") || command.includes("progress") || command.includes("how am i doing")) {
      if (!stats) {
        speak("I don't have your stats yet. Try playing some games first!", "thinking");
        return;
      }
      const message = `Here's your progress: You have ${stats.total_children || 0} children registered. You've played ${stats.total_sessions || 0} games and completed ${stats.completed_sessions || 0} sessions. ${stats.total_sessions >= 5 ? "You're doing amazing! Keep it up!" : "Keep playing to improve your skills!"}`;
      speak(message, "thinking");
      return;
    }
    
    // Encouragement
    if (command.includes("encourage") || command.includes("motivate") || command.includes("i'm sad")) {
      const encouragements = [
        "You are capable of amazing things! Every expert was once a beginner. Keep going!",
        "Believe in yourself! You have unique talents that nobody else has. Shine bright!",
        "Mistakes help us learn and grow. Don't give up - you're getting better every day!",
        "You are braver than you believe, stronger than you seem, and smarter than you think!",
        "The only way to do great work is to love what you do. You're doing great!"
      ];
      speak(encouragements[Math.floor(Math.random() * encouragements.length)], "celebrating");
      return;
    }
    
    // Joke command
    if (command.includes("joke") || command.includes("funny") || command.includes("laugh")) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "Why don't eggs tell jokes? They'd crack each other up!",
        "What do you call a fake noodle? An impasta!"
      ];
      speak(jokes[Math.floor(Math.random() * jokes.length)], "excited");
      return;
    }
    
    // Weather/time (placeholder responses)
    if (command.includes("weather") || command.includes("time")) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      speak(`It's currently ${timeString}. Have a wonderful day!`, "happy");
      return;
    }
    
    // Default response
    speak(`I heard you say: "${command}". Try saying "help" to learn what I can do!`, "thinking");
  }, [addLog, speak, stopSpeech, stats, userName, gameState.isPlaying, gameState.waitingForAnswer, checkAnswer, endGame, startGame, setGameState]);

  // NEW: Detect season on mount
  useEffect(() => {
    detectSeason();
  }, [detectSeason]);

  // Welcome message on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const greetings = [
        `Hi ${userName || "there"}! I'm Dhyan, your interactive learning buddy! Click the microphone or say "help" to learn what I can do!`,
        `Hello ${userName || "friend"}! I'm Dhyan! I can sing songs, tell stories, read poems, and books! Try saying "sing a song"!`,
        `Hey ${userName || "there"}! Welcome back! I'm Dhyan, ready to help you learn! Say "tell me a story" to hear something fun!`
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      speak(greeting, "happy");
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [userName, speak]);
  
  // Emojis for different emotions
  const avatars = {
    happy: "😊",
    excited: "🤩",
    thinking: "🤔",
    celebrating: "🥳",
    waving: "👋",
    story: "📚",
    song: "🎵",
    game: "🎮"
  };
  
  // Colors for different emotions - Cute Pastel Rainbow Theme
  const emotionColors = {
    happy: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
    excited: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    thinking: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    celebrating: "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
    waving: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    story: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    song: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    game: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
  };
  
  // Get current avatar based on mode
  const getCurrentAvatar = () => {
    if (currentMode === "song") return avatars.song;
    if (currentMode === "story" || currentMode === "book") return avatars.story;
    if (currentMode === "game") return avatars.game;
    return avatars[emotion] || avatars.happy;
  };
  
  // Get current color based on mode
  const getCurrentColor = () => {
    if (currentMode === "song") return emotionColors.song;
    if (currentMode === "story" || currentMode === "book") return emotionColors.story;
    if (currentMode === "game") return emotionColors.game;
    return emotionColors[emotion] || emotionColors.happy;
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: emotionColors.happy,
          border: "none",
          fontSize: 28,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
          zIndex: 100,
          animation: "bounce-soft 2s ease-in-out infinite"
        }}
      >
        {avatars.happy}
      </button>
    );
  }
  
  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 12
    }}>
      {/* Ambient Background Particles */}
      <AmbientParticles />

      {/* Confetti Explosion for Big Achievements */}
      <ConfettiExplosion trigger={confettiTrigger} />

      {/* Background Music Player */}
      {musicPlayerOpen && (
        <MusicPlayer
          isOpen={musicPlayerOpen}
          onClose={() => setMusicPlayerOpen(false)}
        />
      )}

      {/* Music Player Toggle Button */}
      {!musicPlayerOpen && (
        <MusicPlayerButton onClick={() => setMusicPlayerOpen(true)} />
      )}

      {/* Main Control Panel */}
      {(currentMessage || isExpanded) && (
        <div style={{
          background: "linear-gradient(135deg, #fff5f7 0%, #ffeef8 50%, #f0f9ff 100%)",
          borderRadius: 28,
          padding: "22px",
          maxWidth: 340,
          boxShadow: "0 12px 40px rgba(255, 154, 158, 0.25), 0 4px 12px rgba(161, 140, 209, 0.15)",
          border: "4px solid rgba(255, 154, 158, 0.4)",
          position: "relative",
          marginBottom: 8,
          animation: "float 3s ease-in-out infinite"
        }}>
          {/* Triangle pointer */}
          <div style={{
            position: "absolute",
            bottom: -14,
            right: 40,
            width: 26,
            height: 26,
            background: "linear-gradient(135deg, #ffeef8, #f0f9ff)",
            borderBottom: "4px solid rgba(255, 154, 158, 0.4)",
            borderRight: "4px solid rgba(255, 154, 158, 0.4)",
            transform: "rotate(45deg)"
          }} />
          
          {/* Header with title and close */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ 
              fontFamily: "var(--font-fun)", 
              fontSize: 18, 
              fontWeight: 800, 
              background: "linear-gradient(135deg, #ff9a9e, #a18cd1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              🌸 Dhyan
              {currentMode !== "chat" && (
                <span style={{ 
                  fontSize: 11, 
                  marginLeft: 6,
                  padding: "4px 10px",
                  background: currentMode === "song" ? "linear-gradient(135deg, #fa709a, #fee140)" :
                             currentMode === "story" ? "linear-gradient(135deg, #e0c3fc, #8ec5fc)" :
                             currentMode === "game" ? "linear-gradient(135deg, #43e97b, #38f9d7)" :
                             "linear-gradient(135deg, #ff9a9e, #a18cd1)",
                  borderRadius: 14,
                  color: "white",
                  fontWeight: 700,
                  WebkitTextFillColor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  {currentMode === "song" ? "🎵 Singing" : 
                   currentMode === "poem" ? "📜 Poetry" :
                   currentMode === "story" ? "📚 Story" :
                   currentMode === "book" ? "📖 Reading" :
                   currentMode === "game" ? "🎮 Gaming" : ""}
                </span>
              )}
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                opacity: 0.5
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Sound wave animation */}
          {isSpeaking && (
            <div style={{ 
              display: "flex", 
              gap: 3, 
              marginBottom: 12, 
              justifyContent: "center",
              padding: "8px",
              background: "var(--cute-primary-soft)",
              borderRadius: 12
            }}>
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{
                  width: 4,
                  height: 10 + i * 5,
                  background: "var(--cute-primary)",
                  borderRadius: 2,
                  animation: `soundWave 0.5s ease-in-out ${i * 0.1}s infinite alternate`
                }} />
              ))}
            </div>
          )}
          
          {/* Listening indicator */}
          {isListening && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 12,
              padding: "10px 16px",
              background: "linear-gradient(135deg, #fff5f7, #ffeef8)",
              borderRadius: 14,
              border: "2px dashed rgba(255, 154, 158, 0.5)"
            }}>
              <span style={{
                width: 10,
                height: 10,
                background: "linear-gradient(135deg, #ff9a9e, #fecfef)",
                borderRadius: "50%",
                animation: "pulse 1s ease-in-out infinite",
                boxShadow: "0 0 8px rgba(255, 154, 158, 0.5)"
              }} />
              <span style={{ fontFamily: "var(--font-fun)", fontSize: 13, color: "#d63384", fontWeight: 700 }}>
                🎤 I'm listening...
              </span>
            </div>
          )}

          {/* NEW: Wake Word Detected Indicator */}
          {showWakeWordIndicator && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 12,
              padding: "12px 18px",
              background: "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
              borderRadius: 16,
              border: "3px solid rgba(255, 107, 107, 0.5)",
              animation: "bounce-in 0.5s ease"
            }}>
              <span style={{
                fontSize: 24,
                animation: "pulse 0.5s ease-in-out infinite"
              }}>
                🎯
              </span>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontFamily: "var(--font-fun)", fontSize: 14, color: "#d63384", fontWeight: 800, display: "block" }}>
                  Hey Dhyan detected!
                </span>
                <span style={{ fontFamily: "var(--font-fun)", fontSize: 11, color: "#6c757d" }}>
                  I'm here and ready to help!
                </span>
              </div>
            </div>
          )}

          {/* NEW: Wake Word Listening Status */}
          {wakeWordEnabled && !isListening && isListeningForWakeWord && !showWakeWordIndicator && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 10,
              padding: "6px 12px",
              background: "rgba(132, 250, 176, 0.2)",
              borderRadius: 20,
              border: "1px dashed rgba(67, 233, 123, 0.4)"
            }}>
              <span style={{
                width: 8,
                height: 8,
                background: "linear-gradient(135deg, #43e97b, #38f9d7)",
                borderRadius: "50%",
                animation: "pulse 2s ease-in-out infinite"
              }} />
              <span style={{ fontFamily: "var(--font-fun)", fontSize: 11, color: "#198754", fontWeight: 600 }}>
                Say "Hey Dhyan" to wake me!
              </span>
            </div>
          )}
          
          {/* Current Message */}
          <p style={{
            fontFamily: "var(--font-fun)",
            fontSize: 14,
            margin: "0 0 16px 0",
            color: "#495057",
            lineHeight: 1.7,
            maxHeight: 120,
            overflowY: "auto"
          }}>
            {currentMessage}
          </p>
          
          {/* Content Display (when showing songs/poems/stories) */}
          {currentContent && (
            <div style={{
              padding: 14,
              background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
              borderRadius: 16,
              marginBottom: 12,
              fontSize: 13,
              border: "2px solid rgba(255, 154, 158, 0.3)",
              boxShadow: "0 4px 12px rgba(255, 154, 158, 0.15)"
            }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#d63384", fontSize: 14 }}>
                � Now Playing: {currentContent.title}
              </p>
              {currentContent.author && (
                <p style={{ margin: "6px 0 0 0", fontSize: 11, color: "#6c757d", fontWeight: 500 }}>
                  ✨ by {currentContent.author}
                </p>
              )}
            </div>
          )}
          
          {/* NEW: Game State Display */}
          {gameState.isPlaying && (
            <div style={{
              padding: 14,
              background: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
              borderRadius: 16,
              marginBottom: 12,
              fontSize: 13,
              border: "2px solid rgba(67, 233, 123, 0.4)",
              boxShadow: "0 4px 16px rgba(67, 233, 123, 0.25)",
              animation: "bounce-in 0.5s ease"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 800, color: "#198754", fontSize: 14 }}>
                  🎮 {gameState.type?.charAt(0).toUpperCase() + gameState.type?.slice(1)} Game
                </span>
                <span style={{ fontWeight: 800, color: "#0d6efd", fontSize: 18, background: "white", padding: "2px 10px", borderRadius: 12 }}>
                  ⭐ {gameState.score}
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#495057" }}>
                <span style={{ fontWeight: 600 }}>🔥 Streak: {gameState.streak}</span>
                <span style={{ fontWeight: 600 }}>📋 {gameState.questionsAnswered + 1}/5</span>
              </div>
              {gameState.waitingForAnswer && (
                <div style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: "linear-gradient(135deg, #fff5f7, #ffeef8)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "#d63384",
                  fontWeight: 700,
                  textAlign: "center",
                  border: "2px dashed rgba(255, 154, 158, 0.4)"
                }}>
                  🎤 Speak your answer...
                </div>
              )}

              {/* STICKER DISPLAY: Shapes Game */}
              {gameState.type === 'shapes' && gameState.currentQuestion?.sticker && (
                <div style={{ marginTop: 15, textAlign: "center" }}>
                  <div className="shape-sticker" style={{ display: "inline-block" }}>
                    {gameState.currentQuestion.sticker}
                  </div>
                </div>
              )}

              {/* STICKER DISPLAY: Memory Game */}
              {gameState.type === 'memory' && gameState.currentQuestion?.items && (
                <div style={{ marginTop: 15 }}>
                  <div className="memory-sticker-container">
                    {gameState.currentQuestion.items.map((item, idx) => (
                      <div key={idx} className="memory-card sticker-pop">
                        {item.sticker}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STICKER DISPLAY: Patterns Game */}
              {gameState.type === 'patterns' && gameState.currentQuestion?.sequence && (
                <div style={{ marginTop: 15 }}>
                  <div className="sticker-sequence">
                    {gameState.currentQuestion.sequence.map((item, idx) => (
                      <div key={idx} className="pattern-sticker">
                        {/* Render pattern stickers based on type */}
                        {gameState.currentQuestion.type === 'pattern' && PatternStickers[item]}
                        {gameState.currentQuestion.type === 'animal' && AnimalStickers[item]}
                        {gameState.currentQuestion.type === 'fruit' && FruitStickers[item]}
                        {gameState.currentQuestion.type === 'number' && NumberStickers[item]}
                        {gameState.currentQuestion.type === 'letter' && NumberStickers[item]}
                      </div>
                    ))}
                    <span className="sticker-separator">→</span>
                    <div className="pattern-sticker" style={{ border: "3px dashed #ff9a9e", borderRadius: "50%" }}>
                      {/* Question mark for the missing item */}
                      <span style={{ fontSize: 24, color: "#ff9a9e" }}>?</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STICKER DISPLAY: Animal Sounds Game */}
              {gameState.type === 'animalSounds' && gameState.currentQuestion?.sticker && (
                <div style={{ marginTop: 15, textAlign: "center" }}>
                  <div className="animal-sticker" style={{ display: "inline-block" }}>
                    {gameState.currentQuestion.sticker}
                  </div>
                  <p style={{ marginTop: 10, fontSize: 14, color: "#666", fontStyle: "italic" }}>
                    Listen to the sound and guess the animal!
                  </p>
                </div>
              )}

              {/* COLOR PREVIEW: Colors Game */}
              {gameState.type === 'colors' && gameState.currentQuestion?.hex && (
                <div style={{ marginTop: 15, textAlign: "center" }}>
                  <div 
                    style={{ 
                      width: 120, 
                      height: 120, 
                      borderRadius: 20, 
                      backgroundColor: gameState.currentQuestion.hex,
                      display: "inline-block",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.3)",
                      border: "4px solid white"
                    }}
                  />
                  <p style={{ marginTop: 10, fontSize: 14, color: "#666", fontStyle: "italic" }}>
                    What color is this?
                  </p>
                </div>
              )}

              {/* STICKER DISPLAY: Spelling Game */}
              {gameState.type === 'spelling' && gameState.currentQuestion?.sticker && (
                <div style={{ marginTop: 15, textAlign: "center" }}>
                  <div className="spelling-sticker" style={{ display: "inline-block" }}>
                    {gameState.currentQuestion.sticker}
                  </div>
                  <p style={{ marginTop: 10, fontSize: 14, color: "#666", fontStyle: "italic" }}>
                    Hint: {gameState.currentQuestion.hint}
                  </p>
                </div>
              )}

              {/* STICKER DISPLAY: Word Scramble Game */}
              {gameState.type === 'wordScramble' && gameState.currentQuestion?.sticker && (
                <div style={{ marginTop: 15, textAlign: "center" }}>
                  <div className="word-scramble-sticker" style={{ display: "inline-block" }}>
                    {gameState.currentQuestion.sticker}
                  </div>
                  <p style={{ marginTop: 10, fontSize: 14, color: "#666", fontStyle: "italic" }}>
                    Hint: {gameState.currentQuestion.hint}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Main Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Media Controls */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => processCommand("sing a song")}
                disabled={isSpeaking}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: isSpeaking ? "#e9ecef" : "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: isSpeaking ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  opacity: isSpeaking ? 0.6 : 1,
                  boxShadow: isSpeaking ? "none" : "0 4px 12px rgba(250, 112, 154, 0.3)",
                  transform: isSpeaking ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !isSpeaking && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !isSpeaking && (e.target.style.transform = "translateY(0)")}
              >
                🎵 Song
              </button>
              <button
                onClick={() => processCommand("read a poem")}
                disabled={isSpeaking}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: isSpeaking ? "#e9ecef" : "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
                  color: isSpeaking ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  opacity: isSpeaking ? 0.6 : 1,
                  boxShadow: isSpeaking ? "none" : "0 4px 12px rgba(161, 140, 209, 0.3)",
                  transform: isSpeaking ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !isSpeaking && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !isSpeaking && (e.target.style.transform = "translateY(0)")}
              >
                📜 Poem
              </button>
              <button
                onClick={() => processCommand("tell me a story")}
                disabled={isSpeaking}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: isSpeaking ? "#e9ecef" : "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
                  color: isSpeaking ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  opacity: isSpeaking ? 0.6 : 1,
                  boxShadow: isSpeaking ? "none" : "0 4px 12px rgba(132, 250, 176, 0.3)",
                  transform: isSpeaking ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !isSpeaking && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !isSpeaking && (e.target.style.transform = "translateY(0)")}
              >
                📚 Story
              </button>
              <button
                onClick={() => processCommand("read a book")}
                disabled={isSpeaking}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: isSpeaking ? "#e9ecef" : "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
                  color: isSpeaking ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  opacity: isSpeaking ? 0.6 : 1,
                  boxShadow: isSpeaking ? "none" : "0 4px 12px rgba(224, 195, 252, 0.3)",
                  transform: isSpeaking ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !isSpeaking && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !isSpeaking && (e.target.style.transform = "translateY(0)")}
              >
                📖 Book
              </button>
            </div>
            
            {/* NEW: Game Buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => processCommand("play riddles")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(255, 154, 158, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🧩 Riddles
              </button>
              <button
                onClick={() => processCommand("play trivia")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(161, 140, 209, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🎯 Trivia
              </button>
              <button
                onClick={() => processCommand("math quiz")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(252, 182, 159, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🔢 Math
              </button>
              <button
                onClick={() => processCommand("word scramble")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(137, 247, 254, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🎲 Words
              </button>
            </div>

            {/* NEW: Additional Learning Games */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => processCommand("play colors")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(255, 107, 107, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🎨 Colors
              </button>
              <button
                onClick={() => processCommand("play shapes")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(161, 140, 209, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🔷 Shapes
              </button>
              <button
                onClick={() => processCommand("play memory")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(102, 126, 234, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🧠 Memory
              </button>
              <button
                onClick={() => processCommand("play patterns")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(17, 153, 142, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                📊 Patterns
              </button>
            </div>

            {/* Utility Buttons - FIXED: Added visual feedback */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  const msg = stats 
                    ? `📊 Your Progress: ${stats.total_sessions || 0} games played, ${stats.completed_sessions || 0} completed. ${stats.total_sessions >= 5 ? "You're doing amazing! 🌟" : "Keep playing to improve! 💪"}`
                    : "📊 No stats yet. Try playing some games first! 🎮";
                  setCurrentMessage(msg);
                  speak(msg, "thinking");
                }}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
                  color: "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(255, 154, 158, 0.25)",
                  transition: "all 0.2s ease",
                  transform: "scale(1)",
                }}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                📊 Stats
              </button>
              <button
                onClick={() => {
                  const encouragements = [
                    "🌟 You are capable of amazing things! Every expert was once a beginner. Keep going!",
                    "💪 Believe in yourself! You have unique talents that nobody else has. Shine bright!",
                    "🌈 Mistakes help us learn and grow. Don't give up - you're getting better every day!",
                    "⭐ You are braver than you believe, stronger than you seem, and smarter than you think!",
                    "🎯 The only way to do great work is to love what you do. You're doing great!"
                  ];
                  const msg = encouragements[Math.floor(Math.random() * encouragements.length)];
                  setCurrentMessage(msg);
                  speak(msg, "celebrating");
                }}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
                  color: "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(250, 208, 196, 0.25)",
                  transition: "all 0.2s ease",
                  transform: "scale(1)",
                }}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                💪 Encourage
              </button>
              <button
                onClick={() => {
                  const jokes = [
                    "😄 Why don't scientists trust atoms? Because they make up everything!",
                    "🤣 Why did the scarecrow win an award? Because he was outstanding in his field!",
                    "😂 Why don't eggs tell jokes? They'd crack each other up!",
                    "🎭 What do you call a fake noodle? An impasta!"
                  ];
                  const msg = jokes[Math.floor(Math.random() * jokes.length)];
                  setCurrentMessage(msg);
                  speak(msg, "excited");
                }}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
                  color: "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(137, 247, 254, 0.25)",
                  transition: "all 0.2s ease",
                  transform: "scale(1)",
                }}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                😄 Joke
              </button>
            </div>

            {/* NEW: Wake Word Toggle */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={toggleWakeWord}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: wakeWordEnabled
                    ? "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)"
                    : "linear-gradient(135deg, #ddd 0%, #bbb 100%)",
                  color: wakeWordEnabled ? "#0d6efd" : "#666",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: wakeWordEnabled
                    ? "0 4px 12px rgba(132, 250, 176, 0.35)"
                    : "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
                onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                <span style={{ fontSize: 14 }}>
                  {wakeWordEnabled ? "🎧" : "🔇"}
                </span>
                {wakeWordEnabled ? "Wake Word: ON" : "Wake Word: OFF"}
              </button>
            </div>

            {/* NEW: Breathing Exercise Button */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={startBreathingExercise}
                disabled={breathingActive}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: breathingActive
                    ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: breathingActive ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.35)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
                onMouseEnter={(e) => !breathingActive && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                <span style={{ fontSize: 14 }}>🧘</span>
                {breathingActive ? `Breathing: ${breathingPhase}` : "Calm Down"}
              </button>
            </div>

            {/* NEW: Avatar Selection */}
            <div style={{
              marginTop: 10,
              padding: 10,
              background: "linear-gradient(135deg, #fff5f7, #ffeef8)",
              borderRadius: 14,
              border: "2px dashed rgba(255, 154, 158, 0.3)"
            }}>
              <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#d63384", fontWeight: 700 }}>
                🎭 Choose Your Friend
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar}
                    onClick={() => changeAvatar(avatar)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: selectedAvatar === avatar ? "3px solid #ff9a9e" : "2px solid transparent",
                      background: selectedAvatar === avatar ? "#fff" : "rgba(255,255,255,0.5)",
                      fontSize: 20,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      transform: selectedAvatar === avatar ? "scale(1.1)" : "scale(1)"
                    }}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* NEW: Daily Challenges */}
            <div style={{
              marginTop: 10,
              padding: 12,
              background: "linear-gradient(135deg, #ffecd2, #fcb69f)",
              borderRadius: 14,
              border: "2px solid rgba(255, 154, 158, 0.3)"
            }}>
              <p style={{ margin: "0 0 10px 0", fontSize: 12, color: "#d63384", fontWeight: 800 }}>
                📋 Daily Challenges
              </p>
              {dailyChallenges.map(challenge => (
                <div key={challenge.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px dashed rgba(0,0,0,0.1)"
                }}>
                  <span style={{ fontSize: 11, color: challenge.completed ? "#28a745" : "#495057" }}>
                    {challenge.completed ? "✅" : "⏳"} {challenge.title}
                  </span>
                  <span style={{ fontSize: 10, color: "#6c757d", fontWeight: 600 }}>
                    {challenge.current}/{challenge.target}
                  </span>
                </div>
              ))}
            </div>

            {/* NEW: Streak Calendar */}
            <div style={{
              marginTop: 10,
              padding: 12,
              background: "linear-gradient(135deg, #84fab0, #8fd3f4)",
              borderRadius: 14
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#0d6efd", fontWeight: 800 }}>
                  🔥 Streak: {streakData.currentStreak} days
                </span>
                {!dailyRewardClaimed && (
                  <button
                    onClick={claimDailyReward}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 10,
                      border: "none",
                      background: "#ffd700",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🎁 Claim!
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: 24,
                    borderRadius: 6,
                    background: streakData.weeklyProgress[i] ? "#0d6efd" : "rgba(255,255,255,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: streakData.weeklyProgress[i] ? "white" : "#6c757d"
                  }}>
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: Creative Mode Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={startStoryCreator}
                disabled={storyCreatorActive}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: storyCreatorActive
                    ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
                    : "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: storyCreatorActive ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(250, 112, 154, 0.35)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
                onMouseEnter={(e) => !storyCreatorActive && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                <span style={{ fontSize: 16 }}>📚</span>
                {storyCreatorActive ? "Creating Story..." : "Create Story"}
              </button>

              <button
                onClick={toggleRewardShop}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: rewardShopOpen
                    ? "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
                    : "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
                  color: "#0d6efd",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(132, 250, 176, 0.35)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
                onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                <span style={{ fontSize: 16 }}>🏪</span>
                {rewardShopOpen ? "Close Shop" : "Reward Shop"}
              </button>
            </div>

            {/* NEW: Story Creator Active Display */}
            {storyCreatorActive && (
              <div style={{
                marginTop: 10,
                padding: 15,
                background: "linear-gradient(135deg, #fff5f7, #ffeef8)",
                borderRadius: 14,
                border: "3px dashed rgba(255, 154, 158, 0.5)"
              }}>
                <p style={{ margin: "0 0 10px 0", fontSize: 12, color: "#d63384", fontWeight: 800 }}>
                  📖 Story Creator Mode
                </p>
                <div style={{ fontSize: 11, color: "#495057", lineHeight: "1.5" }}>
                  {!createdStory.character && "🎯 Step 1: Pick a character (knight, fox, princess, dragon, robot)"}
                  {createdStory.character && !createdStory.setting && "🎯 Step 2: Choose setting (forest, space, underwater, castle, jungle)"}
                  {createdStory.setting && !createdStory.problem && "🎯 Step 3: What's the problem? (treasure, villain, storm, puzzle, monster)"}
                  {createdStory.problem && !createdStory.resolution && "🎯 Step 4: How is it solved? (magic, friends, never give up, clever, kindness)"}
                  {createdStory.fullStory && "✨ Your story is complete! Listen above!"}
                </div>
                {createdStory.character && (
                  <div style={{ marginTop: 8, padding: 8, background: "#fff", borderRadius: 8 }}>
                    <span style={{ fontSize: 20 }}>{createdStory.character.emoji}</span>
                    <span style={{ fontSize: 10, color: "#6c757d", marginLeft: 5 }}>{createdStory.character.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* NEW: Reward Shop Panel */}
            {rewardShopOpen && (
              <div style={{
                marginTop: 10,
                padding: 15,
                background: "linear-gradient(135deg, #ffecd2, #fcb69f)",
                borderRadius: 14,
                border: "2px solid rgba(255, 154, 158, 0.5)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#d63384", fontWeight: 800 }}>
                    🏪 Reward Shop
                  </p>
                  <span style={{ fontSize: 12, color: "#0d6efd", fontWeight: 700, background: "#fff", padding: "4px 10px", borderRadius: 10 }}>
                    💰 {totalScore} pts
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { id: 'bg_stars', name: 'Star Background', cost: 100, type: 'background', icon: '✨' },
                    { id: 'bg_rainbow', name: 'Rainbow Background', cost: 200, type: 'background', icon: '🌈' },
                    { id: 'frame_gold', name: 'Gold Frame', cost: 150, type: 'frame', icon: '🖼️' },
                    { id: 'badge_crown', name: 'Crown Badge', cost: 300, type: 'badge', icon: '👑' },
                    { id: 'badge_star', name: 'Star Badge', cost: 250, type: 'badge', icon: '⭐' }
                  ].map(item => (
                    <div key={item.id} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: purchasedItems.includes(item.id) ? "#d4edda" : "#fff",
                      borderRadius: 10,
                      border: equippedItems[item.type] === item.id ? "2px solid #28a745" : "1px solid rgba(0,0,0,0.1)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                        <span style={{ fontSize: 11, color: "#495057", fontWeight: 600 }}>{item.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {purchasedItems.includes(item.id) ? (
                          <button
                            onClick={() => equipItem(item)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: equippedItems[item.type] === item.id ? "#28a745" : "#6c757d",
                              color: "white",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            {equippedItems[item.type] === item.id ? "Equipped" : "Equip"}
                          </button>
                        ) : (
                          <button
                            onClick={() => purchaseItem(item)}
                            disabled={totalScore < item.cost}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: totalScore >= item.cost ? "#ffd700" : "#e9ecef",
                              color: totalScore >= item.cost ? "#333" : "#adb5bd",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: totalScore >= item.cost ? "pointer" : "not-allowed"
                            }}
                          >
                            💰 {item.cost}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NEW: Sound Effects Toggle */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: soundEnabled
                    ? "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"
                    : "linear-gradient(135deg, #ddd 0%, #bbb 100%)",
                  color: soundEnabled ? "white" : "#666",
                  fontFamily: "var(--font-fun)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: soundEnabled ? "0 4px 12px rgba(137, 247, 254, 0.35)" : "none",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <span style={{ fontSize: 14 }}>{soundEnabled ? "🔊" : "🔇"}</span>
                {soundEnabled ? "Sounds: ON" : "Sounds: OFF"}
              </button>

              {soundEnabled && (
                <div style={{ flex: 1, padding: "0 10px" }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>

            {/* NEW: Emotion Detection Display */}
            {detectedEmotion !== 'neutral' && (
              <div style={{
                marginTop: 10,
                padding: 10,
                background: detectedEmotion === 'happy' ? "linear-gradient(135deg, #fff5f7, #ffeef8)" :
                           detectedEmotion === 'sad' ? "linear-gradient(135deg, #e3f2fd, #bbdefb)" :
                           detectedEmotion === 'angry' ? "linear-gradient(135deg, #ffebee, #ffcdd2)" :
                           "linear-gradient(135deg, #f3e5f5, #e1bee7)",
                borderRadius: 14,
                textAlign: "center"
              }}>
                <span style={{ fontSize: 20 }}>
                  {detectedEmotion === 'happy' && "😊"}
                  {detectedEmotion === 'sad' && "😢"}
                  {detectedEmotion === 'angry' && "😠"}
                  {detectedEmotion === 'fear' && "😨"}
                  {detectedEmotion === 'surprised' && "😲"}
                </span>
                <span style={{ fontSize: 11, color: "#6c757d", marginLeft: 8 }}>
                  Feeling {detectedEmotion}
                </span>
              </div>
            )}

            {/* NEW: Seasonal Indicator */}
            <div style={{
              marginTop: 10,
              padding: 8,
              background: seasonalContent[currentSeason].colors[0] + "20",
              borderRadius: 10,
              textAlign: "center"
            }}>
              <span style={{ fontSize: 11, color: "#6c757d" }}>
                {currentSeason === 'spring' && "🌸 Spring Theme Active"}
                {currentSeason === 'summer' && "☀️ Summer Theme Active"}
                {currentSeason === 'fall' && "🍂 Fall Theme Active"}
                {currentSeason === 'winter' && "❄️ Winter Theme Active"}
              </span>
            </div>

            {/* Voice Command Button */}
            <button
              onClick={startListening}
              disabled={isListening || isSpeaking}
              style={{
                padding: "12px 20px",
                borderRadius: 18,
                border: "3px solid rgba(255, 154, 158, 0.5)",
                background: isListening ? "linear-gradient(135deg, #ff9a9e, #fecfef)" : "white",
                color: isListening ? "white" : "#d63384",
                fontFamily: "var(--font-fun)",
                fontSize: 14,
                fontWeight: 800,
                cursor: (isListening || isSpeaking) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: isListening ? "0 4px 16px rgba(255, 154, 158, 0.4)" : "0 4px 12px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease"
              }}
            >
              {isListening ? "🎤 Listening..." : isSpeaking ? "🔊 Speaking..." : "🎤 Click & Speak"}
            </button>
            
            {/* Help Text */}
            <p style={{
              fontSize: 12,
              color: "#6c757d",
              margin: "10px 0 0 0",
              textAlign: "center",
              fontFamily: "var(--font-fun)",
              fontWeight: 500
            }}>
              🎤 Say "<b>Hey Dhyan</b>" anytime • Or try: "sing" • "story" • "riddles"
            </p>

            {/* ENHANCED: Voice Speed & Pitch Controls */}
            <div style={{
              marginTop: 12,
              padding: 10,
              background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.1)"
            }}>
              <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#6c757d", fontWeight: 600 }}>
                🎛️ Voice Settings
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: "#6c757d", display: "block", marginBottom: 4 }}>
                    Speed: {voiceSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: "#6c757d", display: "block", marginBottom: 4 }}>
                    Pitch: {voicePitch.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>

            {/* ENHANCED: Session Stats */}
            {(totalScore > 0 || sessionStreak > 0) && (
              <div style={{
                marginTop: 10,
                display: "flex",
                gap: 10,
                justifyContent: "center"
              }}>
                {totalScore > 0 && (
                  <span style={{
                    padding: "4px 10px",
                    background: "linear-gradient(135deg, #ffecd2, #fcb69f)",
                    borderRadius: 12,
                    fontSize: 11,
                    color: "#d63384",
                    fontWeight: 700
                  }}>
                    🏆 Total: {totalScore}
                  </span>
                )}
                {sessionStreak > 0 && (
                  <span style={{
                    padding: "4px 10px",
                    background: "linear-gradient(135deg, #84fab0, #8fd3f4)",
                    borderRadius: 12,
                    fontSize: 11,
                    color: "#0d6efd",
                    fontWeight: 700
                  }}>
                    🔥 Streak: {sessionStreak}
                  </span>
                )}
              </div>
            )}

            {/* ENHANCED: Achievement Display */}
            {achievements.length > 0 && (
              <div style={{
                marginTop: 10,
                padding: 8,
                background: "linear-gradient(135deg, #fff5f7, #ffeef8)",
                borderRadius: 12,
                border: "2px dashed rgba(255, 154, 158, 0.3)"
              }}>
                <p style={{ margin: "0 0 6px 0", fontSize: 10, color: "#d63384", fontWeight: 700 }}>
                  🏅 Achievements ({achievements.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {achievements.slice(-5).map((a, i) => (
                    <span key={i} style={{
                      fontSize: 20,
                      animation: "bounce 0.5s ease"
                    }} title={a.title}>
                      {a.icon}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ENHANCED: Achievement Popup */}
          {showAchievement && (
            <div style={{
              position: "fixed",
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10000,
              animation: "bounce-in 0.5s ease"
            }}>
              <div style={{
                background: "linear-gradient(135deg, #ffd700, #ffed4e)",
                padding: "20px 30px",
                borderRadius: 20,
                boxShadow: "0 12px 40px rgba(255, 215, 0, 0.4)",
                textAlign: "center",
                border: "4px solid #fff"
              }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>
                  {showAchievement.icon}
                </div>
                <p style={{
                  margin: 0,
                  fontFamily: "var(--font-fun)",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#333"
                }}>
                  Achievement Unlocked!
                </p>
                <p style={{
                  margin: "4px 0 0 0",
                  fontFamily: "var(--font-fun)",
                  fontSize: 14,
                  color: "#666"
                }}>
                  {showAchievement.title}
                </p>
                <p style={{
                  margin: "4px 0 0 0",
                  fontSize: 11,
                  color: "#888"
                }}>
                  {showAchievement.description}
                </p>
              </div>
            </div>
          )}

          {/* ENHANCED: Particle Effects Container */}
          {particles.length > 0 && (
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              zIndex: 1000,
              overflow: "visible"
            }}>
              {particles.map(p => (
                <div
                  key={p.id}
                  style={{
                    position: "absolute",
                    left: p.x,
                    top: p.y,
                    width: p.emoji ? 24 : 8,
                    height: p.emoji ? 24 : 8,
                    fontSize: p.emoji ? 24 : 8,
                    background: p.emoji ? "transparent" : p.color,
                    borderRadius: "50%",
                    transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
                    opacity: p.life,
                    animation: "float-up 2s ease-out forwards"
                  }}
                >
                  {p.emoji}
                </div>
              ))}
            </div>
          )}

          {/* ENHANCED: Floating Emojis */}
          {floatingEmojis.map(e => (
            <div
              key={e.id}
              style={{
                position: "absolute",
                left: e.x,
                top: e.y,
                fontSize: 32,
                animation: "float-up 3s ease-out forwards",
                pointerEvents: "none",
                zIndex: 1001
              }}
            >
              {e.emoji}
            </div>
          ))}

          {/* System Logs (collapsible) */}
          {systemLogs.length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                cursor: "pointer",
                fontFamily: "var(--font-fun)"
              }}>
                📋 System Logs ({systemLogs.length})
              </summary>
              <div style={{
                marginTop: 8,
                padding: 8,
                background: "var(--color-bg-tertiary)",
                borderRadius: 8,
                maxHeight: 100,
                overflowY: "auto",
                fontSize: 10,
                fontFamily: "monospace"
              }}>
                {systemLogs.map((log, i) => (
                  <div key={i} style={{
                    color: log.type === "error" ? "var(--cute-error)" : 
                           log.type === "success" ? "var(--cute-success)" : 
                           "var(--color-text-secondary)",
                    marginBottom: 2
                  }}>
                    [{log.timestamp}] {log.type}: {log.message}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
      
      {/* Avatar Button */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              padding: "10px 18px",
              borderRadius: 20,
              border: "none",
              background: "white",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              fontFamily: "var(--font-fun)",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              color: "var(--cute-primary)",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            💬 Talk to me!
          </button>
        )}
        
        <button
          onClick={() => {
            setIsExpanded(true);
            const greetings = [
              `Hi! Try saying "sing a song" or "tell me a story"!`,
              `Hello! I can read books, poems, and more!`,
              `Hey! Click the microphone to talk to me!`
            ];
            speak(greetings[Math.floor(Math.random() * greetings.length)], "happy");
          }}
          style={{
            width: 75,
            height: 75,
            borderRadius: "50%",
            background: getCurrentColor(),
            border: "4px solid white",
            fontSize: 40,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(99, 102, 241, 0.3)",
            animation: isSpeaking ? "bounce-soft 0.4s ease-in-out infinite" : "bounce-soft 2s ease-in-out infinite",
            transition: "all 0.3s ease",
            position: "relative"
          }}
        >
          {getCurrentAvatar()}
          
          {/* Status indicator */}
          <span style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: isSpeaking ? "#10b981" : isListening ? "#f59e0b" : "#6366f1",
            border: "3px solid white",
            animation: (isSpeaking || isListening) ? "pulse 1s ease-in-out infinite" : "none"
          }} />
        </button>
      </div>
    </div>
  );
}

// Floating Particles Component
function FloatingParticles() {
  const particles = ['⭐', '🎯', '🎨', '🎪', '🎭', '🎸'];
  return (
    <div className="particles">
      {particles.map((emoji, i) => (
        <div 
          key={i} 
          className="particle" 
          style={{ 
            left: `${Math.random() * 100}%`, 
            animationDelay: `${i * 3}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [children, setChildren] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getDashboardStats().catch(() => null),
      listChildren().catch(() => []),
      getSessionHistory({ limit: 10 }).catch(() => []),
    ]).then(([s, c, h]) => {
      setStats(s);
      setChildren(Array.isArray(c) ? c : []);
      setSessions(Array.isArray(h) ? h : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedChild) {
      setChildProgress(null);
      return;
    }
    getChildProgress(selectedChild)
      .then(setChildProgress)
      .catch(() => setChildProgress(null));
  }, [selectedChild]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container page-content">
          <div className="dashboard-header">
            <div className="dashboard-title-section">
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="dashboard-subtitle">Loading your data...</p>
            </div>
          </div>
          <SkeletonStatCards count={4} />
          <SkeletonTable rows={4} cols={5} />
        </div>
      </div>
    );
  }

  const chartData = childProgress?.game_breakdown?.map((g) => ({
    name: g.game.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    accuracy: Math.round(g.accuracy * 100),
    sessions: g.sessions,
    trials: g.total_trials,
  })) || [];

  const trendData = [...sessions].reverse().map((s, i) => ({
    idx: i + 1,
    accuracy: Math.round(s.accuracy * 100),
    trials: s.total_trials,
  }));

  const weeklyAcc = stats ? Math.round(stats.weekly_accuracy * 100) : 0;

  // Random encouraging messages
  const encouragingMessages = [
    "You're doing amazing! 🌟",
    "Keep up the great work! 💪",
    "Every step counts! 🎯",
    "You're a superstar! ⭐",
    "Learning is fun with you! 🎨"
  ];

  const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

  return (
    <div className="page-wrapper">
      {/* Cute Animated Background Elements */}
      <div className="cute-overlay" />
      <div className="dot-pattern" />
      <div className="wave-bottom" />
      
      {/* Floating Decorations */}
      <div className="floating-decoration cloud1">☁️</div>
      <div className="floating-decoration cloud2">☁️</div>
      <div className="floating-decoration star1">⭐</div>
      <div className="floating-decoration star2">✨</div>
      <div className="floating-decoration heart1">💕</div>
      <div className="floating-decoration heart2">💖</div>
      
      <FloatingParticles />
      
      <div className="container page-content dashboard-container">
        <div className="page-header-cute" style={{ marginBottom: 32 }}>
          <div className="dashboard-title-section">
            <h1 className="page-title">Welcome back, {user?.full_name?.split(' ')[0] || 'Friend'}! 👋</h1>
            <p className="page-subtitle">Ready to learn and have fun today?</p>
          </div>
          <div className="dashboard-actions" style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              className="btn btn-cute btn-cute-primary"
              onClick={() => navigate("/games")}
            >
              <UiIcon name="games" size={18} />
              Play Games!
            </button>
            <button
              className="btn btn-cute btn-cute-success"
              onClick={() => navigate("/therapist")}
            >
              <UiIcon name="chart" size={18} />
              Console
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card-cute card-cute-primary" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: 8 }}>
            <div className="sparkle" style={{ 
              width: 80, 
              height: 80, 
              borderRadius: "var(--radius-xl)", 
              background: "linear-gradient(135deg, var(--cute-warning) 0%, var(--cute-orange) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40
            }}>
              <span className="heart-beat">👋</span>
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-fun)", fontSize: 24, fontWeight: 800, margin: "0 0 8px 0" }}>
                Welcome back, {user?.full_name?.split(' ')[0] || "Friend"}!
              </h2>
              <p style={{ fontSize: 16, color: "var(--color-text-secondary)", margin: 0 }}>
                Ready to learn and have fun today? 🎮
              </p>
            </div>
          </div>
        </div>

      {stats && (
        <div className="stats-grid">
          <StatCard
            iconName="child"
            label="My Kids"
            value={stats.total_children}
            accent="primary"
            subtitle="Children registered"
          />
          <StatCard
            iconName="games"
            label="Games Played"
            value={stats.total_sessions}
            accent="success"
            subtitle="Total sessions"
          />
          <StatCard
            iconName="trophy"
            label="Completed"
            value={stats.completed_sessions}
            accent="warning"
            subtitle="Finished sessions"
          />
          <StatCard
            iconName="star"
            label="This Week"
            value={stats.recent_trials_7d}
            accent="danger"
            subtitle="Recent trials"
          />
        </div>
      )}

      <div className="panel" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <UiIcon name="trophy" size={22} title="" />
            Achievements & Stickers
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
              {Math.min(stats?.total_sessions || 0, 5)} of 5 unlocked
            </span>
            <button
               className="btn btn-cute btn-cute-lavender btn-sm"
               onClick={() => navigate("/sticker-pack")}
               style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px" }}
            >
               <UiIcon name="star" size={14} title="" />
               View Album
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <AchievementBadge
            iconName="games"
            title="First Game"
            description="Play your first game"
            unlocked={(stats?.total_sessions || 0) >= 1}
          />
          <AchievementBadge
            iconName="star"
            title="High Scorer"
            description="Get 80% accuracy"
            unlocked={weeklyAcc >= 80}
          />
          <AchievementBadge
            iconName="calendar"
            title="Weekly Warrior"
            description="5 sessions in a week"
            unlocked={(stats?.recent_sessions_7d || 0) >= 5}
          />
          <AchievementBadge
            iconName="child"
            title="Helper"
            description="Register a child"
            unlocked={(stats?.total_children || 0) >= 1}
          />
          <AchievementBadge
            iconName="trophy"
            title="Expert"
            description="Complete 10 sessions"
            unlocked={(stats?.total_sessions || 0) >= 10}
          />
        </div>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center" }}>
              <UiIcon
                name={weeklyAcc >= 80 ? "star" : weeklyAcc >= 50 ? "thumbs-up" : "dumbbell"}
                size={48}
                title=""
              />
            </div>
            <ProgressRing
              value={weeklyAcc}
              size={120}
              strokeWidth={10}
              color={weeklyAcc >= 80 ? "#48bb78" : weeklyAcc >= 50 ? "#f6ad55" : "#fc8181"}
            />
            <div style={{ marginTop: 12, fontWeight: 700, fontSize: 15 }}>Weekly Accuracy</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>{stats.recent_sessions_7d} sessions this week</div>
            <div style={{ marginTop: 8, padding: "4px 12px", background: weeklyAcc >= 80 ? "rgba(72, 187, 120, 0.2)" : "rgba(246, 173, 85, 0.2)", borderRadius: "12px", fontSize: "12px", fontWeight: "600", color: weeklyAcc >= 80 ? "#276749" : "#c05621" }}>
              {weeklyAcc >= 80 ? "Excellent!" : weeklyAcc >= 50 ? "Good progress!" : "Keep trying!"}
            </div>
          </div>

          {trendData.length > 1 ? (
            <div className="chart-container">
              <div className="chart-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UiIcon name="chart" size={20} title="" />
                Your Learning Journey
              </div>
              <RechartsContainer width="100%" height={160}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="idx" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ background: "#161922", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ display: "none" }}
                    formatter={(v) => [`${v}%`, "Accuracy"]}
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#6366f1" fill="url(#accGrad)" strokeWidth={2} />
                </AreaChart>
              </RechartsContainer>
            </div>
          ) : (
            <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="empty-state" style={{ padding: 16 }}>
                <div className="empty-state-icon" style={{ display: "flex", justifyContent: "center" }}>
                  <UiIcon name="chart" size={36} title="" />
                </div>
                <div className="empty-state-desc">Play more sessions to see trends</div>
              </div>
            </div>
          )}
        </div>
      )}

      {children.length > 0 && (
        <div className="panel" style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Child Progress</h3>
          <div className="row" style={{ marginBottom: 12 }}>
            <select
              className="input"
              value={selectedChild || ""}
              onChange={(e) => setSelectedChild(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Select a child...</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email}
                </option>
              ))}
            </select>
          </div>

          {childProgress && (
            <div>
              <div className="stats-grid" style={{ marginBottom: 16 }}>
                <StatCard label="Sessions" value={childProgress.total_sessions} />
                <StatCard label="Completed" value={childProgress.completed_sessions} />
                <StatCard label="Total Trials" value={childProgress.total_trials} />
                <div className="stat-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <ProgressRing
                    value={Math.round(childProgress.overall_accuracy * 100)}
                    size={64}
                    strokeWidth={6}
                    color={childProgress.overall_accuracy >= 0.8 ? "#10b981" : childProgress.overall_accuracy >= 0.5 ? "#f59e0b" : "#ef4444"}
                  />
                  <div className="stat-label" style={{ marginTop: 6 }}>Accuracy</div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="chart-container">
                  <div className="chart-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <UiIcon name="games" size={20} title="" />
                    Game Breakdown
                  </div>
                  <RechartsContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={32}>
                      <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#161922", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
                        formatter={(v, name) => [name === "accuracy" ? `${v}%` : v, name === "accuracy" ? "Accuracy" : "Sessions"]}
                      />
                      <Bar dataKey="accuracy" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </RechartsContainer>
                </div>
              )}

              {childProgress.game_breakdown?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Game</th>
                          <th>Sessions</th>
                          <th>Trials</th>
                          <th>Correct</th>
                          <th>Accuracy</th>
                          <th>Avg RT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childProgress.game_breakdown.map((g, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{g.game.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                            <td>{g.sessions}</td>
                            <td>{g.total_trials}</td>
                            <td>{g.correct}</td>
                            <td>
                              <span className={`accuracy-badge ${g.accuracy >= 0.8 ? "acc-high" : g.accuracy >= 0.5 ? "acc-mid" : "acc-low"}`}>
                                {(g.accuracy * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td>{g.avg_response_time_ms ? `${g.avg_response_time_ms}ms` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {sessions.length > 0 ? (
        <div className="panel" style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Recent Sessions</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Child</th>
                  <th>Game</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.session_date}</td>
                    <td style={{ fontWeight: 600 }}>{s.child_name}</td>
                    <td>
                      {(s.game_types || [])
                        .map((g) => g.replace(/_/g, " "))
                        .join(", ") || s.title}
                    </td>
                    <td>
                      <span className={`status-badge status-${s.status}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>{s.correct}/{s.total_trials}</td>
                    <td>
                      <span className={`accuracy-badge ${s.accuracy >= 0.8 ? "acc-high" : s.accuracy >= 0.5 ? "acc-mid" : "acc-low"}`}>
                        {(s.accuracy * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 20 }}>
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: "flex", justifyContent: "center" }}>
              <UiIcon name="games" size={36} title="" />
            </div>
            <div className="empty-state-title">No Sessions Yet</div>
            <div className="empty-state-desc">Start a game session to see your progress here.</div>
            <button type="button" className="btn btn-primary" onClick={() => navigate("/games")} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <UiIcon name="play" size={18} title="" />
              Play Now
            </button>
          </div>
        </div>
      )}
      </div>
      
      {/* AI Agent Panel - Multi-Agent Chat Interface */}
      <AIAgentPanel initialAgent="gameHelper" />
    </div>
  );
}

function StatCard({ iconName, label, value, accent, subtitle }) {
  return (
    <div className={`stat-card ${accent ? `stat-card-${accent}` : ""}`} style={{ position: "relative", overflow: "hidden" }}>
      {iconName && (
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
          <UiIcon name={iconName} size={28} title="" />
        </div>
      )}
      <div className="stat-value">{value ?? 0}</div>
      <div className="stat-label">{label}</div>
      {subtitle && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontWeight: 500 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function AchievementBadge({ iconName, title, description, unlocked }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 12px",
        borderRadius: "12px",
        background: unlocked ? "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,185,0,0.1))" : "rgba(0,0,0,0.03)",
        border: unlocked ? "2px solid #ffd700" : "2px solid transparent",
        transition: "all 0.3s ease",
        opacity: unlocked ? 1 : 0.6,
        transform: unlocked ? "scale(1)" : "scale(0.95)"
      }}
    >
      <div style={{
        marginBottom: 8,
        display: "flex",
        justifyContent: "center",
        filter: unlocked ? "none" : "grayscale(100%)",
        opacity: unlocked ? 1 : 0.7,
        transition: "all 0.3s ease"
      }}>
        {unlocked ? (
          <UiIcon name={iconName} size={32} title="" />
        ) : (
          <UiIcon name="lock" size={32} title="" />
        )}
      </div>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: unlocked ? "#b8860b" : "var(--muted)",
        textAlign: "center",
        marginBottom: 4
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 10,
        color: "var(--muted)",
        textAlign: "center",
        lineHeight: 1.3
      }}>
        {description}
      </div>
      {unlocked && (
        <div style={{
          position: "absolute",
          top: 4,
          right: 4,
        }}>
          <UiIcon name="sparkles" size={14} title="" />
        </div>
      )}
    </div>
  );
}
