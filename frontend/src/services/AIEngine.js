/**
 * ADVANCED AI ENGINE
 * Adaptive learning, personalization, and intelligent content generation
 */

class AIEngine {
  constructor() {
    this.userProfiles = new Map();
    this.learningModels = new Map();
    this.contentCache = new Map();
    
    // Learning styles
    this.learningStyles = {
      visual: {
        name: 'Visual Learner',
        preferences: ['colors', 'shapes', 'patterns', 'pictureQuiz', 'memory'],
        teachingMethods: ['show examples', 'use diagrams', 'highlight key points'],
        pace: 'moderate'
      },
      auditory: {
        name: 'Auditory Learner',
        preferences: ['animalSounds', 'songs', 'stories', 'spelling'],
        teachingMethods: ['read aloud', 'discuss concepts', 'use rhythm'],
        pace: 'moderate'
      },
      kinesthetic: {
        name: 'Kinesthetic Learner',
        preferences: ['memory', 'trivia', 'math', 'interactive'],
        teachingMethods: ['hands-on activities', 'movement', 'practice'],
        pace: 'fast'
      },
      reading: {
        name: 'Reading/Writing Learner',
        preferences: ['spelling', 'wordScramble', 'riddles', 'trivia'],
        teachingMethods: ['provide notes', 'written instructions', 'lists'],
        pace: 'slow'
      }
    };
    
    // Initialize from localStorage
    this.loadProfiles();
  }
  
  // ==================== USER PROFILING ====================
  
  createUserProfile(userId, initialData = {}) {
    const profile = {
      id: userId,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      
      // Learning characteristics
      learningStyle: null, // Detected over time
      dominantIntelligence: null, // Multiple intelligences
      attentionSpan: 10, // minutes
      preferredDifficulty: 'adaptive',
      
      // Performance metrics
      performance: {
        overall: { accuracy: 0, speed: 0, consistency: 0 },
        byGameType: {},
        byCategory: {},
        byDifficulty: {}
      },
      
      // Learning patterns
      patterns: {
        bestTimeOfDay: null,
        sessionLength: [],
        streakHistory: [],
        mistakePatterns: [],
        strengthAreas: [],
        improvementAreas: []
      },
      
      // Engagement metrics
      engagement: {
        totalSessions: 0,
        totalTime: 0,
        lastSession: null,
        favoriteGames: [],
        achievementRate: 0
      },
      
      // Personalized settings
      settings: {
        autoDifficulty: true,
        hintFrequency: 'adaptive',
        voiceSpeed: 1.0,
        visualTheme: 'auto',
        notificationPreference: 'gentle'
      },
      
      // Historical data
      history: {
        sessions: [],
        milestones: [],
        feedback: []
      },
      
      ...initialData
    };
    
    this.userProfiles.set(userId, profile);
    this.saveProfiles();
    
    return profile;
  }
  
  getUserProfile(userId) {
    if (!this.userProfiles.has(userId)) {
      return this.createUserProfile(userId);
    }
    return this.userProfiles.get(userId);
  }
  
  updateUserProfile(userId, updates) {
    const profile = this.getUserProfile(userId);
    
    Object.assign(profile, updates, {
      lastUpdated: Date.now()
    });
    
    this.userProfiles.set(userId, profile);
    this.saveProfiles();
    
    return profile;
  }
  
  // ==================== LEARNING STYLE DETECTION ====================
  
  detectLearningStyle(userId, sessionData) {
    const profile = this.getUserProfile(userId);
    
    // Analyze game preferences
    const gamePerformance = sessionData.gameResults || [];
    const styleScores = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      reading: 0
    };
    
    for (const result of gamePerformance) {
      const gameType = result.gameType;
      const accuracy = result.accuracy;
      const enjoyment = result.enjoyment || 0.5;
      
      // Score each learning style based on game affinity
      for (const [style, config] of Object.entries(this.learningStyles)) {
        if (config.preferences.includes(gameType)) {
          styleScores[style] += accuracy * enjoyment * 10;
        }
      }
    }
    
    // Determine dominant style
    const dominant = Object.entries(styleScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (dominant && dominant[1] > 20) {
      profile.learningStyle = dominant[0];
      this.updateUserProfile(userId, { learningStyle: dominant[0] });
    }
    
    return {
      dominant: profile.learningStyle,
      scores: styleScores,
      confidence: dominant ? Math.min(1, dominant[1] / 50) : 0
    };
  }
  
  // ==================== ADAPTIVE DIFFICULTY ====================
  
  calculateOptimalDifficulty(userId, gameType) {
    const profile = this.getUserProfile(userId);
    const gamePerf = profile.performance.byGameType[gameType] || {
      attempts: 0,
      accuracy: 0.5,
      avgTime: 30,
      streak: 0
    };
    
    // Base difficulty on accuracy
    let difficulty = 1;
    
    if (gamePerf.accuracy >= 0.9) {
      difficulty = 5; // Expert
    } else if (gamePerf.accuracy >= 0.8) {
      difficulty = 4; // Hard
    } else if (gamePerf.accuracy >= 0.6) {
      difficulty = 3; // Medium
    } else if (gamePerf.accuracy >= 0.4) {
      difficulty = 2; // Easy-Medium
    } else {
      difficulty = 1; // Easy
    }
    
    // Adjust for speed
    if (gamePerf.avgTime < 10) difficulty += 0.5;
    if (gamePerf.avgTime > 45) difficulty -= 0.5;
    
    // Adjust for streak
    if (gamePerf.streak >= 5) difficulty += 0.5;
    if (gamePerf.streak >= 10) difficulty += 0.5;
    
    // Personal adjustment based on learning style
    if (profile.learningStyle === 'kinesthetic') {
      difficulty += 0.3; // Kinesthetic learners can handle slightly higher
    }
    
    return Math.max(1, Math.min(6, Math.round(difficulty)));
  }
  
  generateAdaptiveQuestion(userId, gameType, stage) {
    const difficulty = this.calculateOptimalDifficulty(userId, gameType);
    const profile = this.getUserProfile(userId);
    
    // Generate based on difficulty level
    const question = this.createQuestionByDifficulty(gameType, difficulty, profile);
    
    // Add personalized hints based on learning style
    question.hints = this.generatePersonalizedHints(
      question,
      profile.learningStyle,
      profile.patterns.mistakePatterns
    );
    
    // Adjust time based on user's pace
    question.timeLimit = this.calculateTimeLimit(profile, difficulty);
    
    return question;
  }
  
  createQuestionByDifficulty(gameType, difficulty, profile) {
    const generators = {
      math: (d) => this.generateMathProblem(d),
      spelling: (d) => this.generateSpellingWord(d),
      riddles: (d) => this.generateRiddle(d),
      memory: (d) => this.generateMemoryChallenge(d),
      patterns: (d) => this.generatePattern(d),
      trivia: (d) => this.generateTriviaQuestion(d),
      colors: (d) => this.generateColorChallenge(d),
      shapes: (d) => this.generateShapeChallenge(d)
    };
    
    const generator = generators[gameType];
    if (generator) {
      return generator(difficulty);
    }
    
    return { type: gameType, difficulty };
  }
  
  generateMathProblem(difficulty) {
    const ops = ['+', '-', '*'];
    const op = ops[Math.min(difficulty - 1, 2)];
    
    let a, b;
    switch (difficulty) {
      case 1:
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        break;
      case 2:
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 15) + 1;
        break;
      case 3:
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 25) + 1;
        break;
      case 4:
        a = Math.floor(Math.random() * 100) + 1;
        b = Math.floor(Math.random() * 50) + 1;
        break;
      case 5:
      case 6:
        a = Math.floor(Math.random() * 200) + 50;
        b = Math.floor(Math.random() * 100) + 20;
        break;
      default:
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
    }
    
    const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
    
    return {
      type: 'math',
      difficulty,
      question: `What is ${a} ${op} ${b}?`,
      answer: answer.toString(),
      visual: `${a}\n${op} ${b}\n─────`,
      hints: [
        `Think about ${op === '+' ? 'counting up' : op === '-' ? 'counting down' : 'groups of'}`,
        `${a} ${op === '+' ? 'plus' : op === '-' ? 'minus' : 'times'} ${b}`
      ]
    };
  }
  
  generateSpellingWord(difficulty) {
    const wordLists = {
      1: ['cat', 'dog', 'sun', 'hat', 'run', 'big', 'red', 'blue'],
      2: ['apple', 'house', 'water', 'friend', 'happy', 'green', 'yellow'],
      3: ['school', 'family', 'garden', 'summer', 'winter', 'spring', 'autumn'],
      4: ['beautiful', 'wonderful', 'adventure', 'butterfly', 'rainbow'],
      5: ['extraordinary', 'imagination', 'celebration', 'exploration'],
      6: ['constellation', 'breathtaking', 'magnificent', 'unstoppable']
    };
    
    const words = wordLists[difficulty] || wordLists[1];
    const word = words[Math.floor(Math.random() * words.length)];
    
    return {
      type: 'spelling',
      difficulty,
      question: `Spell: ${word}`,
      answer: word,
      phonetic: word.split('').join('-'),
      hint: `It has ${word.length} letters and starts with "${word[0]}"`,
      syllables: this.countSyllables(word)
    };
  }
  
  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const match = word.match(/[aeiouy]{1,2}/g);
    return match ? match.length : 1;
  }
  
  generateRiddle(difficulty) {
    const riddles = {
      1: [
        { q: 'What has keys but no locks?', a: 'piano', hint: 'You play it' },
        { q: 'What has hands but cannot clap?', a: 'clock', hint: 'It tells time' },
        { q: 'What has a head and a tail but no body?', a: 'coin', hint: 'You flip it' }
      ],
      2: [
        { q: 'The more you take, the more you leave behind. What am I?', a: 'footsteps', hint: 'Walking' },
        { q: 'I have cities but no houses. What am I?', a: 'map', hint: 'Navigation' },
        { q: 'What gets wet while drying?', a: 'towel', hint: 'Bathroom item' }
      ],
      3: [
        { q: 'I speak without a mouth. What am I?', a: 'echo', hint: 'Sound' },
        { q: 'The more you remove, the bigger I get. What am I?', a: 'hole', hint: 'Empty space' },
        { q: 'What has one eye but cannot see?', a: 'needle', hint: 'Sewing' }
      ],
      4: [
        { q: 'Forward I am heavy, backward I am not. What am I?', a: 'ton', hint: 'Weight unit' },
        { q: 'What has a bottom at the top?', a: 'legs', hint: 'Body part' },
        { q: 'What can travel around the world while staying in a corner?', a: 'stamp', hint: 'Mail' }
      ],
      5: [
        { q: 'I am not alive, but I grow; I don\'t have lungs, but I need air. What am I?', a: 'fire', hint: 'Hot' },
        { q: 'The person who makes it, sells it. The person who buys it, never uses it. What is it?', a: 'coffin', hint: 'Funeral' }
      ],
      6: [
        { q: 'What comes once in a minute, twice in a moment, but never in a thousand years?', a: 'm', hint: 'Letter' },
        { q: 'I have keys but no locks, space but no room. You can enter but not go outside. What am I?', a: 'keyboard', hint: 'Computer' }
      ]
    };
    
    const pool = riddles[difficulty] || riddles[1];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  generatePersonalizedHints(question, learningStyle, mistakePatterns) {
    const styleHintGenerators = {
      visual: (q) => [`👁️ Look at: ${q.visual || q.question}`, '🎨 Picture this in your mind'],
      auditory: (q) => [`🔊 Say it out loud: ${q.phonetic || q.answer}`, '🎵 Listen to the rhythm'],
      kinesthetic: (q) => [`✍️ Write it down`, '💪 Use your hands to trace it'],
      reading: (q) => [`📖 Read carefully: ${q.question}`, '📝 Break it into parts']
    };
    
    const generator = styleHintGenerators[learningStyle] || styleHintGenerators.reading;
    const styleHints = generator(question);
    
    // Add mistake-specific hints
    const mistakeHints = mistakePatterns
      .filter(m => m.questionType === question.type)
      .slice(-2)
      .map(m => `💡 Remember: ${m.correction}`);
    
    return [...styleHints, ...mistakeHints, question.hint].filter(Boolean);
  }
  
  calculateTimeLimit(profile, difficulty) {
    const baseTimes = { 1: 45, 2: 40, 3: 35, 4: 30, 5: 25, 6: 20 };
    const baseTime = baseTimes[difficulty] || 30;
    
    // Adjust for user's attention span
    const attentionFactor = profile.attentionSpan / 10;
    
    // Adjust for learning style
    const styleFactor = profile.learningStyle === 'kinesthetic' ? 0.9 : 1.0;
    
    return Math.round(baseTime * attentionFactor * styleFactor);
  }
  
  // ==================== CONTENT PERSONALIZATION ====================
  
  generatePersonalizedContent(userId, contentType) {
    const profile = this.getUserProfile(userId);
    const style = this.learningStyles[profile.learningStyle] || this.learningStyles.reading;
    
    const contentGenerators = {
      greeting: () => this.generateGreeting(profile),
      encouragement: () => this.generateEncouragement(profile),
      instruction: (task) => this.generateInstruction(task, style),
      feedback: (result) => this.generateFeedback(result, profile),
      story: () => this.generatePersonalizedStory(profile),
      poem: () => this.generatePersonalizedPoem(profile)
    };
    
    const generator = contentGenerators[contentType];
    return generator ? generator() : null;
  }
  
  generateGreeting(profile) {
    const timeOfDay = this.getTimeOfDay();
    const streak = profile.patterns.streakHistory.slice(-1)[0] || 0;
    
    const greetings = {
      morning: [
      `Good morning${profile.name ? `, ${profile.name}` : ''}! Ready to learn?`,
        `Rise and shine! Let's make today amazing!`,
        `Morning brain power activated! 🌅`
      ],
      afternoon: [
      `Good afternoon${profile.name ? `, ${profile.name}` : ''}! How's your day?`,
        `Ready for an afternoon of fun learning?`,
        `Let's keep that brain growing! 🌱`
      ],
      evening: [
      `Good evening${profile.name ? `, ${profile.name}` : ''}!`,
        `Perfect time for some learning before bed!`,
        `Let's finish the day strong! 🌟`
      ]
    };
    
    const timeGreetings = greetings[timeOfDay] || greetings.morning;
    
    if (streak > 5) {
      return `🔥 ${streak} day streak! ${timeGreetings[0]} You're on fire!`;
    }
    
    return timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
  }
  
  generateEncouragement(profile) {
    const recentAccuracy = profile.performance.overall.accuracy;
    const improvements = profile.patterns.improvementAreas;
    
    if (recentAccuracy > 0.9) {
      return "Incredible! You're mastering this! 🌟";
    } else if (recentAccuracy > 0.8) {
      return "Excellent work! Keep it up! 💪";
    } else if (improvements.length > 0) {
      const area = improvements[0];
      return `You're getting better at ${area}! Practice makes perfect! 🎯`;
    }
    
    return "Great effort! Every try makes you stronger! 🌱";
  }
  
  generateInstruction(task, learningStyle) {
    const methods = learningStyle.teachingMethods;
    const method = methods[Math.floor(Math.random() * methods.length)];
    
    return `${method}. Now, ${task.toLowerCase()}.`;
  }
  
  generateFeedback(result, profile) {
    const accuracy = result.accuracy || result.correct / result.total;
    const timeBonus = result.timeRemaining > 10;
    
    if (accuracy === 1.0) {
      const praises = [
        '🏆 Perfect! You\'re a champion!',
        '⭐ Flawless victory! Amazing!',
        '🎯 Bullseye! Every answer correct!',
        '💎 Diamond performance!'
      ];
      return praises[Math.floor(Math.random() * praises.length)];
    } else if (accuracy >= 0.8) {
      return timeBonus 
        ? '⚡ Fantastic speed and accuracy! You\'re on fire!' 
        : '👏 Great job! Almost perfect!';
    } else if (accuracy >= 0.6) {
      return '📈 Good progress! Keep practicing!';
    } else {
      const encouragement = this.generateEncouragement(profile);
      return `${encouragement} Let's review and try again! 💪`;
    }
  }
  
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
  
  // ==================== PREDICTIVE ANALYTICS ====================
  
  predictPerformance(userId, gameType, difficulty) {
    const profile = this.getUserProfile(userId);
    const history = profile.performance.byGameType[gameType];
    
    if (!history || history.attempts < 3) {
      return { prediction: 'uncertain', confidence: 0.3 };
    }
    
    // Simple trend analysis
    const recentScores = history.scores.slice(-5);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const trend = recentScores[recentScores.length - 1] - recentScores[0];
    
    let prediction, confidence;
    
    if (trend > 0 && avgRecent > 0.8) {
      prediction = 'excellent';
      confidence = 0.8;
    } else if (trend > 0) {
      prediction = 'improving';
      confidence = 0.7;
    } else if (trend < 0) {
      prediction = 'needs_support';
      confidence = 0.6;
    } else {
      prediction = 'stable';
      confidence = 0.5;
    }
    
    return { prediction, confidence, trend, avgRecent };
  }
  
  recommendNextActivity(userId) {
    const profile = this.getUserProfile(userId);
    const recentGames = profile.history.sessions
      .slice(-5)
      .map(s => s.gameType);
    
    // Find underplayed games
    const allGames = ['memory', 'spelling', 'math', 'colors', 'shapes', 'riddles', 'trivia'];
    const underplayed = allGames.filter(g => !recentGames.includes(g));
    
    // Find games needing improvement
    const needsImprovement = Object.entries(profile.performance.byGameType)
      .filter(([, perf]) => perf.accuracy < 0.7)
      .map(([type]) => type);
    
    // Prioritize
    if (needsImprovement.length > 0) {
      return {
        type: needsImprovement[0],
        reason: 'needs_practice',
        difficulty: this.calculateOptimalDifficulty(userId, needsImprovement[0])
      };
    }
    
    if (underplayed.length > 0) {
      return {
        type: underplayed[0],
        reason: 'variety',
        difficulty: 2
      };
    }
    
    // Default: favorite game
    const favorite = profile.engagement.favoriteGames[0] || 'memory';
    return {
      type: favorite,
      reason: 'favorite',
      difficulty: this.calculateOptimalDifficulty(userId, favorite)
    };
  }
  
  // ==================== PERSISTENCE ====================
  
  loadProfiles() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('aiUserProfiles');
      if (saved) {
        const data = JSON.parse(saved);
        this.userProfiles = new Map(Object.entries(data));
      }
    }
  }
  
  saveProfiles() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = Object.fromEntries(this.userProfiles);
      localStorage.setItem('aiUserProfiles', JSON.stringify(data));
    }
  }
  
  // ==================== SESSION ANALYSIS ====================
  
  analyzeSession(userId, sessionData) {
    const profile = this.getUserProfile(userId);
    
    // Update performance metrics
    for (const result of sessionData.results) {
      const gameType = result.gameType;
      
      if (!profile.performance.byGameType[gameType]) {
        profile.performance.byGameType[gameType] = {
          attempts: 0,
          correct: 0,
          total: 0,
          scores: [],
          avgTime: 0
        };
      }
      
      const gamePerf = profile.performance.byGameType[gameType];
      gamePerf.attempts++;
      gamePerf.correct += result.correct;
      gamePerf.total += result.total;
      gamePerf.scores.push(result.accuracy);
      gamePerf.accuracy = gamePerf.correct / gamePerf.total;
    }
    
    // Detect patterns
    this.detectPatterns(profile, sessionData);
    
    // Update engagement
    profile.engagement.totalSessions++;
    profile.engagement.totalTime += sessionData.duration;
    profile.engagement.lastSession = Date.now();
    
    // Save
    this.updateUserProfile(userId, profile);
    
    // Generate insights
    return this.generateInsights(profile, sessionData);
  }
  
  detectPatterns(profile, sessionData) {
    // Detect mistake patterns
    for (const mistake of sessionData.mistakes) {
      profile.patterns.mistakePatterns.push({
        type: mistake.type,
        questionType: mistake.questionType,
        userAnswer: mistake.userAnswer,
        correctAnswer: mistake.correctAnswer,
        correction: mistake.correction,
        timestamp: Date.now()
      });
    }
    
    // Keep only recent mistakes
    profile.patterns.mistakePatterns = profile.patterns.mistakePatterns.slice(-20);
    
    // Update strength/improvement areas
    for (const [gameType, perf] of Object.entries(profile.performance.byGameType)) {
      if (perf.accuracy > 0.85) {
        if (!profile.patterns.strengthAreas.includes(gameType)) {
          profile.patterns.strengthAreas.push(gameType);
        }
      } else if (perf.accuracy < 0.6) {
        if (!profile.patterns.improvementAreas.includes(gameType)) {
          profile.patterns.improvementAreas.push(gameType);
        }
      }
    }
    
    // Detect best time of day
    const hour = new Date().getHours();
    if (sessionData.accuracy > 0.8) {
      profile.patterns.bestTimeOfDay = hour;
    }
  }
  
  generateInsights(profile, sessionData) {
    const insights = [];
    
    // Performance insight
    const avgAccuracy = sessionData.results.reduce((a, r) => a + r.accuracy, 0) / sessionData.results.length;
    if (avgAccuracy > 0.9) {
      insights.push({
        type: 'achievement',
        message: 'Outstanding performance! Ready for harder challenges!',
        action: 'increase_difficulty'
      });
    }
    
    // Learning style insight
    if (!profile.learningStyle && sessionData.results.length >= 5) {
      const detected = this.detectLearningStyle(profile.id, sessionData);
      if (detected.confidence > 0.6) {
        insights.push({
          type: 'discovery',
          message: `You seem to be a ${this.learningStyles[detected.dominant].name}!`,
          action: 'personalize_content'
        });
      }
    }
    
    // Streak insight
    const currentStreak = sessionData.streak || 0;
    if (currentStreak >= 5) {
      insights.push({
        type: 'streak',
        message: `🔥 ${currentStreak} correct in a row! Amazing!`,
        action: 'celebrate'
      });
    }
    
    // Improvement insight
    const improvedGames = sessionData.results.filter(r => r.improved);
    if (improvedGames.length > 0) {
      insights.push({
        type: 'progress',
        message: `Getting better at ${improvedGames.map(g => g.gameType).join(', ')}!`,
        action: 'continue_practice'
      });
    }
    
    return insights;
  }
}

// Create singleton
const aiEngine = new AIEngine();

export default aiEngine;
export { AIEngine };
