import { useState, useEffect, useCallback } from 'react';
import gameStageManager from '../services/GameStageManager';

/**
 * REACT HOOK FOR GAME STAGES
 * Manages dynamic game stages, power-ups, and progression
 */
export function useGameStages(userId) {
  const [currentStage, setCurrentStage] = useState(null);
  const [allStages, setAllStages] = useState([]);
  const [progress, setProgress] = useState({});
  const [availablePowerUps, setAvailablePowerUps] = useState([]);
  const [activePowerUp, setActivePowerUp] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load initial data
  useEffect(() => {
    const stages = gameStageManager.getAllStages();
    setAllStages(stages);
    
    if (userId) {
      const userProgress = gameStageManager.userProgress;
      setProgress(userProgress);
      
      const stage = gameStageManager.getCurrentStage(userProgress.totalScore);
      setCurrentStage(stage);
      
      const powerUps = gameStageManager.getAvailablePowerUps(
        stage.id, 
        userProgress.totalScore
      );
      setAvailablePowerUps(powerUps);
      
      setAchievements(userProgress.achievements || []);
    }
    
    setIsLoading(false);
  }, [userId]);
  
  // Update score and progress
  const updateScore = useCallback((gameResult) => {
    if (!currentStage) return;
    
    const result = gameStageManager.updateProgress(currentStage.id, gameResult);
    
    setProgress(prev => ({
      ...prev,
      ...result
    }));
    
    if (result.newAchievements?.length > 0) {
      setAchievements(prev => [...prev, ...result.newAchievements]);
    }
    
    // Check for stage change
    const newStage = gameStageManager.getCurrentStage(result.totalScore);
    if (newStage.id !== currentStage.id) {
      setCurrentStage(newStage);
    }
    
    return result;
  }, [currentStage]);
  
  // Use a power-up
  const usePowerUp = useCallback((powerUpId, gameState) => {
    const result = gameStageManager.usePowerUp(powerUpId, gameState);
    
    if (result.success) {
      setActivePowerUp(result.powerUp);
      
      // Clear after duration
      if (result.powerUp.duration) {
        setTimeout(() => {
          setActivePowerUp(null);
        }, result.powerUp.duration * 1000);
      }
    }
    
    return result;
  }, []);
  
  // Calculate score with multipliers
  const calculateScore = useCallback((basePoints, streak = 0, accuracy = 1.0, timeBonus = 0) => {
    if (!currentStage) return basePoints;
    
    return gameStageManager.calculateScore(
      basePoints,
      currentStage.id,
      streak,
      accuracy,
      timeBonus
    );
  }, [currentStage]);
  
  // Get recommended games
  const getRecommendedGames = useCallback((userPerformance = {}) => {
    if (!currentStage) return [];
    
    return gameStageManager.getRecommendedGames(currentStage.id, userPerformance);
  }, [currentStage]);
  
  // Check if next stage is unlocked
  const canUnlockNextStage = useCallback(() => {
    if (!currentStage) return false;
    
    const nextStage = gameStageManager.getNextStage(currentStage.id);
    if (!nextStage) return false;
    
    return gameStageManager.isStageUnlocked(nextStage.id, progress);
  }, [currentStage, progress]);
  
  return {
    // State
    currentStage,
    allStages,
    progress,
    availablePowerUps,
    activePowerUp,
    achievements,
    isLoading,
    
    // Computed
    totalScore: progress.totalScore || 0,
    canUnlockNext: canUnlockNextStage(),
    
    // Actions
    updateScore,
    usePowerUp,
    calculateScore,
    getRecommendedGames,
    
    // Direct access
    manager: gameStageManager
  };
}

export default useGameStages;
