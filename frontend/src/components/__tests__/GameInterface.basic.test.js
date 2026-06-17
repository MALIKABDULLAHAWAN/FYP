/**
 * GameInterface Basic Tests
 * 
 * Basic unit tests for the enhanced GameInterface component
 * focusing on core functionality and integration points.
 */

import GameMetadataService from '../../services/GameMetadataService';
import GameImageManager from '../../services/GameImageManager';

// Mock the services
jest.mock('../../services/GameMetadataService');
jest.mock('../../services/GameImageManager');

describe('GameInterface Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Integration', () => {
    test('GameMetadataService is properly imported', () => {
      expect(GameMetadataService).toBeDefined();
      expect(typeof GameMetadataService.validateAgeAppropriate).toBe('function');
      expect(typeof GameMetadataService.adjustDifficultyInRealtime).toBe('function');
      expect(typeof GameMetadataService.getDifficultyIndicator).toBe('function');
    });

    test('GameImageManager is properly imported', () => {
      expect(GameImageManager).toBeDefined();
      expect(typeof GameImageManager.getResponsiveImageUrls).toBe('function');
      expect(typeof GameImageManager.validateImage).toBe('function');
    });
  });

  describe('Difficulty Adjustment Logic', () => {
    test('calculates difficulty recommendation correctly', () => {
      const childProgress = {
        averageScore: 85,
        completionRate: 0.9,
        sessionCount: 5,
        recentScores: [80, 85, 90, 88, 92],
        currentDifficulty: 'Easy',
      };

      const recommendation = GameMetadataService.calculateDifficultyRecommendation('child-123', childProgress);
      
      expect(recommendation).toHaveProperty('recommendedDifficulty');
      expect(recommendation).toHaveProperty('reason');
      expect(recommendation).toHaveProperty('confidence');
      expect(recommendation.confidence).toBeGreaterThan(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(1);
    });

    test('handles real-time difficulty adjustment', () => {
      const performanceMetrics = {
        currentDifficulty: 'Medium',
        currentScore: 30,
        tasksCompleted: 2,
        tasksFailed: 8,
        timeSpentSeconds: 300,
        taskCount: 10,
      };

      const adjustment = GameMetadataService.adjustDifficultyInRealtime('session-123', performanceMetrics);
      
      expect(adjustment).toHaveProperty('difficultyAdjusted');
      expect(adjustment).toHaveProperty('reason');
      expect(adjustment).toHaveProperty('adjustmentTimestamp');
      expect(typeof adjustment.difficultyAdjusted).toBe('boolean');
    });
  });

  describe('Image Management', () => {
    test('validates image files correctly', () => {
      const validFile = {
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
        name: 'test-image.jpg',
      };

      const validation = GameImageManager.validateImage(validFile);
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    test('validates therapeutic appropriateness', () => {
      const imageData = {
        width: 800,
        height: 600,
        aspectRatio: 1.33,
      };

      const validation = GameImageManager.validateTherapeuticAppropriateness(imageData);
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    test('validates attribution information', () => {
      const attribution = {
        photographer: 'Test Photographer',
        license: 'CC-BY-4.0',
        source: 'Test Source',
        usage_rights: 'Educational use permitted',
      };

      const validation = GameImageManager.validateAttribution(attribution);
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('Age Appropriateness Validation', () => {
    test('validates age appropriateness correctly', () => {
      const game = {
        game_id: 'test-game',
        title: 'Test Game',
        age_range: { min_age: 6, max_age: 10 },
        therapeutic_goals: ['cognitive-development'],
      };

      const validation = GameMetadataService.validateAgeAppropriate(8, game);
      
      expect(validation).toHaveProperty('isAppropriate');
      expect(validation).toHaveProperty('reason');
      expect(validation).toHaveProperty('hasOverride');
      expect(validation).toHaveProperty('overrideDetails');
      expect(typeof validation.isAppropriate).toBe('boolean');
    });

    test('provides age-appropriate alternatives', () => {
      const game = {
        game_id: 'test-game',
        title: 'Test Game',
        age_range: { min_age: 9, max_age: 12 },
        therapeutic_goals: ['speech-articulation'],
      };

      const alternatives = GameMetadataService.getAgeAppropriateAlternatives(6, game, 3);
      
      expect(Array.isArray(alternatives)).toBe(true);
      expect(alternatives.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Progress Tracking', () => {
    test('tracks difficulty changes correctly', () => {
      const performanceMetrics = {
        score: 75,
        completionRate: 0.8,
        tasksCompleted: 8,
        tasksFailed: 2,
      };

      const change = GameMetadataService.trackDifficultyChange(
        'session-123',
        'Easy',
        'Medium',
        'Child is performing well',
        performanceMetrics
      );
      
      expect(change).toHaveProperty('changeId');
      expect(change).toHaveProperty('sessionId', 'session-123');
      expect(change).toHaveProperty('oldDifficulty', 'Easy');
      expect(change).toHaveProperty('newDifficulty', 'Medium');
      expect(change).toHaveProperty('reason');
      expect(change).toHaveProperty('timestamp');
      expect(change).toHaveProperty('performanceAtChange');
    });
  });

  describe('Metadata Management', () => {
    test('creates game metadata correctly', () => {
      const gameData = {
        title: 'Test Therapeutic Game',
        description: 'A test game for therapeutic learning',
        therapeutic_goals: ['cognitive-development', 'attention-building'],
        difficulty_level: 'Medium',
        age_range: { min_age: 6, max_age: 10 },
        image_url: 'https://example.com/test-image.jpg',
        image_attribution: {
          photographer: 'Test Photographer',
          license: 'CC-BY-4.0',
          source: 'Test Source',
          usage_rights: 'Educational use',
        },
        evidence_base: [{
          citation: 'Test, A. (2023). Therapeutic games research.',
          publication_year: 2023,
          effectiveness_rating: 0.85,
          sample_size: 100,
          study_type: 'RCT',
        }],
      };

      const game = GameMetadataService.createGame(gameData);
      
      expect(game).toHaveProperty('game_id');
      expect(game).toHaveProperty('title', gameData.title);
      expect(game).toHaveProperty('created_at');
      expect(game).toHaveProperty('updated_at');
      expect(game).toHaveProperty('version', 1);
      expect(game).toHaveProperty('is_active', true);
    });

    test('validates metadata correctly', () => {
      const invalidData = {
        title: '', // Invalid: empty title
        description: 'Test description',
        therapeutic_goals: [], // Invalid: empty goals
        difficulty_level: 'Invalid', // Invalid: not in allowed values
        age_range: { min_age: 15, max_age: 20 }, // Invalid: outside 3-12 range
      };

      const validation = GameMetadataService.validateMetadata(invalidData);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('Title'))).toBe(true);
      expect(validation.errors.some(error => error.includes('therapeutic goal'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('handles missing game data gracefully', () => {
      expect(() => {
        GameMetadataService.getGame('nonexistent-game');
      }).toThrow('Game not found');
    });

    test('handles invalid difficulty adjustment parameters', () => {
      const adjustment = GameMetadataService.adjustDifficultyInRealtime(null, null);
      
      expect(adjustment.difficultyAdjusted).toBe(false);
      expect(adjustment.reason).toContain('Invalid');
    });

    test('handles invalid age appropriateness parameters', () => {
      const validation = GameMetadataService.validateAgeAppropriate(null, null);
      
      expect(validation.isAppropriate).toBe(false);
      expect(validation.reason).toContain('Invalid input parameters');
    });
  });
});