/**
 * Unit tests for GameMetadataService
 * Tests game metadata retrieval, enrichment, and analytics functionality
 */

import GameMetadataService from '../GameMetadataService.js';

describe('GameMetadataService', () => {
  let gameMetadataService;

  beforeEach(() => {
    gameMetadataService = new GameMetadataService();
  });

  afterEach(() => {
    gameMetadataService.clearCache();
  });

  describe('getGameMetadata', () => {
    test('should retrieve valid game metadata', async () => {
      const metadata = await gameMetadataService.getGameMetadata('speech-repetition');

      expect(metadata).toBeDefined();
      expect(metadata.id).toBe('speech-repetition');
      expect(metadata.name).toBe('Speech Repetition Practice');
      expect(metadata.therapeuticGoals).toContain('articulation-improvement');
      expect(metadata.difficultyLevel).toBe(2);
      expect(metadata.evidenceBase).toHaveLength(2);
      expect(metadata.adaptations).toHaveLength(3);
    });

    test('should cache metadata after first retrieval', async () => {
      const metadata1 = await gameMetadataService.getGameMetadata('picture-naming');
      const metadata2 = await gameMetadataService.getGameMetadata('picture-naming');

      expect(metadata1).toBe(metadata2); // Same object reference due to caching
    });

    test('should throw error for invalid game ID', async () => {
      await expect(gameMetadataService.getGameMetadata('invalid-game'))
        .rejects.toThrow('GameMetadataNotFoundException');
    });
  });

  describe('getActivityMetadata', () => {
    test('should map activity types to game IDs', async () => {
      const metadata = await gameMetadataService.getActivityMetadata('repetition');

      expect(metadata.id).toBe('speech-repetition');
      expect(metadata.therapeuticGoals).toContain('articulation-improvement');
    });

    test('should handle all supported activity types', async () => {
      const activities = ['repetition', 'picture_naming', 'questions', 'story_retell', 'category_naming'];
      
      for (const activity of activities) {
        const metadata = await gameMetadataService.getActivityMetadata(activity);
        expect(metadata).toBeDefined();
        expect(metadata.id).toBeTruthy();
        expect(metadata.therapeuticGoals).toBeDefined();
      }
    });
  });

  describe('enrichGameWithMetadata', () => {
    const mockGameSession = {
      sessionId: 'test-session-123',
      gameId: 'speech-repetition',
      childId: 'child-456'
    };

    const mockChildProfile = {
      id: 'child-456',
      fullName: 'Test Child',
      dateOfBirth: '2015-01-01',
      therapeuticNeeds: ['articulation-improvement', 'visual-processing'],
      needsVisualSupports: true,
      needsExtendedTime: false
    };

    test('should enrich session with comprehensive metadata', async () => {
      const enrichedSession = await gameMetadataService.enrichGameWithMetadata(
        mockGameSession, 
        mockChildProfile
      );

      expect(enrichedSession.metadata).toBeDefined();
      expect(enrichedSession.therapeuticContext).toBeDefined();
      expect(enrichedSession.dataCollection).toBeDefined();
      expect(enrichedSession.performanceTracking).toBeDefined();
      expect(enrichedSession.enrichedAt).toBeDefined();
    });

    test('should analyze therapeutic needs correctly', async () => {
      const enrichedSession = await gameMetadataService.enrichGameWithMetadata(
        mockGameSession, 
        mockChildProfile
      );

      const { therapeuticNeeds } = enrichedSession.therapeuticContext;
      
      expect(therapeuticNeeds).toContain('articulation-improvement');
      expect(therapeuticNeeds).toContain('visual-processing');
      expect(therapeuticNeeds).toContain('comprehension-support'); // Inferred from needsVisualSupports
    });

    test('should calculate appropriate adaptations', async () => {
      const enrichedSession = await gameMetadataService.enrichGameWithMetadata(
        mockGameSession, 
        mockChildProfile
      );

      const { recommendedAdaptations } = enrichedSession.therapeuticContext;
      
      expect(recommendedAdaptations.length).toBeGreaterThan(0);
      
      // Should include Visual Supports adaptation due to needsVisualSupports
      const visualSupportsAdaptation = recommendedAdaptations.find(
        adaptation => adaptation.name === 'Visual Supports'
      );
      expect(visualSupportsAdaptation).toBeDefined();
      expect(visualSupportsAdaptation.configured).toBe(true);
      expect(visualSupportsAdaptation.matchingNeeds).toBeDefined();
    });

    test('should configure data collection appropriately', async () => {
      const enrichedSession = await gameMetadataService.enrichGameWithMetadata(
        mockGameSession, 
        mockChildProfile
      );

      const { dataCollection } = enrichedSession;
      
      expect(dataCollection.primaryMetrics).toContain('accuracy');
      expect(dataCollection.primaryMetrics).toContain('response-time');
      expect(dataCollection.collectionFrequency).toBe('per-trial');
      expect(dataCollection.therapeuticAlignment).toBe(true);
    });

    test('should initialize performance tracking', async () => {
      const enrichedSession = await gameMetadataService.enrichGameWithMetadata(
        mockGameSession, 
        mockChildProfile
      );

      const { performanceTracking } = enrichedSession;
      
      expect(performanceTracking.gameId).toBe('speech-repetition');
      expect(performanceTracking.childId).toBe('child-456');
      expect(performanceTracking.progressIndicators).toBeDefined();
      expect(performanceTracking.trackingStarted).toBeDefined();
    });

    test('should handle child with extended time needs', async () => {
      const childWithExtendedTime = {
        ...mockChildProfile,
        needsExtendedTime: true
      };

      const enrichedSession = await gameMetadataService.enrichGameWithMetadata(
        mockGameSession, 
        childWithExtendedTime
      );

      const { therapeuticNeeds } = enrichedSession.therapeuticContext;
      const { dataCollection } = enrichedSession;
      
      expect(therapeuticNeeds).toContain('processing-time');
      expect(therapeuticNeeds).toContain('motor-planning');
      expect(dataCollection.additionalMetrics).toContain('response-latency');
    });
  });

  describe('session recording and analytics', () => {
    const mockSession = {
      gameId: 'speech-repetition',
      childId: 'child-123',
      accuracy: 0.85,
      responseTime: 2.5,
      completed: true
    };

    test('should record session data', async () => {
      await gameMetadataService.recordSession(mockSession);

      // Session should be stored with generated ID
      expect(mockSession.sessionId).toBeDefined();
      expect(mockSession.recordedAt).toBeDefined();
    });

    test('should update analytics after recording session', async () => {
      await gameMetadataService.recordSession(mockSession);
      
      const analytics = await gameMetadataService.getAnalytics('child-123');
      
      expect(analytics.childId).toBe('child-123');
      expect(analytics.totalSessions).toBe(1);
      expect(analytics.gamePerformance['speech-repetition']).toBeDefined();
      expect(analytics.gamePerformance['speech-repetition'].sessions).toBe(1);
    });

    test('should accumulate analytics over multiple sessions', async () => {
      const session1 = { ...mockSession, accuracy: 0.8 };
      const session2 = { ...mockSession, accuracy: 0.9 };
      
      await gameMetadataService.recordSession(session1);
      await gameMetadataService.recordSession(session2);
      
      const analytics = await gameMetadataService.getAnalytics('child-123');
      
      expect(analytics.totalSessions).toBe(2);
      expect(analytics.gamePerformance['speech-repetition'].sessions).toBe(2);
    });

    test('should return empty analytics for unknown child', async () => {
      const analytics = await gameMetadataService.getAnalytics('unknown-child');
      
      expect(analytics.childId).toBe('unknown-child');
      expect(analytics.totalSessions).toBe(0);
      expect(analytics.gamePerformance).toEqual({});
    });
  });

  describe('analytics reporting', () => {
    beforeEach(async () => {
      // Set up test data
      await gameMetadataService.recordSession({
        gameId: 'speech-repetition',
        childId: 'child-1',
        accuracy: 0.85
      });
      
      await gameMetadataService.recordSession({
        gameId: 'picture-naming',
        childId: 'child-2',
        accuracy: 0.92
      });
    });

    test('should export comprehensive analytics report', () => {
      const report = gameMetadataService.exportAnalyticsReport();
      
      expect(report.totalChildren).toBe(2);
      expect(report.totalSessions).toBe(2);
      expect(report.childrenAnalytics).toHaveLength(2);
      expect(report.generatedAt).toBeDefined();
    });

    test('should export child-specific analytics report', () => {
      const childReport = gameMetadataService.exportAnalyticsReport('child-1');
      
      expect(childReport.childId).toBe('child-1');
      expect(childReport.totalSessions).toBe(1);
      expect(childReport.gamePerformance['speech-repetition']).toBeDefined();
    });

    test('should return null for unknown child in specific report', () => {
      const report = gameMetadataService.exportAnalyticsReport('unknown-child');
      expect(report).toBeNull();
    });
  });

  describe('validation and error handling', () => {
    test('should validate therapeutic alignment', async () => {
      const validSession = {
        metadata: {
          therapeuticGoals: ['articulation-improvement', 'phonological-awareness']
        },
        therapeuticContext: {
          therapeuticNeeds: ['articulation-improvement', 'visual-processing']
        }
      };

      expect(() => {
        gameMetadataService.validateTherapeuticAlignment(validSession);
      }).not.toThrow();
    });

    test('should throw error for invalid therapeutic alignment', () => {
      const invalidSession = {
        metadata: null,
        therapeuticContext: {
          therapeuticNeeds: ['articulation-improvement']
        }
      };

      expect(() => {
        gameMetadataService.validateTherapeuticAlignment(invalidSession);
      }).toThrow('Invalid therapeutic alignment');
    });

    test('should warn about limited alignment', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const limitedAlignmentSession = {
        metadata: {
          therapeuticGoals: ['unrelated-goal']
        },
        therapeuticContext: {
          therapeuticNeeds: ['completely-different-need']
        }
      };

      gameMetadataService.validateTherapeuticAlignment(limitedAlignmentSession);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Limited therapeutic alignment')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('utility functions', () => {
    test('should generate unique session IDs', () => {
      const id1 = gameMetadataService.generateSessionId();
      const id2 = gameMetadataService.generateSessionId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    test('should clear cache properly', async () => {
      await gameMetadataService.getGameMetadata('speech-repetition');
      expect(gameMetadataService.metadataCache.size).toBe(1);
      
      gameMetadataService.clearCache();
      expect(gameMetadataService.metadataCache.size).toBe(0);
    });
  });
});