/**
 * GAMES HUB - Optimized Games Page
 * Central hub for all games with 20+ levels
 */

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../hooks/useChild";
import UiIcon from "../components/ui/UiIcon";
import { StickerLayer } from "../components/StickerLayer";
import "./GamesHub.css";

// Lazy load heavy components
const EnhancedGameLevels = lazy(() => import("../components/EnhancedGameLevels"));
const MusicPlayerButton = lazy(() => import("../components/MusicPlayer").then(m => ({ default: m.MusicPlayerButton })));

// 20 GAME LEVELS - Progressive Difficulty
const GAME_LEVELS = [
  { id: 1, name: "Seedling", emoji: "🌱", color: "#4ade80", minScore: 0, maxScore: 50, difficulty: "tutorial", games: ["tutorial"], rewards: ["Welcome Badge"], hints: "unlimited" },
  { id: 2, name: "Sprout", emoji: "🌿", color: "#22c55e", minScore: 50, maxScore: 150, difficulty: "very_easy", games: ["memory", "colors"], rewards: ["Color Badge"], hints: "unlimited" },
  { id: 3, name: "Bud", emoji: "🌷", color: "#f472b6", minScore: 150, maxScore: 300, difficulty: "easy", games: ["memory", "colors", "shapes"], rewards: ["Shape Badge", "Hint Power-up"], hints: "frequent" },
  { id: 4, name: "Explorer", emoji: "🔍", color: "#60a5fa", minScore: 300, maxScore: 500, difficulty: "easy", games: ["memory", "spelling", "animals"], rewards: ["Animal Badge"], hints: "frequent" },
  { id: 5, name: "Adventurer", emoji: "🎒", color: "#818cf8", minScore: 500, maxScore: 750, difficulty: "medium", games: ["memory", "spelling", "math"], rewards: ["Math Badge", "Time Bonus"], hints: "sometimes" },
  { id: 6, name: "Learner", emoji: "📚", color: "#a78bfa", minScore: 750, maxScore: 1000, difficulty: "medium", games: ["spelling", "math", "riddles"], rewards: ["Riddle Badge"], hints: "sometimes" },
  { id: 7, name: "Thinker", emoji: "🤔", color: "#fbbf24", minScore: 1000, maxScore: 1300, difficulty: "medium", games: ["math", "riddles", "patterns"], rewards: ["Pattern Badge"], hints: "sometimes" },
  { id: 8, name: "Solver", emoji: "🧩", color: "#f59e0b", minScore: 1300, maxScore: 1700, difficulty: "hard", games: ["riddles", "patterns", "trivia"], rewards: ["Trivia Badge", "Skip Power-up"], hints: "rarely" },
  { id: 9, name: "Challenger", emoji: "⭐", color: "#f97316", minScore: 1700, maxScore: 2200, difficulty: "hard", games: ["patterns", "trivia", "wordScramble"], rewards: ["Word Master Badge"], hints: "rarely" },
  { id: 10, name: "Warrior", emoji: "⚔️", color: "#ef4444", minScore: 2200, maxScore: 2800, difficulty: "very_hard", games: ["trivia", "wordScramble", "speedMatch"], rewards: ["Speed Badge", "Shield Power-up"], hints: "minimal" },
  { id: 11, name: "Knight", emoji: "🛡️", color: "#dc2626", minScore: 2800, maxScore: 3500, difficulty: "very_hard", games: ["wordScramble", "speedMatch", "sequence"], rewards: ["Sequence Badge"], hints: "minimal" },
  { id: 12, name: "Scholar", emoji: "🎓", color: "#16a34a", minScore: 3500, maxScore: 4300, difficulty: "expert", games: ["speedMatch", "sequence", "memory_expert"], rewards: ["Expert Memory Badge"], hints: "minimal" },
  { id: 13, name: "Expert", emoji: "🏆", color: "#ca8a04", minScore: 4300, maxScore: 5200, difficulty: "expert", games: ["sequence", "memory_expert", "math_expert"], rewards: ["Math Expert Badge", "Double Points"], hints: "none" },
  { id: 14, name: "Master", emoji: "👑", color: "#7c3aed", minScore: 5200, maxScore: 6200, difficulty: "master", games: ["memory_expert", "math_expert", "logic"], rewards: ["Logic Badge"], hints: "none" },
  { id: 15, name: "Grandmaster", emoji: "💎", color: "#2563eb", minScore: 6200, maxScore: 7300, difficulty: "master", games: ["math_expert", "logic", "spatial"], rewards: ["Spatial Badge", "Golden Theme"], hints: "none" },
  { id: 16, name: "Legend", emoji: "🌟", color: "#9333ea", minScore: 7300, maxScore: 8500, difficulty: "legend", games: ["logic", "spatial", "codebreaking"], rewards: ["Code Breaker Badge"], hints: "none" },
  { id: 17, name: "Champion", emoji: "🏅", color: "#db2777", minScore: 8500, maxScore: 9800, difficulty: "legend", games: ["spatial", "codebreaking", "puzzle"], rewards: ["Puzzle Master Badge"], hints: "none" },
  { id: 18, name: "Hero", emoji: "🦸", color: "#059669", minScore: 9800, maxScore: 11200, difficulty: "mythic", games: ["codebreaking", "puzzle", "quest"], rewards: ["Quest Badge", "Platinum Theme"], hints: "none" },
  { id: 19, name: "Guardian", emoji: "🛡️", color: "#0891b2", minScore: 11200, maxScore: 12700, difficulty: "mythic", games: ["puzzle", "quest", "battle"], rewards: ["Guardian Badge"], hints: "none" },
  { id: 20, name: "Mythic", emoji: "🐉", color: "#dc2626", minScore: 12700, maxScore: 15000, difficulty: "mythic", games: ["quest", "battle", "ultimate"], rewards: ["Mythic Badge", "Hall of Fame", "Dragon Avatar"], hints: "none" }
];

// Game cards configuration
const GAME_CARDS = [
  { id: "memory", name: "Memory Match", icon: "brain", color: "#ff6b9d", desc: "Match pairs and train your brain!", path: "/games/memory-match" },
  { id: "spelling", name: "Spelling Bee", icon: "abc", color: "#c44569", desc: "Learn words and spell them right!", path: "/games/spelling" },
  { id: "math", name: "Math Magic", icon: "123", color: "#f8b500", desc: "Numbers are fun - solve puzzles!", path: "/games/math" },
  { id: "colors", name: "Color Splash", icon: "palette", color: "#20bf6b", desc: "Learn colors and paint!", path: "/games/colors" },
  { id: "shapes", name: "Shape World", icon: "shapes", color: "#4b7bec", desc: "Discover shapes everywhere!", path: "/games/shapes" },
  { id: "riddles", name: "Riddle Master", icon: "question", color: "#a55eea", desc: "Solve brain teasers!", path: "/games/riddles" },
  { id: "trivia", name: "Trivia Champ", icon: "star", color: "#26de81", desc: "Test your knowledge!", path: "/games/trivia" },
  { id: "animals", name: "Animal Sounds", icon: "pet", color: "#fd9644", desc: "Meet animal friends!", path: "/games/animals" },
  { id: "patterns", name: "Pattern Power", icon: "grid", color: "#778ca3", desc: "Find the pattern!", path: "/games/patterns" }
];

// Power-ups
const POWER_UPS = [
  { id: "hint", name: "💡 Hint", cost: 10, desc: "Get a helpful hint", icon: "bulb" },
  { id: "time", name: "⏱️ Extra Time", cost: 15, desc: "Add 15 seconds", icon: "clock" },
  { id: "skip", name: "⏭️ Skip", cost: 20, desc: "Skip this question", icon: "next" },
  { id: "double", name: "2️⃣ Double", cost: 25, desc: "Double points (3x)", icon: "multiplier" },
  { id: "shield", name: "🛡️ Shield", cost: 30, desc: "Protect streak", icon: "shield" },
  { id: "freeze", name: "❄️ Freeze", cost: 35, desc: "Freeze 5 seconds", icon: "snow" }
];

export default function GamesHub() {
  const navigate = useNavigate();
  const { activeChild } = useChild();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [userScore, setUserScore] = useState(0);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showLevels, setShowLevels] = useState(false);
  const [streak, setStreak] = useState(3);

  // Get current level data
  const levelData = GAME_LEVELS.find(l => l.id === currentLevel) || GAME_LEVELS[0];
  const nextLevel = GAME_LEVELS.find(l => l.id === currentLevel + 1);

  const handlePlayGame = (game) => {
    if (game.path) {
      navigate(game.path);
    }
  };

  const handleLevelClick = (level) => {
    if (userScore >= level.minScore) {
      setCurrentLevel(level.id);
      setShowLevels(false);
    }
  };

  return (
    <div className="games-hub">
      <StickerLayer pageType="games" sessionCount={streak} visible={true} />
      
      {/* Header */}
      <div className="games-hub-header">
        <div className="level-badge-large" style={{ background: levelData.color }}>
          <span className="level-emoji-large">{levelData.emoji}</span>
          <div className="level-info">
            <h1>Level {currentLevel}: {levelData.name}</h1>
            <p>{levelData.difficulty.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>

        <div className="score-stats">
          <div className="stat-card">
            <span className="stat-value">{userScore}</span>
            <span className="stat-label">Points</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{streak}</span>
            <span className="stat-label">Day Streak</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{POWER_UPS.length}</span>
            <span className="stat-label">Power-ups</span>
          </div>
        </div>

        <button 
          className="btn-levels-toggle"
          onClick={() => setShowLevels(!showLevels)}
        >
          {showLevels ? "Hide" : "Show"} All Levels
        </button>
      </div>

      {/* Level Progression Map */}
      {showLevels && (
        <div className="level-map">
          <h2>🗺️ Level Map - 20 Stages</h2>
          <div className="level-path">
            {GAME_LEVELS.map((level, index) => {
              const unlocked = userScore >= level.minScore;
              const isCurrent = level.id === currentLevel;
              
              return (
                <div
                  key={level.id}
                  className={`level-node ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
                  style={{ '--level-color': level.color }}
                  onClick={() => handleLevelClick(level)}
                >
                  <div className="level-icon">
                    {unlocked ? level.emoji : '🔒'}
                    {isCurrent && <div className="current-ring" />}
                  </div>
                  <span className="level-num">{level.id}</span>
                  {index < GAME_LEVELS.length - 1 && <div className="connector" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Games Grid */}
      <div className="games-section">
        <h2>🎮 Available Games</h2>
        <div className="games-grid">
          {GAME_CARDS.filter(g => levelData.games.includes(g.id) || levelData.games.includes('all')).map(game => (
            <div 
              key={game.id}
              className="game-card"
              style={{ '--game-color': game.color }}
              onClick={() => handlePlayGame(game)}
            >
              <div className="game-icon-wrapper" style={{ background: game.color }}>
                <UiIcon name={game.icon} size={32} />
              </div>
              <h3>{game.name}</h3>
              <p>{game.desc}</p>
              <button className="btn-play">Play Now</button>
            </div>
          ))}
        </div>
      </div>

      {/* Power-ups */}
      <div className="powerups-section">
        <h2>⚡ Power-ups Shop</h2>
        <div className="powerups-grid">
          {POWER_UPS.map(powerup => (
            <div key={powerup.id} className="powerup-card">
              <span className="powerup-name">{powerup.name}</span>
              <p className="powerup-desc">{powerup.desc}</p>
              <span className="powerup-cost">{powerup.cost} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="challenges-section">
        <h2>📅 Daily Challenges</h2>
        <div className="challenges-list">
          <div className="challenge-item">
            <span>🎯 Complete 5 games</span>
            <span className="reward">+50 pts</span>
          </div>
          <div className="challenge-item">
            <span>⭐ Score 100 points</span>
            <span className="reward">+30 pts</span>
          </div>
          <div className="challenge-item">
            <span>🔥 Maintain 3-day streak</span>
            <span className="reward">+100 pts</span>
          </div>
          <div className="challenge-item">
            <span>🧩 Try a new game</span>
            <span className="reward">+25 pts</span>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <MusicPlayerButton />
      </Suspense>
    </div>
  );
}
