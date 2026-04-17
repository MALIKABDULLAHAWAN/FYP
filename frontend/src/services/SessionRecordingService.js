/**
 * SessionRecordingService
 * 
 * Handles session data recording with accurate timestamps and performance metrics.
 * Integrates with DataPersistenceService for immediate persistence and offline support.
 * 
 * Requirements: 16.2 - Session data recording with timestamp
 */

import DataPersistenceService from './DataPersistenceService.js';

class SessionRecordingService {
  constructor() {
    this.persistenceService = new DataPersistenceService();
    this.activeSessions = new Map();
    this.sessionMetrics = new Map();
    this.recordingInterval = null;
  }

  /**
   * Start a new game session
   * @param {Object} sessionConfig - Session configuration
   * @returns {Promise<Object>} - Started session data
   */
  async startSession(sessionConfig) {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();
    
    const sessionData = {
      session_id: sessionId,
      child_id: sessionConfig.child_id,
      game_id: sessionConfig.game_id,
      therapist_id: sessionConfig.therapist_id,
      started_at: startTime.toISOString(),
      client_start_timestamp: Date.now(),
      therapeutic_goals_targeted: sessionConfig.therapeutic_goals || [],
      initial_difficulty: sessionConfig.difficulty || 'Medium',
      session_config: sessionConfig,
      status: 'active'
    };

    // Store active session
    this.activeSessions.set(sessionId, sessionData);
    
    // Initialize session metrics
    this.sessionMetrics.set(sessionId, {
      start_time: Date.now(),
      interactions: [],
      performance_data: [],
      engagement_events: [],
      difficulty_changes: []
    });

    try {
      // Record session start immediately
      const recordedSession = await this.persistenceService.recordSessionData(sessionData);
      
      // Start periodic recording for this session
      this.startPeriodicRecording(sessionId);
      
      console.log(`Session ${sessionId} started and recorded`);
      
      return { ...sessionData, ...(recordedSession || {}) };
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  /**
   * Record session interaction with timestamp
   * @param {string} sessionId - Session identifier
   * @param {Object} interaction - Interaction data
   */
  recordInteraction(sessionId, interaction) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) {
      console.warn(`No active session found: ${sessionId}`);
      return;
    }

    const timestampedInteraction = {
      ...interaction,
      timestamp: new Date().toISOString(),
      client_timestamp: Date.now(),
      session_time_ms: Date.now() - metrics.start_time
    };

    metrics.interactions.push(timestampedInteraction);
    
    // Update session metrics immediately
    this.updateSessionMetrics(sessionId, timestampedInteraction);
  }

  /**
   * Record performance data point
   * @param {string} sessionId - Session identifier
   * @param {Object} performanceData - Performance metrics
   */
  recordPerformance(sessionId, performanceData) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) {
      console.warn(`No active session found: ${sessionId}`);
      return;
    }

    const timestampedPerformance = {
      ...performanceData,
      timestamp: new Date().toISOString(),
      client_timestamp: Date.now(),
      session_time_ms: Date.now() - metrics.start_time
    };

    metrics.performance_data.push(timestampedPerformance);
  }

  /**
   * Record engagement event
   * @param {string} sessionId - Session identifier
   * @param {Object} engagementEvent - Engagement data
   */
  recordEngagement(sessionId, engagementEvent) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) {
      console.warn(`No active session found: ${sessionId}`);
      return;
    }

    const timestampedEngagement = {
      ...engagementEvent,
      timestamp: new Date().toISOString(),
      client_timestamp: Date.now(),
      session_time_ms: Date.now() - metrics.start_time
    };

    metrics.engagement_events.push(timestampedEngagement);
  }

  /**
   * Record difficulty change
   * @param {string} sessionId - Session identifier
   * @param {Object} difficultyChange - Difficulty change data
   */
  recordDifficultyChange(sessionId, difficultyChange) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) {
      console.warn(`No active session found: ${sessionId}`);
      return;
    }

    const timestampedChange = {
      ...difficultyChange,
      timestamp: new Date().toISOString(),
      client_timestamp: Date.now(),
      session_time_ms: Date.now() - metrics.start_time
    };

    metrics.difficulty_changes.push(timestampedChange);
  }

  /**
   * Complete and record session
   * @param {string} sessionId - Session identifier
   * @param {Object} completionData - Session completion data
   * @returns {Promise<Object>} - Completed session record
   */
  async completeSession(sessionId, completionData = {}) {
    const sessionData = this.activeSessions.get(sessionId);
    const metrics = this.sessionMetrics.get(sessionId);
    
    if (!sessionData || !metrics) {
      throw new Error(`No active session found: ${sessionId}`);
    }

    const endTime = new Date();
    const durationMs = Math.max(1, Date.now() - metrics.start_time);

    // Calculate final performance metrics
    const finalMetrics = this.calculateFinalMetrics(metrics);

    const completedSession = {
      ...sessionData,
      completed_at: endTime.toISOString(),
      client_end_timestamp: Date.now(),
      duration_seconds: Math.max(1, Math.round(durationMs / 1000)),
      duration_ms: durationMs,
      performance_metrics: {
        ...finalMetrics,
        ...completionData.performance_metrics
      },
      interaction_count: metrics.interactions.length,
      engagement_score: this.calculateEngagementScore(metrics),
      difficulty_adjustments: metrics.difficulty_changes.length,
      session_summary: {
        total_interactions: metrics.interactions.length,
        performance_data_points: metrics.performance_data.length,
        engagement_events: metrics.engagement_events.length,
        difficulty_changes: metrics.difficulty_changes.length
      },
      therapist_notes: completionData.therapist_notes || '',
      observations: completionData.observations || {},
      child_engagement_level: completionData.child_engagement_level || 'medium',
      status: 'completed'
    };

    try {
      // Stop periodic recording
      this.stopPeriodicRecording(sessionId);
      
      // Record completed session
      const recordedSession = await this.persistenceService.recordSessionData(completedSession);
      
      // Clean up active session data
      this.activeSessions.delete(sessionId);
      this.sessionMetrics.delete(sessionId);
      
      console.log(`Session ${sessionId} completed and recorded`);
      
      return { ...completedSession, ...(recordedSession || {}) };
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  }

  /**
   * Get active session data
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} - Session data or null if not found
   */
  getActiveSession(sessionId) {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get session metrics
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} - Session metrics or null if not found
   */
  getSessionMetrics(sessionId) {
    return this.sessionMetrics.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   * @returns {Array} - Array of active session data
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Start periodic recording for a session
   * @private
   */
  startPeriodicRecording(sessionId) {
    // Record session state every 10 seconds
    const intervalId = setInterval(async () => {
      try {
        await this.recordSessionState(sessionId);
      } catch (error) {
        console.error(`Failed to record periodic state for session ${sessionId}:`, error);
      }
    }, 10000);

    // Store interval ID for cleanup
    const sessionData = this.activeSessions.get(sessionId);
    if (sessionData) {
      sessionData.recording_interval_id = intervalId;
    }
  }

  /**
   * Stop periodic recording for a session
   * @private
   */
  stopPeriodicRecording(sessionId) {
    const sessionData = this.activeSessions.get(sessionId);
    if (sessionData && sessionData.recording_interval_id) {
      clearInterval(sessionData.recording_interval_id);
      delete sessionData.recording_interval_id;
    }
  }

  /**
   * Record current session state
   * @private
   */
  async recordSessionState(sessionId) {
    const sessionData = this.activeSessions.get(sessionId);
    const metrics = this.sessionMetrics.get(sessionId);
    
    if (!sessionData || !metrics) {
      return;
    }

    const currentState = {
      ...sessionData,
      current_timestamp: new Date().toISOString(),
      session_duration_ms: Date.now() - metrics.start_time,
      interaction_count: metrics.interactions.length,
      latest_performance: metrics.performance_data.slice(-1)[0] || null,
      latest_engagement: metrics.engagement_events.slice(-1)[0] || null,
      status: 'active'
    };

    // Update session in persistence service
    await this.persistenceService.recordSessionData(currentState);
  }

  /**
   * Update session metrics based on interaction
   * @private
   */
  updateSessionMetrics(sessionId, interaction) {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) return;

    // Update last activity timestamp
    sessionData.last_activity = new Date().toISOString();
    sessionData.last_activity_timestamp = Date.now();
  }

  /**
   * Calculate final performance metrics
   * @private
   */
  calculateFinalMetrics(metrics) {
    const performanceData = metrics.performance_data;
    
    if (performanceData.length === 0) {
      return {
        score: 0,
        accuracy: 0,
        completion_percentage: 0,
        difficulty_adjusted: metrics.difficulty_changes.length > 0
      };
    }

    // Calculate averages
    const scores = performanceData.map(p => p.score || 0);
    const accuracies = performanceData.map(p => p.accuracy || 0);
    const completions = performanceData.map(p => p.completion_percentage || 0);

    return {
      score: scores.reduce((a, b) => a + b, 0) / scores.length,
      accuracy: Number((accuracies.reduce((a, b) => a + b, 0) / accuracies.length).toFixed(3)),
      completion_percentage: Math.max(...completions),
      difficulty_adjusted: metrics.difficulty_changes.length > 0,
      total_interactions: metrics.interactions.length,
      performance_trend: this.calculatePerformanceTrend(scores)
    };
  }

  /**
   * Calculate engagement score
   * @private
   */
  calculateEngagementScore(metrics) {
    const engagementEvents = metrics.engagement_events;
    
    if (engagementEvents.length === 0) {
      return 50; // Default medium engagement
    }

    // Calculate engagement based on event types and frequency
    let engagementScore = 0;
    const eventWeights = {
      'click': 1,
      'hover': 0.5,
      'focus': 0.8,
      'completion': 2,
      'success': 1.5,
      'error': -0.5
    };

    engagementEvents.forEach(event => {
      const weight = eventWeights[event.type] || 1;
      engagementScore += weight;
    });

    // Normalize to 0-100 scale
    const normalizedScore = Math.min(100, Math.max(0, (engagementScore / engagementEvents.length) * 50));
    
    return Math.round(normalizedScore);
  }

  /**
   * Calculate performance trend
   * @private
   */
  calculatePerformanceTrend(scores) {
    if (scores.length < 2) {
      return 'stable';
    }

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, sessionData] of this.activeSessions.entries()) {
      const sessionAge = now - (sessionData.client_start_timestamp || 0);
      
      if (sessionAge > maxSessionAge) {
        console.log(`Cleaning up expired session: ${sessionId}`);
        this.stopPeriodicRecording(sessionId);
        this.activeSessions.delete(sessionId);
        this.sessionMetrics.delete(sessionId);
      }
    }
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      active_sessions: this.activeSessions.size,
      total_metrics_tracked: this.sessionMetrics.size,
      persistence_stats: this.persistenceService.getStatistics()
    };
  }

  /**
   * Clear all session data
   */
  clear() {
    // Stop all periodic recordings
    for (const sessionId of this.activeSessions.keys()) {
      this.stopPeriodicRecording(sessionId);
    }
    
    this.activeSessions.clear();
    this.sessionMetrics.clear();
    this.persistenceService.clear();
  }
}

export default SessionRecordingService;