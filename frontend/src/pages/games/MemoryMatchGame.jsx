/**
 * MemoryMatchGame – Card-flip matching pairs game.
 * Uses the backend game engine for session/trial tracking,
 * but handles card flip logic entirely on the frontend.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import { startGameSession, nextGameTrial, submitGameTrial } from "../../api/games";
import SummaryPanel from "../../components/summarypanel";
import UiIcon from "../../components/ui/UiIcon";
import audioFeedback from "../../services/AudioFeedback";
import visualEffects from "../../services/VisualEffects";
import achievementSystem from "../../services/AchievementSystem";
import AchievementDisplay from "../../components/AchievementDisplay";
import "../../styles/professional.css";
import "./MemoryMatchGame.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function Card({ card, isFlipped, isMatched, onClick, disabled }) {
  const imageUrl = card.image_url
    ? (card.image_url.startsWith("http") ? card.image_url : `${API_BASE}${card.image_url}`)
    : null;

  return (
    <div
      data-card-id={card.id}
      className={`memory-card ${isFlipped ? "flipped" : ""} ${isMatched ? "matched" : ""}`}
      onClick={(e) => !disabled && !isFlipped && !isMatched && onClick(card.id, e)}
    >
      <div className="memory-card-inner">
        <div className="memory-card-front" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <UiIcon name="question" size={36} title="Hidden card" />
        </div>
        <div className="memory-card-back">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={card.label || card.name || ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "12px",
              }}
              onError={(e) => {
                e.target.style.display = "none";
                const sib = e.target.nextSibling;
                if (sib) sib.style.display = "flex";
              }}
            />
          ) : null}
          <span
            style={{
              fontSize: imageUrl ? "1.5rem" : "1rem",
              display: imageUrl ? "none" : "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
            }}
          >
            {card.label || card.name ? (
              <span style={{ padding: 8, textAlign: "center", fontWeight: 600 }}>{card.label || card.name}</span>
            ) : (
              <UiIcon name="cards" size={40} title="Card" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MemoryMatchGamePage() {
  const navigate = useNavigate();
  const { selectedChild } = useChild();

  const [sessionId, setSessionId] = useState(null);
  const [trialNum, setTrialNum] = useState(0);
  const [trial, setTrial] = useState(null);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cards, setCards] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [numPairs, setNumPairs] = useState(0);
  const [gridCols, setGridCols] = useState(4);
  const [lockBoard, setLockBoard] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  
  // Track game session stats for achievements
  const sessionStats = useRef({
    matches: 0,
    moves: 0,
    pairs: 0,
    startTime: null,
  });

  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
  const trialStartRef = useRef(null);
  const trialRef = useRef(null);

  useEffect(() => { trialRef.current = trial; }, [trial]);

  const speak = useCallback(
    (text) => {
      if (!voiceEnabled || !text) return;
      try {
        const u = new SpeechSynthesisUtterance(text.replace(/[^\w\s!?.,']/g, ""));
        u.rate = 0.85;
        u.pitch = 1.1;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch {}
    },
    [voiceEnabled]
  );

  // Audio feedback helper
  const playSound = useCallback((soundName) => {
    if (soundEnabled) {
      audioFeedback.play(soundName);
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimedOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (numPairs > 0 && matchedPairs.size === numPairs && trial) {
      handleBoardComplete(true);
    }
  }, [matchedPairs, numPairs, trial]);

  async function handleStart() {
    if (!selectedChild) {
      setError("Please select a child from the Games page first");
      return;
    }
    setError("");
    setLoading(true);
    setSummary(null);
    setTrialNum(0); // Reset trial num
    try {
      const res = await startGameSession("memory_match", parseInt(selectedChild), 20);
      setSessionId(res.session?.session_id);
      if (res.first_trial && !res.first_trial.detail) {
        setupBoard(res.first_trial);
      } else if (res.summary) {
        setSummary(res.summary);
        setStatus("Session complete");
      }
    } catch (err) {
      setError(err.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  }

  function setupBoard(trialData) {
    const extra = trialData.extra || {};
    const boardCards = extra.cards || [];
    const pairs = extra.num_pairs || 4;
    const cols = extra.grid_cols || 4;

    setTrial(trialData);
    setTrialNum(n => n + 1); // Increment trial num
    setCards(boardCards);
    setNumPairs(pairs);
    setGridCols(cols);
    setFlippedIds([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setLockBoard(false);
    setShowCelebration(false);
    setStatus(`Find all ${pairs} pairs!`);
    trialStartRef.current = Date.now();
    
    // Reset session stats for achievement tracking
    sessionStats.current = {
      matches: 0,
      moves: 0,
      pairs: pairs,
      startTime: Date.now(),
    };

    const timeLimitMs = trialData.time_limit_ms || pairs * 15000;
    setTimeLeft(Math.ceil(timeLimitMs / 1000));

    speak(trialData.prompt);
  }

  function handleCardClick(cardId, event) {
    if (lockBoard || flippedIds.length >= 2) return;

    // Play flip sound
    playSound('flip');
    
    // Visual feedback on click
    if (event?.currentTarget) {
      visualEffects.ripple(event);
    }

    const newFlipped = [...flippedIds, cardId];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLockBoard(true);

      const [first, second] = newFlipped;
      const card1 = cards.find((c) => c.id === first);
      const card2 = cards.find((c) => c.id === second);

      if (card1?.pair_id === card2?.pair_id) {
        // Match found - positive feedback
        playSound('match');
        speak("Great match!");
        
        // Visual celebration
        setTimeout(() => {
          const cardEl1 = document.querySelector(`[data-card-id="${first}"]`);
          const cardEl2 = document.querySelector(`[data-card-id="${second}"]`);
          if (cardEl1) visualEffects.celebrate(cardEl1, { count: 15 });
          if (cardEl2) visualEffects.celebrate(cardEl2, { count: 15 });
        }, 100);
        
        setTimeout(() => {
          setMatchedPairs((prev) => new Set([...prev, card1.pair_id]));
          setFlippedIds([]);
          setLockBoard(false);
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setFlippedIds([]);
          setLockBoard(false);
        }, 1000);
      }
    }
  }

  async function handleBoardComplete(allFound) {
    if (!trialRef.current?.trial_id) return;
    setLockBoard(true);
    setTimeLeft(null);
    
    // Calculate session time
    const endTime = Date.now();
    const sessionTimeSeconds = sessionStats.current.startTime 
      ? Math.floor((endTime - sessionStats.current.startTime) / 1000)
      : 0;
    
    // Track achievement stats
    const wasPerfect = moves === numPairs * 2;
    
    // Celebration effects
    playSound('gameComplete');
    setShowCelebration(true);
    
    // Big celebration after board completion
    const boardEl = document.querySelector('.memory-grid');
    if (boardEl) {
      visualEffects.celebrate(boardEl, { count: 80, duration: 2000, spread: 200 });
    }
    
    // Update achievement stats
    const gameData = {
      matches: matchedPairs.size,
      moves: moves,
      pairs: numPairs,
      timeSeconds: sessionTimeSeconds,
      perfectBoard: wasPerfect,
    };
    
    // Check for new achievements
    const achievements = achievementSystem.updateGameStats('memory_match', gameData);
    if (achievements.length > 0) {
      setNewAchievements(achievements);
      setTimeout(() => setShowAchievements(true), 1500);
    }

    const elapsed = Date.now() - (trialStartRef.current || Date.now());
    const submitValue = `pairs:${matchedPairs.size + (allFound ? 0 : 0)},moves:${moves},total:${numPairs}`;

    setLoading(true);
    try {
      const res = await submitGameTrial(
        "memory_match",
        trialRef.current.trial_id,
        submitValue,
        elapsed,
        false
      );

      setStatus(res.feedback || "Board complete!");
      speak(res.feedback + " Great job!");

      setTimeout(async () => {
        if (res.session_completed && res.summary) {
          setSummary(res.summary);
          setTrial(null);
          setCards([]);
          setStatus("Session complete!");
        } else if (sessionId) {
          try {
            const next = await nextGameTrial("memory_match", sessionId);
            if (next.detail) {
              if (next.summary) setSummary(next.summary);
              setTrial(null);
              setCards([]);
              setStatus("Session complete!");
            } else {
              setupBoard(next);
            }
          } catch (err) {
            setError(err.message || "Failed to get next trial");
          }
        }
        setLoading(false);
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to submit");
      setLoading(false);
    }
  }

  function handleTimedOut() {
    if (!trialRef.current?.trial_id) return;
    setLockBoard(true);

    const elapsed = Date.now() - (trialStartRef.current || Date.now());
    const submitValue = `pairs:${matchedPairs.size},moves:${moves},total:${numPairs}`;

    setLoading(true);
    submitGameTrial("memory_match", trialRef.current.trial_id, submitValue, elapsed, true)
      .then((res) => {
        setStatus(res.feedback || "Time is up!");
        speak(res.feedback);

        setTimeout(async () => {
          if (res.session_completed && res.summary) {
            setSummary(res.summary);
            setTrial(null);
            setCards([]);
            setStatus("Session complete!");
          } else if (sessionId) {
            try {
              const next = await nextGameTrial("memory_match", sessionId);
              if (next.detail) {
                if (next.summary) setSummary(next.summary);
                setTrial(null);
                setCards([]);
                setStatus("Session complete!");
              } else {
                setupBoard(next);
              }
            } catch {}
          }
          setLoading(false);
        }, 2500);
      })
      .catch((err) => {
        setError(err.message || "Failed to submit");
        setLoading(false);
      });
  }

  function handleReset() {
    setSessionId(null);
    setTrial(null);
    setSummary(null);
    setCards([]);
    setFlippedIds([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setTimeLeft(null);
    setStatus("");
    setError("");
    setLockBoard(false);
  }

  if (summary) {
    return (
      <div className="page-wrapper">
        <div className="container page-content">
          <div className="game-header">
            <div className="game-header-title">
              <UiIcon name="cards" size={32} />
              <div>
                <h1 className="game-title">Memory Match</h1>
                <p className="game-subtitle">Complete!</p>
              </div>
            </div>
          </div>
          <SummaryPanel data={summary} onBack={() => navigate("/games")} />
          <button type="button" className="btn btn-primary" onClick={handleReset} style={{ marginTop: 16 }}>
            <UiIcon name="repeat" size={20} title="" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container page-content">
        <div className="game-header">
          <div className="game-header-title">
            <UiIcon name="cards" size={32} />
            <div>
              <h1 className="game-title">Memory Match</h1>
              <p className="game-subtitle">{status || "Flip cards and find matching pairs!"}</p>
            </div>
          </div>
          <div className="game-header-actions">
            <button
              type="button"
              className={`btn btn-sm ${voiceEnabled ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title="Toggle voice"
            >
              <UiIcon name={voiceEnabled ? "volume" : "volume-off"} size={18} />
            </button>
            {trial && (
              <button type="button" className="btn btn-sm btn-outline" onClick={handleReset}>
                <UiIcon name="quit" size={16} />
                Quit
              </button>
            )}
            <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate("/games")}>
              <UiIcon name="arrow-left" size={16} />
              Back
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

      {!trial && !loading && (
        <div className="card game-intro-card">
          <div className="game-intro-icon">
            <UiIcon name="cards" size={64} />
          </div>
          <h2 className="game-intro-title">Memory Match</h2>
          <p className="game-intro-desc">
            Flip cards and find matching pairs! Trains visual memory and concentration.
          </p>
          <button type="button" className="btn btn-primary btn-lg" onClick={handleStart}>
            <UiIcon name="play" size={20} />
            Start Game
          </button>
        </div>
      )}

      {loading && !trial && (
        <div className="card game-loading-card">
          <div className="loading-spinner" />
          <p>Loading...</p>
        </div>
      )}

      {trial && cards.length > 0 && (
        <>
          <div className="card game-stats">
              <div className="stat-card">
                <div className="stat-label">Trial</div>
                <div className="stat-value">{trialNum} / 20</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Progress</div>
                <div className="stat-value">
                  {matchedPairs.size}/{numPairs}
                </div>
              </div>
            <div className="game-stat">
              <div className="game-stat-label">Moves</div>
              <div className="game-stat-value">{moves}</div>
            </div>
            <div className="game-stat">
              <div className="game-stat-label">Time Left</div>
              <div className={`game-stat-value ${timeLeft && timeLeft < 10 ? 'warning' : ''}`}>
                {timeLeft != null ? `${timeLeft}s` : "--"}
              </div>
            </div>
          </div>

          <div
            className="memory-grid"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              maxWidth: gridCols * 110,
            }}
          >
            {cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                isFlipped={flippedIds.includes(card.id)}
                isMatched={matchedPairs.has(card.pair_id)}
                onClick={handleCardClick}
                disabled={lockBoard || loading}
              />
            ))}
          </div>

          {trial.ai_hint && (
            <div className="game-hint">
              <UiIcon name="bulb" size={18} />
              {trial.ai_hint}
            </div>
          )}
        </>
      )}
      
      {/* Achievement Display Modal */}
      {showAchievements && (
        <AchievementDisplay
          achievements={newAchievements}
          onClose={() => {
            setShowAchievements(false);
            setNewAchievements([]);
          }}
        />
      )}
      </div>
    </div>
  );
}
