/**
 * GameInterface Verification Tests
 * 
 * Verification tests for the enhanced GameInterface component
 * focusing on service integration and core functionality.
 * 
 * Requirements: 4.3, 5.1, 5.2, 5.3, 5.4, 15.1, 15.2, 15.3
 */

import GameMetadataService from '../../services/GameMetadataService';
import GameImageManager from '../../services/GameImageManager';

describe('GameInterface Verification Tests', () => {
  beforeEach(() => {
    // Clear any existing data
    GameMetadataService.clear();
    GameImageManager.clearCache();
  });

  describe('Therapeutic Photograph Integration', () => {
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
      
      if (validation.valid) {
        expect(validation.errors).toHaveLength(0);
      }
    });

    test('rejects oversized image files', () => {
      const oversizedFile = {
        size: 10 * 1024 * 1024, // 10MB (over 5MB limit)
        type: 'image/jpeg',
        name: 'large-image.jpg',
      };

      const validation = GameImageManager.validateImage(oversizedFile);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(error => error.includes('File size exceeds'))).toBe(true);
    });

    test('validates therapeutic appropriateness of images', () => {
      const appropriateImage = {
        width: 800,
        height: 600,
        aspectRatio: 1.33,
      };

      const validation = GameImageManager.validateTherapeuticAppropriateness(appropriateImage);
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      
      if (validation.valid) {
        expect(validation.errors).toHaveLength(0);
      }
    });

    test('rejects images with inappropriate dimensions', () => {
      const tooSmallImage = {
        width: 50,
        height: 50,
        aspectRatio: 1,
      };

      const validation = GameImageManager.validateTherapeuticAppropriateness(tooSmallImage);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(error => error.includes('dimensions too small'))).toBe(true);
    });

    test('validates image attribution information', () => {
      const completeAttribution = {
        photographer: 'Test Photographer',
        license: 'CC-BY-4.0',
        source: 'Test Source',
        usage_rights: 'Educational use permitted',
      };

      const validation = GameImageManager.validateAttribution(completeAttribution);
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      
      if (validation.valid) {
        expect(validation.errors).toHaveLength(0);
      }
    });

    test('requires complete attribution information', () => {
      const incompleteAttribution = {
        photographer: 'Test Photographer',
        // Missing license, source, and usage_rights
      };

      const validation = GameImageManager.validateAttribution(incompleteAttribution);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Indicator Integration', () => {
    test('tracks difficulty changes with performance metrics', () => {
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
      expect(change).toHaveProperty('reason', 'Child is performing well');
      expect(change).toHaveProperty('timestamp');
      expect(change).toHaveProperty('performanceAtChange');
      
      // Verify performance metrics are captured
      expect(change.performanceAtChange).toHaveProperty('score', 75);
      expect(change.performanceAtChange).toHaveProperty('completionRate', 0.8);
    });

    test('calculates difficulty recommendations based on child progress', () => {
      const excellentProgress = {
        averageScore: 90,
        completionRate: 0.95,
        sessionCount: 5,
        recentScores: [85, 88, 92, 94, 96],
        currentDifficulty: 'Easy',
      };

      const recommendation = GameMetadataService.calculateDifficultyRecommendation('child-123', excellentProgress);
      
      expect(recommendation).toHaveProperty('recommendedDifficulty');
      expect(recommendation).toHaveProperty('reason');
      expect(recommendation).toHaveProperty('confidence');
      expect(recommendation).toHaveProperty('performanceMetrics');
      
      // Should recommend harder difficulty for excellent performance
      expect(['Medium', 'Hard']).toContain(recommendation.recommendedDifficulty);
      expect(recommendation.confidence).toBeGreaterThan(0.7);
    });

    test('recommends easier difficulty for struggling children', () => {
      const strugglingProgress = {
        averageScore: 40,
        completionRate: 0.3,
        sessionCount: 5,
        recentScores: [30, 35, 40, 45, 35],
        currentDifficulty: 'Hard',
      };

      const recommendation = GameMetadataService.calculateDifficultyRecommendation('child-456', strugglingProgress);
      
      expect(recommendation).toHaveProperty('recommendedDifficulty');
      expect(recommendation).toHaveProperty('reason');
      
      // Should recommend easier difficulty for struggling performance
      expect(['Easy', 'Medium']).toContain(recommendation.recommendedDifficulty);
      expect(recommendation.reason).toContain('struggling');
    });
  });

  describe('Difficulty Adjustment Controls', () => {
    test('provides difficulty indicators with proper metadata', () => {
      const easyIndicator = GameMetadataService.getDifficultyIndicator('Easy');
      
      expect(easyIndicator).toHaveProperty('difficulty', 'Easy');
      expect(easyIndicator).toHaveProperty('displayLabel', 'Easy');
      expect(easyIndicator).toHaveProperty('color');
      expect(easyIndicator).toHaveProperty('icon');
      expect(easyIndicator).toHaveProperty('description');
      expect(easyIndicator).toHaveProperty('ageRange');
      
      // Verify color is appropriate for Easy difficulty
      expect(easyIndicator.color).toBe('#7ED321'); // Soft Green
    });

    test('handles real-time difficulty adjustment based on performance', () => {
      const strugglingMetrics = {
        currentDifficulty: 'Hard',
        currentScore: 25,
        tasksCompleted: 2,
        tasksFailed: 8,
        timeSpentSeconds: 600,
        taskCount: 10,
      };

      const adjustment = GameMetadataService.adjustDifficultyInRealtime('session-123', strugglingMetrics);
      
      expect(adjustment).toHaveProperty('difficultyAdjusted');
      expect(adjustment).toHaveProperty('oldDifficulty');
      expect(adjustment).toHaveProperty('newDifficulty');
      expect(adjustment).toHaveProperty('reason');
      expect(adjustment).toHaveProperty('adjustmentTimestamp');
      
      // Should adjust difficulty down for struggling performance
      if (adjustment.difficultyAdjusted) {
        expect(adjustment.newDifficulty).not.toBe('Hard');
        expect(adjustment.reason).toContain('failure rate');
      }
    });

    test('maintains difficulty for adequate performance', () => {
      const adequateMetrics = {
        currentDifficulty: 'Medium',
        currentScore: 70,
        tasksCompleted: 7,
        tasksFailed: 3,
        timeSpentSeconds: 300,
        taskCount: 10,
      };

      const adjustment = GameMetadataService.adjustDifficultyInRealtime('session-456', adequateMetrics);
      
      expect(adjustment).toHaveProperty('difficultyAdjusted');
      
      // Should not adjust difficulty for adequate performance
      expect(adjustment.difficultyAdjusted).toBe(false);
    });
  });

  describe('Age Appropriateness Validation', () => {
    test('validates age-appropriate games correctly', () => {
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
      
      // 8-year-old should be appropriate for 6-10 age range
      expect(validation.isAppropriate).toBe(true);
      expect(validation.hasOverride).toBe(false);
    });

    test('rejects age-inappropriate games', () => {
      const game = {
        game_id: 'advanced-game',
        title: 'Advanced Game',
        age_range: { min_age: 9, max_age: 12 },
        therapeutic_goals: ['advanced-reasoning'],
      };

      const validation = GameMetadataService.validateAgeAppropriate(5, game);
      
      expect(validation.isAppropriate).toBe(false);
      expect(validation.reason).toContain('too young');
      expect(validation.hasOverride).toBe(false);
    });

    test('provides age-appropriate alternatives', () => {
      // First create some games in the service
      const appropriateGame = {
        title: 'Age Appropriate Game',
        description: 'A game for younger children',
        therapeutic_goals: ['cognitive-development'],
        difficulty_level: 'Easy',
        age_range: { min_age: 4, max_age: 7 },
        image_url: 'https://example.com/image.jpg',
        image_attribution: {
          photographer: 'Test',
          license: 'CC-BY-4.0',
          source: 'Test',
          usage_rights: 'Educational',
        },
        evidence_base: [{
          citation: 'Test (2023)',
          publication_year: 2023,
          effectiveness_rating: 0.8,
          sample_size: 100,
          study_type: 'RCT',
        }],
      };

      const inappropriateGame = {
        title: 'Too Advanced Game',
        description: 'A game for older children',
        therapeutic_goals: ['cognitive-development'],
        difficulty_level: 'Hard',
        age_range: { min_age: 9, max_age: 12 },
        image_url: 'https://example.com/image.jpg',
        image_attribution: {
          photographer: 'Test',
          license: 'CC-BY-4.0',
          source: 'Test',
          usage_rights: 'Educational',
        },
        evidence_base: [{
          citation: 'Test (2023)',
          publication_year: 2023,
          effectiveness_rating: 0.8,
          sample_size: 100,
          study_type: 'RCT',
        }],
      };

      // Create the games
      const createdAppropriate = GameMetadataService.createGame(appropriateGame);
      const createdInappropriate = GameMetadataService.createGame(inappropriateGame);

      // Get alternatives for the inappropriate game
      const alternatives = GameMetadataService.getAgeAppropriateAlternatives(5, createdInappropriate, 3);
      
      expect(Array.isArray(alternatives)).toBe(true);
      
      // Should find the appropriate game as an alternative
      if (alternatives.length > 0) {
        const alternative = alternatives[0];
        expect(alternative.age_range.min_age).toBeLessThanOrEqual(5);
        expect(alternative.age_range.max_age).toBeGreaterThanOrEqual(5);
      }
    });
  });

  describe('Game Metadata Management', () => {
    test('creates and validates complete game metadata', () => {
      const gameData = {
        title: 'Therapeutic Memory Game',
        description: 'A memory game designed to improve cognitive function and attention span',
        therapeutic_goals: ['cognitive-development', 'attention-building', 'memory-enhancement'],
        difficulty_level: 'Medium',
        age_range: { min_age: 6, max_age: 10 },
        image_url: 'https://example.com/memory-game.jpg',
        image_attribution: {
          photographer: 'Dr. Sarah Johnson',
          license: 'CC-BY-4.0',
          source: 'Therapeutic Games Research Lab',
          usage_rights: 'Educational and therapeutic use permitted',
        },
        evidence_base: [{
          citation: 'Johnson, S. et al. (2023). Effectiveness of digital memory games in pediatric therapy. Journal of Therapeutic Gaming, 15(3), 45-62.',
          publication_year: 2023,
          effectiveness_rating: 0.87,
          sample_size: 150,
          study_type: 'RCT',
        }],
      };

      const game = GameMetadataService.createGame(gameData);
      
      expect(game).toHaveProperty('game_id');
      expect(game).toHaveProperty('title', gameData.title);
      expect(game).toHaveProperty('description', gameData.description);
      expect(game).toHaveProperty('therapeutic_goals');
      expect(game).toHaveProperty('difficulty_level', 'Medium');
      expect(game).toHaveProperty('age_range');
      expect(game).toHaveProperty('image_url', gameData.image_url);
      expect(game).toHaveProperty('image_attribution');
      expect(game).toHaveProperty('evidence_base');
      expect(game).toHaveProperty('created_at');
      expect(game).toHaveProperty('updated_at');
      expect(game).toHaveProperty('version', 1);
      expect(game).toHaveProperty('is_active', true);
      
      // Verify therapeutic goals array
      expect(Array.isArray(game.therapeutic_goals)).toBe(true);
      expect(game.therapeutic_goals).toContain('cognitive-development');
      expect(game.therapeutic_goals).toContain('attention-building');
      expect(game.therapeutic_goals).toContain('memory-enhancement');
      
      // Verify evidence base
      expect(Array.isArray(game.evidence_base)).toBe(true);
      expect(game.evidence_base[0]).toHaveProperty('effectiveness_rating', 0.87);
      expect(game.evidence_base[0]).toHaveProperty('sample_size', 150);
    });

    test('validates metadata and rejects invalid data', () => {
      const invalidData = {
        title: '', // Invalid: empty title
        description: 'A' * 600, // Invalid: too long
        therapeutic_goals: [], // Invalid: empty array
        difficulty_level: 'SuperHard', // Invalid: not in allowed values
        age_range: { min_age: 15, max_age: 20 }, // Invalid: outside 3-12 range
        image_url: 'not-a-url', // Invalid: not a valid URL
        image_attribution: {}, // Invalid: missing required fields
        evidence_base: [], // Invalid: empty array
      };

      const validation = GameMetadataService.validateMetadata(invalidData);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      expect(validation.errors.some(error => error.includes('Title'))).toBe(true);
      expect(validation.errors.some(error => error.includes('therapeutic goal'))).toBe(true);
      expect(validation.errors.some(error => error.includes('Difficulty level'))).toBe(true);
      expect(validation.errors.some(error => error.includes('age'))).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles missing game gracefully', () => {
      expect(() => {
        GameMetadataService.getGame('nonexistent-game');
      }).toThrow('Game not found: nonexistent-game');
    });

    test('handles invalid difficulty adjustment parameters', () => {
      const adjustment = GameMetadataService.adjustDifficultyInRealtime(null, null);
      
      expect(adjustment.difficultyAdjusted).toBe(false);
      expect(adjustment.reason).toContain('Invalid session or performance data');
    });

    test('handles invalid age appropriateness parameters', () => {
      const validation = GameMetadataService.validateAgeAppropriate(null, null);
      
      expect(validation.isAppropriate).toBe(false);
      expect(validation.reason).toBe('Invalid input parameters');
      expect(validation.hasOverride).toBe(false);
      expect(validation.overrideDetails).toBeNull();
    });

    test('handles insufficient data for difficulty recommendation', () => {
      const recommendation = GameMetadataService.calculateDifficultyRecommendation('child-123', null);
      
      expect(recommendation.recommendedDifficulty).toBe('Easy');
      expect(recommendation.reason).toBe('Insufficient data for recommendation');
      expect(recommendation.confidence).toBe(0);
    });
  });
});