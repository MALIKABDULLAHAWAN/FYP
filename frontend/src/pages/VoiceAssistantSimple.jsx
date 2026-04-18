/**
 * Simplified DHYAN Voice Assistant Page
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import "./VoiceAssistant.css";

function VoiceAssistantSimple() {
  const { user } = useAuth();
  const [currentMessage, setCurrentMessage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("🐰");

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setCurrentMessage(text);
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setCurrentMessage(text);
    }
  }, []);

  const handleJoke = () => {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Why did the scarecrow win an award? He was outstanding in his field!",
      "Why don't eggs tell jokes? They'd crack each other up!",
    ];
    speak(jokes[Math.floor(Math.random() * jokes.length)]);
  };

  const handleSong = () => {
    speak("🎵 Twinkle twinkle little star, how I wonder what you are!");
  };

  const handleStory = () => {
    speak("Once upon a time, in a magical forest, there lived a friendly rabbit...");
  };

  const handleEncourage = () => {
    speak("You are capable of amazing things! Keep going!");
  };

  const avatarOptions = ["🐰", "🐻", "🐱", "🐶", "🦁", "🐼", "🦄", "🦊"];

  return (
    <div className="voice-assistant-page">
      <div className="voice-container">
        <div className="voice-header">
          <h1>🎙️ Dhyan Voice Assistant</h1>
          <p>Hi {user?.full_name?.split(" ")[0] || "Friend"}! I'm here to chat, tell jokes, and help you learn!</p>
        </div>

        <div className="avatar-display">
          <div className={`avatar-bubble ${isSpeaking ? "speaking" : ""}`}>
            <span className="avatar-emoji">{selectedAvatar}</span>
            {isSpeaking && <span className="speaking-indicator">🔊</span>}
          </div>
        </div>

        <div className="message-display">
          {currentMessage || "👋 Say hello or click a button below!"}
        </div>

        <div className="avatar-selector">
          <p>Choose Your Friend:</p>
          <div className="avatar-options">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar}
                onClick={() => {
                  setSelectedAvatar(avatar);
                  speak(`Hi! I'm your friend ${avatar}!`);
                }}
                className={selectedAvatar === avatar ? "selected" : ""}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        <div className="quick-actions">
          <button onClick={handleEncourage} className="btn-encourage">
            💪 Encourage Me
          </button>
          <button onClick={handleJoke} className="btn-joke">
            😄 Tell a Joke
          </button>
          <button onClick={handleSong} className="btn-song">
            🎵 Sing a Song
          </button>
          <button onClick={handleStory} className="btn-story">
            📚 Tell a Story
          </button>
        </div>

        <div className="voice-tips">
          <h4>💡 Try clicking the buttons above!</h4>
          <p>Your friend will speak to you and show messages.</p>
        </div>
      </div>
    </div>
  );
}

export default VoiceAssistantSimple;
