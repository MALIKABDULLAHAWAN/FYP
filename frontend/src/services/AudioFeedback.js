/**
 * AudioFeedback Service
 * 
 * Provides sound effects and audio feedback for games:
 * - Success/failure sounds
 * - Game event sounds (flip, match, click)
 * - Background music management
 * - Voice synthesis helpers
 * - Volume control and muting
 */

class AudioFeedback {
  constructor() {
    this.enabled = true;
    this.volume = 0.5;
    this.sounds = new Map();
    this.initialized = false;
    
    // Sound URLs (using data URIs for simple beeps/boops)
    this.soundEffects = {
      success: this.createSuccessSound(),
      failure: this.createFailureSound(),
      click: this.createClickSound(),
      flip: this.createFlipSound(),
      match: this.createMatchSound(),
      levelUp: this.createLevelUpSound(),
      gameComplete: this.createGameCompleteSound(),
      tick: this.createTickSound(),
    };
  }

  createSuccessSound() {
    // Create a pleasant major chord arpeggio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return () => this.playTone(audioContext, [523.25, 659.25, 783.99], 0.1, 'sine');
  }

  createFailureSound() {
    // Create a descending minor sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return () => this.playTone(audioContext, [440, 415.3], 0.15, 'sawtooth');
  }

  createClickSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return () => this.playTone(audioContext, [800], 0.05, 'sine');
  }

  createFlipSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return () => this.playTone(audioContext, [600], 0.08, 'triangle');
  }

  createMatchSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return () => this.playTone(audioContext, [523.25, 659.25, 783.99, 1046.50], 0.2, 'sine');
  }

  createLevelUpSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(audioContext, [freq], 0.1, 'sine'), i * 100);
      });
    };
  }

  createGameCompleteSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      const melody = [523.25, 659.25, 783.99, 523.25, 783.99, 1046.50];
      melody.forEach((freq, i) => {
        setTimeout(() => this.playTone(audioContext, [freq], 0.15, 'sine'), i * 150);
      });
    };
  }

  createTickSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return () => this.playTone(audioContext, [1000], 0.05, 'sine');
  }

  createMissionCompleteSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      const melody = [523.25, 659.25, 783.99, 1046.50, 783.99, 1318.51];
      melody.forEach((freq, i) => {
        setTimeout(() => this.playTone(audioContext, [freq], 0.2, 'sine'), i * 120);
      });
    };
  }

  playTone(audioContext, frequencies, duration, type = 'sine') {
    if (!this.enabled) return;
    
    try {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      const now = audioContext.currentTime;
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, now + (index * 0.05));
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.start(now + (index * 0.05));
        oscillator.stop(now + duration + 0.1);
      });
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  play(soundName) {
    if (!this.enabled) return;
    
    const sound = this.soundEffects[soundName];
    if (sound) {
      try {
        sound();
      } catch (e) {
        console.warn(`Failed to play sound: ${soundName}`, e);
      }
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('dhyan_audio_enabled', JSON.stringify(enabled));
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('dhyan_audio_volume', this.volume.toString());
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  loadSettings() {
    const savedEnabled = localStorage.getItem('dhyan_audio_enabled');
    const savedVolume = localStorage.getItem('dhyan_audio_volume');
    
    if (savedEnabled !== null) {
      this.enabled = JSON.parse(savedEnabled);
    }
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }
  }

  // Helper for TTS with better error handling
  async speak(text, options = {}) {
    if (!('speechSynthesis' in window)) return;
    
    const { rate = 0.9, pitch = 1.1, lang = 'en-US' } = options;
    
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = lang;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      window.speechSynthesis.speak(utterance);
    });
  }
}

// Export singleton
const audioFeedback = new AudioFeedback();
audioFeedback.loadSettings();

export default audioFeedback;
