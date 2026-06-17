/**
 * AchievementSystem Service
 * 
 * Tracks and awards achievements for children:
 * - Game-specific achievements (Memory Match, JA, etc.)
 * - Streak tracking
 * - Milestone rewards
 * - Badge collection
 * - Progress persistence
 */

import unifiedErrorHandler from './ErrorHandlers/index.js';

const ACHIEVEMENTS = {
  // Memory Match Achievements
  memory_match: {
    first_match: {
      id: 'first_match',
      name: 'First Match!',
      description: 'Match your first pair of cards',
      icon: 'cards',
      color: '#4ECDC4',
      condition: (stats) => stats.matches >= 1,
    },
    memory_master: {
      id: 'memory_master',
      name: 'Memory Master',
      description: 'Complete 10 Memory Match boards',
      icon: 'brain',
      color: '#FF6B6B',
      condition: (stats) => stats.boardsCompleted >= 10,
    },
    perfect_board: {
      id: 'perfect_board',
      name: 'Perfect Board',
      description: 'Complete a board without any mistakes',
      icon: 'star',
      color: '#FFD93D',
      condition: (stats) => stats.perfectBoards >= 1,
    },
    speed_demon: {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Complete a board in under 30 seconds',
      icon: 'rocket',
      color: '#FF6B9D',
      condition: (stats) => stats.fastCompletions >= 1,
    },
  },
  
  // Joint Attention Achievements
  ja: {
    first_response: {
      id: 'first_response',
      name: 'First Response',
      description: 'Correctly respond to your first prompt',
      icon: 'eye',
      color: '#4ECDC4',
      condition: (stats) => stats.correctResponses >= 1,
    },
    attention_champion: {
      id: 'attention_champion',
      name: 'Attention Champion',
      description: 'Get 20 correct responses in a row',
      icon: 'trophy',
      color: '#FFD93D',
      condition: (stats) => stats.bestStreak >= 20,
    },
    quick_learner: {
      id: 'quick_learner',
      name: 'Quick Learner',
      description: 'Reach level 3 in Joint Attention',
      icon: 'chart',
      color: '#6BCF7F',
      condition: (stats) => stats.maxLevel >= 3,
    },
  },
  
  // General Achievements
  general: {
    first_session: {
      id: 'first_session',
      name: 'First Steps',
      description: 'Complete your first activity adventure',
      icon: 'footprints',
      color: '#A8E6CF',
      condition: (stats) => stats.totalSessions >= 1,
    },
    dedicated_learner: {
      id: 'dedicated_learner',
      name: 'Dedicated Learner',
      description: 'Complete 5 sessions in one day',
      icon: 'calendar',
      color: '#FF8B94',
      condition: (stats) => stats.dailySessions >= 5,
    },
    week_warrior: {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Practice 7 days in a row',
      icon: 'fire',
      color: '#FF6B6B',
      condition: (stats) => stats.streakDays >= 7,
    },
    game_explorer: {
      id: 'game_explorer',
      name: 'Game Explorer',
      description: 'Try all 4 fun games',
      icon: 'compass',
      color: '#95E1D3',
      condition: (stats) => stats.gamesPlayed >= 4,
    },
    accuracy_star: {
      id: 'accuracy_star',
      name: 'Accuracy Star',
      description: 'Achieve 90% accuracy in any game',
      icon: 'target',
      color: '#FFD93D',
      condition: (stats) => stats.bestAccuracy >= 0.9,
    },
  },
};

const REWARDS = {
  stickers: [
    { id: 'star', name: 'Gold Star', icon: 'star', color: '#FFD700' },
    { id: 'heart', name: 'Heart', icon: 'heart', color: '#FF6B6B' },
    { id: 'smile', name: 'Smiley', icon: 'smile', color: '#FFD93D' },
    { id: 'trophy', name: 'Trophy', icon: 'trophy', color: '#FF8C00' },
    { id: 'medal', name: 'Medal', icon: 'medal', color: '#C0C0C0' },
    { id: 'diamond', name: 'Diamond', icon: 'gem', color: '#00CED1' },
    { id: 'rocket', name: 'Rocket', icon: 'rocket', color: '#FF6B9D' },
    { id: 'crown', name: 'Crown', icon: 'crown', color: '#FFD700' },
  ],
  
  themes: [
    { id: 'default', name: 'Classic', unlocked: true },
    { id: 'ocean', name: 'Ocean', unlocked: false, requirement: { type: 'sessions', count: 5 } },
    { id: 'forest', name: 'Forest', unlocked: false, requirement: { type: 'achievements', count: 5 } },
    { id: 'space', name: 'Space', unlocked: false, requirement: { type: 'streak', count: 7 } },
    { id: 'rainbow', name: 'Rainbow', unlocked: false, requirement: { type: 'perfect', count: 3 } },
  ],
};

class AchievementSystem {
  constructor() {
    this.achievements = new Map();
    this.stats = {
      totalSessions: 0,
      dailySessions: 0,
      streakDays: 0,
      gamesPlayed: new Set(),
      bestAccuracy: 0,
      gameStats: {},
    };
    this.earnedAchievements = new Set();
    this.stickers = [];
    this.unlockedThemes = ['default'];
    this.loadProgress();
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('dhyan_achievements');
      if (saved) {
        const data = JSON.parse(saved);
        this.earnedAchievements = new Set(data.earnedAchievements || []);
        this.stickers = data.stickers || [];
        this.stats = { ...this.stats, ...data.stats };
        this.unlockedThemes = data.unlockedThemes || ['default'];
      }
    } catch (e) {
      console.warn('Failed to load achievement progress:', e);
    }
  }

  saveProgress() {
    try {
      const data = {
        earnedAchievements: Array.from(this.earnedAchievements),
        stickers: this.stickers,
        stats: this.stats,
        unlockedThemes: this.unlockedThemes,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem('dhyan_achievements', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save achievement progress:', e);
    }
  }

  // Update game-specific stats and check for achievements
  updateGameStats(gameType, sessionData) {
    if (!this.stats.gameStats[gameType]) {
      this.stats.gameStats[gameType] = this.getInitialGameStats(gameType);
    }
    
    const stats = this.stats.gameStats[gameType];
    
    // Update based on game type
    switch (gameType) {
      case 'memory_match':
        this.updateMemoryMatchStats(stats, sessionData);
        break;
      case 'ja':
        this.updateJAStats(stats, sessionData);
        break;
    }
    
    // Update general stats
    this.stats.totalSessions++;
    this.stats.gamesPlayed.add(gameType);
    
    // Check for new achievements
    const newAchievements = this.checkAchievements(gameType);
    
    // Save progress
    this.saveProgress();
    
    return newAchievements;
  }

  getInitialGameStats(gameType) {
    const defaults = {
      memory_match: {
        matches: 0,
        boardsCompleted: 0,
        perfectBoards: 0,
        fastCompletions: 0,
        totalMoves: 0,
        bestTime: Infinity,
      },
      ja: {
        correctResponses: 0,
        totalResponses: 0,
        currentStreak: 0,
        bestStreak: 0,
        maxLevel: 1,
      },
    };
    return defaults[gameType] || {};
  }

  updateMemoryMatchStats(stats, data) {
    stats.matches += data.matches || 0;
    stats.boardsCompleted++;
    stats.totalMoves += data.moves || 0;
    
    if (data.moves === data.pairs * 2) {
      stats.perfectBoards++;
    }
    
    if (data.timeSeconds && data.timeSeconds < 30) {
      stats.fastCompletions++;
    }
    
    if (data.timeSeconds && data.timeSeconds < stats.bestTime) {
      stats.bestTime = data.timeSeconds;
    }
  }

  updateJAStats(stats, data) {
    if (data.correct) {
      stats.correctResponses++;
      stats.currentStreak++;
      if (stats.currentStreak > stats.bestStreak) {
        stats.bestStreak = stats.currentStreak;
      }
    } else {
      stats.currentStreak = 0;
    }
    stats.totalResponses++;
    
    if (data.level && data.level > stats.maxLevel) {
      stats.maxLevel = data.level;
    }
  }

  checkAchievements(gameType) {
    const newAchievements = [];
    
    // Check game-specific achievements
    if (ACHIEVEMENTS[gameType]) {
      Object.values(ACHIEVEMENTS[gameType]).forEach(achievement => {
        if (!this.earnedAchievements.has(achievement.id)) {
          const stats = this.stats.gameStats[gameType] || {};
          if (achievement.condition(stats)) {
            this.earnedAchievements.add(achievement.id);
            newAchievements.push(achievement);
            this.awardReward(achievement);
          }
        }
      });
    }
    
    // Check general achievements
    Object.values(ACHIEVEMENTS.general).forEach(achievement => {
      if (!this.earnedAchievements.has(achievement.id)) {
        if (achievement.condition(this.stats)) {
          this.earnedAchievements.add(achievement.id);
          newAchievements.push(achievement);
          this.awardReward(achievement);
        }
      }
    });
    
    return newAchievements;
  }

  awardReward(achievement) {
    // Award a random sticker
    const randomSticker = REWARDS.stickers[Math.floor(Math.random() * REWARDS.stickers.length)];
    this.stickers.push({
      ...randomSticker,
      earnedAt: new Date().toISOString(),
      fromAchievement: achievement.id,
    });
    
    // Check for theme unlocks
    REWARDS.themes.forEach(theme => {
      if (!this.unlockedThemes.includes(theme.id) && theme.requirement) {
        const { type, count } = theme.requirement;
        let meetsRequirement = false;
        
        switch (type) {
          case 'sessions':
            meetsRequirement = this.stats.totalSessions >= count;
            break;
          case 'achievements':
            meetsRequirement = this.earnedAchievements.size >= count;
            break;
          case 'streak':
            meetsRequirement = this.stats.streakDays >= count;
            break;
          case 'perfect':
            // Check perfect boards across all memory match games
            const mmStats = this.stats.gameStats.memory_match || {};
            meetsRequirement = mmStats.perfectBoards >= count;
            break;
        }
        
        if (meetsRequirement) {
          this.unlockedThemes.push(theme.id);
        }
      }
    });
  }

  getProgress() {
    return {
      totalAchievements: Object.values(ACHIEVEMENTS).reduce(
        (sum, cat) => sum + Object.keys(cat).length, 0
      ),
      earnedCount: this.earnedAchievements.size,
      earnedAchievements: Array.from(this.earnedAchievements).map(id =>
        this.findAchievementById(id)
      ).filter(Boolean),
      stickers: this.stickers,
      unlockedThemes: this.unlockedThemes,
      allThemes: REWARDS.themes,
      stats: this.stats,
      nextRewards: this.getNextRewards(),
    };
  }

  findAchievementById(id) {
    for (const category of Object.values(ACHIEVEMENTS)) {
      if (category[id]) return category[id];
    }
    return null;
  }

  getNextRewards() {
    const next = [];
    
    REWARDS.themes.forEach(theme => {
      if (!this.unlockedThemes.includes(theme.id) && theme.requirement) {
        const { type, count } = theme.requirement;
        let current = 0;
        
        switch (type) {
          case 'sessions':
            current = this.stats.totalSessions;
            break;
          case 'achievements':
            current = this.earnedAchievements.size;
            break;
          case 'streak':
            current = this.stats.streakDays;
            break;
          case 'perfect':
            const mmStats = this.stats.gameStats.memory_match || {};
            current = mmStats.perfectBoards || 0;
            break;
        }
        
        next.push({
          type: 'theme',
          name: theme.name,
          progress: current,
          required: count,
          percentage: Math.min(100, (current / count) * 100),
        });
      }
    });
    
    return next.slice(0, 3); // Return top 3 closest rewards
  }

  reset() {
    this.earnedAchievements.clear();
    this.stickers = [];
    this.stats = {
      totalSessions: 0,
      dailySessions: 0,
      streakDays: 0,
      gamesPlayed: new Set(),
      bestAccuracy: 0,
      gameStats: {},
    };
    this.unlockedThemes = ['default'];
    this.saveProgress();
  }

  // Daily streak tracking
  recordDailySession() {
    const today = new Date().toDateString();
    const lastSession = localStorage.getItem('dhyan_last_session_date');
    
    if (lastSession !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastSession === yesterday.toDateString()) {
        this.stats.streakDays++;
      } else if (lastSession !== today) {
        this.stats.streakDays = 1;
      }
      
      localStorage.setItem('dhyan_last_session_date', today);
      this.stats.dailySessions = 1;
    } else {
      this.stats.dailySessions++;
    }
    
    this.saveProgress();
  }
}

// Export singleton
const achievementSystem = new AchievementSystem();

export default achievementSystem;
export { ACHIEVEMENTS, REWARDS };
