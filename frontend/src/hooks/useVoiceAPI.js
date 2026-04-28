/**
 * DHYAN Voice Assistant API Hook (WebSocket Enhanced)
 * Connects to the FastAPI real-time voice service
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiFetch } from '../api/client';

const WS_URL = import.meta.env.VITE_VOICE_WS_URL || '';

export function useVoiceAPI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [navCommand, setNavCommand] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Initialize Audio Context for streaming playback
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const connectWS = useCallback(() => {
    if (!WS_URL) {
      setStatus('Voice server ready');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    // Don't retry if we've already exhausted retries
    if (retryCountRef.current > MAX_RETRIES) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Voice WebSocket connected');
      setStatus("Connected! ✨");
    };

    ws.onmessage = async (event) => {
      console.log('Voice WS Message Received:', event.data);
      const data = json_safe_parse(event.data);
      if (!data) return;

      switch (data.type) {
        case 'status':
          setStatus(data.message);
          break;
        case 'transcription':
          // Transcription received from server (ASR)
          break;
        case 'response_start':
          setIsProcessing(true);
          if (data.text) {
            setLastResponse({
              text: data.text,
              agent: data.agent,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
          if (data.nav_command) {
            setNavCommand(data.nav_command);
          }
          break;
        case 'audio_chunk':
          // Buffer binary audio chunk
          handleAudioChunk(data.data);
          break;
        case 'response_end':
          setIsProcessing(false);
          break;
        case 'music_chunk':
          handleAudioChunk(data.data);
          break;
        case 'error':
          setError(data.message);
          setIsProcessing(false);
          break;
        default:
          break;
      }
    };

    // Keep-alive Heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 20000);

    ws.onerror = (event) => {
      console.warn('Voice WebSocket error (server may be offline)');
    };

    ws.onclose = () => {
      console.log('Voice WebSocket disconnected');
      clearInterval(heartbeat);
      retryCountRef.current += 1;
      if (retryCountRef.current <= MAX_RETRIES) {
        const delay = Math.min(3000 * Math.pow(2, retryCountRef.current - 1), 30000);
        setStatus(`Reconnecting (${retryCountRef.current}/${MAX_RETRIES})...`);
        setTimeout(connectWS, delay);
      } else {
        setStatus("Voice server offline — text commands still work");
      }
    };
  }, []);

  useEffect(() => {
    connectWS();
    return () => wsRef.current?.close();
  }, [connectWS]);

  const json_safe_parse = (str) => {
    try { return JSON.parse(str); }
    catch (e) { return null; }
  };

  const handleAudioChunk = async (base64Data) => {
    initAudio();
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      audioQueueRef.current.push(audioBuffer);
      playNextInQueue();
    } catch (e) {
      console.error("Error decoding audio chunk", e);
    }
  };

  const playNextInQueue = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift();
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      isPlayingRef.current = false;
      playNextInQueue();
    };
    
    source.start(0);
  };

  const sendTextCommand = useCallback((text, childId = null) => {
    if (!WS_URL) {
      setIsProcessing(true);
      setStatus('Processing...');

      apiFetch('/api/v1/voice/command/', {
        method: 'POST',
        auth: false,
        body: {
          command: text,
          language: 'en',
          child_id: childId,
        },
      })
        .then((response) => {
          if (response?.response) {
            setLastResponse({
              text: response.response,
              agent: 'voice',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }
          setStatus('Voice server ready');
        })
        .catch((err) => {
          setError(err.message || 'Voice request failed');
        })
        .finally(() => {
          setIsProcessing(false);
        });

      return;
    }

    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.error("Voice server not connected. ReadyState:", wsRef.current?.readyState);
      setError("Voice server not connected");
      return;
    }
    console.log("Sending text command:", text);
    setIsProcessing(true);
    wsRef.current.send(JSON.stringify({
      type: "text_command",
      text: text,
      child_id: childId
    }));
  }, []);

  const sendAudioBlob = useCallback((blob) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    // Send raw binary
    wsRef.current.send(blob);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("Listening... 👂");
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      console.log("Speech recognized:", text);
      sendTextCommand(text);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [sendTextCommand]);

  const stopPlayback = useCallback(() => {
    audioQueueRef.current = [];
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

    return {
    isProcessing,
    isListening,
    status,
    error,
    navCommand,
    lastResponse,
    setNavCommand,
    sendTextCommand,
    sendAudioBlob,
    startListening,
    stopPlayback,
    setIsListening
  };
}

export default useVoiceAPI;
