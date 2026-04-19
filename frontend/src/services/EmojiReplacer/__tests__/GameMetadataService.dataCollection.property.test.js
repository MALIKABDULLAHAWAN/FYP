/**
 * Property-based tests for GameMetadataService data collection framework
 * Tests comprehensive data collection properties
 */

import fc from 'fast-check';
import GameMetadataService from '../GameMetadataService.js';

describe('GameMetadataService - Data Collection Property Tests', () => {
  let gameMetadataService;

  beforeEach(() => {
    gameMetadataService = new GameMetadataService();
    // Clear all data to ensure clean state
    gameMetadataService.sessionData.clear();
    gameMetadataService.analyticsData.clear();
  });

  afterEach(() => {
    gameMetadataService.clearCache();
    gameMetadataService.sessionData.clear();
    gameMetadataService.analyticsData.clear();
  });

  /**
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
   * Property 8: Comprehensive Data Collection
   * 
   * For any therapeutic session, the system should initialize tracking, record adaptations,
   * persist session data, and provide correlation analytics between enhancements and outcomes
   */
  describe('Property 8: Comprehensive Data Collection', () => {
    const sessionDataArb = fc.record({
      gameId: fc.constantFrom('speech-repetition', 'picture-naming', 'question-answer', 'story-retell', 'category-naming'),
      childId: fc.string({ minLength: 1, maxLength: 20 }),
      accuracy: fc.float({ min: 0, max: 1 }),
      responseTime: fc.float({ min: 0.5, max: 15 }),
      completed: fc.boolean(),
      duration: fc.integer({ min: 30, max: 1800 }), // 30 seconds to 30 minutes
      attemptsPerTrial: fc.integer({ min: 1, max: 5 }),
      selfCorrections: fc.integer({ min: 0, max: 10 }),
      frustrationIndicators: fc.integer({ min: 0, max: 5 }),
      adaptationsUsed: fc.array(
        fc.record({
          name: fc.constantFrom('Visual Supports', 'Extended Response Time', 'Reduced Complexity'),
          effectiveness: fc.float({ min: 0, max: 1 }),
          frequency: fc.integer({ min: 1, max: 10 }),
          prePerformance: fc.float({ min: 0, max: 1 }),
          postPerformance: fc.float({ min: 0, max: 1 })
        }),
        { maxLength: 3 }
      )
    });

    test('should initialize performance tracking for all sessions', async () => {
      await fc.assert(fc.asyncProperty(
        sessionDataArb,
        async (sessionData) => {
          await gameMetadataService.recordSession(sessionData);
          
          // Verify session was recorded with tracking data
          expect(sessionData.sessionId).toBeDefined();
          expect(sessionData.recordedAt).toBeDefined();
          
          // Get the recorded session
          const recordedSession = gameMetadataService.sessionData.get(sessionData.sessionId);
          expect(recordedSession).toBeDefined();
          
          // Verify therapeutic metrics are calculated
          expect(recordedSession.therapeuticMetrics).toBeDefined();
          expect(recordedSession.therapeuticMetrics.primaryOutcomes).toBeDefined();
          expect(recordedSession.therapeuticMetrics.engagementIndicators).toBeDefined();
          
          // Verify primary outcomes tracking
          if (sessionData.accuracy !== undefined) {
            expect(recordedSession.therapeuticMetrics.primaryOutcomes.accuracy).toBe(sessionData.accuracy);
            expect(recordedSession.therapeuticMetrics.primaryOutcomes.accuracyCategory).toBeDefined();
            expect(recordedSession.therapeuticMetrics.primaryOutcomes.accuracyCategory).toMatch(
              /^(excellent|good|fair|needs-improvement|significant-concern)$/
            );
          }
          
          if (sessionData.responseTime !== undefined) {
            expect(recordedSession.therapeuticMetrics.primaryOutcomes.responseTime).toBe(sessionData.responseTime);
            expect(recordedSession.therapeuticMetrics.primaryOutcomes.responseTimeCategory).toBeDefined();
            expect(recordedSession.therapeuticMetrics.primaryOutcomes.responseTimeCategory).toMatch(
              /^(fast|normal|slow|very-slow)$/
            );
          }
        }
      ), { numRuns: 50 });
    });

    test('should record adaptation configurations and effectiveness', async () => {
      await fc.assert(fc.asyncProperty(
        sessionDataArb.filter(s => s.adaptationsUsed && s.adaptationsUsed.length > 0),
        async (sessionData) => {
          await gameMetadataService.recordSession(sessionData);
          
          const recordedSession = gameMetadataService.sessionData.get(sessionData.sessionId);
          
          // Verify adaptation effectiveness is assessed
          expect(recordedSession.adaptationEffectiveness).toBeDefined();
          
          if (sessionData.adaptationsUsed.length > 0) {
            expect(recordedSession.adaptationEffectiveness.noAdaptationsUsed).toBeUndefined();
            
            sessionData.adaptationsUsed.forEach(adaptation => {
              const effectiveness = recordedSession.adaptationEffectiveness[adaptation.name];
              expect(effectiveness).toBeDefined();
              
              // Verify effectiveness structure
              expect(effectiveness.preAdaptationPerformance).toBeDefined();
              expect(effectiveness.postAdaptationPerformance).toBeDefined();
              expect(effectiveness.improvementMeasured).toBeDefined();
              expect(effectiveness.effectivenessScore).toBeGreaterThanOrEqual(0);
              expect(effectiveness.effectivenessScore).toBeLessThanOrEqual(1);
              
              // If both pre and post data available, improvement should be calculated
              if (adaptation.prePerformance && adaptation.postPerformance) {
                expect(effectiveness.improvementMeasured).toBe(true);
                expect(effectiveness.improvementAmount).toBeDefined();
              }
            });
          }
        }
      ), { numRuns: 30 });
    });

    test('should persist structured session data with all required fields', async () => {
      await fc.assert(fc.asyncProperty(
        sessionDataArb,
        async (sessionData) => {
          await gameMetadataService.recordSession(sessionData);
          
          const recordedSession = gameMetadataService.sessionData.get(sessionData.sessionId);
          
          // Verify all original data is preserved
          expect(recordedSession.gameId).toBe(sessionData.gameId);
          expect(recordedSession.childId).toBe(sessionData.childId);
          expect(recordedSession.accuracy).toBe(sessionData.accuracy);
          expect(recordedSession.responseTime).toBe(sessionData.responseTime);
          expect(recordedSession.completed).toBe(sessionData.completed);
          
          // Verify enhanced data is added
          expect(recordedSession.sessionId).toBeDefined();
          expect(recordedSession.recordedAt).toBeDefined();
          expect(recordedSession.therapeuticMetrics).toBeDefined();
          expect(recordedSession.adaptationEffectiveness).toBeDefined();
          
          // Verify timestamp format
          expect(new Date(recordedSession.recordedAt)).toBeInstanceOf(Date);
          expect(new Date(recordedSession.recordedAt).getTime()).not.toBeNaN();
        }
      ), { numRuns: 40 });
    });

    test('should provide analytics correlation between enhancements and outcomes', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(sessionDataArb, { minLength: 2, maxLength: 8 }),
        async (sessions) => {
          // Create a fresh service instance for this test
          const freshService = new GameMetadataService();
          
          // Record multiple sessions for the same child
          const childId = sessions[0].childId;
          const childSessions = sessions.map(s => ({ ...s, childId }));
          
          for (const session of childSessions) {
            await freshService.recordSession(session);
          }
          
          const analytics = await freshService.getAnalytics(childId);
          
          // Verify analytics structure
          expect(analytics.childId).toBe(childId);
          expect(analytics.totalSessions).toBe(childSessions.length);
          
          // Verify outcome correlations
          expect(analytics.outcomeCorrelations).toBeDefined();
          expect(analytics.outcomeCorrelations.gameTypeEffectiveness).toBeDefined();
          expect(analytics.outcomeCorrelations.adaptationImpact).toBeDefined();
          expect(analytics.outcomeCorrelations.progressionPatterns).toBeDefined();
          expect(analytics.outcomeCorrelations.therapeuticGoalAlignment).toBeDefined();
          
          // Verify therapeutic effectiveness assessment
          expect(analytics.therapeuticEffectiveness).toBeDefined();
          expect(analytics.therapeuticEffectiveness.overallEffectiveness).toBeGreaterThanOrEqual(0);
          expect(analytics.therapeuticEffectiveness.overallEffectiveness).toBeLessThanOrEqual(1);
          expect(analytics.therapeuticEffectiveness.goalProgressions).toBeDefined();
          expect(analytics.therapeuticEffectiveness.recommendedAdjustments).toBeDefined();
          expect(Array.isArray(analytics.therapeuticEffectiveness.recommendedAdjustments)).toBe(true);
          expect(analytics.therapeuticEffectiveness.clinicalSignificance).toBeDefined();
          expect(analytics.therapeuticEffectiveness.clinicalSignificance).toMatch(
            /^(clinically-significant-improvement|moderate-improvement|minimal-improvement|no-significant-change)$/
          );
          
          // Verify game performance tracking
          Object.values(analytics.gamePerformance).forEach(gamePerf => {
            expect(gamePerf.sessions).toBeGreaterThan(0);
            expect(gamePerf.averageAccuracy).toBeGreaterThanOrEqual(0);
            expect(gamePerf.averageAccuracy).toBeLessThanOrEqual(1);
            expect(gamePerf.averageResponseTime).toBeGreaterThanOrEqual(0); // Allow 0 for edge cases
          });
        }
      ), { numRuns: 20 });
    });

    test('should maintain data collection consistency across multiple sessions', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(sessionDataArb, { minLength: 3, maxLength: 10 }),
        async (sessions) => {
          // Record all sessions
          for (const session of sessions) {
            await gameMetadataService.recordSession(session);
          }
          
          // Verify each session maintains data integrity
          sessions.forEach(originalSession => {
            const recordedSession = gameMetadataService.sessionData.get(originalSession.sessionId);
            expect(recordedSession).toBeDefined();
            
            // Verify therapeutic metrics consistency
            const metrics = recordedSession.therapeuticMetrics;
            expect(metrics.primaryOutcomes).toBeDefined();
            expect(metrics.engagementIndicators).toBeDefined();
            
            // Verify engagement indicators
            expect(metrics.engagementIndicators.sessionDuration).toBe(originalSession.duration || 0);
            expect(metrics.engagementIndicators.attemptsPerTrial).toBe(originalSession.attemptsPerTrial || 1);
            expect(metrics.engagementIndicators.selfCorrections).toBe(originalSession.selfCorrections || 0);
            expect(metrics.engagementIndicators.frustrationIndicators).toBe(originalSession.frustrationIndicators || 0);
          });
        }
      ), { numRuns: 25 });
    });

    test('should handle edge cases in data collection gracefully', async () => {
      const edgeCaseSessionArb = fc.record({
        gameId: fc.constantFrom('speech-repetition', 'picture-naming'),
        childId: fc.string({ minLength: 1, maxLength: 20 }),
        accuracy: fc.constantFrom(0, 1, 0.5), // Edge values
        responseTime: fc.constantFrom(0.1, 30, 1.5), // Edge values
        completed: fc.boolean(),
        adaptationsUsed: fc.constantFrom([], undefined, null) // Edge cases
      });

      await fc.assert(fc.asyncProperty(
        edgeCaseSessionArb,
        async (sessionData) => {
          // Should not throw errors for edge cases
          await expect(gameMetadataService.recordSession(sessionData)).resolves.not.toThrow();
          
          const recordedSession = gameMetadataService.sessionData.get(sessionData.sessionId);
          expect(recordedSession).toBeDefined();
          
          // Should handle null/undefined adaptations gracefully
          if (!sessionData.adaptationsUsed || sessionData.adaptationsUsed.length === 0) {
            expect(recordedSession.adaptationEffectiveness.noAdaptationsUsed).toBe(true);
          }
          
          // Should categorize edge accuracy values correctly
          if (sessionData.accuracy === 0) {
            expect(recordedSession.therapeuticMetrics.primaryOutcomes.accuracyCategory).toBe('significant-concern');
          } else if (sessionData.accuracy === 1) {
            expect(recordedSession.therapeuticMetrics.primaryOutcomes.accuracyCategory).toBe('excellent');
          }
        }
      ), { numRuns: 30 });
    });

    test('should generate unique session IDs consistently', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(sessionDataArb, { minLength: 5, maxLength: 20 }),
        async (sessions) => {
          const sessionIds = new Set();
          
          for (const session of sessions) {
            await gameMetadataService.recordSession(session);
            sessionIds.add(session.sessionId);
          }
          
          // All session IDs should be unique
          expect(sessionIds.size).toBe(sessions.length);
          
          // All session IDs should follow the expected format
          sessionIds.forEach(id => {
            expect(id).toMatch(/^session_\d+_[a-z0-9]+$/);
          });
        }
      ), { numRuns: 15 });
    });
  });

  describe('Data Collection Error Handling', () => {
    test('should handle malformed session data gracefully', async () => {
      const malformedSessionArb = fc.record({
        gameId: fc.string(), // Could be invalid
        childId: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
        accuracy: fc.oneof(fc.float(), fc.constant(null), fc.constant('invalid')),
        responseTime: fc.oneof(fc.float(), fc.constant(-1), fc.constant('invalid'))
      });

      await fc.assert(fc.asyncProperty(
        malformedSessionArb,
        async (sessionData) => {
          // Should not crash on malformed data
          await expect(gameMetadataService.recordSession(sessionData)).resolves.not.toThrow();
          
          if (sessionData.sessionId) {
            const recordedSession = gameMetadataService.sessionData.get(sessionData.sessionId);
            expect(recordedSession).toBeDefined();
            expect(recordedSession.therapeuticMetrics).toBeDefined();
          }
        }
      ), { numRuns: 20 });
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large numbers of sessions efficiently', async () => {
      const startTime = Date.now();
      
      // Generate and record many sessions
      const sessions = Array.from({ length: 100 }, (_, i) => ({
        gameId: 'speech-repetition',
        childId: `child-${i % 10}`, // 10 different children
        accuracy: Math.random(),
        responseTime: Math.random() * 5 + 1,
        completed: Math.random() > 0.2
      }));

      for (const session of sessions) {
        await gameMetadataService.recordSession(session);
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete within reasonable time (less than 5 seconds)
      expect(processingTime).toBeLessThan(5000);

      // Verify all sessions were recorded
      expect(gameMetadataService.sessionData.size).toBe(100);

      // Verify analytics are still accurate
      const analytics = await gameMetadataService.getAnalytics('child-0');
      expect(analytics.totalSessions).toBeGreaterThan(0);
    });
  });
});