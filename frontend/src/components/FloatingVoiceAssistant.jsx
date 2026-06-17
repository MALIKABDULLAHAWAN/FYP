/**
 * Dhyan Floating Voice Assistant
 * Premium AI companion with real-time WebSocket support
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "react-router-dom";
import { useVoiceAPI } from "../hooks/useVoiceAPI";
import { useNavigate } from "react-router-dom";
import "./FloatingVoiceAssistant.css";

function FloatingVoiceAssistant() {
  const { user } = useAuth();
  const location = useLocation();
  const { 
    sendTextCommand, 
    sendAudioBlob, 
    stopPlayback, 
    isProcessing,
    status, 
    error,
    isListening,
    navCommand,
    lastResponse,
    setNavCommand,
    setIsListening
  } = useVoiceAPI();
  
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🐰");
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatEndRef = useRef(null);
  const wakeWordRef = useRef(null);

  // Handle navigation commands from AI
  useEffect(() => {
    if (navCommand) {
      setTimeout(() => {
        navigate(navCommand);
        setNavCommand(null);
      }, 2000); // Give time for Dhyan to say "Taking you there"
    }
  }, [navCommand, navigate, setNavCommand]);

  // Handle incoming AI responses
  useEffect(() => {
    if (lastResponse) {
      const aiMsg = {
        type: "ai",
        text: lastResponse.text,
        timestamp: lastResponse.timestamp
      };
      setChatHistory(prev => [...prev, aiMsg]);
    }
  }, [lastResponse]);

  // Wake word detection
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !isListening && !isProcessing) {
      wakeWordRef.current = new SpeechRecognition();
      wakeWordRef.current.continuous = true;
      wakeWordRef.current.interimResults = true;
      wakeWordRef.current.lang = 'en-US';

      wakeWordRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
          .toLowerCase();

        if (transcript.includes("hey dhyan") || transcript.includes("dhyan")) {
          wakeWordRef.current.stop();
          setIsOpen(true);
          setIsMinimized(false);
          startRecording();
        }
      };

      wakeWordRef.current.start();
    }

    return () => {
      if (wakeWordRef.current) wakeWordRef.current.stop();
    };
  }, [isListening, isProcessing]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Audio Recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioBlob(audioBlob);
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSendMessage = (message = userInput) => {
    if (!message.trim()) return;
    
    const userMsg = {
      type: "user",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setUserInput("");
    
    sendTextCommand(message, user?.id);
  };

  // Listen for AI responses (we should ideally get them from the hook's state or a callback)
  // For this implementation, I'll mock the history update if the backend sends response_start
  // In a real app, I'd extend useVoiceAPI to return the transcriptions/responses.

  const isUrdu = (text) => {
    return /[\u0600-\u06FF]/.test(text);
  };

  const quickActions = [
    { icon: "💪", text: "Encourage me", action: () => handleSendMessage("Encourage me") },
    { icon: "🏠", text: "Translate Urdu", action: () => handleSendMessage("How do you say 'I am happy' in Urdu?") },
    { icon: "📚", text: "Tell a story", action: () => handleSendMessage("Tell me a short story") },
    { icon: "🎵", text: "Sing a song", action: () => handleSendMessage("Sing me a song") },
  ];

  const avatarOptions = ["🐰", "🐻", "🐱", "🐶", "🦁", "🐼", "🦄", "🦊"];

  if (!isOpen) {
    return (
      <div className="floating-assistant-trigger" onClick={() => setIsOpen(true)}>
        <div className={`assistant-bubble ${isProcessing ? 'speaking' : ''}`}>
          <span className="assistant-avatar">{selectedAvatar}</span>
          {isProcessing && <span className="pulse-ring"></span>}
        </div>
        <div className="assistant-tooltip">Chat with Dhyan! ✨</div>
      </div>
    );
  }

  return (
    <div className={`floating-assistant-container ${isMinimized ? 'minimized' : 'expanded'}`}>
      {/* Floating Avatar - Frame Breaking */}
      {!isMinimized && (
        <div className="floating-avatar-container">
          {selectedAvatar}
        </div>
      )}

      {/* Header */}
      <div className="assistant-header">
        <div className="header-left">
          <h3>Dhyan AI</h3>
          <p className="status-hint">{status || "Always here for you!"}</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="btn-minimize"
          >
            {isMinimized ? "⬆️" : "⎯"}
          </button>
          <button 
            onClick={() => { setIsOpen(false); stopPlayback(); }}
            className="btn-close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {!isMinimized && (
        <>
          {/* Avatar Selection */}
          <div className="assistant-avatars">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={`avatar-btn ${selectedAvatar === avatar ? 'selected' : ''}`}
              >
                {avatar}
              </button>
            ))}
          </div>

          {/* Chat History */}
          <div className="assistant-chat">
            {chatHistory.length === 0 ? (
              <div className="chat-welcome">
                <p>Hi {user?.full_name?.split(" ")[0] || "Friend"}! 👋</p>
                <p>I'm **Dhyan**, your AI learning companion. How can I help you today? ✨</p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.type}`}>
                  {msg.type === "ai" && <span className="msg-avatar">{selectedAvatar}</span>}
                  <div className={`msg-content ${isUrdu(msg.text) ? 'rtl' : ''}`}>
                    <p>{msg.text}</p>
                    <span className="msg-time">{msg.timestamp}</span>
                  </div>
                  {msg.type === "user" && <span className="msg-avatar">👤</span>}
                </div>
              ))
            )}
            {isProcessing && (
              <div className="chat-message ai">
                <span className="msg-avatar typing-avatar">{selectedAvatar}</span>
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="assistant-quick-actions">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className="quick-action-btn"
                disabled={isProcessing}
              >
                <span>{action.icon}</span>
                <span>{action.text}</span>
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="assistant-input-area">
            <div className="assistant-input">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Talk to Dhyan..."
                disabled={isProcessing || isListening}
              />
              <button
                onClick={isListening ? stopRecording : startRecording}
                className={`btn-voice ${isListening ? 'listening' : ''}`}
              >
                {isListening ? "⏹️" : "🎤"}
              </button>
              <button
                onClick={() => handleSendMessage()}
                className="btn-send"
                disabled={!userInput.trim() || isProcessing}
              >
                {isProcessing ? "✨" : "➤"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FloatingVoiceAssistant;
