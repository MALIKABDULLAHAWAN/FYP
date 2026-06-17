// Background Music Player Component
// Provides soothing background music for focus and relaxation

import { useState, useEffect, useRef, useCallback } from 'react';

// Calm background music playlist (using Web Audio API generated tones)
const MUSIC_TRACKS = [
  { id: 'calm', name: 'Peaceful Meadows', type: 'ambient', color: '#84fab0' },
  { id: 'focus', name: 'Study Time', type: 'focus', color: '#66a6ff' },
  { id: 'playful', name: 'Fun Time', type: 'upbeat', color: '#fa709a' },
  { id: 'sleep', name: 'Dreamy Night', type: 'sleep', color: '#a18cd1' }
];

// Generate ambient music using Web Audio API
const generateAmbientMusic = (type, volume) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const masterGain = audioContext.createGain();
  masterGain.gain.value = volume * 0.3; // Keep it subtle
  masterGain.connect(audioContext.destination);

  const oscillators = [];
  const gains = [];

  if (type === 'ambient') {
    // Peaceful pentatonic scale
    const frequencies = [261.63, 293.66, 329.63, 392.00, 440.00]; // C major pentatonic
    frequencies.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      oscillators.push(osc);
      gains.push(gain);
    });
  } else if (type === 'focus') {
    // Alpha waves for concentration
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = 100; // Alpha wave frequency
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    oscillators.push(osc);
    gains.push(gain);
  } else if (type === 'upbeat') {
    // Cheerful major chords
    const frequencies = [261.63, 329.63, 392.00]; // C major chord
    frequencies.forEach(freq => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      oscillators.push(osc);
      gains.push(gain);
    });
  } else if (type === 'sleep') {
    // Deep delta wave
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = 2; // Delta wave
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    oscillators.push(osc);
    gains.push(gain);
  }

  return {
    stop: () => {
      gains.forEach(g => {
        g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      });
      setTimeout(() => {
        oscillators.forEach(o => o.stop());
      }, 500);
    },
    setVolume: (v) => {
      masterGain.gain.setValueAtTime(v * 0.3, audioContext.currentTime);
    }
  };
};

export const MusicPlayer = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(MUSIC_TRACKS[0]);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const musicRef = useRef(null);
  const progressInterval = useRef(null);

  const play = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.stop();
    }
    musicRef.current = generateAmbientMusic(currentTrack.type, volume);
    setIsPlaying(true);

    // Simulate progress
    progressInterval.current = setInterval(() => {
      setProgress(p => (p + 1) % 100);
    }, 1000);
  }, [currentTrack, volume]);

  const pause = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.stop();
      musicRef.current = null;
    }
    setIsPlaying(false);
    clearInterval(progressInterval.current);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const selectTrack = useCallback((track) => {
    setCurrentTrack(track);
    setProgress(0);
    if (isPlaying) {
      pause();
      setTimeout(play, 100);
    }
  }, [isPlaying, play, pause]);

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    if (musicRef.current) {
      musicRef.current.setVolume(newVolume);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (musicRef.current) {
        musicRef.current.stop();
      }
      clearInterval(progressInterval.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '320px',
      background: 'linear-gradient(135deg, #fff5f7, #ffeef8)',
      borderRadius: '20px',
      padding: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      zIndex: 1000,
      animation: 'springIn 0.4s ease-out',
      border: '2px solid rgba(255, 154, 158, 0.3)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          color: '#d63384',
          fontFamily: 'var(--font-fun)',
          fontWeight: 700
        }}>
          🎵 Music Player
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Now Playing */}
      <div style={{
        background: '#fff',
        borderRadius: '15px',
        padding: '15px',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: currentTrack.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          animation: isPlaying ? 'smoothPulse 2s infinite' : 'none'
        }}>
          {isPlaying ? '♪' : '♫'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            margin: '0 0 4px 0',
            fontSize: '14px',
            fontWeight: 700,
            color: '#333',
            fontFamily: 'var(--font-fun)'
          }}>
            {currentTrack.name}
          </p>
          <p style={{
            margin: 0,
            fontSize: '11px',
            color: '#888',
            textTransform: 'capitalize'
          }}>
            {currentTrack.type} Mode
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '6px',
        background: 'rgba(0,0,0,0.1)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '15px'
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #ff9a9e, #fecfef)',
          borderRadius: '3px',
          transition: 'width 1s linear'
        }} />
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '15px'
      }}>
        <button
          onClick={togglePlay}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255, 154, 158, 0.4)',
            transition: 'all 0.3s ease'
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>

      {/* Volume Control */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '15px'
      }}>
        <span style={{ fontSize: '14px' }}>🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: '12px', color: '#888', minWidth: '35px' }}>
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* Track List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {MUSIC_TRACKS.map(track => (
          <button
            key={track.id}
            onClick={() => selectTrack(track)}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: 'none',
              background: currentTrack.id === track.id ? track.color : '#fff',
              color: currentTrack.id === track.id ? 'white' : '#666',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: currentTrack.id === track.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <span style={{ fontSize: '14px' }}>
              {track.type === 'ambient' && '🌿'}
              {track.type === 'focus' && '📚'}
              {track.type === 'upbeat' && '🎉'}
              {track.type === 'sleep' && '🌙'}
            </span>
            {track.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// Music Player Toggle Button
export const MusicPlayerButton = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      border: 'none',
      background: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer',
      boxShadow: '0 8px 30px rgba(255, 154, 158, 0.4)',
      zIndex: 999,
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      animation: 'smoothFloat 3s ease-in-out infinite'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'scale(1.1)';
      e.target.style.boxShadow = '0 12px 40px rgba(255, 154, 158, 0.5)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'scale(1)';
      e.target.style.boxShadow = '0 8px 30px rgba(255, 154, 158, 0.4)';
    }}
  >
    🎵
  </button>
);

// Default export (for compatibility)
export default { MusicPlayer, MusicPlayerButton };
