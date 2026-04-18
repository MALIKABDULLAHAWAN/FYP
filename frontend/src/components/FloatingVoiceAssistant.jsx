/**
 * Floating Voice Assistant Widget
 * A persistent AI companion that works throughout the entire app
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "react-router-dom";
import { useVoiceAPI } from "../hooks/useVoiceAPI";
import "./FloatingVoiceAssistant.css";

function FloatingVoiceAssistant() {
  const { user } = useAuth();
  const location = useLocation();
  const { sendTextCommand, isProcessing } = useVoiceAPI();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [currentMessage, setCurrentMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("🐰");
  const [contextInfo, setContextInfo] = useState("");
  
  const synthRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Initialize speech synthesis and recognition
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        handleSendMessage(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Update context based on current page
  useEffect(() => {
    const path = location.pathname;
    let context = "";
    
    if (path.includes("/dashboard")) {
      context = "You're on the Dashboard. I can help you understand your progress and stats!";
    } else if (path.includes("/games")) {
      const gameName = path.split("/").pop();
      context = `You're playing ${gameName}. I can give you tips and encouragement!`;
    } else if (path.includes("/profile")) {
      context = "You're viewing your Profile. I can help you update your information!";
    } else if (path.includes("/therapist")) {
      context = "You're in the Therapist Console. I can help you manage your patients!";
    } else {
      context = "I'm here to help you navigate and learn!";
    }
    
    setContextInfo(context);
  }, [location]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Speak text
  const speak = useCallback((text) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    setIsSpeaking(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, []);

  // Start voice recognition
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Handle sending message
  const handleSendMessage = async (message = userInput) => {
    if (!message.trim()) return;
    
    const userMsg = {
      type: "user",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setUserInput("");
    setCurrentMessage("Thinking...");
    
    try {
      // Add context to the message
      const contextualMessage = `[Context: ${contextInfo}] User says: ${message}`;
      const result = await sendTextCommand(contextualMessage);
      
      const aiResponse = result?.response || "I'm here to help! Try asking me something else.";
      
      const aiMsg = {
        type: "ai",
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatHistory(prev => [...prev, aiMsg]);
      setCurrentMessage(aiResponse);
      speak(aiResponse);
      
    } catch (error) {
      const errorMsg = {
        type: "ai",
        text: "I'm having trouble connecting. Try again in a moment!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMsg]);
      setCurrentMessage(errorMsg.text);
    }
  };

  // Quick actions
  const quickActions = [
    { icon: "💪", text: "Encourage me", action: () => handleSendMessage("Encourage me") },
    { icon: "😄", text: "Tell a joke", action: () => handleSendMessage("Tell me a joke") },
    { icon: "❓", text: "Help", action: () => handleSendMessage("What can you help me with?") },
    { icon: "📊", text: "My progress", action: () => handleSendMessage("Show my progress") },
  ];

  const avatarOptions = ["🐰", "🐻", "🐱", "🐶", "🦁", "🐼", "🦄", "🦊"];

  if (!isOpen) {
    return (
      <div className="floating-assistant-trigger" onClick={() => setIsOpen(true)}>
        <div className={`assistant-bubble ${isSpeaking ? 'speaking' : ''}`}>
          <span className="assistant-avatar">{selectedAvatar}</span>
          {isSpeaking && <span className="pulse-ring"></span>}
        </div>
        <div className="assistant-tooltip">Chat with Dhyan!</div>
      </div>
    );
  }

  return (
    <div className={`floating-assistant-container ${isMinimized ? 'minimized' : 'expanded'}`}>
      {/* Header */}
      <div className="assistant-header">
        <div className="header-left">
          <span className="assistant-icon">🎙️</span>
          <div>
            <h3>Dhyan Assistant</h3>
            <p className="context-hint">{contextInfo}</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="btn-minimize"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? "⬆️" : "⬇️"}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="btn-close"
            title="Close"
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
                <div className="welcome-avatar">{selectedAvatar}</div>
                <p>Hi {user?.full_name?.split(" ")[0] || "Friend"}! 👋</p>
                <p>I'm here to help you throughout your journey!</p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.type}`}>
                  {msg.type === "ai" && <span className="msg-avatar">{selectedAvatar}</span>}
                  <div className="msg-content">
                    <p>{msg.text}</p>
                    <span className="msg-time">{msg.timestamp}</span>
                  </div>
                  {msg.type === "user" && <span className="msg-avatar">👤</span>}
                </div>
              ))
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
          <div className="assistant-input">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type or speak your message..."
              disabled={isProcessing || isListening}
            />
            <button
              onClick={isListening ? stopListening : startListening}
              className={`btn-voice ${isListening ? 'listening' : ''}`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? "🔴" : "🎤"}
            </button>
            <button
              onClick={() => handleSendMessage()}
              className="btn-send"
              disabled={!userInput.trim() || isProcessing}
            >
              {isProcessing ? "⏳" : "➤"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default FloatingVoiceAssistant;
