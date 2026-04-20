import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiFetch } from "../api/client";
import "./VoiceAssistantPage.css";

function VoiceAssistantPage() {
  const { user } = useAuth();
  const [currentMessage, setCurrentMessage] = useState("Welcome! I'm Aura, your personal voice assistant. Click the microphone to start talking!");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [avatar, setAvatar] = useState("🤖");
  const [language, setLanguage] = useState("en");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const processingRef = useRef(false);
  const handleCommandRef = useRef(null);
  const abortControllerRef = useRef(null);
  const audioRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const handleCommand = useCallback(async (command) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Stop any current audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    if (processingRef.current) {
      processingRef.current = false;
    }
    
    processingRef.current = true;
    setIsProcessing(true);
    setAvatar("⏳");
    setCurrentMessage(language === "ur" ? "آپ کی درخواست پر کام ہو رہا ہے..." : "Processing your request...");

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      console.log("Sending command:", command);
      const response = await apiFetch("/api/v1/voice/command/", {
        method: "POST",
        auth: false,
        body: {
          command: command.trim(),
          language: language
        },
        signal: abortControllerRef.current.signal
      });

      console.log("Response received:", response);

      if (response?.response) {
        const responseText = response.response;
        setCurrentMessage(responseText);
        setAvatar("😊");
        setChatHistory(prev => [
          ...prev,
          { role: "user", text: command },
          { role: "assistant", text: responseText }
        ]);
        
        // Play audio from backend if available
        if (response.audio_url) {
          playBackendAudio(response.audio_url, responseText);
        } else {
          // Fallback to frontend speech synthesis
          speakResponse(responseText);
        }
      } else {
        throw new Error("No response from server");
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("Request was cancelled");
        return; // Don't show error for cancelled requests
      }
      console.error("Error:", error);
      const errorMsg = language === "ur" ? `خرابی: ${error.message || "آپ کی درخواست پر عمل نہیں ہو سکا"}` : `Error: ${error.message || "Could not process your request"}`;
      setCurrentMessage(errorMsg);
      setAvatar("😕");
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
      setTranscript("");
      abortControllerRef.current = null;
    }
  }, [language]);

  const playBackendAudio = (audioUrl, fallbackText) => {
    try {
      // Stop any current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      setIsSpeaking(true);
      audioRef.current = new Audio(`http://localhost:8000${audioUrl}`);
      
      audioRef.current.onended = () => {
        setIsSpeaking(false);
      };
      
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
      };
      
      audioRef.current.play().catch(e => {
        console.warn("Backend audio playback failed, using fallback:", e);
        setIsSpeaking(false);
        // Fallback to speech synthesis if backend audio fails
        if (fallbackText) {
          speakResponse(fallbackText);
        }
      });
    } catch (e) {
      console.warn("Backend audio error, using fallback:", e);
      setIsSpeaking(false);
      if (fallbackText) {
        speakResponse(fallbackText);
      }
    }
  };

  const speakResponse = (text) => {
    if (!text || typeof window === "undefined") return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      if (language === "ur") {
        utterance.lang = "ur-PK";
        // Try to find Urdu voice
        const voices = synth.getVoices();
        const urduVoice = voices.find(v => v.lang.startsWith("ur"));
        if (urduVoice) {
          utterance.voice = urduVoice;
        }
      } else {
        utterance.lang = "en-US";
        // Try to find a female voice for English
        const voices = synth.getVoices();
        const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'));
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
      }

      synth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      setIsSpeaking(false);
    }
  };

  // Keep ref updated with latest handleCommand
  useEffect(() => {
    handleCommandRef.current = handleCommand;
  }, [handleCommand]);

  useEffect(() => {
    if (!SpeechRecognition) {
      const msg = language === "ur" ? "آپ کے براؤزر میں آواز کی شناخت کی سہولت دستیاب نہیں ہے۔ براہ کرم Chrome یا Edge استعمال کریں۔" : "Speech recognition not supported in your browser. Please use Chrome or Edge.";
      setCurrentMessage(msg);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === "ur" ? "ur-PK" : "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      const msg = language === "ur" ? "میں سن رہا ہوں..." : "I'm listening...";
      setCurrentMessage(msg);
      setAvatar("👂");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setTranscript(interimTranscript);
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        setIsListening(false);
        if (handleCommandRef.current) {
          handleCommandRef.current(finalTranscript);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setAvatar("😕");
      const errorMsg = language === "ur" ? `خرابی: ${event.error}` : `Error: ${event.error}`;
      setCurrentMessage(errorMsg);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, [language]);

  const toggleMicrophone = () => {
    if (!recognitionRef.current) return;

    // Always stop any current audio and speech synthesis first
    stopSpeaking();

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Cancel any ongoing processing when starting new listening
      if (processingRef.current && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Reset processing state
      setIsProcessing(false);
      processingRef.current = false;
      setAvatar("👂");
      
      recognitionRef.current.start();
    }
  };

  const stopSpeaking = () => {
    // Stop backend audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  };

  const sendCommand = (command) => {
    console.log("sendCommand called with:", command);
    
    // Stop any current audio and speech synthesis
    stopSpeaking();
    
    handleCommand(command);
  };

  return (
    <div className="voice-assistant-page">
      <div className="voice-container">
        <div className="voice-header">
          <h1>🎙️ Voice Assistant</h1>
          <p>Chat with Aura</p>
          <div className="language-toggle">
            <button 
              className={`lang-btn ${language === "en" ? "active" : ""}`}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
            <button 
              className={`lang-btn ${language === "ur" ? "active" : ""}`}
              onClick={() => setLanguage("ur")}
            >
              اردو
            </button>
          </div>
        </div>

        <div className="avatar-section">
          <div className="avatar-circle">{avatar}</div>
        </div>

        <div className="response-box">
          {currentMessage}
        </div>

        {transcript && (
          <div className="transcript-box">
            <strong>You said:</strong> {transcript}
          </div>
        )}

        {chatHistory.length > 0 && (
          <div className="chat-history">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
          </div>
        )}

        <div className="quick-actions">
          <button 
            className="action-btn" 
            onClick={() => sendCommand(language === "ur" ? "مجھے کوئی مذاق سنائیں" : "Tell me a joke")}
            disabled={isListening}
          >
            😄 {language === "ur" ? "مذاق" : "Joke"}
          </button>
          <button 
            className="action-btn" 
            onClick={() => sendCommand(language === "ur" ? "مجھے کوئی کہانی سنائیں" : "Tell me a story")}
            disabled={isListening}
          >
            📖 {language === "ur" ? "کہانی" : "Story"}
          </button>
          <button 
            className="action-btn" 
            onClick={() => sendCommand(language === "ur" ? "موسم کیسا ہے" : "What's the weather")}
            disabled={isListening}
          >
            🌤️ {language === "ur" ? "موسم" : "Weather"}
          </button>
          <button 
            className="action-btn" 
            onClick={() => sendCommand(language === "ur" ? "مجھے کوئی دلچسپ بات بتائیں" : "Tell me a fun fact")}
            disabled={isListening}
          >
            💡 {language === "ur" ? "حقیقت" : "Fact"}
          </button>
        </div>

        <div className="mic-controls">
          <button
            className={`mic-button ${isListening ? "listening" : ""}`}
            onClick={toggleMicrophone}
          >
            {isListening ? "⏹️" : "🎤"}
          </button>

          {isSpeaking && (
            <button
              className="stop-button"
              onClick={stopSpeaking}
              title={language === "ur" ? "بولنا بند کریں" : "Stop Speaking"}
            >
              🛑
            </button>
          )}
        </div>

        <p className="info-text">
          {isProcessing 
            ? (language === "ur" ? "کام ہو رہا ہے..." : "Processing...") 
            : isListening 
              ? (language === "ur" ? "سن رہا ہوں..." : "Listening...") 
              : (language === "ur" ? "شروع کرنے کے لیے مائیکروفون دبائیں" : "Press the microphone to start")
          }
        </p>
      </div>
    </div>
  );
}

export default VoiceAssistantPage;
