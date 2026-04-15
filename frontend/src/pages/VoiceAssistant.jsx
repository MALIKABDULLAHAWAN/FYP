/**
 * DHYAN Voice Assistant Page
 * A dedicated page for the voice agent
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useVoiceAPI } from "../hooks/useVoiceAPI";
import { getDashboardStats } from "../api/games";
import "./VoiceAssistant.css";

function VoiceAssistant() {
  const { user } = useAuth();
  const { sendTextCommand, isProcessing, response, error } = useVoiceAPI();
  const [currentMessage, setCurrentMessage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotion, setEmotion] = useState("happy");
  const [stats, setStats] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState("🐰");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const synthRef = useRef(null);

  // Emojis for different emotions
  const avatars = {
    happy: "😊",
    excited: "🤩",
    thinking: "🤔",
    celebrating: "🥳",
    calm: "😌",
    story: "📚",
    song: "🎵",
    game: "🎮",
  };

  // Load stats on mount
  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => setStats(null));
    synthRef.current = window.speechSynthesis;
  }, []);

  // Get current avatar based on emotion
  const getCurrentAvatar = () => avatars[emotion] || avatars.happy;

  // Speak text using Web Speech API
  const speak = useCallback(
    (text, emotionType = "happy") => {
      if (!synthRef.current) return;

      synthRef.current.cancel();
      setEmotion(emotionType);
      setCurrentMessage(text);
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSpeed;
      utterance.pitch = emotionType === "excited" ? 1.3 : emotionType === "calm" ? 0.9 : voicePitch;
      utterance.volume = 0.95;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [voiceSpeed, voicePitch]
  );

  // Handle commands
  const handleStats = () => {
    const msg = stats
      ? `📊 Your Progress: ${stats.total_sessions || 0} games played, ${stats.completed_sessions || 0} completed. Keep it up!`
      : "📊 Play some games to see your stats!";
    setCurrentMessage(msg);
    speak(msg, "thinking");
  };

  const handleEncourage = () => {
    const encouragements = [
      "🌟 You are capable of amazing things! Keep going!",
      "💪 Believe in yourself! You have unique talents!",
      "🌈 Mistakes help us learn. You're getting better every day!",
      "⭐ You are braver than you believe!",
      "🎯 You're doing great! Keep it up!",
    ];
    const msg = encouragements[Math.floor(Math.random() * encouragements.length)];
    setCurrentMessage(msg);
    speak(msg, "celebrating");
  };

  const handleJoke = () => {
    const jokes = [
      "😄 Why don't scientists trust atoms? Because they make up everything!",
      "🤣 Why did the scarecrow win an award? He was outstanding in his field!",
      "😂 Why don't eggs tell jokes? They'd crack each other up!",
      "🎭 What do you call a fake noodle? An impasta!",
    ];
    const msg = jokes[Math.floor(Math.random() * jokes.length)];
    setCurrentMessage(msg);
    speak(msg, "excited");
  };

  const handleSong = () => {
    const songs = [
      "🎵 Twinkle twinkle little star, how I wonder what you are!",
      "🎵 The itsy bitsy spider went up the water spout!",
      "🎵 If you're happy and you know it, clap your hands!",
    ];
    const msg = songs[Math.floor(Math.random() * songs.length)];
    setCurrentMessage(msg);
    speak(msg, "song");
  };

  const handleStory = () => {
    const intros = [
      "📚 Once upon a time, in a magical forest...",
      "📚 Long ago, in a land far away...",
      "📚 In a cozy little village...",
    ];
    const msg = intros[Math.floor(Math.random() * intros.length)] + " (Ask me to continue the story!)";
    setCurrentMessage(msg);
    speak(msg, "story");
  };

  const handleAICommand = async (command) => {
    setEmotion("thinking");
    try {
      const result = await sendTextCommand(command);
      if (result?.response) {
        setCurrentMessage(result.response);
        speak(result.response, "happy");
      }
    } catch (err) {
      const msg = "I'm thinking... Try asking me something else! 🧠";
      setCurrentMessage(msg);
      speak(msg, "thinking");
    }
  };

  const avatarOptions = ["🐰", "🐻", "🐱", "🐶", "🦁", "🐼", "🦄", "🦊"];

  return (
    <div className="voice-assistant-page">
      <div className="voice-container">
        {/* Header */}
        <div className="voice-header">
          <h1>🎙️ Dhyan Voice Assistant</h1>
          <p>Hi {user?.full_name?.split(" ")[0] || "Friend"}! I'm here to chat, tell jokes, and help you learn!</p>
        </div>

        {/* Main Avatar Display */}
        <div className="avatar-display">
          <div className={`avatar-bubble ${isSpeaking ? "speaking" : ""}`}>
            <span className="avatar-emoji">{getCurrentAvatar()}</span>
            {isSpeaking && <span className="speaking-indicator">🔊</span>}
          </div>
        </div>

        {/* Message Display */}
        <div className="message-display">
          {currentMessage || "👋 Say hello or click a button below!"}
        </div>

        {/* Avatar Selection */}
        <div className="avatar-selector">
          <p>Choose Your Friend:</p>
          <div className="avatar-options">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar}
                onClick={() => {
                  setSelectedAvatar(avatar);
                  const msg = `Hi! I'm your friend ${avatar}!`;
                  setCurrentMessage(msg);
                  speak(msg, "happy");
                }}
                className={selectedAvatar === avatar ? "selected" : ""}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="quick-actions">
          <button onClick={handleStats} className="btn-stats">
            📊 My Stats
          </button>
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
          <button onClick={() => handleAICommand("hello")} className="btn-chat">
            💬 Chat with AI
          </button>
        </div>

        {/* Voice Settings */}
        <div className="voice-settings">
          <h3>🎛️ Voice Settings</h3>
          <div className="setting">
            <label>Speed: {voiceSpeed.toFixed(1)}x</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
            />
          </div>
          <div className="setting">
            <label>Pitch: {voicePitch.toFixed(1)}x</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voicePitch}
              onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Status */}
        {isProcessing && (
          <div className="processing-indicator">
            🤔 Thinking...
          </div>
        )}
        {error && (
          <div className="error-message">
            ⚠️ Oops! Something went wrong. Try again!
          </div>
        )}

        {/* Tips */}
        <div className="voice-tips">
          <h4>💡 Try saying:</h4>
          <ul>
            <li>"Hello" or "Hi Dhyan"</li>
            <li>"Tell me a joke"</li>
            <li>"Sing a song"</li>
            <li>"Encourage me"</li>
            <li>"Tell me a story"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default VoiceAssistant;
