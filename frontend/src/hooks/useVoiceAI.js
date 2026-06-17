/**
 * useVoiceAI Hook
 * React hook for voice-enabled AI interactions
 * Integrates with backend voice agent
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { buildApiUrl } from '../api/base';

// Get token using same key as api/client.js
function getAuthToken() {
  return localStorage.getItem('dhyan_jwt') || localStorage.getItem('token') || localStorage.getItem('access_token') || '';
}

export function useVoiceAI() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setIsSupported(supported);
      if (!supported) {
        setError('Voice recording is not supported in this browser');
      }
    };
    checkSupport();
  }, []);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Voice recording is not supported');
      return;
    }

    try {
      setError(null);
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setError('Recording error occurred');
        setIsRecording(false);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err.message || 'Could not access microphone');
      setIsRecording(false);
    }
  }, [isSupported]);

  /**
   * Stop recording and process audio
   */
  const stopRecording = useCallback(async () => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      const recorder = mediaRecorderRef.current;
      
      recorder.onstop = async () => {
        try {
          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }

          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: recorder.mimeType 
          });
          
          resolve(audioBlob);
        } catch (err) {
          reject(err);
        }
      };

      recorder.stop();
      setIsRecording(false);
    });
  }, []);

  /**
   * Send audio to backend for processing
   */
  const processVoiceCommand = useCallback(async (audioBlob) => {
    if (!audioBlob) return null;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_command.wav');

      const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
      
      const response = await fetch(buildApiUrl('/api/v1/therapy/voice/audio'), {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      setTranscript(result.text || result.transcription || '');
      
      // Play returned audio directly using browser HTML5 Audio
      if (result.audio_url) {
        // Build absolute URL if needed
        const mediaUrl = result.audio_url.startsWith('http') 
          ? result.audio_url 
          : buildApiUrl(result.audio_url);
          
        const audio = new Audio(mediaUrl);
        audio.play().catch(e => console.warn('Browser blocked audio playback:', e));
      }
      
      return {
        text: result.text || result.transcription,
        response: result.response,
        audio_url: result.audio_url,
        success: true
      };
      
    } catch (err) {
      console.error('Voice processing error:', err);
      setError(err.message || 'Failed to process voice command');
      return {
        text: '',
        response: '',
        success: false,
        error: err.message
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Record and process in one go
   */
  const recordAndProcess = useCallback(async (maxDuration = 10000) => {
    await startRecording();
    
    // Auto-stop after maxDuration
    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        const audioBlob = await stopRecording();
        const result = await processVoiceCommand(audioBlob);
        resolve(result);
      }, maxDuration);

      // Also resolve early if manually stopped
      const checkInterval = setInterval(() => {
        if (!isRecording && mediaRecorderRef.current?.state === 'inactive') {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          (async () => {
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
            });
            const result = await processVoiceCommand(audioBlob);
            resolve(result);
          })();
        }
      }, 100);
    });
  }, [startRecording, stopRecording, processVoiceCommand, isRecording]);

  /**
   * Stop any ongoing playback
   */
  const stopPlayback = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
      
      await fetch(buildApiUrl('/api/v1/therapy/voice/stop'), {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
    } catch (err) {
      console.warn('Stop playback error:', err);
    }
  }, []);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
      
      await fetch(buildApiUrl('/api/v1/therapy/voice/clear-history'), {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
    } catch (err) {
      console.warn('Clear history error:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    // State
    isRecording,
    isProcessing,
    transcript,
    error,
    isSupported,
    
    // Actions
    startRecording,
    stopRecording,
    processVoiceCommand,
    recordAndProcess,
    stopPlayback,
    clearHistory,
    setTranscript,
    setError
  };
}

export default useVoiceAI;
