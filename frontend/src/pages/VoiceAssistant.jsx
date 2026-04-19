import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { getDashboardStats } from "../api/games";
import buddyBrain from "../services/BuddyBrainService";

import "./VoiceAssistant.css";

/**
 * DHYAN Voice Assistant Page
 * A cute, interactive space for child-AI interaction.
 * Integrates BuddyBrain for personality-driven responses.
 */

// ── TTS helper ──
function speakText(text) {
  try {
    window.speechSynthesis.cancel();
    // Simplified regex for clean TTS
    const cleanText = text.replace(/[^\w\s!?.,'":;\-()🎵⭐🌟💕✨🧸🦕🍌🐶🎉💭🚀😊🤩🥳]/g, "");
    const u = new SpeechSynthesisUtterance(cleanText);
    u.rate = 0.95;
    u.pitch = 1.25; // Slightly higher pitch for cuteness
    u.lang = "en-US";
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.warn("TTS failed:", e);
  }
}

function VoiceAssistant() {
  const { user } = useAuth();
  const [currentMessage, setCurrentMessage] = useState("");
  const [emotion, setEmotion] = useState("happy");
  const [stats, setStats] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [buddyAvatar, setBuddyAvatar] = useState("🐰");
  const recognitionRef = useRef(null);

  const avatars = {
    happy: "😊",
    excited: "🥳",
    thinking: "🤔",
    celebrating: "🥳",
    calm: "😌",
    story: "📖",
    song: "🎵",
    game: "🎮",
  };

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => setStats(null));
  }, []);

  // Greet on mount using BuddyBrain
  useEffect(() => {
    const greeting = buddyBrain.getResponse("greetings");
    setCurrentMessage(greeting.text);
    setEmotion(greeting.emotion);
    setBuddyAvatar(greeting.avatar);
    setTimeout(() => speakText(greeting.text), 1000);
  }, [user]);

  const handleCommand = useCallback(async (text) => {
    setIsProcessing(true);
    setTranscript(text);
    setEmotion("thinking");

    // Add user message to chat
    setChatHistory(prev => [...prev.slice(-10), { role: "user", text }]);

    try {
      // Get response from BuddyBrain (now async!)
      const response = await buddyBrain.processInput(text);
      
      setCurrentMessage(response.text);
      setEmotion(response.emotion);
      setBuddyAvatar(response.avatar);
      setChatHistory(prev => [...prev, { role: "assistant", text: response.text }]);
      speakText(response.text);
    } catch (err) {
      console.error("Buddy interaction failed:", err);
      setCurrentMessage("I'm having a little trouble thinking right now, but I still love you! ✨");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setCurrentMessage("I'm sorry, I can't listen right now. Try using Google Chrome! 🌐");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setEmotion("calm");
      setCurrentMessage("I'm all ears! Speak now, buddy! 👂");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalTranscript += result[0].transcript;
        else interimTranscript += result[0].transcript;
      }

      if (interimTranscript) setTranscript(interimTranscript);

      if (finalTranscript) {
        setTranscript(finalTranscript);
        setIsListening(false);
        handleCommand(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setEmotion("happy");
      if (event.error === "not-allowed") {
        setCurrentMessage("I need to use your microphone to hear you! Please let me in! 🎤");
      } else {
        setCurrentMessage("Oopsie! I didn't catch that. Can you say it again? 🔄");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [isListening, handleCommand]);

  const handleStats = () => {
    const msg = stats
      ? `📊 You've played ${stats.total_sessions || 0} games! You're the best! Accuracy: ${Math.round((stats.weekly_accuracy || 0) * 100)}% 🌟`
      : "📊 Let's play some games to earn your first stars!";
    setCurrentMessage(msg);
    setEmotion("excited");
    speakText(msg);
  };

  const handleBuddyAction = (action) => {
    const response = buddyBrain.getResponse(action);
    setCurrentMessage(response.text);
    setEmotion(response.emotion);
    setBuddyAvatar(response.avatar);
    setChatHistory(prev => [...prev.slice(-10), { role: "assistant", text: response.text }]);
    speakText(response.text);
  };

  const getEmotionIcon = () => avatars[emotion] || avatars.happy;

  return (
    <div className="voice-assistant-cute">
      <style>{`
        .voice-assistant-cute {
          min-height: 100vh;
          background: linear-gradient(135deg, #FFF5F7 0%, #F0F5FF 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Fredoka', 'Nunito', sans-serif;
        }
        .cute-card {
          width: 100%;
          max-width: 800px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 50px;
          box-shadow: 0 30px 60px rgba(255, 182, 193, 0.2);
          padding: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 4px solid #FFE4E8;
          position: relative;
          overflow: hidden;
        }
        .cute-card::before {
          content: '✨';
          position: absolute;
          top: 20px;
          left: 20px;
          font-size: 24px;
        }
        .cute-card::after {
          content: '🎨';
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 24px;
        }
        .buddy-avatar-section {
          position: relative;
          margin-bottom: 40px;
        }
        .avatar-circle {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 110px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.05);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 8px solid white;
        }
        .avatar-circle.processing {
          animation: buddy-bounce 0.8s infinite ease-in-out;
        }
        .emotion-badge {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          box-shadow: 0 8px 15px rgba(0,0,0,0.1);
          border: 4px solid #FFE4E8;
        }
        @keyframes buddy-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.05); }
        }
        .cute-speech-bubble {
          background: #FFF0F3;
          padding: 30px;
          border-radius: 35px;
          margin-bottom: 25px;
          width: 100%;
          text-align: center;
          font-size: 24px;
          color: #FF5A78;
          font-weight: 700;
          line-height: 1.4;
          box-shadow: inset 0 4px 10px rgba(255, 182, 193, 0.1);
          border: 2px solid white;
        }
        .live-transcript-cute {
          background: #F0F7FF;
          border-radius: 20px;
          padding: 15px 25px;
          width: 100%;
          text-align: center;
          font-size: 18px;
          color: #4A90E2;
          font-weight: 700;
          margin-bottom: 25px;
          border: 2px dashed #B5DEFF;
        }
        .cute-chat-box {
          width: 100%;
          max-height: 180px;
          overflow-y: auto;
          margin-bottom: 30px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 10px;
        }
        .cute-msg {
          padding: 12px 20px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 700;
          max-width: 85%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .cute-msg.user {
          align-self: flex-end;
          background: #FFE4E8;
          color: #FF5A78;
          border-bottom-right-radius: 5px;
        }
        .cute-msg.assistant {
          align-self: flex-start;
          background: white;
          color: #6366F1;
          border-bottom-left-radius: 5px;
          border: 1px solid #F0F5FF;
        }
        .cute-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          width: 100%;
          margin-bottom: 40px;
        }
        .cute-btn {
          padding: 18px 10px;
          border: none;
          border-radius: 25px;
          background: white;
          color: #FF8C9E;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 10px 20px rgba(255, 182, 193, 0.15);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }
        .cute-btn:hover {
          transform: translateY(-8px) scale(1.05);
          background: #FF8C9E;
          color: white;
        }
        .big-mic-button {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%);
          color: white;
          font-size: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 15px 35px rgba(255, 154, 158, 0.4);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 6px solid white;
        }
        .big-mic-button.listening {
          background: #FF4D6D;
          animation: mic-ripple 1.5s infinite;
          transform: scale(1.1);
        }
        @keyframes mic-ripple {
          0% { box-shadow: 0 0 0 0 rgba(255, 77, 109, 0.5); }
          100% { box-shadow: 0 0 0 40px rgba(255, 77, 109, 0); }
        }
      `}</style>

      <div className="cute-card">
        <h1 style={{ color: "#FF5A78", fontWeight: 900, marginBottom: "8px", fontSize: "36px" }}>
          Hi {user?.full_name?.split(" ")[0] || "Friend"}! 👋
        </h1>
        <p style={{ color: "#A0AEC0", marginBottom: "35px", fontWeight: 700 }}>
          I'm so happy to talk with you!
        </p>

        <div className="buddy-avatar-section">
          <div className={`avatar-circle ${isProcessing ? "processing" : ""}`}>
            {buddyAvatar}
          </div>
          <div className="emotion-badge">
            {getEmotionIcon()}
          </div>
        </div>

        <div className="cute-speech-bubble">
          {isProcessing ? "Hmm... let me think! 🤔" : currentMessage}
        </div>

        {(isListening || transcript) && (
          <div className="live-transcript-cute">
            {isListening && !transcript ? "✨ I'm listening to your magic words..." : `🗣️ "${transcript}"`}
          </div>
        )}

        {chatHistory.length > 0 && (
          <div className="cute-chat-box">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`cute-msg ${msg.role}`}>
                {msg.text}
              </div>
            ))}
          </div>
        )}

        <div className="cute-actions">
          <button className="cute-btn" onClick={() => handleBuddyAction("stories")}>
            <span style={{ fontSize: 32 }}>📖</span> Story
          </button>
          <button className="cute-btn" onClick={() => handleBuddyAction("jokes")}>
            <span style={{ fontSize: 32 }}>🤡</span> Joke
          </button>
          <button className="cute-btn" onClick={() => handleBuddyAction("stories")}>
            <span style={{ fontSize: 32 }}>🎵</span> Song
          </button>
          <button className="cute-btn" onClick={handleStats}>
            <span style={{ fontSize: 32 }}>✨</span> Stars
          </button>
        </div>

        <button
          className={`big-mic-button ${isListening ? "listening" : ""}`}
          onClick={startListening}
        >
          {isListening ? "⏹️" : "🎤"}
        </button>

        <p style={{ marginTop: "25px", color: "#FFACB7", fontWeight: 800, fontSize: 18 }}>
          {isListening ? "Tap to finish!" : "Press the mic to talk!"}
        </p>
      </div>
    </div>
  );
}

export default VoiceAssistant;
