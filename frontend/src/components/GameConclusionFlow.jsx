import React, { useState, useEffect, useRef } from 'react';
import RewardScreen from './RewardScreen';
import StandaloneGameReport from './StandaloneGameReport';
import { useChild } from '../hooks/useChild';
import { AnimatePresence } from 'framer-motion';
import { apiFetch } from '../api/client';

/**
 * GameConclusionFlow - Orchestrates the post-game experience.
 * 1. Celebration (RewardScreen)
 * 2. Clinical Analysis (StandaloneGameReport)
 *
 * Supports two calling patterns:
 *
 * Pattern A (individual props — standard):
 *   <GameConclusionFlow gameName="Bubble Pop" score={7} total={10} duration={45} skills={[...]} />
 *
 * Pattern B (legacy results object — used by StoryAdventure, SpeechTherapy):
 *   <GameConclusionFlow results={{ gameName, score, total_trials, accuracy, duration, skills }} />
 */
export default function GameConclusionFlow({ 
  // Pattern A props
  gameName: gameNameProp,
  score: scoreProp,
  total: totalProp,
  duration: durationProp,
  skills: skillsProp,
  // Pattern B (legacy)
  results,
  // Shared
  onAction,
  actionLabel = "Ready for More? 🚀",
  // Legacy aliases used by some older games
  onReplay,
  onNext,
}) {
  // Normalise: support both calling patterns
  const gameName  = gameNameProp  ?? results?.gameName  ?? results?.game_name  ?? 'Unknown Game';
  const score     = scoreProp     ?? results?.score     ?? 0;
  const total     = totalProp     ?? results?.total_trials ?? results?.total ?? 0;
  const duration  = durationProp  ?? results?.duration  ?? 0;
  const skills    = skillsProp    ?? results?.skills     ?? [];
  const accuracy  = results?.accuracy != null ? results.accuracy : (total > 0 ? Math.min(1, score / total) : 0);

  const [phase, setPhase] = useState('celebration');
  const { selectedChild } = useChild();
  const hasSaved = useRef(false);

  useEffect(() => {
    // Guard: save exactly once even in React StrictMode double-effect
    if (!selectedChild || hasSaved.current) return;
    hasSaved.current = true;

    apiFetch('/api/v1/therapy/game-sessions/record', {
      method: 'POST',
      body: {
        child_id: selectedChild,
        game_name: gameName,
        score,
        total_trials: total,
        accuracy: Number(accuracy.toFixed(4)),
        duration_seconds: duration || 0,
        skills_tested: Array.isArray(skills) ? skills : [],
        status: 'completed',
      },
    })
      .then((resp) => {
        console.log(`[GameConclusionFlow] ✅ Session saved for "${gameName}":`, resp);
      })
      .catch((err) => {
        console.warn(`[GameConclusionFlow] ⚠️ Session save failed for "${gameName}":`, err);
      });
  }, []);

  const handleRewardNext = () => setPhase('analysis');

  // Support legacy onReplay / onNext as fallbacks for onAction
  const handleAction = onAction ?? onReplay ?? onNext ?? (() => {});

  return (
    <div className="game-conclusion-container">
      <AnimatePresence mode="wait">
        {phase === 'celebration' && (
          <RewardScreen 
            stars={accuracy >= 0.8 ? 3 : accuracy >= 0.5 ? 2 : 1}
            message={score === total && total > 0 ? "Perfect Adventure! 🏆" : "Amazing Effort! ✨"}
            onNext={handleRewardNext}
          />
        )}
        
        {phase === 'analysis' && (
          <StandaloneGameReport
            gameName={gameName}
            score={score}
            total={total}
            accuracy={accuracy}
            duration={duration}
            skills={skills}
            onAction={handleAction}
            actionLabel={actionLabel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
