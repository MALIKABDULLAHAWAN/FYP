/**
 * Integration Test: Game Metadata System
 * 
 * Tests the complete workflow of:
 * 1. Creating games with metadata
 * 2. Filtering and searching games
 * 3. Validating age appropriateness
 * 4. Managing difficulty levels
 * 5. Recording game sessions
 * 6. Tracking progress metrics
 */

import GameMetadataService from '../GameMetadataService';
import GameImageManager from '../GameImageManager';

describe('Integration: Game Metadata System Workflow', () => {
  beforeEach(() => {
    GameMetadataService.clear();
    GameImageManager.clearCache();
  });

  describe('Complete Game Selection Workflow', () => {
    test('should complete full game selection workflow', () => {
      // Step 1: Create games
      const games = [
        {
          title: 'Speech Sounds',
          description: 'Learn to pronounce sounds correctly',
          therapeutic_goals: ['Speech Articulation'],
          difficulty_level: 'Easy',
          age_range: { min_age: 3, max_age: 5, developmental_stage: 'early-childhood' },
          image_url: 'https://example.com/speech.jpg',
          image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
          evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.85, sample_size: 100, study_type: 'RCT' }]
        },
        {
          title: 'Social Stories',
          description: 'Learn social interactions',
          therapeutic_goals: ['Social Awareness'],
          difficulty_level: 'Medium',
          age_range: { min_age: 6, max_age: 8, developmental_stage: 'middle-childhood' },
          image_url: 'https://example.com/social.jpg',
          image_attribution: { photographer: 'B', license: 'CC', source: 'S', usage_rights: 'U' },
          evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 80, study_type: 'RCT' }]
        }
      ];

      const createdGames = games.map(g => GameMetadataService.createGame(g));
      expect(createdGames.length).toBe(2);

      // Step 2: Filter games by age
      const childAge = 4;
      const ageAppropriateGames = GameMetadataService.getGamesByAgeAndDifficulty(childAge, 'Easy');
      expect(ageAppropriateGames.length).toBeGreaterThan(0);
      expect(ageAppropriateGames[0].difficulty_level).toBe('Easy');

      // Step 3: Validate age appropriateness
      const selectedGame = createdGames[0];
      const validation = GameMetadataService.validateAgeAppropriate(childAge, selectedGame);
      expect(validation.isAppropriate).toBe(true);

      // Step 4: Get difficulty recommendation
      const childProgress = {
        total_sessions: 3,
        average_score: 75,
        score_trend: [70, 75, 80]
      };
      const recommendation = GameMetadataService.calculateDifficultyRecommendation('child-1', childProgress);
      expect(recommendation.recommendedDifficulty).toBeDefined();

      // Step 5: Get difficulty indicator
      const indicator = GameMetadataService.getDifficultyIndicator(selectedGame.difficulty_level);
      expect(indicator.displayLabel).toBe('Easy');
      expect(indicator.color).toBeDefined();
    });
  });

  describe('Game Filtering and Search', () => {
    test('should filter games by multiple criteria', () => {
      // Create diverse games
      const games = [
        {
          title: 'Speech Game 1',
          description: 'Speech articulation practice',
          therapeutic_goals: ['Speech Articulation'],
          difficulty_level: 'Easy',
          age_range: { min_age: 3, max_age: 5, developmental_stage: 'early-childhood' },
          image_url: 'https://example.com/1.jpg',
          image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
          evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
        },
        {
          title: 'Speech Game 2',
          description: 'Advanced speech practice',
          therapeutic_goals: ['Speech Articulation', 'Language Development'],
          difficulty_level: 'Hard',
          age_range: { min_age: 9, max_age: 12, developmental_stage: 'late-childhood' },
          image_url: 'https://example.com/2.jpg',
          image_attribution: { photographer: 'B', license: 'CC', source: 'S', usage_rights: 'U' },
          evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.85, sample_size: 100, study_type: 'RCT' }]
        },
        {
          title: 'Social Game',
          description: 'Social awareness training',
          therapeutic_goals: ['Social Awareness'],
          difficulty_level: 'Medium',
          age_range: { min_age: 6, max_age: 8, developmental_stage: 'middle-childhood' },
          image_url: 'https://example.com/3.jpg',
          image_attribution: { photographer: 'C', license: 'CC', source: 'S', usage_rights: 'U' },
          evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.75, sample_size: 60, study_type: 'RCT' }]
        }
      ];

      games.forEach(g => GameMetadataService.createGame(g));

      // Test filtering by difficulty
      const easyGames = GameMetadataService.getGamesByAgeAndDifficulty(4, 'Easy');
      expect(easyGames.length).toBeGreaterThan(0);
      expect(easyGames.every(g => g.difficulty_level === 'Easy')).toBe(true);

      // Test filtering by therapeutic goals
      const speechGames = GameMetadataService.getGamesByTherapeuticGoals(['Speech Articulation']);
      expect(speechGames.length).toBeGreaterThan(0);
      expect(speechGames.every(g => g.therapeutic_goals.includes('Speech Articulation'))).toBe(true);

      // Test search
      const searchResults = GameMetadataService.searchGames('Speech');
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(g => g.title.includes('Speech'))).toBe(true);
    });
  });

  describe('Age Appropriateness and Alternatives', () => {
    test('should suggest age-appropriate alternatives', () => {
      // Create games for different age groups
      const games = [
        {
          title: 'Young Game',
          description: 'For young children',
          therapeutic_goals: ['Speech Articulation'],
          difficulty_level: 'Easy',
          age_range: { min_age: 3, max_age: 5, developmental_stage: 'early-childhood' },
          image_url: 'https://example.com/1.jpg',
          image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
          evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
        },
        {
          title: 'Middle Game',
          description: 'For middle children',
          therapeutic_goals: ['Speech Articulation'],
          difficulty_level: 'Medium',
          age_range: { min_age: 6, max_age: 8, developmental_stage: 'middle-childhood' },
          image_url: 'https://example.com/2.jpg',
          image_attribution: { photographer: 'B', license: 'CC', source: 'S', usage_rights: 'U' },
          evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
        },
        {
          title: 'Old Game',
          description: 'For older children',
          therapeutic_goals: ['Speech Articulation'],
          difficulty_level: 'Hard',
          age_range: { min_age: 9, max_age: 12, developmental_stage: 'late-childhood' },
          image_url: 'https://example.com/3.jpg',
          image_attribution: { photographer: 'C', license: 'CC', source: 'S', usage_rights: 'U' },
          evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
        }
      ];

      const createdGames = games.map(g => GameMetadataService.createGame(g));

      // Try to select an age-inappropriate game
      const childAge = 4;
      const inappropriateGame = createdGames[2]; // Old game for 9-12

      const validation = GameMetadataService.validateAgeAppropriate(childAge, inappropriateGame);
      expect(validation.isAppropriate).toBe(false);

      // Get alternatives
      const alternatives = GameMetadataService.getAgeAppropriateAlternatives(childAge, inappropriateGame);
      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives.every(g => g.age_range.min_age <= childAge && childAge <= g.age_range.max_age)).toBe(true);
    });
  });

  describe('Difficulty Management', () => {
    test('should manage difficulty progression', () => {
      // Simulate child progressing through difficulty levels
      let childProgress = {
        averageScore: 0,
        completionRate: 0,
        sessionCount: 0,
        recentScores: [],
        currentDifficulty: 'Easy'
      };

      // Initial recommendation (no data)
      let recommendation = GameMetadataService.calculateDifficultyRecommendation('child-1', childProgress);
      expect(recommendation.recommendedDifficulty).toBe('Easy');

      // After excelling at Easy
      childProgress = {
        averageScore: 90,
        completionRate: 0.95,
        sessionCount: 5,
        recentScores: [85, 88, 90, 92, 95],
        currentDifficulty: 'Easy'
      };
      recommendation = GameMetadataService.calculateDifficultyRecommendation('child-1', childProgress);
      expect(recommendation.recommendedDifficulty).toBe('Medium');

      // After excelling at Medium
      childProgress = {
        averageScore: 88,
        completionRate: 0.92,
        sessionCount: 10,
        recentScores: [85, 88, 90, 92, 95, 85, 88, 90, 92, 95],
        currentDifficulty: 'Medium'
      };
      recommendation = GameMetadataService.calculateDifficultyRecommendation('child-1', childProgress);
      expect(recommendation.recommendedDifficulty).toBe('Hard');
    });

    test('should adjust difficulty in real-time', () => {
      const performanceMetrics = {
        currentDifficulty: 'Medium',
        currentScore: 30,
        tasksCompleted: 1,
        tasksFailed: 9,
        timeSpentSeconds: 600,
        taskCount: 10
      };

      const adjustment = GameMetadataService.adjustDifficultyInRealtime('session-1', performanceMetrics);
      expect(adjustment.difficultyAdjusted).toBe(true);
      expect(adjustment.newDifficulty).toBeDefined();
      expect(adjustment.oldDifficulty).toBe('Medium');
    });
  });

  describe('Image Management', () => {
    test('should validate and cache images', () => {
      // Create a mock file
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Validate file
      const validation = GameImageManager.validateImage(mockFile);
      expect(validation.valid).toBe(true);

      // Validate attribution
      const attribution = {
        photographer: 'John Doe',
        license: 'CC-BY-4.0',
        source: 'Unsplash',
        usage_rights: 'Free for therapeutic use'
      };

      const attributionValidation = GameImageManager.validateAttribution(attribution);
      expect(attributionValidation.valid).toBe(true);

      // Check cache stats
      const stats = GameImageManager.getCacheStats();
      expect(stats.cachedImages).toBeDefined();
      expect(stats.totalCacheSize).toBeDefined();
      expect(stats.cacheUtilization).toBeDefined();
    });
  });

  describe('Metadata Persistence', () => {
    test('should maintain metadata consistency', () => {
      const game = {
        title: 'Consistency Test',
        description: 'Test metadata consistency',
        therapeutic_goals: ['Speech Articulation'],
        difficulty_level: 'Medium',
        age_range: { min_age: 6, max_age: 8, developmental_stage: 'middle-childhood' },
        image_url: 'https://example.com/img.jpg',
        image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
        evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
      };

      // Create game
      const created = GameMetadataService.createGame(game);
      const gameId = created.game_id;

      // Retrieve and verify
      const retrieved = GameMetadataService.getGame(gameId);
      expect(retrieved.title).toBe(game.title);
      expect(retrieved.description).toBe(game.description);
      expect(retrieved.therapeutic_goals).toEqual(game.therapeutic_goals);
      expect(retrieved.difficulty_level).toBe(game.difficulty_level);
      expect(retrieved.age_range).toEqual(game.age_range);

      // Update game
      const updates = { title: 'Updated Title' };
      const updated = GameMetadataService.updateGame(gameId, updates);
      expect(updated.title).toBe('Updated Title');

      // Verify update persisted
      const reRetrieved = GameMetadataService.getGame(gameId);
      expect(reRetrieved.title).toBe('Updated Title');
    });
  });

  describe('Export Functionality', () => {
    test('should export metadata in JSON format', () => {
      const game = {
        title: 'Export Test',
        description: 'Test export',
        therapeutic_goals: ['Speech Articulation'],
        difficulty_level: 'Easy',
        age_range: { min_age: 3, max_age: 5, developmental_stage: 'early-childhood' },
        image_url: 'https://example.com/img.jpg',
        image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
        evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
      };

      GameMetadataService.createGame(game);

      const jsonExport = GameMetadataService.exportToJSON();
      expect(jsonExport).toBeDefined();
      expect(typeof jsonExport).toBe('string');

      // Verify it's valid JSON
      const parsed = JSON.parse(jsonExport);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    test('should export metadata in CSV format', () => {
      const game = {
        title: 'CSV Export Test',
        description: 'Test CSV export',
        therapeutic_goals: ['Speech Articulation'],
        difficulty_level: 'Medium',
        age_range: { min_age: 6, max_age: 8, developmental_stage: 'middle-childhood' },
        image_url: 'https://example.com/img.jpg',
        image_attribution: { photographer: 'A', license: 'CC', source: 'S', usage_rights: 'U' },
        evidence_base: [{ citation: 'Test (2020)', publication_year: 2020, effectiveness_rating: 0.8, sample_size: 50, study_type: 'RCT' }]
      };

      GameMetadataService.createGame(game);

      const csvExport = GameMetadataService.exportToCSV();
      expect(csvExport).toBeDefined();
      expect(typeof csvExport).toBe('string');
      expect(csvExport.includes('CSV Export Test')).toBe(true);
    });
  });
});
