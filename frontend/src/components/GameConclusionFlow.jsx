import React, { useState, useEffect } from 'react';
import RewardScreen from './RewardScreen';
import StandaloneGameReport from './StandaloneGameReport';
import DataPersistenceService from '../services/DataPersistenceService';
import { useChild } from '../hooks/useChild';
import { AnimatePresence } from 'framer-motion';

/**
 * GameConclusionFlow - Orchestrates the post-game experience.
 * 1. Celebration (RewardScreen)
 * 2. Clinical Analysis (StandaloneGameReport)
 */
export default function GameConclusionFlow({ 
  gameName, 
  score, 
  total, 
  duration, 
  skills, 
  onAction, 
  actionLabel = "Ready for More? 🚀" 
}) {
  const [phase, setPhase] = useState('celebration'); // celebration, analysis
  const { selectedChild } = useChild();
  const persistence = new DataPersistenceService();

  useEffect(() => {
    // Automatically persist the results for the Therapist Console when the component mounts
    if (selectedChild) {
      persistence.recordSessionData({
        child_id: selectedChild,
        game_name: gameName,
        score,
        total_trials: total,
        accuracy: total > 0 ? score / total : 0,
        duration_seconds: duration,
        skills_tested: skills,
        type: 'standalone_adventure',
        status: 'completed'
      }).then(resp => {
        console.log(`Adventure ${gameName} persisted:`, resp);
      }).catch(err => {
        console.warn("Offline? Persistence queued:", err);
      });
    }
  }, []);

  const handleRewardNext = () => {
    setPhase('analysis');
  };

  return (
    <div className="game-conclusion-container">
      <AnimatePresence mode="wait">
        {phase === 'celebration' && (
          <RewardScreen 
            stars={total > 0 && (score / total) >= 0.8 ? 3 : (score / total) >= 0.5 ? 2 : 1}
            message={score === total ? "Perfect Adventure! 🏆" : "Amazing Effort! ✨"}
            onNext={handleRewardNext}
          />
        )}
        
        {phase === 'analysis' && (
          <StandaloneGameReport
            gameName={gameName}
            score={score}
            total={total}
            accuracy={total > 0 ? score / total : 0}
            duration={duration}
            skills={skills}
            onAction={onAction}
            actionLabel={actionLabel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
