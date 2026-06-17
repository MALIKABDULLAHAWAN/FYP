/**
 * ENHANCED VOICE AGENT SERVICE
 * Advanced speech recognition, synthesis, and voice interaction
 */

class VoiceAgent {
  constructor() {
    // Speech Synthesis
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.preferredVoice = null;
    this.isSpeaking = false;
    this.speechQueue = [];
    
    // Speech Recognition
    this.recognition = null;
    this.isListening = false;
    this.isListeningForWakeWord = false;
    this.wakeWordRecognition = null;
    this.transcriptBuffer = '';
    this.confidenceThreshold = 0.7;
    
    // Voice Settings
    this.settings = {
      rate: 1.0,
      pitch: 1.1,
      volume: 0.95,
      language: 'en-US',
      continuousListening: true,
      interimResults: true,
      wakeWords: ['hey dhyan', 'hi dhyan', 'hello dhyan', 'okay dhyan', 'yo dhyan', 'dhyan', 'dylan', 'dian', 'dhayan'],
      emotionMapping: {
        happy: { pitch: 1.15, rate: 1.0, volume: 1.0 },
        excited: { pitch: 1.3, rate: 1.15, volume: 1.0 },
        thinking: { pitch: 1.0, rate: 0.95, volume: 0.9 },
        story: { pitch: 1.1, rate: 0.95, volume: 0.95 },
        celebrating: { pitch: 1.25, rate: 1.1, volume: 1.0 },
        calm: { pitch: 0.95, rate: 0.9, volume: 0.85 },
        encouraging: { pitch: 1.2, rate: 1.05, volume: 1.0 }
      }
    };
    
    // Event callbacks
    this.callbacks = {
      onSpeechStart: null,
      onSpeechEnd: null,
      onSpeechError: null,
      onListeningStart: null,
      onListeningEnd: null,
      onTranscript: null,
      onWakeWord: null,
      onCommand: null,
      onError: null
    };
    
    // Initialize
    this.init();
  }
  
  init() {
    this.initSpeechSynthesis();
    this.initSpeechRecognition();
    this.loadPreferredVoice();
  }
  
  // ==================== SPEECH SYNTHESIS ====================
  
  initSpeechSynthesis() {
    if (!this.synth) {
      console.error('Speech synthesis not supported');
      return;
    }
    
    // Load voices when available
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadPreferredVoice();
    }
  }
  
  loadPreferredVoice() {
    if (!this.synth) return;
    
    const voices = this.synth.getVoices();
    
    // Priority voice selection for child-friendly, clear speech
    const preferredVoices = [
      'Samantha',           // macOS - warm, clear
      'Google US English',  // Chrome - natural
      'Microsoft Zira',     // Windows - female, clear
      'Victoria',           // macOS - British, clear
      'Karen',              // macOS - Australian, friendly
      'Amy',                // Amazon Polly - warm
      'Joanna',             // Amazon Polly - natural
      'Microsoft Anna'      // Windows fallback
    ];
    
    for (const voiceName of preferredVoices) {
      const found = voices.find(v => v.name.includes(voiceName));
      if (found) {
        this.preferredVoice = found;
        console.log(`Voice loaded: ${found.name}`);
        break;
      }
    }
    
    // Fallback to any English voice
    if (!this.preferredVoice) {
      this.preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
      ) || voices.find(v => v.lang.startsWith('en'));
    }
  }
  
  /**
   * Speak text with emotion and advanced features
   */
  speak(text, emotion = 'happy', options = {}) {
    if (!this.synth) {
      this.callbacks.onError?.('Speech synthesis not available');
      return Promise.reject('Speech synthesis not available');
    }
    
    // Stop current speech
    this.stop();
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const emotionSettings = this.settings.emotionMapping[emotion] || this.settings.emotionMapping.happy;
      
      // Apply settings
      utterance.rate = options.rate || emotionSettings.rate * this.settings.rate;
      utterance.pitch = options.pitch || emotionSettings.pitch * this.settings.pitch;
      utterance.volume = options.volume || emotionSettings.volume * this.settings.volume;
      utterance.lang = options.language || this.settings.language;
      
      // Set voice
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }
      
      // Event handlers
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.callbacks.onSpeechStart?.({ text, emotion });
      };
      
      utterance.onend = () => {
        this.isSpeaking = false;
        this.callbacks.onSpeechEnd?.({ text, emotion });
        resolve({ text, emotion, duration: utterance.duration });
      };
      
      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.callbacks.onSpeechError?.({ error: event.error, text });
        reject(event.error);
      };
      
      utterance.onpause = () => {
        this.isSpeaking = false;
      };
      
      utterance.onresume = () => {
        this.isSpeaking = true;
      };
      
      // Speak
      this.utterance = utterance;
      this.synth.speak(utterance);
    });
  }
  
  /**
   * Queue multiple utterances for sequential speaking
   */
  async speakQueue(utterances) {
    for (const item of utterances) {
      if (typeof item === 'string') {
        await this.speak(item);
      } else {
        await this.speak(item.text, item.emotion, item.options);
      }
    }
  }
  
  /**
   * Stop speaking
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
  
  /**
   * Pause speaking
   */
  pause() {
    if (this.synth) {
      this.synth.pause();
    }
  }
  
  /**
   * Resume speaking
   */
  resume() {
    if (this.synth) {
      this.synth.resume();
    }
  }
  
  /**
   * Create SSML-enhanced speech (if supported)
   */
  speakWithSSML(ssml, emotion = 'happy') {
    // Note: SSML support varies by browser
    // Strip SSML tags for basic support
    const text = ssml.replace(/<[^>]*>/g, '');
    return this.speak(text, emotion);
  }
  
  // ==================== SPEECH RECOGNITION ====================
  
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }
    
    // Main recognition instance
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.settings.continuousListening;
    this.recognition.interimResults = this.settings.interimResults;
    this.recognition.lang = this.settings.language;
    this.recognition.maxAlternatives = 3;
    
    // Setup handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onListeningStart?.();
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks.onListeningEnd?.();
      
      // Auto-restart for continuous listening
      if (this.settings.continuousListening && !this.isListeningForWakeWord) {
        setTimeout(() => this.startListening(), 100);
      }
    };
    
    this.recognition.onresult = (event) => {
      this.handleRecognitionResult(event);
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.callbacks.onError?.({ type: 'recognition', error: event.error });
      
      // Restart on error (except for no-speech)
      if (event.error !== 'no-speech' && this.settings.continuousListening) {
        setTimeout(() => this.startListening(), 500);
      }
    };
    
    // Wake word recognition instance (separate for efficiency)
    this.wakeWordRecognition = new SpeechRecognition();
    this.wakeWordRecognition.continuous = true;
    this.wakeWordRecognition.interimResults = false;
    this.wakeWordRecognition.lang = this.settings.language;
    
    this.wakeWordRecognition.onstart = () => {
      this.isListeningForWakeWord = true;
    };
    
    this.wakeWordRecognition.onend = () => {
      this.isListeningForWakeWord = false;
    };
    
    this.wakeWordRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const confidence = event.results[0][0].confidence;
      
      if (confidence > 0.6 && this.detectWakeWord(transcript)) {
        this.callbacks.onWakeWord?.({ transcript, confidence });
      }
    };
  }
  
  handleRecognitionResult(event) {
    const results = event.results;
    const lastResult = results[results.length - 1];
    
    if (lastResult.isFinal) {
      const transcript = lastResult[0].transcript.toLowerCase().trim();
      const confidence = lastResult[0].confidence;
      
      // Get alternative transcriptions for better matching
      const alternatives = Array.from(lastResult).map(alt => ({
        transcript: alt.transcript.toLowerCase().trim(),
        confidence: alt.confidence
      }));
      
      this.callbacks.onTranscript?.({
        transcript,
        confidence,
        alternatives,
        isFinal: true
      });
      
      // Check for wake word first
      if (this.detectWakeWord(transcript)) {
        this.callbacks.onWakeWord?.({ transcript, confidence });
      } else if (confidence > this.confidenceThreshold) {
        this.callbacks.onCommand?.({ transcript, confidence, alternatives });
      }
    } else {
      // Interim results
      const interim = lastResult[0].transcript;
      this.callbacks.onTranscript?.({
        transcript: interim.toLowerCase().trim(),
        confidence: lastResult[0].confidence,
        isFinal: false
      });
    }
  }
  
  detectWakeWord(transcript) {
    const lowerTranscript = transcript.toLowerCase().trim();
    return this.settings.wakeWords.some(word => 
      lowerTranscript.includes(word) ||
      this.fuzzyMatch(lowerTranscript, word) > 0.8
    );
  }
  
  /**
   * Fuzzy string matching for better command recognition
   */
  fuzzyMatch(str1, str2) {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Levenshtein distance
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = [];
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - (distance / maxLen);
  }
  
  /**
   * Find best matching command from a list
   */
  findBestCommand(transcript, commands) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const command of commands) {
      const score = this.fuzzyMatch(transcript, command);
      if (score > bestScore && score > 0.75) {
        bestScore = score;
        bestMatch = command;
      }
    }
    
    return { command: bestMatch, score: bestScore };
  }
  
  startListening() {
    if (!this.recognition || this.isListening) return;
    
    try {
      this.transcriptBuffer = '';
      this.recognition.start();
    } catch (e) {
      console.error('Failed to start listening:', e);
    }
  }
  
  stopListening() {
    if (!this.recognition) return;
    
    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (e) {
      // Ignore
    }
  }
  
  startWakeWordListening() {
    if (!this.wakeWordRecognition || this.isListeningForWakeWord) return;
    
    try {
      this.wakeWordRecognition.start();
    } catch (e) {
      console.error('Failed to start wake word listening:', e);
    }
  }
  
  stopWakeWordListening() {
    if (!this.wakeWordRecognition) return;
    
    try {
      this.wakeWordRecognition.stop();
      this.isListeningForWakeWord = false;
    } catch (e) {
      // Ignore
    }
  }
  
  // ==================== SETTINGS & UTILITIES ====================
  
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    // Update recognition settings
    if (this.recognition) {
      this.recognition.continuous = this.settings.continuousListening;
      this.recognition.interimResults = this.settings.interimResults;
      this.recognition.lang = this.settings.language;
    }
  }
  
  setLanguage(lang) {
    this.settings.language = lang;
    if (this.recognition) this.recognition.lang = lang;
    if (this.wakeWordRecognition) this.wakeWordRecognition.lang = lang;
  }
  
  setVoice(voiceName) {
    const voices = this.synth?.getVoices() || [];
    const voice = voices.find(v => v.name.includes(voiceName));
    if (voice) {
      this.preferredVoice = voice;
    }
  }
  
  getAvailableVoices() {
    return this.synth?.getVoices() || [];
  }
  
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
  }
  
  off(event) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = null;
    }
  }
  
  /**
   * Preload voices for faster response
   */
  preload() {
    if (this.synth) {
      this.synth.getVoices(); // Trigger voice loading
    }
    return this;
  }
  
  /**
   * Check if voice features are supported
   */
  static isSupported() {
    return {
      speechSynthesis: 'speechSynthesis' in window,
      speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      wakeWord: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    };
  }
}

// Create singleton instance
const voiceAgent = new VoiceAgent();

export default voiceAgent;
export { VoiceAgent };
