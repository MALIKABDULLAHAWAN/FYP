/**
 * Unit tests for GameMetadataService difficulty level management
 * Tests difficulty recommendation, real-time adjustment, and tracking
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import GameMetadataService from '../GameMetadataService.js';

describe('GameMetadataService - Difficulty Level Management', () => {
  let service;

  beforeEach(() => {
    service = GameMetadataService;
    service.clear();
  });

  afterEach(() => {
    service.clear();
  });

  describe('calculateDifficultyRecommendation', () => {
    test('should recommend Easy for new child with insufficient data', () => {
      const childProgress = {
        averageScore: 0,
        completionRate: 0,
        sessionCount: 0,
        recentScores: [],
        currentDifficulty: 'Easy',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Easy');
      expect(recommendation.reason).toContain('Insufficient');
      expect(recommendation.confidence).toBeLessThan(0.5);
    });

    test('should recommend Medium when child excels at Easy', () => {
      const childProgress = {
        averageScore: 88,
        completionRate: 0.92,
        sessionCount: 5,
        recentScores: [85, 88, 90, 92, 89],
        currentDifficulty: 'Easy',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Medium');
      expect(recommendation.reason).toContain('excelling');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
    });

    test('should recommend Hard when child excels at Medium', () => {
      const childProgress = {
        averageScore: 87,
        completionRate: 0.91,
        sessionCount: 5,
        recentScores: [85, 87, 90, 88, 89],
        currentDifficulty: 'Medium',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Hard');
      expect(recommendation.reason).toContain('excelling');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
    });

    test('should maintain Hard when child excels at Hard', () => {
      const childProgress = {
        averageScore: 88,
        completionRate: 0.93,
        sessionCount: 5,
        recentScores: [86, 88, 90, 89, 87],
        currentDifficulty: 'Hard',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Hard');
      expect(recommendation.reason).toContain('excellently');
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0.85);
    });

    test('should recommend Easy when child struggles at Hard', () => {
      const childProgress = {
        averageScore: 35,
        completionRate: 0.4,
        sessionCount: 5,
        recentScores: [30, 35, 40, 38, 32],
        currentDifficulty: 'Hard',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Medium');
      expect(recommendation.reason).toContain('struggling');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
    });

    test('should recommend Easy when child struggles at Medium', () => {
      const childProgress = {
        averageScore: 45,
        completionRate: 0.45,
        sessionCount: 5,
        recentScores: [40, 45, 48, 42, 46],
        currentDifficulty: 'Medium',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Easy');
      expect(recommendation.reason).toContain('struggling');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
    });

    test('should maintain current difficulty when performance is adequate', () => {
      const childProgress = {
        averageScore: 72,
        completionRate: 0.78,
        sessionCount: 5,
        recentScores: [70, 72, 75, 71, 73],
        currentDifficulty: 'Medium',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Medium');
      expect(recommendation.reason).toContain('well');
      expect(recommendation.confidence).toBeGreaterThan(0.6);
    });

    test('should consider improving trend for recommendation', () => {
      const childProgress = {
        averageScore: 75,
        completionRate: 0.8,
        sessionCount: 6,
        recentScores: [60, 65, 70, 75, 78, 80], // Improving trend
        currentDifficulty: 'Easy',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.performanceMetrics.trend).toBe('improving');
      expect(recommendation.recommendedDifficulty).toBe('Medium');
    });

    test('should consider declining trend for recommendation', () => {
      const childProgress = {
        averageScore: 65,
        completionRate: 0.7,
        sessionCount: 6,
        recentScores: [80, 78, 75, 70, 65, 60], // Declining trend
        currentDifficulty: 'Hard',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.performanceMetrics.trend).toBe('declining');
      expect(recommendation.recommendedDifficulty).toBe('Medium');
    });

    test('should handle missing childProgress gracefully', () => {
      const recommendation = service.calculateDifficultyRecommendation('child-1', null);

      expect(recommendation.recommendedDifficulty).toBe('Easy');
      expect(recommendation.confidence).toBe(0);
    });

    test('should handle missing childId gracefully', () => {
      const childProgress = {
        averageScore: 80,
        completionRate: 0.85,
        sessionCount: 5,
        recentScores: [78, 80, 82],
        currentDifficulty: 'Medium',
      };

      const recommendation = service.calculateDifficultyRecommendation(null, childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Easy');
      expect(recommendation.confidence).toBe(0);
    });

    test('should include performance metrics in recommendation', () => {
      const childProgress = {
        averageScore: 85,
        completionRate: 0.9,
        sessionCount: 5,
        recentScores: [83, 85, 87],
        currentDifficulty: 'Easy',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.performanceMetrics).toBeDefined();
      expect(recommendation.performanceMetrics.averageScore).toBe(85);
      expect(recommendation.performanceMetrics.completionRate).toBe(0.9);
      expect(recommendation.performanceMetrics.sessionCount).toBe(5);
    });
  });

  describe('adjustDifficultyInRealtime', () => {
    test('should adjust from Hard to Medium when child is struggling', () => {
      const performanceMetrics = {
        currentDifficulty: 'Hard',
        currentScore: 35,
        tasksCompleted: 2,
        tasksFailed: 5,
        timeSpentSeconds: 300,
        taskCount: 7,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      expect(adjustment.difficultyAdjusted).toBe(true);
      expect(adjustment.oldDifficulty).toBe('Hard');
      expect(adjustment.newDifficulty).toBe('Medium');
      expect(adjustment.reason).toContain('High failure rate');
    });

    test('should adjust from Medium to Easy when child is struggling', () => {
      const performanceMetrics = {
        currentDifficulty: 'Medium',
        currentScore: 38,
        tasksCompleted: 2,
        tasksFailed: 5,
        timeSpentSeconds: 300,
        taskCount: 7,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      expect(adjustment.difficultyAdjusted).toBe(true);
      expect(adjustment.oldDifficulty).toBe('Medium');
      expect(adjustment.newDifficulty).toBe('Easy');
    });

    test('should adjust from Easy to Medium when child is excelling', () => {
      const performanceMetrics = {
        currentDifficulty: 'Easy',
        currentScore: 92,
        tasksCompleted: 19,
        tasksFailed: 1,
        timeSpentSeconds: 300,
        taskCount: 20,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      expect(adjustment.difficultyAdjusted).toBe(true);
      expect(adjustment.oldDifficulty).toBe('Easy');
      expect(adjustment.newDifficulty).toBe('Medium');
      expect(adjustment.reason).toContain('Excellent performance');
    });

    test('should adjust from Medium to Hard when child is excelling', () => {
      const performanceMetrics = {
        currentDifficulty: 'Medium',
        currentScore: 91,
        tasksCompleted: 19,
        tasksFailed: 1,
        timeSpentSeconds: 300,
        taskCount: 20,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      expect(adjustment.difficultyAdjusted).toBe(true);
      expect(adjustment.oldDifficulty).toBe('Medium');
      expect(adjustment.newDifficulty).toBe('Hard');
    });

    test('should not adjust when performance is moderate', () => {
      const performanceMetrics = {
        currentDifficulty: 'Medium',
        currentScore: 65,
        tasksCompleted: 13,
        tasksFailed: 7,
        timeSpentSeconds: 300,
        taskCount: 20,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      expect(adjustment.difficultyAdjusted).toBe(false);
      expect(adjustment.oldDifficulty).toBe('Medium');
      expect(adjustment.newDifficulty).toBe('Medium');
    });

    test('should not adjust Hard difficulty when excelling', () => {
      const performanceMetrics = {
        currentDifficulty: 'Hard',
        currentScore: 92,
        tasksCompleted: 19,
        tasksFailed: 1,
        timeSpentSeconds: 300,
        taskCount: 20,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      expect(adjustment.difficultyAdjusted).toBe(false);
      expect(adjustment.newDifficulty).toBe('Hard');
    });

    test('should not adjust Easy difficulty when struggling', () => {
      const performanceMetrics = {
        currentDifficulty: 'Easy',
        currentScore: 35,
        tasksCompleted: 2,
        tasksFailed: 5,
        timeSpentSeconds: 300,
        taskCount: 7,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      expect(adjustment.difficultyAdjusted).toBe(false);
      expect(adjustment.newDifficulty).toBe('Easy');
    });

    test('should include adjustment timestamp', () => {
      const performanceMetrics = {
        currentDifficulty: 'Medium',
        currentScore: 92,
        tasksCompleted: 19,
        tasksFailed: 1,
        timeSpentSeconds: 300,
        taskCount: 20,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      expect(adjustment.adjustmentTimestamp).toBeDefined();
      expect(new Date(adjustment.adjustmentTimestamp)).toBeInstanceOf(Date);
    });

    test('should handle missing performanceMetrics gracefully', () => {
      const adjustment = service.adjustDifficultyInRealtime('session-1', null);

      expect(adjustment.difficultyAdjusted).toBe(false);
      expect(adjustment.reason).toContain('Invalid');
    });

    test('should handle missing sessionId gracefully', () => {
      const performanceMetrics = {
        currentDifficulty: 'Medium',
        currentScore: 80,
        tasksCompleted: 16,
        tasksFailed: 4,
        timeSpentSeconds: 300,
        taskCount: 20,
      };

      const adjustment = service.adjustDifficultyInRealtime(null, performanceMetrics);

      expect(adjustment.difficultyAdjusted).toBe(false);
      expect(adjustment.reason).toContain('Invalid');
    });
  });

  describe('getDifficultyIndicator', () => {
    test('should return Easy difficulty indicator', () => {
      const indicator = service.getDifficultyIndicator('Easy');

      expect(indicator.difficulty).toBe('Easy');
      expect(indicator.displayLabel).toBe('Easy');
      expect(indicator.color).toBe('#7ED321');
      expect(indicator.description).toContain('beginners');
      expect(indicator.ageRange).toBe('Ages 3-5');
    });

    test('should return Medium difficulty indicator', () => {
      const indicator = service.getDifficultyIndicator('Medium');

      expect(indicator.difficulty).toBe('Medium');
      expect(indicator.displayLabel).toBe('Medium');
      expect(indicator.color).toBe('#F5A623');
      expect(indicator.description).toContain('challenge');
      expect(indicator.ageRange).toBe('Ages 6-8');
    });

    test('should return Hard difficulty indicator', () => {
      const indicator = service.getDifficultyIndicator('Hard');

      expect(indicator.difficulty).toBe('Hard');
      expect(indicator.displayLabel).toBe('Hard');
      expect(indicator.color).toBe('#4A90E2');
      expect(indicator.description).toContain('advanced');
      expect(indicator.ageRange).toBe('Ages 9-12');
    });

    test('should return Medium as default for invalid difficulty', () => {
      const indicator = service.getDifficultyIndicator('Invalid');

      expect(indicator.difficulty).toBe('Medium');
      expect(indicator.displayLabel).toBe('Medium');
    });

    test('should include icon for each difficulty level', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      expect(easy.icon).toBeDefined();
      expect(medium.icon).toBeDefined();
      expect(hard.icon).toBeDefined();
      expect(easy.icon).not.toBe(medium.icon);
      expect(medium.icon).not.toBe(hard.icon);
    });
  });

  describe('trackDifficultyChange', () => {
    test('should track difficulty change with all required fields', () => {
      const change = service.trackDifficultyChange(
        'session-1',
        'Easy',
        'Medium',
        'Child excelled at Easy level'
      );

      expect(change.changeId).toBeDefined();
      expect(change.sessionId).toBe('session-1');
      expect(change.oldDifficulty).toBe('Easy');
      expect(change.newDifficulty).toBe('Medium');
      expect(change.reason).toBe('Child excelled at Easy level');
      expect(change.timestamp).toBeDefined();
    });

    test('should include performance metrics at time of change', () => {
      const performanceMetrics = {
        score: 88,
        completionRate: 0.92,
        tasksCompleted: 23,
        tasksFailed: 2,
      };

      const change = service.trackDifficultyChange(
        'session-1',
        'Easy',
        'Medium',
        'Child excelled',
        performanceMetrics
      );

      expect(change.performanceAtChange.score).toBe(88);
      expect(change.performanceAtChange.completionRate).toBe(0.92);
      expect(change.performanceAtChange.tasksCompleted).toBe(23);
      expect(change.performanceAtChange.tasksFailed).toBe(2);
    });

    test('should generate unique changeId for each change', () => {
      const change1 = service.trackDifficultyChange('session-1', 'Easy', 'Medium', 'Reason 1');
      const change2 = service.trackDifficultyChange('session-2', 'Medium', 'Hard', 'Reason 2');

      expect(change1.changeId).not.toBe(change2.changeId);
    });

    test('should log difficulty change to audit trail', () => {
      service.trackDifficultyChange('session-1', 'Easy', 'Medium', 'Child excelled');

      const auditTrail = service.getAuditTrail('session-1');
      const difficultyChangeEntry = auditTrail.find((entry) => entry.action === 'DIFFICULTY_CHANGE');

      expect(difficultyChangeEntry).toBeDefined();
      expect(difficultyChangeEntry.old_data.difficulty).toBe('Easy');
      expect(difficultyChangeEntry.new_data.difficulty).toBe('Medium');
    });

    test('should throw error when sessionId is missing', () => {
      expect(() => {
        service.trackDifficultyChange(null, 'Easy', 'Medium', 'Reason');
      }).toThrow();
    });

    test('should throw error when oldDifficulty is missing', () => {
      expect(() => {
        service.trackDifficultyChange('session-1', null, 'Medium', 'Reason');
      }).toThrow();
    });

    test('should throw error when newDifficulty is missing', () => {
      expect(() => {
        service.trackDifficultyChange('session-1', 'Easy', null, 'Reason');
      }).toThrow();
    });

    test('should handle missing performance metrics gracefully', () => {
      const change = service.trackDifficultyChange(
        'session-1',
        'Easy',
        'Medium',
        'Reason'
      );

      expect(change.performanceAtChange.score).toBe(0);
      expect(change.performanceAtChange.completionRate).toBe(0);
      expect(change.performanceAtChange.tasksCompleted).toBe(0);
      expect(change.performanceAtChange.tasksFailed).toBe(0);
    });

    test('should include valid timestamp in ISO format', () => {
      const change = service.trackDifficultyChange('session-1', 'Easy', 'Medium', 'Reason');

      expect(new Date(change.timestamp)).toBeInstanceOf(Date);
      expect(change.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('integration scenarios', () => {
    test('should recommend difficulty progression through levels', () => {
      // Start at Easy
      let progress = {
        averageScore: 88,
        completionRate: 0.92,
        sessionCount: 5,
        recentScores: [85, 88, 90, 92, 89],
        currentDifficulty: 'Easy',
      };

      let recommendation = service.calculateDifficultyRecommendation('child-1', progress);
      expect(recommendation.recommendedDifficulty).toBe('Medium');

      // Progress to Medium
      progress.currentDifficulty = 'Medium';
      progress.averageScore = 87;
      progress.completionRate = 0.91;
      progress.recentScores = [85, 87, 90, 88, 89];

      recommendation = service.calculateDifficultyRecommendation('child-1', progress);
      expect(recommendation.recommendedDifficulty).toBe('Hard');

      // Progress to Hard
      progress.currentDifficulty = 'Hard';
      recommendation = service.calculateDifficultyRecommendation('child-1', progress);
      expect(recommendation.recommendedDifficulty).toBe('Hard');
    });

    test('should track multiple difficulty changes in session', () => {
      const change1 = service.trackDifficultyChange('session-1', 'Easy', 'Medium', 'Initial adjustment');
      const change2 = service.trackDifficultyChange('session-1', 'Medium', 'Hard', 'Child excelling');

      expect(change1.changeId).not.toBe(change2.changeId);
      expect(change1.sessionId).toBe(change2.sessionId);

      const auditTrail = service.getAuditTrail('session-1');
      const difficultyChanges = auditTrail.filter((entry) => entry.action === 'DIFFICULTY_CHANGE');
      expect(difficultyChanges.length).toBe(2);
    });

    test('should combine real-time adjustment with tracking', () => {
      const performanceMetrics = {
        currentDifficulty: 'Easy',
        currentScore: 92,
        tasksCompleted: 19,
        tasksFailed: 1,
        timeSpentSeconds: 300,
        taskCount: 20,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      if (adjustment.difficultyAdjusted) {
        const change = service.trackDifficultyChange(
          adjustment.sessionId || 'session-1',
          adjustment.oldDifficulty,
          adjustment.newDifficulty,
          adjustment.reason,
          performanceMetrics
        );

        expect(change.oldDifficulty).toBe(adjustment.oldDifficulty);
        expect(change.newDifficulty).toBe(adjustment.newDifficulty);
      }
    });
  });

  describe('edge cases', () => {
    test('should handle zero session count', () => {
      const childProgress = {
        averageScore: 0,
        completionRate: 0,
        sessionCount: 0,
        recentScores: [],
        currentDifficulty: 'Easy',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Easy');
      expect(recommendation.confidence).toBeLessThan(0.5);
    });

    test('should handle perfect score (100)', () => {
      const childProgress = {
        averageScore: 100,
        completionRate: 1.0,
        sessionCount: 5,
        recentScores: [100, 100, 100, 100, 100],
        currentDifficulty: 'Hard',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Hard');
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0.85);
    });

    test('should handle zero score', () => {
      const childProgress = {
        averageScore: 0,
        completionRate: 0,
        sessionCount: 5,
        recentScores: [0, 0, 0, 0, 0],
        currentDifficulty: 'Easy',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Easy');
    });

    test('should handle single recent score', () => {
      const childProgress = {
        averageScore: 85,
        completionRate: 0.9,
        sessionCount: 1,
        recentScores: [85],
        currentDifficulty: 'Easy',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);

      expect(recommendation.recommendedDifficulty).toBe('Easy');
      expect(recommendation.confidence).toBeLessThan(0.8);
    });

    test('should handle very high completion rate', () => {
      const performanceMetrics = {
        currentDifficulty: 'Easy',
        currentScore: 95,
        tasksCompleted: 100,
        tasksFailed: 0,
        timeSpentSeconds: 300,
        taskCount: 100,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      expect(adjustment.difficultyAdjusted).toBe(true);
      expect(adjustment.newDifficulty).toBe('Medium');
    });

    test('should handle very low completion rate', () => {
      const performanceMetrics = {
        currentDifficulty: 'Hard',
        currentScore: 10,
        tasksCompleted: 1,
        tasksFailed: 19,
        timeSpentSeconds: 300,
        taskCount: 20,
      };

      const adjustment = service.adjustDifficultyInRealtime('session-1', performanceMetrics);

      expect(adjustment.difficultyAdjusted).toBe(true);
      expect(adjustment.newDifficulty).toBe('Medium');
    });
  });
});
