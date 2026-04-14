/**
 * DHYAN Voice Assistant API Hook
 * Connects to the Python backend voice service
 */

import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1/therapy/voice';

export function useVoiceAPI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Send text command to voice assistant
   */
  const sendTextCommand = useCallback(async (command, generateAudio = true) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      abortControllerRef.current = new AbortController();
      
      const response = await axios.post(
        `${API_BASE_URL}/command`,
        {
          command,
          generate_audio: generateAudio
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          signal: abortControllerRef.current.signal
        }
      );
      
      const data = response.data;
      setResponse(data);
      
      // Play audio if available
      if (data.audio_url) {
        playAudio(data.audio_url);
      }
      
      return data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Send audio file to voice assistant
   */
  const sendAudioCommand = useCallback(async (audioBlob, childId = null) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'command.wav');
      if (childId) {
        formData.append('child_id', childId);
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/audio`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      const data = response.data;
      setResponse(data);
      
      // Play audio if available
      if (data.audio_url) {
        playAudio(data.audio_url);
      }
      
      return data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Stop current playback
   */
  const stopPlayback = useCallback(async () => {
    try {
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Stop any playing audio
      window.speechSynthesis?.cancel();
      
      // Tell backend to stop
      await axios.post(
        `${API_BASE_URL}/stop`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
    } catch (err) {
      console.log('Stop playback error:', err);
    }
  }, []);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/clear-history`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      setResponse(null);
    } catch (err) {
      console.log('Clear history error:', err);
    }
  }, []);

  /**
   * Get voice assistant status
   */
  const getStatus = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/status`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      return response.data;
    } catch (err) {
      return { available: false, error: err.message };
    }
  }, []);

  /**
   * Play audio from URL
   */
  const playAudio = useCallback((audioUrl) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.log('Audio playback error:', err);
    });
    return audio;
  }, []);

  return {
    // State
    isProcessing,
    error,
    response,
    
    // Actions
    sendTextCommand,
    sendAudioCommand,
    stopPlayback,
    clearHistory,
    getStatus,
    playAudio
  };
}

export default useVoiceAPI;
