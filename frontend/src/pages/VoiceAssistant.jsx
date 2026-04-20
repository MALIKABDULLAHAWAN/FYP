import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { getDashboardStats } from "../api/games";
import { speakText, processVoiceInput, getGreeting, getVoiceOptions, getSavedVoice, setVoicePreference } from "../services/VoiceAgentService";
import { apiFetch } from "../api/client";

import "./VoiceAssistant.css";

/**
 * DHYAN Voice Assistant Page (Aura)
 * Enhanced with multi-language support, voice options, content filtering, and streaming responses
 */

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
  const [language, setLanguage] = useState(localStorage.getItem("dhyan_language") || "en");
  const [voiceKey, setVoiceKey] = useState(getSavedVoice());
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const voiceOptions = getVoiceOptions();

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

  // Greet on mount
  useEffect(() => {
    const greeting = getGreeting(language);
    setCurrentMessage(greeting);
    setEmotion("happy");
    setBuddyAvatar("🐰");
    // Delay greeting speech to let page load
    const timer = setTimeout(() => {
      setIsSpeaking(true);
      speakText(greeting, voiceKey);
      setTimeout(() => setIsSpeaking(false), 1500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [language, voiceKey]);

  const handleCommand = useCallback(async (text) => {
    setIsProcessing(true);
    setTranscript(text);
    setEmotion("thinking");
    setCurrentMessage("Hmm, let me think about that... 🤔");

    setChatHistory(prev => [...prev.slice(-10), { role: "user", text }]);

    try {
      // Show thinking message and play thinking sound
      const thinkingMessages = [
        "Let me put on my thinking cap! 🧠",
        "Hmm, that's interesting! 💭",
        "Give me a moment to think... ⏳",
        "Let me process that... 🔄"
      ];
      const thinkingMsg = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
      setCurrentMessage(thinkingMsg);

      // Call backend API with language
      const response = await apiFetch("/api/v1/therapy/ai/chat", {
        method: "POST",
        body: {
          message: text,
          agent: "buddy",
          language: language,
          history: chatHistory.slice(-5) // Keep last 5 messages for context
        }
      });

      if (response?.text) {
        setCurrentMessage(response.text);
        setEmotion("happy");
        setBuddyAvatar("🐰");
        setChatHistory(prev => [...prev, { role: "assistant", text: response.text }]);
        
        // Speak the response
        setIsSpeaking(true);
        speakText(response.text, voiceKey);
        setTimeout(() => setIsSpeaking(false), 2000);
      } else {
        throw new Error("No response from AI");
      }
    } catch (err) {
      console.error("Voice agent failed:", err);
      const errorMsg = language === "ur" 
        ? "مجھے سوچنے میں مسئلہ ہو رہا ہے، لیکن میں ابھی بھی آپ سے محبت کرتا ہوں! ✨"
        : "I'm having a little trouble thinking right now, but I still love you! ✨";
      setCurrentMessage(errorMsg);
      setEmotion("calm");
    } finally {
      setIsProcessing(false);
    }
  }, [language, voiceKey, chatHistory]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = language === "ur"
        ? "مجھے معافی ہے، میں ابھی سن نہیں سکتا۔ Google Chrome استعمال کرنے کی کوشش کریں! 🌐"
        : "I'm sorry, I can't listen right now. Try using Google Chrome! 🌐";
      setCurrentMessage(msg);
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "ur" ? "ur-PK" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setEmotion("calm");
      const msg = language === "ur"
        ? "میں سن رہا ہوں! اب بولیں، دوست! 👂"
        : "I'm all ears! Speak now, buddy! 👂";
      setCurrentMessage(msg);
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
        const msg = language === "ur"
          ? "مجھے اپنا مائیکروفون استعمال کرنے کی ضرورت ہے! براہ کرم مجھے اندر آنے دیں! 🎤"
          : "I need to use your microphone to hear you! Please let me in! 🎤";
        setCurrentMessage(msg);
      } else {
        const msg = language === "ur"
          ? "اوپس! میں نے یہ نہیں سمجھا۔ کیا آپ دوبارہ کہہ سکتے ہیں؟ 🔄"
          : "Oopsie! I didn't catch that. Can you say it again? 🔄";
        setCurrentMessage(msg);
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
  }, [isListening, handleCommand, language]);

  const handleStats = () => {
    let msg;
    if (language === "ur") {
      msg = stats
        ? `📊 آپ نے ${stats.total_sessions || 0} گیمز کھیلی ہیں! آپ بہترین ہیں! درستگی: ${Math.round((stats.weekly_accuracy || 0) * 100)}% 🌟`
        : "📊 آئیے کچھ گیمز کھیل کر اپنے پہلے ستارے حاصل کریں!";
    } else {
      msg = stats
        ? `📊 You've played ${stats.total_sessions || 0} games! You're the best! Accuracy: ${Math.round((stats.weekly_accuracy || 0) * 100)}% 🌟`
        : "📊 Let's play some games to earn your first stars!";
    }
    setCurrentMessage(msg);
    setEmotion("excited");
    setIsSpeaking(true);
    speakText(msg, voiceKey);
    setTimeout(() => setIsSpeaking(false), 2000);
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
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .thinking-dots span {
          animation: dot-bounce 1.4s infinite;
          margin: 0 2px;
        }
        .thinking-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .thinking-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }
        .speaking-indicator {
          margin-left: 10px;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
          margin-bottom: 20px;
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
        .cute-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .voice-settings-panel {
          background: rgba(255, 240, 243, 0.8);
          padding: 16px;
          border-radius: 20px;
          margin-bottom: 20px;
          width: 100%;
        }
        .voice-settings-panel select {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          border: 2px solid #FFE4E8;
          background: white;
          color: #FF5A78;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 12px;
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
          margin-bottom: 20px;
        }
        .big-mic-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          {isProcessing ? (
            <span>
              {currentMessage}
              <span className="thinking-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </span>
          ) : isSpeaking ? (
            <span>
              {currentMessage}
              <span className="speaking-indicator">🔊</span>
            </span>
          ) : (
            currentMessage
          )}
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
          <button className="cute-btn" onClick={() => handleCommand("Tell me a story! 📖")} disabled={isProcessing || isListening}>
            <span style={{ fontSize: 32 }}>📖</span> Story
          </button>
          <button className="cute-btn" onClick={() => handleCommand("Tell me a joke! 🤡")} disabled={isProcessing || isListening}>
            <span style={{ fontSize: 32 }}>🤡</span> Joke
          </button>
          <button className="cute-btn" onClick={() => handleCommand("Sing me a song! 🎵")} disabled={isProcessing || isListening}>
            <span style={{ fontSize: 32 }}>🎵</span> Song
          </button>
          <button className="cute-btn" onClick={handleStats} disabled={isProcessing || isListening}>
            <span style={{ fontSize: 32 }}>✨</span> Stars
          </button>
        </div>

        {/* Voice Settings */}
        <button
          className="cute-btn"
          onClick={() => setShowVoiceSettings(!showVoiceSettings)}
          style={{ width: "100%", marginBottom: 12 }}
        >
          <span style={{ fontSize: 24 }}>🎙️</span> Voice Settings
        </button>
        
        {showVoiceSettings && (
          <div className="voice-settings-panel">
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#FF5A78", marginBottom: 8 }}>
                Choose Your Voice:
              </label>
              <select
                value={voiceKey}
                onChange={(e) => {
                  setVoiceKey(e.target.value);
                  setVoicePreference(e.target.value);
                }}
              >
                {voiceOptions.map(v => (
                  <option key={v.key} value={v.key}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#FF5A78", marginBottom: 8 }}>
                Language:
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  localStorage.setItem("dhyan_language", e.target.value);
                }}
              >
                <option value="en">English</option>
                <option value="ur">Urdu (اردو)</option>
              </select>
            </div>
          </div>
        )}

        <button
          className={`big-mic-button ${isListening ? "listening" : ""}`}
          onClick={startListening}
          disabled={isProcessing}
        >
          {isListening ? "⏹️" : "🎤"}
        </button>

        <p style={{ marginTop: "0px", color: "#FFACB7", fontWeight: 800, fontSize: 18 }}>
          {isListening ? "Tap to finish!" : "Press the mic to talk!"}
        </p>
      </div>
    </div>
  );
}

export default VoiceAssistant;
