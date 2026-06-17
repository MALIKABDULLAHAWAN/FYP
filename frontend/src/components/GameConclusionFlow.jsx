import React, { useState, useEffect, useRef } from 'react';
import RewardScreen from './RewardScreen';
import StandaloneGameReport from './StandaloneGameReport';
import StickerAward from './StickerAward';
import { useChild } from '../hooks/useChild';
import { useToast } from '../hooks/useToast';
import { AnimatePresence } from 'framer-motion';
import { apiFetch } from '../api/client';

/**
 * GameConclusionFlow - Orchestrates the post-game experience.
 * 1. Celebration (RewardScreen)
 * 2. Sticker Award (Optional - if level 3 and accuracy >= 0.8)
 * 3. Clinical Analysis (StandaloneGameReport)
 *
 * Supports two calling patterns:
 *
 * Pattern A (individual props — standard):
 *   <GameConclusionFlow gameName="Bubble Pop" score={7} total={10} duration={45} skills={[...]} level={3} />
 *
 * Pattern B (legacy results object — used by StoryAdventure):
 *   <GameConclusionFlow results={{ gameName, score, total_trials, accuracy, duration, skills, level }} />
 */
export default function GameConclusionFlow({ 
  // Pattern A props
  gameName: gameNameProp,
  score: scoreProp,
  total: totalProp,
  duration: durationProp,
  skills: skillsProp,
  level: levelProp,
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
  const level     = levelProp     ?? results?.level      ?? results?.difficulty_level ?? 1;
  const accuracy  = results?.accuracy != null ? results.accuracy : (total > 0 ? Math.min(1, score / total) : 0);

  const [phase, setPhase] = useState('celebration'); // celebration, sticker, analysis
  const { selectedChild } = useChild();
  const toast = useToast();
  const hasSaved = useRef(false);

  useEffect(() => {
    // Guard: save exactly once even in React StrictMode double-effect
    // We prioritize using the child_id from either the context or results object
    const finalChildId = selectedChild || results?.child_id;
    
    if (!finalChildId || hasSaved.current) {
        if (!finalChildId && !hasSaved.current) {
            console.warn("[GameConclusionFlow] Missing child_id, session might not be recorded in history.");
        }
        return;
    }
    hasSaved.current = true;

    // Record session data to the backend
    apiFetch('/api/v1/therapy/game-sessions/record', {
      method: 'POST',
      body: {
        child_id: finalChildId,
        game_name: gameName,
        score,
        total_trials: Math.max(1, total), // Ensure valid for analytics
        accuracy: Math.min(1, Math.max(0, Number(accuracy.toFixed(4)))),
        duration_seconds: duration || 0,
        skills_tested: Array.isArray(skills) ? skills : [],
        level: level,
        status: 'completed',
      },
    })
      .then((resp) => {
        console.log(`[GameConclusionFlow] ✅ Session saved for "${gameName}" (Level ${level}):`, resp);
        toast.success(`Session recorded: ${gameName} 🌟`);
      })
      .catch((err) => {
        console.warn(`[GameConclusionFlow] ⚠️ Session save failed for "${gameName}":`, err);
        toast.error(`Could not save session: ${err.message || "Generic error"}`);
      });
  }, [selectedChild, results?.child_id, gameName, score, total, accuracy, duration, skills, level, toast]);

  const handleRewardNext = () => {
    // Standard for stickers: Level 3+ and Accuracy >= 80%
    const isHighPlay = accuracy >= 0.8 && (String(level) === '3' || level >= 3 || String(level).toLowerCase().includes('hard') || String(level).toLowerCase().includes('expert'));
    
    if (isHighPlay) {
      setPhase('sticker');
    } else {
      setPhase('analysis');
    }
  };

  const handleStickerFinish = () => {
    setPhase('analysis');
  };

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

        {phase === 'sticker' && (
          <StickerAward onFinish={handleStickerFinish} />
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
