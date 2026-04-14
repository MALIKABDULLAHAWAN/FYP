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
  const [gameMetadata, setGameMetadata] = useState(null);
  const [gameImage, setGameImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState('Medium');
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
      // In a real implementation, this would fetch from the backend
      // For now, we'll create sample metadata
      const metadata = {
        game_id: gameCode,
        title: gameName,
        description: `Engaging ${gameName.toLowerCase()} game designed for therapeutic learning`,
        therapeutic_goals: ['cognitive-development', 'problem-solving', 'attention-building'],
        difficulty_level: currentDifficulty,
        age_range: { min_age: 3, max_age: 12 },
        image_url: `/assets/games/${gameCode}/main-image.svg`,
        image_attribution: {
          photographer: 'Therapeutic Games Studio',
          license: 'CC-BY-4.0',
          source: 'Therapeutic Learning Resources',
          usage_rights: 'Educational use permitted'
        },
        evidence_base: [{
          citation: 'Smith, J. et al. (2023). Effectiveness of digital therapeutic games.',
          publication_year: 2023,
          effectiveness_rating: 0.85,
          sample_size: 150,
          study_type: 'RCT'
        }]
      };

      setGameMetadata(metadata);
      loadGameImage(metadata);
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
      } else {
        setStreak(0);
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
          if (accuracy >= 80) {
            toast.achievement(`Great job! ${accuracy}% accuracy!`);
            setShowConfetti(true);
          } else {
            toast.success("Session completed!");
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
    <div className="game-interface">
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

      {/* Completion screen with positive reinforcement */}
      {showCompletionScreen && summary && (
        <div className="completion-screen">
          <div className="completion-celebration">
            <div className="completion-icon">
              <UiIcon name="trophy" size={96} title="Congratulations!" />
            </div>
            
            <div className="completion-title">
              Fantastic Work!
            </div>
            
            <div className="completion-subtitle">
              You completed the {gameName} game!
            </div>
            
            <div className="completion-stats">
              <div className="stat-item">
                <div className="stat-value">
                  {Math.round((summary.correct_trials / summary.total_trials) * 100)}%
                </div>
                <div className="stat-label">Accuracy</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-value">{summary.correct_trials}</div>
                <div className="stat-label">Correct</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-value">{summary.total_trials}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
            
            <div className="completion-encouragement">
              {summary.correct_trials / summary.total_trials >= 0.8 
                ? "Outstanding performance! You're getting really good at this!"
                : summary.correct_trials / summary.total_trials >= 0.6
                ? "Great effort! You're making excellent progress!"
                : "Good job trying your best! Every attempt helps you learn and grow!"
              }
            </div>
            
            <div className="completion-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleStart}
              >
                <UiIcon name="play" size={20} />
                Play Again!
              </button>
              
              <button
                className="btn btn-outline"
                onClick={() => navigate("/games")}
              >
                <UiIcon name="arrow-left" size={18} />
                Choose Another Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary panel (existing component) */}
      {summary && !showCompletionScreen && (
        <SummaryPanel data={summary} lastResult={lastResult} />
      )}
    </div>
  );
}