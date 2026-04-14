import { useState, useEffect, useCallback, useRef } from 'react';
import voiceAgent from '../services/VoiceAgent';

/**
 * ENHANCED VOICE AGENT HOOK
 * React hook for voice interaction with advanced features
 */
export function useVoiceAgent(options = {}) {
  const {
    onWakeWord,
    onCommand,
    onTranscript,
    onSpeechStart,
    onSpeechEnd,
    autoStart = false,
    continuousListening = true,
    defaultEmotion = 'happy'
  } = options;
  
  // State
  const [isListening, setIsListening] = useState(false);
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState(null);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [supported, setSupported] = useState({ synthesis: false, recognition: false });
  const [error, setError] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [settings, setSettings] = useState({
    rate: 1.0,
    pitch: 1.1,
    volume: 0.95
  });
  
  const transcriptTimeoutRef = useRef(null);
  const wakeWordTimeoutRef = useRef(null);
  
  // Check support on mount
  useEffect(() => {
    setSupported(voiceAgent.constructor.isSupported());
    setVoices(voiceAgent.getAvailableVoices());
    
    // Update voices when they change
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoices(voiceAgent.getAvailableVoices());
      };
    }
  }, []);
  
  // Setup voice agent callbacks
  useEffect(() => {
    // Listening events
    voiceAgent.on('onListeningStart', () => {
      setIsListening(true);
      setError(null);
    });
    
    voiceAgent.on('onListeningEnd', () => {
      setIsListening(false);
    });
    
    // Speech events
    voiceAgent.on('onSpeechStart', () => {
      setIsSpeaking(true);
      onSpeechStart?.();
    });
    
    voiceAgent.on('onSpeechEnd', () => {
      setIsSpeaking(false);
      onSpeechEnd?.();
    });
    
    voiceAgent.on('onSpeechError', ({ error }) => {
      setIsSpeaking(false);
      setError({ type: 'speech', message: error });
    });
    
    // Transcript events
    voiceAgent.on('onTranscript', ({ transcript: text, confidence: conf, isFinal, alternatives }) => {
      if (isFinal) {
        setTranscript(text);
        setInterimTranscript('');
        setConfidence(conf);
        onTranscript?.({ transcript: text, confidence: conf, isFinal: true, alternatives });
        
        // Clear transcript after delay
        if (transcriptTimeoutRef.current) {
          clearTimeout(transcriptTimeoutRef.current);
        }
        transcriptTimeoutRef.current = setTimeout(() => {
          setTranscript('');
          setConfidence(0);
        }, 5000);
      } else {
        setInterimTranscript(text);
        onTranscript?.({ transcript: text, isFinal: false });
      }
    });
    
    // Wake word detection
    voiceAgent.on('onWakeWord', ({ transcript: text, confidence: conf }) => {
      setWakeWordDetected(true);
      setTranscript(text);
      setConfidence(conf);
      onWakeWord?.({ transcript: text, confidence: conf });
      
      // Clear wake word indicator after delay
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
      wakeWordTimeoutRef.current = setTimeout(() => {
        setWakeWordDetected(false);
      }, 3000);
    });
    
    // Command detection
    voiceAgent.on('onCommand', ({ transcript: text, confidence: conf, alternatives }) => {
      setLastCommand({ text, confidence, alternatives, timestamp: Date.now() });
      onCommand?.({ transcript: text, confidence: conf, alternatives });
    });
    
    // Error handling
    voiceAgent.on('onError', ({ type, error: err }) => {
      setError({ type, message: err });
      setIsListening(false);
    });
    
    // Auto-start if requested
    if (autoStart) {
      voiceAgent.startWakeWordListening();
    }
    
    return () => {
      voiceAgent.off('onListeningStart');
      voiceAgent.off('onListeningEnd');
      voiceAgent.off('onSpeechStart');
      voiceAgent.off('onSpeechEnd');
      voiceAgent.off('onSpeechError');
      voiceAgent.off('onTranscript');
      voiceAgent.off('onWakeWord');
      voiceAgent.off('onCommand');
      voiceAgent.off('onError');
      
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
    };
  }, [onWakeWord, onCommand, onTranscript, onSpeechStart, onSpeechEnd, autoStart]);
  
  // Actions
  const speak = useCallback(async (text, emotion = defaultEmotion, options = {}) => {
    try {
      return await voiceAgent.speak(text, emotion, options);
    } catch (err) {
      setError({ type: 'speech', message: err });
      throw err;
    }
  }, [defaultEmotion]);
  
  const speakQueue = useCallback(async (utterances) => {
    try {
      return await voiceAgent.speakQueue(utterances);
    } catch (err) {
      setError({ type: 'speech', message: err });
      throw err;
    }
  }, []);
  
  const stopSpeaking = useCallback(() => {
    voiceAgent.stop();
  }, []);
  
  const startListening = useCallback(() => {
    voiceAgent.startListening();
  }, []);
  
  const stopListening = useCallback(() => {
    voiceAgent.stopListening();
  }, []);
  
  const startWakeWordListening = useCallback(() => {
    voiceAgent.startWakeWordListening();
    setIsListeningForWakeWord(true);
  }, []);
  
  const stopWakeWordListening = useCallback(() => {
    voiceAgent.stopWakeWordListening();
    setIsListeningForWakeWord(false);
  }, []);
  
  const updateSettings = useCallback((newSettings) => {
    voiceAgent.updateSettings(newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  
  const setVoice = useCallback((voiceName) => {
    voiceAgent.setVoice(voiceName);
    setSelectedVoice(voiceName);
  }, []);
  
  const findBestCommand = useCallback((transcript, commands) => {
    return voiceAgent.findBestCommand(transcript, commands);
  }, []);
  
  const fuzzyMatch = useCallback((str1, str2) => {
    return voiceAgent.fuzzyMatch(str1, str2);
  }, []);
  
  return {
    // State
    isListening,
    isListeningForWakeWord,
    isSpeaking,
    transcript,
    interimTranscript,
    confidence,
    lastCommand,
    wakeWordDetected,
    supported,
    error,
    voices,
    selectedVoice,
    settings,
    
    // Actions
    speak,
    speakQueue,
    stopSpeaking,
    startListening,
    stopListening,
    startWakeWordListening,
    stopWakeWordListening,
    updateSettings,
    setVoice,
    findBestCommand,
    fuzzyMatch,
    
    // Direct access to voice agent
    voiceAgent
  };
}

export default useVoiceAgent;
