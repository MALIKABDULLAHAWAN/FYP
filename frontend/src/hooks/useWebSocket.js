import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * REACT HOOK FOR WEBSOCKET CONNECTIONS
 * Supports real-time multiplayer, progress tracking, notifications
 */
export function useWebSocket(url, options = {}) {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnects = 5
  } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  
  const connect = useCallback(() => {
    if (isConnecting || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectCountRef.current = 0;
        
        // Start ping interval for latency check
        pingIntervalRef.current = setInterval(() => {
          const pingTime = Date.now();
          ws.send(JSON.stringify({ type: 'ping', timestamp: pingTime }));
        }, 5000);
        
        if (onOpen) onOpen(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle pong for latency
          if (data.type === 'pong' && data.received) {
            const latency = Date.now() - data.received;
            setLatency(latency);
          }
          
          if (onMessage) onMessage(data, event);
        } catch (err) {
          // Non-JSON message
          if (onMessage) onMessage(event.data, event);
        }
      };
      
      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        if (onClose) onClose(event);
        
        // Attempt reconnection
        if (reconnect && reconnectCountRef.current < maxReconnects) {
          reconnectCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * reconnectCountRef.current);
        }
      };
      
      ws.onerror = (error) => {
        setError(error);
        setIsConnecting(false);
        if (onError) onError(error);
      };
      
    } catch (err) {
      setError(err);
      setIsConnecting(false);
    }
  }, [url, options, onOpen, onMessage, onClose, onError, reconnect, reconnectInterval, maxReconnects, isConnecting]);
  
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);
  
  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
      return true;
    }
    return false;
  }, []);
  
  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    isConnected,
    isConnecting,
    error,
    latency,
    send,
    connect,
    disconnect,
    ws: wsRef.current
  };
}

/**
 * HOOK FOR MULTIPLAYER GAME ROOMS
 */
export function useGameRoom(roomCode, playerId, playerName) {
  const [players, setPlayers] = useState({});
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, finished
  const [messages, setMessages] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const wsUrl = `ws://localhost:8000/ws/game/${roomCode}/`;
  
  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'player_joined':
        setPlayers(prev => ({
          ...prev,
          [data.player_id]: { name: data.player_name, score: 0 }
        }));
        break;
      
      case 'player_left':
        setPlayers(prev => {
          const newPlayers = { ...prev };
          delete newPlayers[data.player_id];
          return newPlayers;
        });
        break;
      
      case 'game_started':
        setGameState('playing');
        break;
      
      case 'chat':
        setMessages(prev => [...prev, {
          player: data.player_name,
          message: data.message,
          timestamp: data.timestamp
        }]);
        break;
      
      case 'progress':
        if (data.player_id === playerId) {
          setMyScore(data.score);
        }
        setPlayers(prev => ({
          ...prev,
          [data.player_id]: { ...prev[data.player_id], score: data.score }
        }));
        break;
      
      case 'player_answered':
        // Update leaderboard
        setLeaderboard(prev => {
          const updated = [...prev];
          const index = updated.findIndex(p => p.id === data.player_id);
          if (index >= 0) {
            updated[index].correct += data.is_correct ? 1 : 0;
            updated[index].total += 1;
          } else {
            updated.push({
              id: data.player_id,
              correct: data.is_correct ? 1 : 0,
              total: 1
            });
          }
          return updated.sort((a, b) => (b.correct / b.total) - (a.correct / a.total));
        });
        break;
      
      default:
        break;
    }
  }, [playerId]);
  
  const { isConnected, send } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    onOpen: (ws) => {
      // Join room
      ws.send(JSON.stringify({
        type: 'join',
        player_id: playerId,
        player_name: playerName
      }));
    }
  });
  
  const submitAnswer = useCallback((answer, questionId, timeTaken, isCorrect) => {
    send({
      type: 'answer',
      answer,
      question_id: questionId,
      time_taken: timeTaken,
      is_correct: isCorrect
    });
  }, [send]);
  
  const sendChat = useCallback((message) => {
    send({
      type: 'chat',
      player_name: playerName,
      message
    });
  }, [send, playerName]);
  
  const setReady = useCallback((ready = true) => {
    send({
      type: 'ready',
      ready
    });
  }, [send]);
  
  const startGame = useCallback((config) => {
    send({
      type: 'start_game',
      config
    });
  }, [send]);
  
  const updateProgress = useCallback((progress) => {
    send({
      type: 'progress',
      ...progress
    });
  }, [send]);
  
  const usePowerUp = useCallback((powerUp, targetPlayer = null) => {
    send({
      type: 'power_up',
      power_up: powerUp,
      target_player: targetPlayer
    });
  }, [send]);
  
  const sendEmoji = useCallback((emoji) => {
    send({
      type: 'emoji',
      emoji
    });
  }, [send]);
  
  return {
    isConnected,
    players,
    gameState,
    messages,
    myScore,
    leaderboard,
    submitAnswer,
    sendChat,
    setReady,
    startGame,
    updateProgress,
    usePowerUp,
    sendEmoji
  };
}

/**
 * HOOK FOR LIVE PROGRESS TRACKING (Therapist/Parent)
 */
export function useProgressTracking(childId) {
  const [progress, setProgress] = useState(null);
  const [isLive, setIsLive] = useState(false);
  
  const wsUrl = `ws://localhost:8000/ws/progress/${childId}/`;
  
  const handleMessage = useCallback((data) => {
    if (data.type === 'initial_data') {
      setProgress(data.data);
    } else if (data.type === 'live_update') {
      setProgress(data.data);
      setIsLive(true);
    }
  }, []);
  
  const { isConnected, send } = useWebSocket(wsUrl, {
    onMessage: handleMessage
  });
  
  const requestUpdate = useCallback(() => {
    send({ type: 'request_update' });
  }, [send]);
  
  return {
    isConnected,
    isLive,
    progress,
    requestUpdate
  };
}

export default useWebSocket;
