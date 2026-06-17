import { useState, useEffect, useCallback } from 'react';
import aiEngine from '../services/AIEngine';

/**
 * REACT HOOK FOR AI ENGINE
 * Provides adaptive learning and personalization features
 */
export function useAI(userId) {
  const [profile, setProfile] = useState(null);
  const [learningStyle, setLearningStyle] = useState(null);
  const [insights, setInsights] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Load profile on mount
  useEffect(() => {
    if (userId) {
      const userProfile = aiEngine.getUserProfile(userId);
      setProfile(userProfile);
      setLearningStyle(userProfile.learningStyle);
    }
  }, [userId]);
  
  // Detect learning style from session data
  const detectLearningStyle = useCallback((sessionData) => {
    if (!userId) return null;
    
    const result = aiEngine.detectLearningStyle(userId, sessionData);
    setLearningStyle(result.dominant);
    
    return result;
  }, [userId]);
  
  // Get personalized greeting
  const getGreeting = useCallback(() => {
    if (!profile) return 'Hello!';
    return aiEngine.generatePersonalizedContent(profile.id, 'greeting');
  }, [profile]);
  
  // Get encouragement message
  const getEncouragement = useCallback(() => {
    if (!profile) return 'Keep going!';
    return aiEngine.generatePersonalizedContent(profile.id, 'encouragement');
  }, [profile]);
  
  // Generate adaptive question
  const generateQuestion = useCallback((gameType, stage) => {
    if (!userId) return null;
    
    return aiEngine.generateAdaptiveQuestion(userId, gameType, stage);
  }, [userId]);
  
  // Get optimal difficulty
  const getDifficulty = useCallback((gameType) => {
    if (!userId) return 2;
    
    return aiEngine.calculateOptimalDifficulty(userId, gameType);
  }, [userId]);
  
  // Generate personalized feedback
  const getFeedback = useCallback((result) => {
    if (!profile) return 'Good job!';
    return aiEngine.generateFeedback(result, profile);
  }, [profile]);
  
  // Analyze session and get insights
  const analyzeSession = useCallback(async (sessionData) => {
    if (!userId) return [];
    
    setIsAnalyzing(true);
    
    try {
      const sessionInsights = aiEngine.analyzeSession(userId, sessionData);
      setInsights(sessionInsights);
      
      // Update profile
      const updatedProfile = aiEngine.getUserProfile(userId);
      setProfile(updatedProfile);
      
      return sessionInsights;
    } finally {
      setIsAnalyzing(false);
    }
  }, [userId]);
  
  // Get performance prediction
  const predictPerformance = useCallback((gameType, difficulty) => {
    if (!userId) return { prediction: 'uncertain', confidence: 0 };
    
    return aiEngine.predictPerformance(userId, gameType, difficulty);
  }, [userId]);
  
  // Get next recommended activity
  const getRecommendation = useCallback(() => {
    if (!userId) return { type: 'memory', difficulty: 1 };
    
    return aiEngine.recommendNextActivity(userId);
  }, [userId]);
  
  // Get personalized instruction
  const getInstruction = useCallback((task) => {
    if (!profile || !profile.learningStyle) return task;
    
    const style = aiEngine.learningStyles[profile.learningStyle];
    return aiEngine.generateInstruction(task, style);
  }, [profile]);
  
  // Update profile settings
  const updateSettings = useCallback((settings) => {
    if (!userId) return;
    
    const updated = aiEngine.updateUserProfile(userId, {
      settings: { ...profile?.settings, ...settings }
    });
    setProfile(updated);
  }, [userId, profile]);
  
  return {
    // State
    profile,
    learningStyle,
    insights,
    isAnalyzing,
    
    // Learning style info
    learningStyleName: learningStyle ? aiEngine.learningStyles[learningStyle]?.name : null,
    learningStyleConfig: learningStyle ? aiEngine.learningStyles[learningStyle] : null,
    
    // Actions
    detectLearningStyle,
    getGreeting,
    getEncouragement,
    generateQuestion,
    getDifficulty,
    getFeedback,
    analyzeSession,
    predictPerformance,
    getRecommendation,
    getInstruction,
    updateSettings,
    
    // Direct access
    engine: aiEngine
  };
}

export default useAI;
