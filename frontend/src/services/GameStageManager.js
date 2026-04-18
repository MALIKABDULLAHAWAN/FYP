/**
 * DYNAMIC GAME STAGE MANAGER
 * Manages progressive game stages, difficulty scaling, and adaptive learning
 */

class GameStageManager {
  constructor() {
    // Stage definitions with progressive difficulty
    this.stages = {
      // Stage 1: Discovery (Easy)
      discovery: {
        id: 'discovery',
        name: 'Discovery',
        emoji: '🌱',
        description: 'Learn the basics with guided help',
        difficulty: 'easy',
        minScore: 0,
        timeLimit: null,
        hints: true,
        powerUps: false,
        multiplier: 1,
        unlockRequirement: null,
        visualStyle: 'colorful',
        feedback: 'encouraging',
        games: ['memory', 'colors', 'shapes', 'animalSounds']
      },
      
      // Stage 2: Explorer (Easy-Medium)
      explorer: {
        id: 'explorer',
        name: 'Explorer',
        emoji: '🌿',
        description: 'Explore new challenges with occasional hints',
        difficulty: 'easy-medium',
        minScore: 50,
        timeLimit: 45,
        hints: true,
        hintsDelay: 10,
        powerUps: true,
        powerUpsTypes: ['hint', 'extraTime'],
        multiplier: 1.5,
        unlockRequirement: { stage: 'discovery', score: 50 },
        visualStyle: 'adventure',
        feedback: 'positive',
        games: ['memory', 'colors', 'shapes', 'spelling', 'math']
      },
      
      // Stage 3: Apprentice (Medium)
      apprentice: {
        id: 'apprentice',
        name: 'Apprentice',
        emoji: '🌲',
        description: 'Apply your skills with limited hints',
        difficulty: 'medium',
        minScore: 150,
        timeLimit: 30,
        hints: true,
        hintsDelay: 15,
        powerUps: true,
        powerUpsTypes: ['hint', 'extraTime', 'skip'],
        multiplier: 2,
        unlockRequirement: { stage: 'explorer', score: 100 },
        visualStyle: 'focused',
        feedback: 'constructive',
        games: ['memory', 'spelling', 'math', 'patterns', 'riddles', 'trivia']
      },
      
      // Stage 4: Challenger (Medium-Hard)
      challenger: {
        id: 'challenger',
        name: 'Challenger',
        emoji: '⭐',
        description: 'Test your knowledge under pressure',
        difficulty: 'medium-hard',
        minScore: 300,
        timeLimit: 25,
        hints: false,
        powerUps: true,
        powerUpsTypes: ['hint', 'extraTime', 'skip', 'doublePoints'],
        multiplier: 2.5,
        unlockRequirement: { stage: 'apprentice', score: 200 },
        visualStyle: 'intense',
        feedback: 'challenging',
        games: ['spelling', 'math', 'riddles', 'trivia', 'wordScramble', 'memory']
      },
      
      // Stage 5: Master (Hard)
      master: {
        id: 'master',
        name: 'Master',
        emoji: '🏆',
        description: 'Master level challenges with no hints',
        difficulty: 'hard',
        minScore: 500,
        timeLimit: 20,
        hints: false,
        powerUps: true,
        powerUpsTypes: ['extraTime', 'skip', 'doublePoints', 'shield'],
        multiplier: 3,
        unlockRequirement: { stage: 'challenger', score: 350 },
        visualStyle: 'epic',
        feedback: 'masterful',
        games: ['riddles', 'math', 'trivia', 'wordScramble', 'patterns']
      },
      
      // Stage 6: Legend (Expert)
      legend: {
        id: 'legend',
        name: 'Legend',
        emoji: '👑',
        description: 'Ultimate challenges for legends only',
        difficulty: 'expert',
        minScore: 800,
        timeLimit: 15,
        hints: false,
        powerUps: false,
        multiplier: 5,
        unlockRequirement: { stage: 'master', score: 600 },
        visualStyle: 'legendary',
        feedback: 'legendary',
        games: ['riddles', 'math', 'trivia', 'wordScramble']
      }
    };
    
    // Power-up definitions
    this.powerUps = {
      hint: {
        id: 'hint',
        name: 'Hint',
        emoji: '💡',
        description: 'Get a helpful hint',
        cost: 10,
        cooldown: 5,
        duration: null,
        effect: 'showHint'
      },
      extraTime: {
        id: 'extraTime',
        name: 'Extra Time',
        emoji: '⏱️',
        description: 'Add 10 seconds to the timer',
        cost: 15,
        cooldown: 0,
        duration: null,
        effect: 'addTime',
        value: 10
      },
      skip: {
        id: 'skip',
        name: 'Skip',
        emoji: '⏭️',
        description: 'Skip this question',
        cost: 20,
        cooldown: 10,
        duration: null,
        effect: 'skipQuestion'
      },
      doublePoints: {
        id: 'doublePoints',
        name: 'Double Points',
        emoji: '2️⃣',
        description: 'Double points for next 3 questions',
        cost: 25,
        cooldown: 15,
        duration: 3,
        effect: 'doublePoints'
      },
      shield: {
        id: 'shield',
        name: 'Shield',
        emoji: '🛡️',
        description: 'Protect your streak from one wrong answer',
        cost: 30,
        cooldown: 20,
        duration: 1,
        effect: 'protectStreak'
      },
      freeze: {
        id: 'freeze',
        name: 'Freeze Time',
        emoji: '❄️',
        description: 'Pause timer for 5 seconds',
        cost: 35,
        cooldown: 25,
        duration: 5,
        effect: 'freezeTime'
      }
    };
    
    // Achievement milestones per stage
    this.achievements = {
      discovery: [
        { id: 'first_step', name: 'First Step', desc: 'Complete your first game', icon: '🌱' },
        { id: 'explorer_badge', name: 'Explorer Badge', desc: 'Score 50 points in Discovery', icon: '🔍' }
      ],
      explorer: [
        { id: 'adventurer', name: 'Adventurer', desc: 'Complete 5 games in Explorer', icon: '🎒' },
        { id: 'hint_master', name: 'Hint Master', desc: 'Complete a game using no hints', icon: '🧠' }
      ],
      apprentice: [
        { id: 'skilled', name: 'Skilled Learner', desc: 'Maintain a 5-streak in Apprentice', icon: '📚' },
        { id: 'time_keeper', name: 'Time Keeper', desc: 'Complete 3 games before timer ends', icon: '⏰' }
      ],
      challenger: [
        { id: 'challenge_accepted', name: 'Challenge Accepted', desc: 'Unlock Challenger stage', icon: '🎯' },
        { id: 'speed_demon', name: 'Speed Demon', desc: 'Answer 10 questions in under 20 seconds', icon: '⚡' }
      ],
      master: [
        { id: 'master_mind', name: 'Master Mind', desc: 'Complete Master stage with 90% accuracy', icon: '🏆' },
        { id: 'perfect_run', name: 'Perfect Run', desc: 'Complete a game with no wrong answers', icon: '💎' }
      ],
      legend: [
        { id: 'legendary', name: 'Legendary Status', desc: 'Complete Legend stage', icon: '👑' },
        { id: 'unstoppable', name: 'Unstoppable', desc: 'Score 1000+ total points', icon: '🌟' }
      ]
    };
    
    // User progress tracking
    this.userProgress = this.loadProgress();
  }
  
  // ==================== STAGE MANAGEMENT ====================
  
  getStage(stageId) {
    return this.stages[stageId] || this.stages.discovery;
  }
  
  getAllStages() {
    return Object.values(this.stages);
  }
  
  getCurrentStage(userScore = 0) {
    // Determine current stage based on user score
    const stageOrder = ['discovery', 'explorer', 'apprentice', 'challenger', 'master', 'legend'];
    
    for (let i = stageOrder.length - 1; i >= 0; i--) {
      const stage = this.stages[stageOrder[i]];
      if (userScore >= stage.minScore) {
        return stage;
      }
    }
    
    return this.stages.discovery;
  }
  
  isStageUnlocked(stageId, userProgress) {
    const stage = this.stages[stageId];
    if (!stage.unlockRequirement) return true;
    
    const req = stage.unlockRequirement;
    const prevStageProgress = userProgress.stages[req.stage];
    
    return prevStageProgress && prevStageProgress.totalScore >= req.score;
  }
  
  getNextStage(currentStageId) {
    const stageOrder = ['discovery', 'explorer', 'apprentice', 'challenger', 'master', 'legend'];
    const currentIndex = stageOrder.indexOf(currentStageId);
    
    if (currentIndex < stageOrder.length - 1) {
      return this.stages[stageOrder[currentIndex + 1]];
    }
    
    return null;
  }
  
  getStageProgress(stageId, userProgress) {
    return userProgress.stages[stageId] || {
      totalScore: 0,
      gamesCompleted: 0,
      accuracy: 0,
      bestStreak: 0,
      achievements: [],
      unlocked: this.isStageUnlocked(stageId, userProgress)
    };
  }
  
  // ==================== DIFFICULTY SCALING ====================
  
  calculateDifficulty(stageId, userPerformance) {
    const stage = this.getStage(stageId);
    const baseDifficulty = stage.difficulty;
    
    // Adjust based on user performance
    const accuracy = userPerformance.accuracy || 0.5;
    const avgTime = userPerformance.avgTime || 30;
    const streak = userPerformance.bestStreak || 0;
    
    let adjustment = 0;
    
    // High accuracy = increase difficulty
    if (accuracy > 0.9) adjustment += 1;
    else if (accuracy > 0.8) adjustment += 0.5;
    else if (accuracy < 0.5) adjustment -= 0.5;
    
    // Fast completion = increase difficulty
    if (avgTime < 10) adjustment += 0.5;
    else if (avgTime > 30) adjustment -= 0.5;
    
    // High streak = increase difficulty
    if (streak > 10) adjustment += 0.5;
    
    return {
      base: baseDifficulty,
      adjustment,
      final: Math.max(1, Math.min(10, this.difficultyToNumber(baseDifficulty) + adjustment))
    };
  }
  
  difficultyToNumber(difficulty) {
    const mapping = {
      'easy': 1,
      'easy-medium': 2,
      'medium': 3,
      'medium-hard': 4,
      'hard': 5,
      'expert': 6
    };
    return mapping[difficulty] || 3;
  }
  
  // ==================== POWER-UPS ====================
  
  getAvailablePowerUps(stageId, userPoints = 0) {
    const stage = this.getStage(stageId);
    const availableTypes = stage.powerUpsTypes || [];
    
    return availableTypes
      .map(type => this.powerUps[type])
      .filter(p => p && p.cost <= userPoints);
  }
  
  usePowerUp(powerUpId, gameState) {
    const powerUp = this.powerUps[powerUpId];
    if (!powerUp) return { success: false, error: 'Invalid power-up' };
    
    const effect = this.applyPowerUpEffect(powerUp, gameState);
    
    return {
      success: true,
      powerUp,
      effect,
      message: `${powerUp.emoji} ${powerUp.name} activated!`
    };
  }
  
  applyPowerUpEffect(powerUp, gameState) {
    switch (powerUp.effect) {
      case 'showHint':
        return { action: 'show_hint' };
      case 'addTime':
        return { action: 'add_time', value: powerUp.value };
      case 'skipQuestion':
        return { action: 'skip_question' };
      case 'doublePoints':
        return { action: 'activate_multiplier', value: 2, duration: powerUp.duration };
      case 'protectStreak':
        return { action: 'activate_shield', duration: powerUp.duration };
      case 'freezeTime':
        return { action: 'freeze_timer', duration: powerUp.duration };
      default:
        return { action: 'none' };
    }
  }
  
  // ==================== REWARDS & ACHIEVEMENTS ====================
  
  calculateScore(basePoints, stageId, streak = 0, accuracy = 1.0, timeBonus = 0) {
    const stage = this.getStage(stageId);
    
    let score = basePoints * stage.multiplier;
    
    // Streak bonus
    if (streak >= 5) score *= 1.5;
    else if (streak >= 3) score *= 1.25;
    
    // Accuracy bonus
    score *= (0.5 + 0.5 * accuracy);
    
    // Time bonus
    score += timeBonus;
    
    return Math.round(score);
  }
  
  checkAchievements(stageId, gameStats) {
    const stageAchievements = this.achievements[stageId] || [];
    const unlocked = [];
    
    for (const achievement of stageAchievements) {
      if (this.meetsAchievementCriteria(achievement, gameStats)) {
        unlocked.push(achievement);
      }
    }
    
    return unlocked;
  }
  
  meetsAchievementCriteria(achievement, stats) {
    // Criteria checking logic based on achievement type
    switch (achievement.id) {
      case 'first_step':
        return stats.gamesCompleted >= 1;
      case 'explorer_badge':
        return stats.totalScore >= 50;
      case 'adventurer':
        return stats.gamesCompleted >= 5;
      case 'hint_master':
        return stats.hintsUsed === 0 && stats.questionsAnswered >= 5;
      case 'skilled':
        return stats.bestStreak >= 5;
      case 'time_keeper':
        return stats.gamesCompletedOnTime >= 3;
      case 'speed_demon':
        return stats.fastAnswers >= 10;
      case 'master_mind':
        return stats.accuracy >= 0.9;
      case 'perfect_run':
        return stats.wrongAnswers === 0 && stats.questionsAnswered >= 5;
      case 'unstoppable':
        return stats.totalScore >= 1000;
      default:
        return false;
    }
  }
  
  // ==================== PROGRESS PERSISTENCE ====================
  
  loadProgress() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('gameStageProgress');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    
    return {
      currentStage: 'discovery',
      totalScore: 0,
      stages: {},
      achievements: [],
      powerUps: {},
      settings: {
        adaptiveDifficulty: true,
        showHints: true,
        soundEnabled: true
      }
    };
  }
  
  saveProgress() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('gameStageProgress', JSON.stringify(this.userProgress));
    }
  }
  
  updateProgress(stageId, gameResult) {
    // Update stage-specific progress
    if (!this.userProgress.stages[stageId]) {
      this.userProgress.stages[stageId] = {
        totalScore: 0,
        gamesCompleted: 0,
        accuracy: 0,
        bestStreak: 0,
        achievements: []
      };
    }
    
    const stageProgress = this.userProgress.stages[stageId];
    stageProgress.totalScore += gameResult.score;
    stageProgress.gamesCompleted += 1;
    
    // Update running accuracy
    const totalQuestions = (stageProgress.accuracy * (stageProgress.gamesCompleted - 1)) + gameResult.accuracy;
    stageProgress.accuracy = totalQuestions / stageProgress.gamesCompleted;
    
    // Update best streak
    if (gameResult.streak > stageProgress.bestStreak) {
      stageProgress.bestStreak = gameResult.streak;
    }
    
    // Update global score
    this.userProgress.totalScore += gameResult.score;
    
    // Check for new achievements
    const newAchievements = this.checkAchievements(stageId, gameResult);
    stageProgress.achievements.push(...newAchievements);
    this.userProgress.achievements.push(...newAchievements);
    
    // Check for stage unlock
    const nextStage = this.getNextStage(stageId);
    if (nextStage && !this.isStageUnlocked(nextStage.id, this.userProgress)) {
      if (this.isStageUnlocked(nextStage.id, this.userProgress)) {
        this.userProgress.currentStage = nextStage.id;
      }
    }
    
    this.saveProgress();
    
    return {
      stageProgress,
      newAchievements,
      unlockedStage: nextStage?.id,
      totalScore: this.userProgress.totalScore
    };
  }
  
  // ==================== DYNAMIC CONTENT ====================
  
  generateDynamicQuestion(gameType, stageId, userHistory = []) {
    const stage = this.getStage(stageId);
    const difficulty = this.difficultyToNumber(stage.difficulty);
    
    // Use user history to avoid repetition
    const recentQuestions = userHistory.slice(-20);
    
    return {
      gameType,
      difficulty: stage.difficulty,
      timeLimit: stage.timeLimit,
      hints: stage.hints,
      powerUps: stage.powerUps,
      visualStyle: stage.visualStyle,
      feedback: stage.feedback
    };
  }
  
  getRecommendedGames(stageId, userPerformance) {
    const stage = this.getStage(stageId);
    const allGames = stage.games || [];
    
    // Sort by user performance in each game type
    return allGames.sort((a, b) => {
      const perfA = userPerformance[a] || { accuracy: 0.5, enjoyment: 0.5 };
      const perfB = userPerformance[b] || { accuracy: 0.5, enjoyment: 0.5 };
      
      // Recommend games where user has medium accuracy (50-80%)
      const scoreA = Math.abs(0.65 - perfA.accuracy);
      const scoreB = Math.abs(0.65 - perfB.accuracy);
      
      return scoreA - scoreB;
    });
  }
}

// Create singleton instance
const gameStageManager = new GameStageManager();

export default gameStageManager;
export { GameStageManager };
