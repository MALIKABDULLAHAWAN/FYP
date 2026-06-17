/**
 * SessionRecordingService Tests
 * 
 * Tests for session data recording with accurate timestamps and performance metrics.
 * Tests Requirement: 16.2 - Session data recording with timestamp
 */

import SessionRecordingService from '../SessionRecordingService.js';
import DataPersistenceService from '../DataPersistenceService.js';

// Mock DataPersistenceService
jest.mock('../DataPersistenceService.js');

describe('SessionRecordingService', () => {
  let service;
  let mockPersistenceService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPersistenceService = {
      recordSessionData: jest.fn().mockResolvedValue({ success: true }),
      getStatistics: jest.fn().mockReturnValue({ cache_size: 0 }),
      clear: jest.fn()
    };
    
    DataPersistenceService.mockImplementation(() => mockPersistenceService);
    
    service = new SessionRecordingService();
  });

  describe('Session Management', () => {
    test('should start a new session with proper timestamps', async () => {
      const sessionConfig = {
        child_id: 'child-123',
        game_id: 'game-456',
        therapist_id: 'therapist-789',
        therapeutic_goals: ['speech-articulation', 'social-awareness'],
        difficulty: 'Medium'
      };

      const result = await service.startSession(sessionConfig);

      expect(result.session_id).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(result.child_id).toBe(sessionConfig.child_id);
      expect(result.game_id).toBe(sessionConfig.game_id);
      expect(result.therapist_id).toBe(sessionConfig.therapist_id);
      expect(result.started_at).toBeDefined();
      expect(result.client_start_timestamp).toBeDefined();
      expect(result.therapeutic_goals_targeted).toEqual(sessionConfig.therapeutic_goals);
      expect(result.initial_difficulty).toBe('Medium');
      expect(result.status).toBe('active');

      // Verify session is stored in active sessions
      expect(service.activeSessions.has(result.session_id)).toBe(true);
      expect(service.sessionMetrics.has(result.session_id)).toBe(true);

      // Verify persistence service was called
      expect(mockPersistenceService.recordSessionData).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: result.session_id,
          child_id: sessionConfig.child_id,
          status: 'active'
        })
      );
    });

    test('should handle session start failure', async () => {
      const sessionConfig = {
        child_id: 'child-fail',
        game_id: 'game-fail'
      };

      mockPersistenceService.recordSessionData.mockRejectedValue(new Error('Persistence failed'));

      await expect(service.startSession(sessionConfig)).rejects.toThrow('Persistence failed');
    });
  });

  describe('Interaction Recording', () => {
    test('should record interactions with accurate timestamps', async () => {
      // Start a session first
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      const interaction = {
        type: 'click',
        target: 'game-button',
        value: 'start-game'
      };

      service.recordInteraction(sessionId, interaction);

      const metrics = service.getSessionMetrics(sessionId);
      expect(metrics.interactions).toHaveLength(1);
      
      const recordedInteraction = metrics.interactions[0];
      expect(recordedInteraction.type).toBe('click');
      expect(recordedInteraction.target).toBe('game-button');
      expect(recordedInteraction.timestamp).toBeDefined();
      expect(recordedInteraction.client_timestamp).toBeDefined();
      expect(recordedInteraction.session_time_ms).toBeGreaterThanOrEqual(0);
    });

    test('should handle interactions for non-existent sessions', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      service.recordInteraction('non-existent-session', { type: 'click' });

      expect(consoleSpy).toHaveBeenCalledWith('No active session found: non-existent-session');
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Recording', () => {
    test('should record performance data with timestamps', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      const performanceData = {
        score: 85,
        accuracy: 0.9,
        completion_percentage: 0.75
      };

      service.recordPerformance(sessionId, performanceData);

      const metrics = service.getSessionMetrics(sessionId);
      expect(metrics.performance_data).toHaveLength(1);
      
      const recordedPerformance = metrics.performance_data[0];
      expect(recordedPerformance.score).toBe(85);
      expect(recordedPerformance.accuracy).toBe(0.9);
      expect(recordedPerformance.timestamp).toBeDefined();
      expect(recordedPerformance.session_time_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Engagement Recording', () => {
    test('should record engagement events with timestamps', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      const engagementEvent = {
        type: 'success',
        level: 'high',
        duration_ms: 5000
      };

      service.recordEngagement(sessionId, engagementEvent);

      const metrics = service.getSessionMetrics(sessionId);
      expect(metrics.engagement_events).toHaveLength(1);
      
      const recordedEngagement = metrics.engagement_events[0];
      expect(recordedEngagement.type).toBe('success');
      expect(recordedEngagement.level).toBe('high');
      expect(recordedEngagement.timestamp).toBeDefined();
    });
  });

  describe('Difficulty Change Recording', () => {
    test('should record difficulty changes with timestamps', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      const difficultyChange = {
        from: 'Medium',
        to: 'Hard',
        reason: 'child_performing_well',
        triggered_by: 'system'
      };

      service.recordDifficultyChange(sessionId, difficultyChange);

      const metrics = service.getSessionMetrics(sessionId);
      expect(metrics.difficulty_changes).toHaveLength(1);
      
      const recordedChange = metrics.difficulty_changes[0];
      expect(recordedChange.from).toBe('Medium');
      expect(recordedChange.to).toBe('Hard');
      expect(recordedChange.reason).toBe('child_performing_well');
      expect(recordedChange.timestamp).toBeDefined();
    });
  });

  describe('Session Completion', () => {
    test('should complete session with comprehensive metrics', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      // Add some test data
      service.recordInteraction(sessionId, { type: 'click', target: 'button1' });
      service.recordInteraction(sessionId, { type: 'click', target: 'button2' });
      service.recordPerformance(sessionId, { score: 80, accuracy: 0.8 });
      service.recordPerformance(sessionId, { score: 90, accuracy: 0.9 });
      service.recordEngagement(sessionId, { type: 'success', level: 'high' });
      service.recordDifficultyChange(sessionId, { from: 'Easy', to: 'Medium' });

      const completionData = {
        therapist_notes: 'Child showed great improvement',
        child_engagement_level: 'high',
        observations: {
          behavior_notes: 'Very focused throughout the session',
          progress_indicators: ['improved_accuracy', 'faster_response_time']
        }
      };

      const result = await service.completeSession(sessionId, completionData);

      expect(result.session_id).toBe(sessionId);
      expect(result.completed_at).toBeDefined();
      expect(result.client_end_timestamp).toBeDefined();
      expect(result.duration_seconds).toBeGreaterThan(0);
      expect(result.duration_ms).toBeGreaterThan(0);
      expect(result.status).toBe('completed');

      // Check performance metrics
      expect(result.performance_metrics.score).toBe(85); // Average of 80 and 90
      expect(result.performance_metrics.accuracy).toBe(0.85); // Average of 0.8 and 0.9
      expect(result.performance_metrics.difficulty_adjusted).toBe(true);
      expect(result.performance_metrics.total_interactions).toBe(2);

      // Check session summary
      expect(result.session_summary.total_interactions).toBe(2);
      expect(result.session_summary.performance_data_points).toBe(2);
      expect(result.session_summary.engagement_events).toBe(1);
      expect(result.session_summary.difficulty_changes).toBe(1);

      // Check completion data
      expect(result.therapist_notes).toBe(completionData.therapist_notes);
      expect(result.child_engagement_level).toBe(completionData.child_engagement_level);
      expect(result.observations).toEqual(completionData.observations);

      // Verify session was removed from active sessions
      expect(service.activeSessions.has(sessionId)).toBe(false);
      expect(service.sessionMetrics.has(sessionId)).toBe(false);

      // Verify persistence service was called
      expect(mockPersistenceService.recordSessionData).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: sessionId,
          status: 'completed'
        })
      );
    });

    test('should handle completion of non-existent session', async () => {
      await expect(service.completeSession('non-existent-session')).rejects.toThrow(
        'No active session found: non-existent-session'
      );
    });

    test('should calculate engagement score correctly', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      // Add engagement events with different weights
      service.recordEngagement(sessionId, { type: 'click' }); // weight: 1
      service.recordEngagement(sessionId, { type: 'completion' }); // weight: 2
      service.recordEngagement(sessionId, { type: 'success' }); // weight: 1.5
      service.recordEngagement(sessionId, { type: 'error' }); // weight: -0.5

      const result = await service.completeSession(sessionId);

      // Expected: (1 + 2 + 1.5 - 0.5) / 4 * 50 = 50
      expect(result.engagement_score).toBe(50);
    });
  });

  describe('Session Retrieval', () => {
    test('should retrieve active session data', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      const retrievedSession = service.getActiveSession(sessionId);

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession.session_id).toBe(sessionId);
      expect(retrievedSession.child_id).toBe(sessionConfig.child_id);
    });

    test('should return null for non-existent session', () => {
      const retrievedSession = service.getActiveSession('non-existent');
      expect(retrievedSession).toBeNull();
    });

    test('should retrieve session metrics', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      const metrics = service.getSessionMetrics(sessionId);

      expect(metrics).toBeDefined();
      expect(metrics.start_time).toBeDefined();
      expect(metrics.interactions).toEqual([]);
      expect(metrics.performance_data).toEqual([]);
      expect(metrics.engagement_events).toEqual([]);
      expect(metrics.difficulty_changes).toEqual([]);
    });

    test('should get all active sessions', async () => {
      const session1 = await service.startSession({ child_id: 'child-1', game_id: 'game-1' });
      const session2 = await service.startSession({ child_id: 'child-2', game_id: 'game-2' });

      const activeSessions = service.getActiveSessions();

      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.map(s => s.session_id)).toContain(session1.session_id);
      expect(activeSessions.map(s => s.session_id)).toContain(session2.session_id);
    });
  });

  describe('Performance Trend Calculation', () => {
    test('should calculate improving performance trend', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      // Add performance data showing improvement
      service.recordPerformance(sessionId, { score: 60 });
      service.recordPerformance(sessionId, { score: 65 });
      service.recordPerformance(sessionId, { score: 75 });
      service.recordPerformance(sessionId, { score: 80 });

      const result = await service.completeSession(sessionId);

      expect(result.performance_metrics.performance_trend).toBe('improving');
    });

    test('should calculate declining performance trend', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      // Add performance data showing decline
      service.recordPerformance(sessionId, { score: 80 });
      service.recordPerformance(sessionId, { score: 75 });
      service.recordPerformance(sessionId, { score: 65 });
      service.recordPerformance(sessionId, { score: 60 });

      const result = await service.completeSession(sessionId);

      expect(result.performance_metrics.performance_trend).toBe('declining');
    });

    test('should calculate stable performance trend', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      // Add stable performance data
      service.recordPerformance(sessionId, { score: 75 });
      service.recordPerformance(sessionId, { score: 73 });
      service.recordPerformance(sessionId, { score: 77 });
      service.recordPerformance(sessionId, { score: 76 });

      const result = await service.completeSession(sessionId);

      expect(result.performance_metrics.performance_trend).toBe('stable');
    });
  });

  describe('Periodic Recording', () => {
    test('should start and stop periodic recording', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      // Verify periodic recording was started
      const sessionData = service.getActiveSession(sessionId);
      expect(sessionData.recording_interval_id).toBeDefined();

      // Complete session to stop periodic recording
      await service.completeSession(sessionId);

      // Verify interval was cleared (session no longer exists)
      expect(service.getActiveSession(sessionId)).toBeNull();
    });
  });

  describe('Session Cleanup', () => {
    test('should cleanup expired sessions', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      // Manually set old timestamp to simulate expired session
      const sessionData = service.getActiveSession(sessionId);
      sessionData.client_start_timestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago

      service.cleanupExpiredSessions();

      expect(service.getActiveSession(sessionId)).toBeNull();
      expect(service.getSessionMetrics(sessionId)).toBeNull();
    });

    test('should not cleanup recent sessions', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      service.cleanupExpiredSessions();

      expect(service.getActiveSession(sessionId)).toBeDefined();
      expect(service.getSessionMetrics(sessionId)).toBeDefined();
    });
  });

  describe('Service Management', () => {
    test('should provide service statistics', async () => {
      const session1 = await service.startSession({ child_id: 'child-1', game_id: 'game-1' });
      const session2 = await service.startSession({ child_id: 'child-2', game_id: 'game-2' });

      const stats = service.getStatistics();

      expect(stats.active_sessions).toBe(2);
      expect(stats.total_metrics_tracked).toBe(2);
      expect(stats.persistence_stats).toBeDefined();
    });

    test('should clear all session data', async () => {
      const session1 = await service.startSession({ child_id: 'child-1', game_id: 'game-1' });
      const session2 = await service.startSession({ child_id: 'child-2', game_id: 'game-2' });

      service.clear();

      expect(service.getActiveSessions()).toHaveLength(0);
      expect(service.getSessionMetrics(session1.session_id)).toBeNull();
      expect(service.getSessionMetrics(session2.session_id)).toBeNull();
      expect(mockPersistenceService.clear).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle persistence service failures during session start', async () => {
      mockPersistenceService.recordSessionData.mockRejectedValue(new Error('Database error'));

      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };

      await expect(service.startSession(sessionConfig)).rejects.toThrow('Database error');
    });

    test('should handle persistence service failures during session completion', async () => {
      const sessionConfig = { child_id: 'child-123', game_id: 'game-456' };
      const session = await service.startSession(sessionConfig);
      const sessionId = session.session_id;

      // Reset mock to simulate failure on completion
      mockPersistenceService.recordSessionData.mockRejectedValue(new Error('Completion failed'));

      await expect(service.completeSession(sessionId)).rejects.toThrow('Completion failed');
    });
  });
});