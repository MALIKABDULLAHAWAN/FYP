/**
 * Enhanced GameInterface Component
 * 
 * Integrates therapeutic photographs and enhanced features:
 * - Game image display with proper attribution
 * - Image loading with fallback handling
 * - Progress indicator integration
 * - Difficulty adjustment controls
 * - Completion screen with positive reinforcement
 * 
 * Requirements: 4.3, 5.1, 5.2, 5.3, 5.4, 15.1, 15.2, 15.3
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { startGameSession, nextGameTrial, submitGameTrial, endSession } from '../api/games';
import { useChild } from '../hooks/useChild';
import { useToast } from '../hooks/useToast';

// Services
import GameMetadataService from '../services/GameMetadataService';
import GameImageManager from '../services/GameImageManager';

// Components
import ProgressIndicator from './ProgressIndicator';
import DifficultyIndicator from './DifficultyIndicator';
import SummaryPanel from './summarypanel';
import Confetti from './Confetti';
import UiIcon from './ui/UiIcon';
import PatternToken from './ui/PatternToken';
import GameOptionMedia from './GameOptionMedia';
import AchievementDisplay from './AchievementDisplay';
import { 
  AmbientParticles, 
  BouncingStars, 
  SuccessBurst, 
  FloatingEmoji, 
  MagicalSparkles,
  FloatingOrbs
} from './AmbientEffects';
import { generateEncouragement, getPersonalizedHint } from '../services/aiServiceEnhanced';
import achievementSystem from '../services/AchievementSystem';

// Styles
import '../styles/professional.css';
import './GameInterface.css';

export default function GameInterface({
  gameCode,
  gameName = "Game",
  gameIconName = "games",
  trialCount = 10,
  multiSelect = false,
}) {
  const navigate = useNavigate();
  const { selectedChild, childProfile } = useChild();
  const toast = useToast();

  // Game state
  const [sessionId, setSessionId] = useState(null);
  const [trial, setTrial] = useState(null);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: trialCount });
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);

  // Enhanced features
  const [burstTrigger, setBurstTrigger] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [aiEncouragement, setAiEncouragement] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [aiHint, setAiHint] = useState("");
  const [hintLoading, setHintLoading] = useState(false);

  const [gameMetadata, setGameMetadata] = useState(null);

  const [gameImage, setGameImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState(1);
  const [difficultyAdjusted, setDifficultyAdjusted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  const timerRef = useRef(null);
  const trialStartRef = useRef(null);

  // Load game metadata and image on mount
  useEffect(() => {
    loadGameMetadata();
  }, [gameCode]);

  // Load game metadata
  const loadGameMetadata = async () => {
    try {
      const service = new GameMetadataService();
      const metadata = await service.getGameMetadata(gameCode);
      
      // Map properties to what UI components expect, ensuring fallbacks
      const standardMetadata = {
        game_id: gameCode,
        title: metadata.name || gameName,
        description: metadata.description || `Engaging ${gameName.toLowerCase()} game designed for therapeutic learning`,
        therapeutic_goals: metadata.therapeuticGoals || ['cognitive-development', 'problem-solving', 'attention-building'],
        difficulty_level: metadata.difficultyLevel || currentDifficulty,
        age_range: metadata.ageRange || { min_age: 3, max_age: 12 },
        image_url: metadata.imageUrl || `/assets/games/${gameCode}/main-image.svg`,
        image_attribution: metadata.imageAttribution || {
          photographer: 'Therapeutic Games Studio',
          license: 'CC-BY-4.0',
          source: 'Therapeutic Learning Resources',
          usage_rights: 'Educational use permitted'
        },
        evidence_base: metadata.evidenceBase || []
      };

      setGameMetadata(standardMetadata);
      loadGameImage(standardMetadata);
    } catch (error) {
      console.error('Failed to load game metadata:', error);
    }
  };

  // Load game image with fallback handling
  const loadGameImage = async (metadata) => {
    setImageLoading(true);
    setImageError(false);

    try {
      // Try to get optimized image from GameImageManager
      const imageData = GameImageManager.getResponsiveImageUrls(metadata.game_id);
      
      if (imageData) {
        setGameImage(imageData);
      } else {
        // Fallback to default image URL
        setGameImage({
          desktop: metadata.image_url,
          tablet: metadata.image_url,
          mobile: metadata.image_url,
          thumbnail: metadata.image_url,
          attribution: metadata.image_attribution
        });
      }
    } catch (error) {
      console.error('Failed to load game image:', error);
      setImageError(true);
      // Set fallback image
      setGameImage({
        desktop: `/assets/games/fallback/default-game.svg`,
        tablet: `/assets/games/fallback/default-game.svg`,
        mobile: `/assets/games/fallback/default-game.svg`,
        thumbnail: `/assets/games/fallback/default-game.svg`,
        attribution: {
          photographer: 'Default',
          license: 'Internal',
          source: 'System Default',
          usage_rights: 'Internal use'
        }
      });
    } finally {
      setImageLoading(false);
    }
  };

  // Handle image load error
  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      // Try fallback image
      setGameImage(prev => ({
        ...prev,
        desktop: `/assets/games/fallback/default-game.svg`,
        tablet: `/assets/games/fallback/default-game.svg`,
        mobile: `/assets/games/fallback/default-game.svg`,
        thumbnail: `/assets/games/fallback/default-game.svg`
      }));
    }
  };

  // Speech synthesis
  const speak = useCallback((text) => {
    if (!voiceEnabled || !text) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text.replace(/[^\w\s!?.,']/g, ""));
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  }, [voiceEnabled]);

  // Auto-speak trial prompts
  useEffect(() => {
    if (trial?.prompt) speak(trial.prompt);
  }, [trial, speak]);

  // Trial timer
  useEffect(() => {
    if (!trial?.time_limit_ms || !trial?.trial_id) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      handleSubmit(null, true);
    }, trial.time_limit_ms);
    
    return () => clearTimeout(timerRef.current);
  }, [trial]);

  // Normalize trial data
  function normalizeTrial(raw) {
    if (!raw || raw.detail) return raw;
    
    const options = (raw.options || []).map((option) => {
      if (typeof option === "string") return { id: option, label: option };
      return {
        id: option.id || option.label || String(option),
        label: option.label || option.id || String(option),
        image_url: option.image_url,
        image: option.image,
        metadata: option.metadata,
      };
    });
    
    return { ...raw, options };
  }

  // Start game session
  async function handleStart() {
    if (!selectedChild) {
      setError("Please select a child from the Games page first");
      return;
    }

    setError("");
    setLoading(true);
    setSummary(null);
    setLastResult(null);
    setSelectedItems(new Set());
    setShowCompletionScreen(false);
    setProgress({ current: 0, total: trialCount });
    setStreak(0);

    try {
      const response = await startGameSession(gameCode, parseInt(selectedChild), trialCount);
      setSessionId(response.session?.session_id);
      
      if (response.first_trial && !response.first_trial.detail) {
        setTrial(normalizeTrial(response.first_trial));
        setStatus("Playing...");
        trialStartRef.current = Date.now();
      } else if (response.summary) {
        setSummary(response.summary);
        setStatus("Session complete");
        setShowCompletionScreen(true);
      }
    } catch (err) {
      setError(err.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  }

  // Submit trial response
  async function handleSubmit(clickedValue, timedOut = false) {
    if (!trial?.trial_id) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    const elapsed = Date.now() - (trialStartRef.current || Date.now());
    let clicked = clickedValue;

    if (multiSelect && !timedOut) {
      clicked = Array.from(selectedItems).join(",");
    }

    if (!clicked && !timedOut) return;

    setLoading(true);
    setShowFeedback(false);

    try {
      const response = await submitGameTrial(gameCode, trial.trial_id, clicked || "", elapsed, timedOut);
      setLastResult(response);
      setShowFeedback(true);

      // Update progress
      setProgress((prev) => ({ ...prev, current: prev.current + 1 }));

      // Handle success feedback
      if (response.success) {
        setStreak((prev) => {
          const newStreak = prev + 1;
          if (newStreak === 3) toast.celebration("3 in a row! Keep it up!");
          if (newStreak === 5) toast.celebration("Amazing! 5 correct answers!");
          return newStreak;
        });

        if (response.score >= 9) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
        }
        setBurstTrigger(true);
        setShowEmoji(true);
        setTimeout(() => {
          setBurstTrigger(false);
          setShowEmoji(false);
        }, 1500);
      } else {
        setStreak(0);
        const newWrong = wrongAttempts + 1;
        setWrongAttempts(newWrong);
        // Fetch AI hint after first wrong attempt
        if (newWrong >= 1 && trial?.prompt) {
          setHintLoading(true);
          getPersonalizedHint(gameCode, trial.prompt, newWrong)
            .then(hint => { setAiHint(hint); setHintLoading(false); })
            .catch(() => setHintLoading(false));
        }
      }

      // Check for real-time difficulty adjustment
      checkDifficultyAdjustment(response);

      // Continue to next trial after feedback
      setTimeout(async () => {
        setShowFeedback(false);
        setSelectedItems(new Set());

        if (response.session_completed && response.summary) {
          setSummary(response.summary);
          setTrial(null);
          setStatus("Session complete!");
          setShowCompletionScreen(true);

          const accuracy = Math.round((response.summary.correct_trials / response.summary.total_trials) * 100);
          // Record session in AchievementSystem service (persists to localStorage)
          achievementSystem.recordDailySession();
          const newAchievements = achievementSystem.updateGameStats(gameCode, {
            matches: response.summary.correct_trials,
            boardsCompleted: 1,
            correctResponses: response.summary.correct_trials,
            totalResponses: response.summary.total_trials,
            bestAccuracy: accuracy / 100,
          });
          if (accuracy >= 80) {
            toast.achievement(`Great job! ${accuracy}% accuracy!`);
            setShowConfetti(true);
            // Merge service achievements + inline earned
            const inlineEarned = [];
            if (accuracy === 100) inlineEarned.push({ name: "Perfect Score!", description: "You got every answer right! 🌟", icon: "star", color: "#F6C90E" });
            if (accuracy >= 80) inlineEarned.push({ name: "Star Player", description: `Amazing! ${accuracy}% correct!`, icon: "trophy", color: "#4ECDC4" });
            if (streak >= 5) inlineEarned.push({ name: "On Fire!", description: "5 correct answers in a row!", icon: "fire", color: "#FF6B6B" });
            setAchievements([...inlineEarned, ...newAchievements]);
            generateEncouragement(`${accuracy}% accuracy in ${gameName}`).then(msg => setAiEncouragement(msg)).catch(() => {});
          } else {
            toast.success("Session completed!");
            if (newAchievements.length > 0) setAchievements(newAchievements);
          }
        } else if (sessionId) {
          try {
            const next = await nextGameTrial(gameCode, sessionId);
            if (next.detail) {
              if (next.summary) {
                setSummary(next.summary);
                setShowCompletionScreen(true);
                const accuracy = Math.round((next.summary.correct_trials / next.summary.total_trials) * 100);
                if (accuracy >= 80) {
                  toast.achievement(`Excellent! ${accuracy}% accuracy!`);
                  setShowConfetti(true);
                } else {
                  toast.success("Session completed!");
                }
              }
              setTrial(null);
              setStatus("Session complete!");
            } else {
              setTrial(normalizeTrial(next));
              setStatus(`Question ${progress.current + 2} of ${progress.total}`);
              trialStartRef.current = Date.now();
            }
          } catch (err) {
            setError(err.message || "Failed to get next trial");
            setTrial(null);
          }
        }
        setLoading(false);
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit");
      setLoading(false);
    }
  }

  // Check for real-time difficulty adjustment
  const checkDifficultyAdjustment = (response) => {
    if (!childProfile || difficultyAdjusted) return;

    const performanceMetrics = {
      currentDifficulty,
      currentScore: response.score || 0,
      tasksCompleted: progress.current + 1,
      tasksFailed: progress.current + 1 - (streak + (response.success ? 1 : 0)),
      timeSpentSeconds: (Date.now() - (trialStartRef.current || Date.now())) / 1000,
      taskCount: progress.current + 1,
    };

    const adjustment = GameMetadataService.adjustDifficultyInRealtime(sessionId, performanceMetrics);
    
    if (adjustment.difficultyAdjusted) {
      setCurrentDifficulty(adjustment.newDifficulty);
      setDifficultyAdjusted(true);
      toast.info(`Difficulty adjusted to ${adjustment.newDifficulty}: ${adjustment.reason}`);
    }
  };

  // Toggle item selection (for multi-select games)
  function toggleItem(id) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Reset game session
  async function handleReset() {
    if (sessionId) {
      try {
        await endSession(sessionId);
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    }
    
    setSessionId(null);
    setTrial(null);
    setSummary(null);
    setLastResult(null);
    setStatus("");
    setError("");
    setSelectedItems(new Set());
    setShowFeedback(false);
    setShowCompletionScreen(false);
    setProgress({ current: 0, total: trialCount });
    setStreak(0);
    setDifficultyAdjusted(false);
  };

  // Manual difficulty adjustment
  const handleDifficultyChange = (newDifficulty) => {
    setCurrentDifficulty(newDifficulty);
    toast.info(`Difficulty changed to ${newDifficulty}`);
  };

  const usePatternTokens = Boolean(trial?.extra?.use_pattern_tokens);
  const streakIcons = Math.min(streak, 5);
  const progressPercentage = (progress.current / progress.total) * 100;

  return (
    <div className="game-interface" style={{ position: 'relative', minHeight: '100vh', zIndex: 1 }}>
      <AmbientParticles />
      <FloatingOrbs count={3} />
      <BouncingStars />
      <SuccessBurst trigger={burstTrigger} />
      
      {showEmoji && <FloatingEmoji emoji="🎉" x="50%" y="40%" delay={0} />}
      {showEmoji && <FloatingEmoji emoji="🌟" x="30%" y="50%" delay={0.2} />}
      {showEmoji && <FloatingEmoji emoji="✨" x="70%" y="30%" delay={0.1} />}

      {/* Header with game info and controls */}
      <div className="game-header">
        <div className="game-title-section">
          <div className="game-title">
            <UiIcon name={gameIconName} size={36} title={gameName} />
            <span>{gameName}</span>
          </div>
          <div className="game-subtitle">
            {status || "Select a child and start playing"}
          </div>
        </div>
        
        <div className="game-header-actions">
          <button
            className={`btn btn-sm ${voiceEnabled ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
          >
            <UiIcon name={voiceEnabled ? "volume" : "volume-off"} size={16} />
            {voiceEnabled ? "Voice On" : "Voice Off"}
          </button>
          
          {sessionId && (
            <button
              className="btn btn-sm btn-outline"
              onClick={handleReset}
            >
              <UiIcon name="refresh" size={16} />
              Reset
            </button>
          )}
          
          <button
            className="btn btn-sm btn-outline"
            onClick={() => navigate("/games")}
          >
            <UiIcon name="arrow-left" size={16} />
            Back
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Confetti animation */}
      {showConfetti && <Confetti />}

      {/* Achievement popup */}
      {achievements.length > 0 && (
        <AchievementDisplay
          achievements={achievements}
          onClose={() => setAchievements([])}
        />
      )}

      {/* AI Encouragement Banner */}
      {aiEncouragement && !achievements.length && (
        <div style={{
          position: "fixed",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
          color: "white",
          padding: "14px 28px",
          borderRadius: "16px",
          fontFamily: "var(--font-fun)",
          fontSize: "17px",
          zIndex: 2000,
          boxShadow: "0 8px 24px rgba(108,99,255,0.4)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          maxWidth: "90vw",
          animation: "fadeInDown 0.5s ease-out"
        }}>
          <span style={{ fontSize: "24px" }}>🤖</span>
          {aiEncouragement}
          <button onClick={() => setAiEncouragement("")} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "20px", marginLeft: "8px" }}>×</button>
        </div>
      )}

      {/* Game image with attribution */}
      {gameImage && !showCompletionScreen && (
        <div className="game-image-container">
          <div className="game-image-wrapper">
            {imageLoading ? (
              <div className="image-loading">
                <div className="spinner" />
                <span>Loading game image...</span>
              </div>
            ) : (
              <picture className="game-image">
                <source
                  media="(min-width: 1024px)"
                  srcSet={gameImage.desktop}
                />
                <source
                  media="(min-width: 640px)"
                  srcSet={gameImage.tablet}
                />
                <img
                  src={gameImage.mobile}
                  alt={`${gameName} therapeutic game`}
                  onError={handleImageError}
                  loading="lazy"
                />
              </picture>
            )}
          </div>
          
          {gameImage.attribution && (
            <div className="image-attribution">
              <small>
                Photo by {gameImage.attribution.photographer} • {gameImage.attribution.license}
              </small>
            </div>
          )}
        </div>
      )}

      {/* Progress and difficulty indicators */}
      {sessionId && !summary && (
        <div className="game-progress-section">
          <div className="progress-header">
            <span className="progress-label">Progress</span>
            <span className="progress-count">
              {progress.current} of {progress.total}
            </span>
          </div>
          
          <ProgressIndicator
            progress={progressPercentage}
            type="linear"
            showLabel={false}
            animated={true}
          />
          
          <div className="difficulty-and-streak">
            <DifficultyIndicator
              difficulty={currentDifficulty}
              onDifficultyChange={handleDifficultyChange}
              allowAdjustment={sessionId && !loading}
            />
            
            {streak > 0 && (
              <div className="streak-indicator">
                {Array.from({ length: streakIcons }, (_, i) => (
                  <UiIcon key={i} name="fire" size={18} title="" />
                ))}
                <span>{streak} in a row!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game start screen */}
      {!sessionId && !showCompletionScreen && (
        <div className="game-start-screen">
          <div className="start-screen-icon">
            <UiIcon name={gameIconName} size={72} title={gameName} />
          </div>
          
          <div className="start-screen-title">
            Ready to play {gameName}?
          </div>
          
          <div className="start-screen-subtitle">
            {selectedChild ? "Press start when you are ready!" : "Select a child on the Games page first."}
          </div>
          
          <button
            className="btn btn-primary btn-lg"
            onClick={handleStart}
            disabled={loading || !selectedChild}
          >
            {loading ? (
              <>
                <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />
                Starting...
              </>
            ) : (
              <>
                <UiIcon name="play" size={20} />
                Start Playing!
              </>
            )}
          </button>
          
          {!selectedChild && (
            <div className="child-selection-reminder">
              <UiIcon name="hand" size={20} title="" />
              Select a child on the Games page first.
            </div>
          )}
        </div>
      )}

      {/* Feedback display */}
      {showFeedback && lastResult && (
        <div className={`feedback-banner ${lastResult.success ? "feedback-success" : "feedback-fail"}`}>
          <div className="feedback-icon">
            <UiIcon name={lastResult.success ? "star" : "dumbbell"} size={48} title="" />
          </div>
          
          <div className="feedback-title">
            {lastResult.success ? "Great job!" : "Keep trying!"}
          </div>
          
          <div className="feedback-message">
            {lastResult.feedback}
          </div>
          
          {lastResult.success && lastResult.score >= 9 && (
            <div className="perfect-score-message">
              <UiIcon name="trophy" size={16} title="" />
              Perfect score! Amazing work!
            </div>
          )}
        </div>
      )}

      {/* Trial display */}
      {trial && !showFeedback && !showCompletionScreen && (
        <div className="trial-section">
          <div className="trial-prompt-panel">
            <div className="trial-prompt">
              {trial.prompt}
            </div>
            
            {trial.extra?.category_label && (
              <div className="trial-category">
                {trial.extra.category_label}
                {trial.extra?.correct_count > 0 && (
                  <span className="correct-count">
                    (find {trial.extra.correct_count})
                  </span>
                )}
              </div>
            )}
            
            {trial.extra?.sequence && (
              <div className={`trial-sequence ${usePatternTokens ? "pattern-tokens" : "text-sequence"}`}>
                {usePatternTokens
                  ? trial.extra.sequence.map((token, i) => (
                      <PatternToken key={i} token={token} size={40} />
                    ))
                  : trial.extra.sequence.join(" ")}
              </div>
            )}
            
            {trial.ai_hint && (
              <div className="trial-hint">
                <UiIcon name="bulb" size={18} title="" />
                <span>Hint: {trial.ai_hint}</span>
              </div>
            )}

            {/* AI-powered hint after wrong attempt */}
            {aiHint && !showFeedback && (
              <div style={{
                marginTop: 12,
                padding: '12px 16px',
                background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(167,139,250,0.08))',
                border: '1.5px solid rgba(108,99,255,0.25)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                animation: 'fadeInDown 0.4s ease-out'
              }}>
                <span style={{ fontSize: 22 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>AI Hint</div>
                  <div style={{ fontSize: 14, color: '#4a4a6a', lineHeight: 1.5 }}>{aiHint}</div>
                </div>
                <button onClick={() => setAiHint('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18, flexShrink: 0 }}>×</button>
              </div>
            )}
            {hintLoading && (
              <div style={{ marginTop: 10, textAlign: 'center', color: '#6c63ff', fontSize: 13 }}>
                <span>🤖 Getting a hint for you...</span>
              </div>
            )}
          </div>

          <div className="trial-options-grid">
            {(trial.options || []).map((option) => {
              const isHighlighted = trial.highlight === option.id || trial.highlight_id === option.id;
              const isSelected = multiSelect && selectedItems.has(option.id);
              
              return (
                <div
                  key={option.id}
                  className={`option-card ${isHighlighted ? "highlighted" : ""} ${isSelected ? "selected" : ""} ${loading ? "disabled" : ""}`}
                  onClick={() => {
                    if (loading) return;
                    if (multiSelect) {
                      toggleItem(option.id);
                    } else {
                      handleSubmit(option.id);
                    }
                  }}
                >
                  <div className="option-content">
                    <GameOptionMedia 
                      opt={option} 
                      usePatternTokens={usePatternTokens} 
                      imageSize={96} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {multiSelect && (
            <div className="multi-select-submit">
              <button
                className="btn btn-primary"
                onClick={() => handleSubmit(null)}
                disabled={loading || selectedItems.size === 0}
              >
                <UiIcon name="check" size={18} />
                Submit ({selectedItems.size} selected)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Completion screen - enhanced with AI encouragement + achievement preview */}
      {showCompletionScreen && summary && (() => {
        const acc = Math.round((summary.correct_trials / summary.total_trials) * 100);
        const progress = achievementSystem.getProgress();
        return (
          <div className="completion-screen" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.06), rgba(250,209,240,0.15))' }}>
            <div className="completion-celebration">

              {/* Animated trophy + accuracy ring */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="completion-icon" style={{ position: 'relative' }}>
                  <UiIcon name="trophy" size={80} title="Congratulations!" />
                  {acc === 100 && <MagicalSparkles />}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 56, fontWeight: 900, background: acc >= 80 ? 'linear-gradient(135deg, #6c63ff, #a78bfa)' : 'linear-gradient(135deg, #f6ad55, #ed8936)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{acc}%</div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Accuracy</div>
                </div>
              </div>

              <div className="completion-title" style={{ fontFamily: 'var(--font-fun)', fontSize: 32 }}>
                {acc === 100 ? '🌟 Perfect Score!' : acc >= 80 ? '🎉 Fantastic Work!' : acc >= 60 ? '👍 Great Effort!' : '💪 Keep Practising!'}
              </div>

              <div className="completion-subtitle">
                You completed the {gameName} game!
              </div>

              {/* Stats row */}
              <div className="completion-stats" style={{ gap: 32, marginBottom: 20 }}>
                <div className="stat-item">
                  <div className="stat-value" style={{ color: '#48bb78' }}>{summary.correct_trials}</div>
                  <div className="stat-label">✅ Correct</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value" style={{ color: '#fc8181' }}>{summary.total_trials - summary.correct_trials}</div>
                  <div className="stat-label">❌ Incorrect</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value" style={{ color: '#f6ad55' }}>{streak}</div>
                  <div className="stat-label">🔥 Best Streak</div>
                </div>
              </div>

              {/* AI encouragement message */}
              {aiEncouragement && (
                <div style={{
                  background: 'linear-gradient(135deg, #6c63ff22, #a78bfa22)',
                  border: '1.5px solid rgba(108,99,255,0.2)',
                  borderRadius: 16,
                  padding: '14px 20px',
                  margin: '0 0 20px',
                  fontSize: 16,
                  color: '#4a4a6a',
                  fontStyle: 'italic',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: 24 }}>🤖</span>
                  {aiEncouragement}
                </div>
              )}

              {/* Persistent achievement progress from AchievementSystem */}
              <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#6c63ff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UiIcon name="trophy" size={16} title="" />
                  Your Badge Collection ({progress.earnedCount} / {progress.totalAchievements})
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {progress.earnedAchievements.slice(0, 6).map(a => (
                    <div key={a.id} title={a.description} style={{ background: a.color + '22', border: `1.5px solid ${a.color}`, borderRadius: 10, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: a.color }}>
                      {a.name}
                    </div>
                  ))}
                  {progress.earnedCount === 0 && <span style={{ fontSize: 13, color: '#999' }}>Play more to earn badges!</span>}
                </div>
              </div>

              <div className="completion-actions">
                <button className="btn btn-primary btn-lg" onClick={() => { setWrongAttempts(0); setAiHint(''); setAiEncouragement(''); handleStart(); }}>
                  <UiIcon name="play" size={20} />
                  Play Again!
                </button>
                <button className="btn btn-outline" onClick={() => navigate("/games")}>
                  <UiIcon name="arrow-left" size={18} />
                  All Games
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Summary panel (existing component) */}
      {summary && !showCompletionScreen && (
        <SummaryPanel data={summary} lastResult={lastResult} />
      )}
    </div>
  );
}