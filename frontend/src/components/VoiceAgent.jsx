import React, { useEffect, useState, useCallback } from 'react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Activity } from 'lucide-react';
import '../styles/voice-agent.css';

/**
 * ENHANCED VOICE AGENT COMPONENT
 * Visual interface for voice interaction with advanced features
 */
export function VoiceAgent({
  onCommand,
  onWakeWord,
  games = [],
  userName = '',
  disabled = false,
  position = 'bottom-right',
  size = 'default'
}) {
  const [showPanel, setShowPanel] = useState(false);
  const [recentCommands, setRecentCommands] = useState([]);
  const [voiceVisualizer, setVoiceVisualizer] = useState([]);
  
  const {
    isListening,
    isListeningForWakeWord,
    isSpeaking,
    transcript,
    interimTranscript,
    confidence,
    wakeWordDetected,
    supported,
    error,
    speak,
    startListening,
    stopListening,
    startWakeWordListening,
    stopWakeWordListening,
    findBestCommand,
    setVoice
  } = useVoiceAgent({
    autoStart: !disabled,
    continuousListening: true,
    onWakeWord: ({ transcript, confidence }) => {
      handleWakeWord({ transcript, confidence });
    },
    onCommand: ({ transcript, confidence, alternatives }) => {
      handleCommand({ transcript, confidence, alternatives });
    },
    onTranscript: ({ transcript, isFinal }) => {
      if (!isFinal) {
        // Update visualizer for interim results
        updateVisualizer(transcript.length);
      }
    }
  });
  
  // Visualizer animation
  const updateVisualizer = useCallback((intensity) => {
    const bars = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      height: Math.max(20, Math.min(100, intensity * (0.5 + Math.random()))),
      delay: i * 50
    }));
    setVoiceVisualizer(bars);
  }, []);
  
  // Handle wake word detection
  const handleWakeWord = useCallback(({ transcript, confidence }) => {
    // Visual feedback
    setShowPanel(true);
    
    // Greeting
    const greetings = [
      `Yes ${userName || 'friend'}! I'm here!`,
      `Hello ${userName || 'there'}! Ready to help!`,
      `Hey! I'm listening!`,
      `Hi there! What would you like to do?`,
      `I'm here! Let's have some fun!`
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    speak(greeting, 'excited');
    
    // Start listening for command after greeting
    setTimeout(() => {
      startListening();
    }, 1500);
    
    onWakeWord?.({ transcript, confidence });
  }, [userName, speak, startListening, onWakeWord]);
  
  // Handle command detection
  const handleCommand = useCallback(({ transcript, confidence, alternatives }) => {
    const gameCommands = games.map(g => ({
      command: `play ${g.name.toLowerCase()}`,
      action: () => onCommand?.({ type: 'game', game: g.id }),
      label: g.name
    }));
    
    const systemCommands = [
      { command: 'stop listening', action: () => stopListening(), label: 'Stop' },
      { command: 'start listening', action: () => startWakeWordListening(), label: 'Start' },
      { command: 'close panel', action: () => setShowPanel(false), label: 'Close' },
      { command: 'help', action: () => showHelp(), label: 'Help' },
      { command: 'what can I say', action: () => showHelp(), label: 'Commands' }
    ];
    
    const allCommands = [...gameCommands, ...systemCommands];
    
    // Find best matching command
    const allTranscripts = [transcript, ...alternatives.map(a => a.transcript)];
    let bestMatch = null;
    let bestScore = 0;
    
    for (const text of allTranscripts) {
      for (const cmd of allCommands) {
        const { command, score } = findBestCommand(text, [cmd.command, ...cmd.command.split(' ')]);
        if (score > bestScore && score > 0.7) {
          bestScore = score;
          bestMatch = cmd;
        }
      }
    }
    
    if (bestMatch) {
      // Execute command
      bestMatch.action();
      
      // Add to recent commands
      setRecentCommands(prev => [
        { text: transcript, command: bestMatch.label, time: Date.now() },
        ...prev.slice(0, 4)
      ]);
      
      // Confirm with voice
      speak(`Okay! ${bestMatch.label}!`, 'happy');
      
      onCommand?.({ type: 'command', command: bestMatch.label, transcript, confidence });
    } else {
      // No match found
      speak(`I heard "${transcript}". Try saying "play memory" or "help"!`, 'thinking');
    }
    
    // Return to wake word listening after command
    setTimeout(() => {
      stopListening();
      startWakeWordListening();
    }, 3000);
  }, [games, onCommand, speak, startListening, stopListening, startWakeWordListening, findBestCommand]);
  
  const showHelp = useCallback(() => {
    const helpText = `Here are some things you can say: "Hey Dhyan" to wake me up, then "play memory", "play spelling", "play colors", "tell me a story", or "help" for assistance.`;
    speak(helpText, 'happy');
  }, [speak]);
  
  // Visual feedback effects
  const getEmotionColor = () => {
    if (wakeWordDetected) return '#FF6B6B'; // Red/Excited
    if (isSpeaking) return '#4ECDC4'; // Teal/Speaking
    if (isListening) return '#45B7D1'; // Blue/Listening
    if (isListeningForWakeWord) return '#96CEB4'; // Green/Active
    return '#FFEAA7'; // Yellow/Idle
  };
  
  const getStatusText = () => {
    if (wakeWordDetected) return 'I\'m here!';
    if (isSpeaking) return 'Speaking...';
    if (isListening) return 'Listening...';
    if (isListeningForWakeWord) return 'Say "Hey Dhyan"';
    return 'Voice Agent';
  };
  
  // Error display
  if (error) {
    console.warn('Voice Agent Error:', error);
  }
  
  // Check support
  if (!supported.synthesis || !supported.recognition) {
    return (
      <div className={`voice-agent voice-agent--unsupported voice-agent--${position} voice-agent--${size}`}>
        <div className="voice-agent__icon">
          <MicOff size={24} />
        </div>
        <span className="voice-agent__text">Voice not supported</span>
      </div>
    );
  }
  
  return (
    <>
      {/* Main Voice Agent Button */}
      <div 
        className={`voice-agent voice-agent--${position} voice-agent--${size} ${
          wakeWordDetected ? 'voice-agent--active' : ''
        } ${isListening ? 'voice-agent--listening' : ''} ${
          isSpeaking ? 'voice-agent--speaking' : ''
        }`}
        style={{ '--agent-color': getEmotionColor() }}
      >
        {/* Ripple Effect */}
        {(isListening || isListeningForWakeWord) && (
          <div className="voice-agent__ripple">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        
        {/* Voice Visualizer */}
        {isListening && voiceVisualizer.length > 0 && (
          <div className="voice-agent__visualizer">
            {voiceVisualizer.map(bar => (
              <div
                key={bar.id}
                className="voice-agent__bar"
                style={{
                  height: `${bar.height}%`,
                  animationDelay: `${bar.delay}ms`
                }}
              />
            ))}
          </div>
        )}
        
        {/* Main Button */}
        <button
          className="voice-agent__button"
          onClick={() => setShowPanel(!showPanel)}
          disabled={disabled}
          aria-label="Voice Agent"
        >
          {isSpeaking ? (
            <Volume2 size={24} className="voice-agent__icon--pulse" />
          ) : isListening ? (
            <Activity size={24} className="voice-agent__icon--pulse" />
          ) : wakeWordDetected ? (
            <Sparkles size={24} className="voice-agent__icon--sparkle" />
          ) : (
            <Mic size={24} />
          )}
        </button>
        
        {/* Status Text */}
        <span className="voice-agent__status">{getStatusText()}</span>
        
        {/* Confidence Indicator */}
        {isListening && confidence > 0 && (
          <div 
            className="voice-agent__confidence"
            style={{ '--confidence': `${confidence * 100}%` }}
          />
        )}
      </div>
      
      {/* Voice Panel */}
      {showPanel && (
        <div className="voice-agent__panel voice-agent__panel--show">
          <div className="voice-agent__panel-header">
            <h3>🎙️ Voice Agent</h3>
            <button 
              className="voice-agent__close"
              onClick={() => setShowPanel(false)}
            >
              ×
            </button>
          </div>
          
          <div className="voice-agent__panel-content">
            {/* Current Transcript */}
            {(transcript || interimTranscript) && (
              <div className="voice-agent__transcript">
                <p className="voice-agent__final">{transcript}</p>
                {interimTranscript && (
                  <p className="voice-agent__interim">{interimTranscript}</p>
                )}
              </div>
            )}
            
            {/* Recent Commands */}
            {recentCommands.length > 0 && (
              <div className="voice-agent__history">
                <h4>Recent Commands</h4>
                <ul>
                  {recentCommands.map((cmd, i) => (
                    <li key={i}>
                      <span className="voice-agent__cmd-text">"{cmd.text}"</span>
                      <span className="voice-agent__cmd-action">→ {cmd.command}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Quick Commands */}
            <div className="voice-agent__commands">
              <h4>Try Saying</h4>
              <div className="voice-agent__quick-cmds">
                <span className="voice-agent__chip">"Hey Dhyan"</span>
                <span className="voice-agent__chip">"Play Memory"</span>
                <span className="voice-agent__chip">"Play Colors"</span>
                <span className="voice-agent__chip">"Tell a Story"</span>
                <span className="voice-agent__chip">"Help"</span>
              </div>
            </div>
            
            {/* Controls */}
            <div className="voice-agent__controls">
              <button
                className={`voice-agent__ctrl ${isListeningForWakeWord ? 'active' : ''}`}
                onClick={isListeningForWakeWord ? stopWakeWordListening : startWakeWordListening}
              >
                {isListeningForWakeWord ? <MicOff size={16} /> : <Mic size={16} />}
                {isListeningForWakeWord ? 'Stop' : 'Start'}
              </button>
              
              <button
                className={`voice-agent__ctrl ${isSpeaking ? 'active' : ''}`}
                onClick={() => speak('I\'m ready to help! What would you like to do?', 'happy')}
              >
                <Volume2 size={16} />
                Test
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VoiceAgent;
