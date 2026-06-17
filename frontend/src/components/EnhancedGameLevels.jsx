/**
 * ENHANCED GAME LEVELS COMPONENT
 * 12 Progressive Levels with unlockable content
 */

import React, { useState, useEffect } from 'react';
import './EnhancedGameLevels.css';

const LEVELS = [
  {
    id: 1,
    name: 'Seedling',
    emoji: '🌱',
    color: '#4ade80',
    minScore: 0,
    description: 'Just getting started!',
    rewards: ['Basic Avatar'],
    games: ['memory', 'colors'],
    difficulty: 'very_easy',
    hints: 'always'
  },
  {
    id: 2,
    name: 'Sprout',
    emoji: '🌿',
    color: '#22c55e',
    minScore: 50,
    description: 'Growing stronger every day',
    rewards: ['Color Badge', 'Hint Power-up'],
    games: ['memory', 'colors', 'shapes'],
    difficulty: 'easy',
    hints: 'always'
  },
  {
    id: 3,
    name: 'Bud',
    emoji: '🌷',
    color: '#f472b6',
    minScore: 150,
    description: 'Ready to bloom!',
    rewards: ['Flower Badge', 'Time Bonus'],
    games: ['memory', 'colors', 'shapes', 'spelling'],
    difficulty: 'easy',
    hints: 'often'
  },
  {
    id: 4,
    name: 'Explorer',
    emoji: '🔍',
    color: '#60a5fa',
    minScore: 300,
    description: 'Discovering new worlds',
    rewards: ['Explorer Hat', 'Skip Power-up'],
    games: ['memory', 'spelling', 'math', 'animalSounds'],
    difficulty: 'medium',
    hints: 'often'
  },
  {
    id: 5,
    name: 'Adventurer',
    emoji: '🎒',
    color: '#818cf8',
    minScore: 500,
    description: 'Adventures await!',
    rewards: ['Backpack', 'Double Points'],
    games: ['memory', 'spelling', 'math', 'riddles'],
    difficulty: 'medium',
    hints: 'sometimes'
  },
  {
    id: 6,
    name: 'Learner',
    emoji: '📚',
    color: '#a78bfa',
    minScore: 750,
    description: 'Knowledge is power',
    rewards: ['Book Badge', 'Shield Power-up'],
    games: ['spelling', 'math', 'riddles', 'trivia'],
    difficulty: 'medium',
    hints: 'sometimes'
  },
  {
    id: 7,
    name: 'Challenger',
    emoji: '⭐',
    color: '#fbbf24',
    minScore: 1000,
    description: 'Taking on challenges',
    rewards: ['Star Crown', 'Freeze Time'],
    games: ['math', 'riddles', 'trivia', 'patterns'],
    difficulty: 'hard',
    hints: 'rarely'
  },
  {
    id: 8,
    name: 'Warrior',
    emoji: '⚔️',
    color: '#f87171',
    minScore: 1300,
    description: 'Fighting for success',
    rewards: ['Warrior Shield', 'All Power-ups'],
    games: ['riddles', 'trivia', 'patterns', 'wordScramble'],
    difficulty: 'hard',
    hints: 'rarely'
  },
  {
    id: 9,
    name: 'Scholar',
    emoji: '🎓',
    color: '#34d399',
    minScore: 1700,
    description: 'Wise and knowledgeable',
    rewards: ['Graduation Cap', 'Expert Mode'],
    games: ['trivia', 'patterns', 'wordScramble', 'memory_expert'],
    difficulty: 'very_hard',
    hints: 'minimal'
  },
  {
    id: 10,
    name: 'Expert',
    emoji: '🏆',
    color: '#f59e0b',
    minScore: 2200,
    description: 'Master of many skills',
    rewards: ['Trophy', 'Champion Title'],
    games: ['all_games'],
    difficulty: 'expert',
    hints: 'minimal'
  },
  {
    id: 11,
    name: 'Master',
    emoji: '👑',
    color: '#e879f9',
    minScore: 2800,
    description: 'Almost legendary!',
    rewards: ['Crown', 'Golden Theme'],
    games: ['all_games_unlocked'],
    difficulty: 'master',
    hints: 'none'
  },
  {
    id: 12,
    name: 'Legend',
    emoji: '🌟',
    color: '#6366f1',
    minScore: 3500,
    description: 'A true legend!',
    rewards: ['Legend Badge', 'Hall of Fame', 'Creator Avatar'],
    games: ['everything'],
    difficulty: 'legend',
    hints: 'none'
  }
];

const POWER_UPS = [
  { id: 'hint', name: '💡 Hint', cost: 10, description: 'Get a helpful hint' },
  { id: 'time', name: '⏱️ Extra Time', cost: 15, description: 'Add 15 seconds' },
  { id: 'skip', name: '⏭️ Skip', cost: 20, description: 'Skip this question' },
  { id: 'double', name: '2️⃣ Double Points', cost: 25, description: 'Double points next 3 questions' },
  { id: 'shield', name: '🛡️ Shield', cost: 30, description: 'Protect your streak' },
  { id: 'freeze', name: '❄️ Freeze', cost: 35, description: 'Freeze timer for 5s' }
];

export default function EnhancedGameLevels({ userScore = 0, currentLevel: propsLevel, onLevelSelect }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    // Animate score counting
    const interval = setInterval(() => {
      setAnimatedScore(prev => {
        if (prev < userScore) return prev + Math.ceil((userScore - prev) / 10);
        return userScore;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [userScore]);

  const getCurrentLevel = () => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (userScore >= LEVELS[i].minScore) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = LEVELS.find(l => l.minScore > userScore);
  const progressToNext = nextLevel 
    ? ((userScore - currentLevel.minScore) / (nextLevel.minScore - currentLevel.minScore)) * 100
    : 100;

  const isLevelUnlocked = (level) => userScore >= level.minScore;

  return (
    <div className="enhanced-levels-container">
      {/* Header */}
      <div className="levels-header">
        <div className="current-level-badge" style={{ '--level-color': currentLevel.color }}>
          <span className="level-emoji">{currentLevel.emoji}</span>
          <div className="level-info">
            <h2>Level {currentLevel.id}: {currentLevel.name}</h2>
            <p>{currentLevel.description}</p>
          </div>
        </div>

        <div className="score-display">
          <div className="score-circle">
            <span className="score-value">{animatedScore}</span>
            <span className="score-label">Points</span>
          </div>
          {nextLevel && (
            <div className="next-level-info">
              <span>{nextLevel.minScore - userScore} points to {nextLevel.name}</span>
              <div className="progress-bar-mini">
                <div 
                  className="progress-fill-mini" 
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Level Path */}
      <div className="level-path">
        {LEVELS.map((level, index) => {
          const unlocked = isLevelUnlocked(level);
          const isCurrent = level.id === currentLevel.id;
          
          return (
            <div 
              key={level.id}
              className={`level-node ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
              style={{ '--node-color': level.color }}
              onClick={() => unlocked && setSelectedLevel(level)}
            >
              <div className="level-icon">
                <span>{unlocked ? level.emoji : '🔒'}</span>
                {isCurrent && <div className="current-pulse" />}
              </div>
              <div className="level-number">{level.id}</div>
              
              {index < LEVELS.length - 1 && (
                <div className={`level-connector ${unlocked ? 'connected' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Level Details */}
      {selectedLevel && (
        <div className="level-details-panel" style={{ '--panel-color': selectedLevel.color }}>
          <div className="panel-header">
            <span className="panel-emoji">{selectedLevel.emoji}</span>
            <h3>Level {selectedLevel.id}: {selectedLevel.name}</h3>
            <button className="close-btn" onClick={() => setSelectedLevel(null)}>×</button>
          </div>
          
          <p className="panel-description">{selectedLevel.description}</p>
          
          <div className="panel-section">
            <h4>🎁 Rewards</h4>
            <div className="rewards-list">
              {selectedLevel.rewards.map((reward, i) => (
                <span key={i} className="reward-tag">{reward}</span>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h4>🎮 Available Games</h4>
            <div className="games-list">
              {selectedLevel.games.map((game, i) => (
                <span key={i} className="game-tag">{game.replace('_', ' ')}</span>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h4>⚙️ Difficulty</h4>
            <span className={`difficulty-badge ${selectedLevel.difficulty}`}>
              {selectedLevel.difficulty.replace('_', ' ')}
            </span>
          </div>

          {selectedLevel.id === currentLevel.id && (
            <button className="play-btn" onClick={() => onLevelSelect?.(selectedLevel)}>
              🎮 Play Now!
            </button>
          )}
        </div>
      )}

      {/* Power-ups Shop */}
      <div className="powerups-section">
        <h3>⚡ Power-ups Shop</h3>
        <div className="powerups-grid">
          {POWER_UPS.map(powerup => (
            <div key={powerup.id} className="powerup-card">
              <span className="powerup-icon">{powerup.name}</span>
              <p className="powerup-desc">{powerup.description}</p>
              <span className="powerup-cost">{powerup.cost} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak Bonus */}
      <div className="streak-bonus">
        <h3>🔥 Streak Bonus</h3>
        <div className="streak-days">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <div key={day} className={`streak-day ${day <= 3 ? 'completed' : ''}`}>
              <span className="day-number">{day}</span>
              <span className="day-reward">{day * 10} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
