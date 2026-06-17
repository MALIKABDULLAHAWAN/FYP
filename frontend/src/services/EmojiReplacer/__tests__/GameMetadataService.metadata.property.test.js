/**
 * Property-based tests for GameMetadataService metadata integration
 * Tests comprehensive metadata integration properties
 */

import fc from 'fast-check';
import GameMetadataService from '../GameMetadataService.js';

describe('GameMetadataService - Property-Based Tests', () => {
  let gameMetadataService;

  beforeEach(() => {
    gameMetadataService = new GameMetadataService();
  });

  afterEach(() => {
    gameMetadataService.clearCache();
  });

  /**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
   * Property 7: Comprehensive Metadata Integration
   * 
   * For any game session or activity, the Metadata_Service should provide complete therapeutic context,
   * evidence-based adaptations, and maintain alignment throughout processing
   */
  describe('Property 7: Comprehensive Metadata Integration', () => {
    const gameSessionArb = fc.record({
      sessionId: fc.string({ minLength: 1, maxLength: 50 }),
      gameId: fc.constantFrom('speech-repetition', 'picture-naming', 'question-answer', 'story-retell', 'category-naming'),
      childId: fc.string({ minLength: 1, maxLength: 20 })
    });

    const childProfileArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      fullName: fc.string({ minLength: 1, maxLength: 50 }),
      dateOfBirth: fc.date({ min: new Date('2010-01-01'), max: new Date('2020-12-31') }).map(d => d.toISOString().split('T')[0]),
      therapeuticNeeds: fc.array(
        fc.constantFrom(
          'articulation-improvement', 'visual-processing', 'comprehension-support',
          'processing-time', 'motor-planning', 'phonological-awareness',
          'vocabulary-expansion', 'social-communication', 'auditory-processing'
        ),
        { minLength: 1, maxLength: 4 }
      ),
      needsVisualSupports: fc.boolean(),
      needsExtendedTime: fc.boolean()
    });

    test('should always provide complete therapeutic context for valid inputs', async () => {
      await fc.assert(fc.asyncProperty(
        gameSessionArb,
        childProfileArb,
        async (gameSession, childProfile) => {
          const enrichedSession = await gameMetadataService.enrichGameWithMetadata(gameSession, childProfile);

          // Verify complete metadata structure
          expect(enrichedSession.metadata).toBeDefined();
          expect(enrichedSession.metadata.id).toBe(gameSession.gameId);
          expect(enrichedSession.metadata.therapeuticGoals).toBeDefined();
          expect(Array.isArray(enrichedSession.metadata.therapeuticGoals)).toBe(true);
          expect(enrichedSession.metadata.therapeuticGoals.length).toBeGreaterThan(0);

          // Verify therapeutic context completeness
          expect(enrichedSession.therapeuticContext).toBeDefined();
          expect(enrichedSession.therapeuticContext.childProfile).toEqual(childProfile);
          expect(enrichedSession.therapeuticContext.therapeuticNeeds).toBeDefined();
          expect(Array.isArray(enrichedSession.therapeuticContext.therapeuticNeeds)).toBe(true);
          expect(enrichedSession.therapeuticContext.recommendedAdaptations).toBeDefined();
          expect(Array.isArray(enrichedSession.therapeuticContext.recommendedAdaptations)).toBe(true);

          // Verify evidence base is included
          expect(enrichedSession.therapeuticContext.evidenceBase).toBeDefined();
          expect(Array.isArray(enrichedSession.therapeuticContext.evidenceBase)).toBe(true);

          // Verify therapeutic alignment is calculated
          expect(enrichedSession.therapeuticContext.therapeuticAlignment).toBeDefined();
          expect(enrichedSession.therapeuticContext.therapeuticAlignment.score).toBeGreaterThanOrEqual(0);
          expect(enrichedSession.therapeuticContext.therapeuticAlignment.score).toBeLessThanOrEqual(1);
        }
      ), { numRuns: 50 });
    });

    test('should maintain evidence-based adaptation selection', async () => {
      await fc.assert(fc.asyncProperty(
        gameSessionArb,
        childProfileArb,
        async (gameSession, childProfile) => {
          const enrichedSession = await gameMetadataService.enrichGameWithMetadata(gameSession, childProfile);
          const adaptations = enrichedSession.therapeuticContext.recommendedAdaptations;

          // All configured adaptations should have evidence-based rationale
          const configuredAdaptations = adaptations.filter(a => a.configured);
          configuredAdaptations.forEach(adaptation => {
            expect(adaptation.selectionRationale).toBeDefined();
            expect(typeof adaptation.selectionRationale).toBe('string');
            expect(adaptation.selectionRationale.length).toBeGreaterThan(0);
            
            // Should have scoring information
            expect(adaptation.totalScore).toBeDefined();
            expect(adaptation.totalScore).toBeGreaterThanOrEqual(0);
            expect(adaptation.totalScore).toBeLessThanOrEqual(1);
            
            // Should have matching needs
            expect(adaptation.matchingNeeds).toBeDefined();
            expect(Array.isArray(adaptation.matchingNeeds)).toBe(true);
          });
        }
      ), { numRuns: 30 });
    });

    test('should ensure therapeutic alignment throughout processing', async () => {
      await fc.assert(fc.asyncProperty(
        gameSessionArb,
        childProfileArb,
        async (gameSession, childProfile) => {
          const enrichedSession = await gameMetadataService.enrichGameWithMetadata(gameSession, childProfile);
          
          // Therapeutic alignment should be maintained
          const alignment = enrichedSession.therapeuticContext.therapeuticAlignment;
          expect(alignment.score).toBeGreaterThanOrEqual(0);
          expect(alignment.alignmentStrength).toMatch(/^(strong|moderate|weak)$/);
          
          // Aligned goals should be subset of total goals
          expect(alignment.alignedGoals.length).toBeLessThanOrEqual(alignment.totalGoals);
          
          // All aligned goals should exist in the metadata
          alignment.alignedGoals.forEach(goal => {
            expect(enrichedSession.metadata.therapeuticGoals).toContain(goal);
          });
          
          // Data collection should be therapeutically aligned
          expect(enrichedSession.dataCollection.therapeuticAlignment).toBe(true);
        }
      ), { numRuns: 40 });
    });

    test('should provide comprehensive data collection configuration', async () => {
      await fc.assert(fc.asyncProperty(
        gameSessionArb,
        childProfileArb,
        async (gameSession, childProfile) => {
          const enrichedSession = await gameMetadataService.enrichGameWithMetadata(gameSession, childProfile);
          const dataCollection = enrichedSession.dataCollection;

          // Should have primary metrics
          expect(dataCollection.primaryMetrics).toBeDefined();
          expect(Array.isArray(dataCollection.primaryMetrics)).toBe(true);
          expect(dataCollection.primaryMetrics.length).toBeGreaterThan(0);

          // Should have collection configuration
          expect(dataCollection.collectionFrequency).toBeDefined();
          expect(dataCollection.aggregationLevel).toBeDefined();
          expect(dataCollection.therapeuticAlignment).toBe(true);

          // Should have enhanced tracking capabilities
          expect(dataCollection.realTimeTracking).toBe(true);
          expect(dataCollection.correlationAnalysis).toBe(true);

          // Should have secondary and outcome metrics
          expect(dataCollection.secondaryMetrics).toBeDefined();
          expect(Array.isArray(dataCollection.secondaryMetrics)).toBe(true);
          expect(dataCollection.outcomeMetrics).toBeDefined();
          expect(Array.isArray(dataCollection.outcomeMetrics)).toBe(true);
        }
      ), { numRuns: 30 });
    });

    test('should handle adaptation scoring consistently', async () => {
      await fc.assert(fc.asyncProperty(
        gameSessionArb,
        childProfileArb,
        async (gameSession, childProfile) => {
          const enrichedSession = await gameMetadataService.enrichGameWithMetadata(gameSession, childProfile);
          const adaptations = enrichedSession.therapeuticContext.recommendedAdaptations;

          adaptations.forEach(adaptation => {
            // All adaptations should have valid scores
            expect(adaptation.alignmentScore).toBeGreaterThanOrEqual(0);
            expect(adaptation.alignmentScore).toBeLessThanOrEqual(1);
            expect(adaptation.evidenceScore).toBeGreaterThanOrEqual(0);
            expect(adaptation.evidenceScore).toBeLessThanOrEqual(1);
            expect(adaptation.personalizationScore).toBeGreaterThanOrEqual(0);
            expect(adaptation.personalizationScore).toBeLessThanOrEqual(1);
            expect(adaptation.totalScore).toBeGreaterThanOrEqual(0);
            expect(adaptation.totalScore).toBeLessThanOrEqual(1);

            // Configured adaptations should meet minimum threshold
            if (adaptation.configured) {
              expect(adaptation.totalScore).toBeGreaterThanOrEqual(0.6);
            }
          });
        }
      ), { numRuns: 40 });
    });

    test('should maintain data integrity across enrichment process', async () => {
      await fc.assert(fc.asyncProperty(
        gameSessionArb,
        childProfileArb,
        async (gameSession, childProfile) => {
          const enrichedSession = await gameMetadataService.enrichGameWithMetadata(gameSession, childProfile);

          // Original session data should be preserved
          expect(enrichedSession.sessionId).toBe(gameSession.sessionId);
          expect(enrichedSession.gameId).toBe(gameSession.gameId);
          expect(enrichedSession.childId).toBe(gameSession.childId);

          // Enrichment metadata should be present
          expect(enrichedSession.enrichedAt).toBeDefined();
          expect(enrichedSession.enrichmentVersion).toBe('2.0');

          // Performance tracking should be initialized
          expect(enrichedSession.performanceTracking).toBeDefined();
          expect(enrichedSession.performanceTracking.gameId).toBe(gameSession.gameId);
          expect(enrichedSession.performanceTracking.childId).toBe(childProfile.id); // Use childProfile.id
          expect(enrichedSession.performanceTracking.trackingStarted).toBeDefined();
          expect(enrichedSession.performanceTracking.trackingVersion).toBe('2.0');
        }
      ), { numRuns: 30 });
    });
  });

  describe('Metadata Service Error Handling', () => {
    test('should handle invalid game IDs gracefully', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
          !['speech-repetition', 'picture-naming', 'question-answer', 'story-retell', 'category-naming'].includes(s) &&
          !['toString', 'valueOf', 'constructor', 'hasOwnProperty'].includes(s) // Exclude problematic property names
        ),
        async (invalidGameId) => {
          await expect(gameMetadataService.getGameMetadata(invalidGameId))
            .rejects.toThrow('GameMetadataNotFoundException');
        }
      ), { numRuns: 20 });
    });

    test('should validate therapeutic alignment requirements', async () => {
      const invalidSessionArb = fc.record({
        metadata: fc.constantFrom(null, undefined, {}),
        therapeuticContext: fc.record({
          therapeuticNeeds: fc.array(fc.string(), { minLength: 1 })
        })
      });

      await fc.assert(fc.property(
        invalidSessionArb,
        (invalidSession) => {
          expect(() => {
            gameMetadataService.validateEnhancedTherapeuticAlignment(invalidSession);
          }).toThrow();
        }
      ), { numRuns: 20 });
    });
  });

  describe('Analytics and Correlation Properties', () => {
    const sessionDataArb = fc.record({
      gameId: fc.constantFrom('speech-repetition', 'picture-naming', 'question-answer'),
      childId: fc.string({ minLength: 1, maxLength: 20 }),
      accuracy: fc.float({ min: 0, max: 1 }),
      responseTime: fc.float({ min: 0.5, max: 10 }),
      completed: fc.boolean()
    });

    test('should maintain analytics consistency across sessions', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(sessionDataArb, { minLength: 1, maxLength: 10 }),
        async (sessions) => {
          // Record all sessions
          for (const session of sessions) {
            await gameMetadataService.recordSession({ ...session });
          }

          // Get analytics for each unique child
          const uniqueChildIds = [...new Set(sessions.map(s => s.childId))];
          
          for (const childId of uniqueChildIds) {
            const analytics = await gameMetadataService.getAnalytics(childId);
            
            expect(analytics.childId).toBe(childId);
            expect(analytics.totalSessions).toBeGreaterThan(0);
            expect(analytics.outcomeCorrelations).toBeDefined();
            expect(analytics.therapeuticEffectiveness).toBeDefined();
            
            // Verify correlation structure
            expect(analytics.outcomeCorrelations.gameTypeEffectiveness).toBeDefined();
            expect(typeof analytics.outcomeCorrelations.gameTypeEffectiveness).toBe('object');
            
            // Verify therapeutic effectiveness assessment
            expect(analytics.therapeuticEffectiveness.overallEffectiveness).toBeGreaterThanOrEqual(0);
            expect(analytics.therapeuticEffectiveness.overallEffectiveness).toBeLessThanOrEqual(1);
          }
        }
      ), { numRuns: 20 });
    });
  });
});