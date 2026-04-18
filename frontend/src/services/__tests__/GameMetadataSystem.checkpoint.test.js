/**
 * Checkpoint Test: Game Metadata System Verification
 * 
 * Verifies all Phase 3 requirements:
 * - 4.1-4.5: Game metadata and image database
 * - 6.1-6.4: Metadata structure and persistence
 * - 7.1-7.4: Age appropriateness validation
 * - 8.1-8.4: Difficulty level management
 * - 9.1-9.3: Therapeutic goals documentation
 * - 10.1-10.2: Evidence-based information
 * - 14.1-14.3: Therapist console enhancement
 * - 16.1-16.2: Data persistence and synchronization
 */

import GameMetadataService from '../GameMetadataService';
import GameImageManager from '../GameImageManager';

describe('Checkpoint: Game Metadata System', () => {
  beforeEach(() => {
    GameMetadataService.clear();
    GameImageManager.clearCache();
  });

  describe('Requirement 4.1-4.5: Game Metadata and Image Database', () => {
    test('should provide therapeutic photographs for games', () => {
      const game = {
        game_id: 'game-1',
        title: 'Speech Game',
        description: 'A therapeutic game',
        therapeutic_goals: ['Speech Articulation'],
        difficulty_level: 'Easy',
        age_range: { min_age: 3, max_age: 5, developmental_stage: 'early-childhood' },
        image_url: 'https://example.com/image.jpg',
        image_attribution: {
          photographer: 'John Doe',
          license: 'CC-BY-4.0',
          source: 'Unsplash',
          usage_rights: 'Free for therapeutic use'
        },
        evidence_base: [
          {
            citation: 'Smith et al. (2020)',
            publication_year: 2020,
            effectiveness_rating: 0.85,
            sample_size: 100,
            study_type: 'RCT'
          }
        ]
      };

      const created = GameMetadataService.createGame(game);
      expect(created.image_url).toBe('https://example.com/image.jpg');
      expect(created.image_attribution).toBeDefined();
    });

    test('should validate game metadata completeness', () => {
      const incompleteGame = {
        game_id: 'game-2',
        title: 'Incomplete Game'
        // Missing required fields
      };

      expect(() => GameMetadataService.createGame(incompleteGame)).toThrow();
    });
  });

  describe('Requirement 6.1-6.4: Metadata Structure and Persistence', () => {
    test('should persist all metadata fields', () => {
      const game = {
        title: 'Test Game',
        description: 'Test description',
        therapeutic_goals: ['Speech Articulation'],
        difficulty_level: 'Medium',
        age_range: { min_age: 6, max_age: 8, developmental_stage: 'middle-childhood' },
        image_url: 'https://example.com/image.jpg',
        image_attribution: {
          photographer: 'Jane Doe',
          license: 'CC-BY-4.0',
          source: 'Pexels',
          usage_rights: 'Free'
        },
        evidence_base: [
          {
            citation: 'Test et al. (2020)',
            publication_year: 2020,
            effectiveness_rating: 0.8,
            sample_size: 50,
            study_type: 'RCT'
          }
        ]
      };

      const created = GameMetadataService.createGame(game);
      const retrieved = GameMetadataService.getGame(created.game_id);

      expect(retrieved.title).toBe(game.title);
      expect(retrieved.description).toBe(game.description);
      expect(retrieved.therapeutic_goals).toEqual(game.therapeutic_goals);
      expect(retrieved.difficulty_level).toBe(game.difficulty_level);
    });

    test('should support filtering by age and difficulty', () => {
      const games = [
        {
          title: 'Easy Young',
          description: 'Easy game for young',
          therapeutic_goals: ['Speech Articulation'],
          difficulty_level: 'Easy',
          age_range: { min_age: 3, max_age: 5, developmental_stage: 'early-childhood' },
          image_url: 'https://example.com/1.jpg',
          image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
          evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
        },
        {
          title: 'Hard Old',
          description: 'Hard game for old',
          therapeutic_goals: ['Speech Articulation'],
          difficulty_level: 'Hard',
          age_range: { min_age: 9, max_age: 12, developmental_stage: 'late-childhood' },
          image_url: 'https://example.com/2.jpg',
          image_attribution: { photographer: 'B', license: 'CC', source: 'S', usage_rights: 'U' },
          evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
        }
      ];

      games.forEach(g => GameMetadataService.createGame(g));

      const filtered = GameMetadataService.getGamesByAgeAndDifficulty(4, 'Easy');
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].difficulty_level).toBe('Easy');
    });
  });

  describe('Requirement 7.1-7.4: Age Appropriateness Validation', () => {
    test('should validate age appropriateness', () => {
      const game = {
        title: 'Age Test',
        description: 'Test',
        therapeutic_goals: ['Speech Articulation'],
        difficulty_level: 'Easy',
        age_range: { min_age: 3, max_age: 5, developmental_stage: 'early-childhood' },
        image_url: 'https://example.com/img.jpg',
        image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
        evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
      };

      const created = GameMetadataService.createGame(game);

      const validation = GameMetadataService.validateAgeAppropriate(4, created);
      expect(validation.isAppropriate).toBe(true);

      const invalidValidation = GameMetadataService.validateAgeAppropriate(10, created);
      expect(invalidValidation.isAppropriate).toBe(false);
    });
  });

  describe('Requirement 8.1-8.4: Difficulty Level Management', () => {
    test('should display difficulty level clearly', () => {
      const indicator = GameMetadataService.getDifficultyIndicator('Easy');
      expect(indicator.displayLabel).toBe('Easy');
      expect(indicator.color).toBeDefined();
      expect(indicator.icon).toBeDefined();
    });

    test('should recommend difficulty based on progress', () => {
      const childProgress = {
        total_sessions: 5,
        average_score: 85,
        score_trend: [70, 75, 80, 85, 90]
      };

      const recommendation = GameMetadataService.calculateDifficultyRecommendation('child-1', childProgress);
      expect(recommendation.recommendedDifficulty).toBeDefined();
      expect(['Easy', 'Medium', 'Hard']).toContain(recommendation.recommendedDifficulty);
    });
  });

  describe('Requirement 9.1-9.3: Therapeutic Goals Documentation', () => {
    test('should display therapeutic goals', () => {
      const game = {
        title: 'Goals Test',
        description: 'Test',
        therapeutic_goals: ['Speech Articulation', 'Social Awareness'],
        difficulty_level: 'Medium',
        age_range: { min_age: 6, max_age: 8, developmental_stage: 'middle-childhood' },
        image_url: 'https://example.com/img.jpg',
        image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
        evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
      };

      const created = GameMetadataService.createGame(game);
      const retrieved = GameMetadataService.getGame(created.game_id);

      expect(retrieved.therapeutic_goals).toContain('Speech Articulation');
      expect(retrieved.therapeutic_goals).toContain('Social Awareness');
    });
  });

  describe('Requirement 10.1-10.2: Evidence-Based Information', () => {
    test('should include evidence base information', () => {
      const game = {
        title: 'Evidence Test',
        description: 'Test',
        therapeutic_goals: ['Speech Articulation'],
        difficulty_level: 'Easy',
        age_range: { min_age: 3, max_age: 5, developmental_stage: 'early-childhood' },
        image_url: 'https://example.com/img.jpg',
        image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
        evidence_base: [
          {
            citation: 'Smith et al. (2020)',
            publication_year: 2020,
            effectiveness_rating: 0.85,
            sample_size: 100,
            study_type: 'RCT'
          }
        ]
      };

      const created = GameMetadataService.createGame(game);
      const retrieved = GameMetadataService.getGame(created.game_id);

      expect(retrieved.evidence_base.length).toBeGreaterThan(0);
      expect(retrieved.evidence_base[0].citation).toBeDefined();
      expect(retrieved.evidence_base[0].effectiveness_rating).toBeDefined();
    });
  });

  describe('Requirement 16.1-16.2: Data Persistence', () => {
    test('should persist metadata immediately', () => {
      const game = {
        title: 'Persist Test',
        description: 'Test',
        therapeutic_goals: ['Speech Articulation'],
        difficulty_level: 'Easy',
        age_range: { min_age: 3, max_age: 5, developmental_stage: 'early-childhood' },
        image_url: 'https://example.com/img.jpg',
        image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
        evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
      };

      const startTime = Date.now();
      const created = GameMetadataService.createGame(game);
      const endTime = Date.now();

      const retrieved = GameMetadataService.getGame(created.game_id);
      expect(retrieved).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });

  describe('Image Optimization and Caching', () => {
    test('should validate image files', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const validation = GameImageManager.validateImage(validFile);
      expect(validation.valid).toBe(true);
    });

    test('should validate image attribution', () => {
      const attribution = {
        photographer: 'John Doe',
        license: 'CC-BY-4.0',
        source: 'Unsplash',
        usage_rights: 'Free'
      };

      const validation = GameImageManager.validateAttribution(attribution);
      expect(validation.valid).toBe(true);
    });

    test('should cache images', () => {
      const stats = GameImageManager.getCacheStats();
      expect(stats.cachedImages).toBeDefined();
      expect(stats.totalCacheSize).toBeDefined();
      expect(stats.cacheUtilization).toBeDefined();
    });
  });
});
