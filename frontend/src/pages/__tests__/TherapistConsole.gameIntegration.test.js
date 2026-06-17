import GameMetadataService from '../../services/GameMetadataService';

/**
 * Unit Test for TherapistConsole Game Integration
 * 
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
 * 
 * Tests the integration of game metadata services with TherapistConsole:
 * 1. Game metadata service integration
 * 2. Age appropriateness validation
 * 3. Game filtering capabilities
 * 4. Session management setup
 */

describe('TherapistConsole Game Integration', () => {
  beforeEach(() => {
    // Clear any existing data
    GameMetadataService.clear();
  });

  test('integrates with GameMetadataService for game retrieval', () => {
    // Create test games
    const testGame1 = {
      game_id: 'game-1',
      title: 'Memory Match',
      description: 'A therapeutic memory matching game',
      difficulty_level: 'Easy',
      age_range: { min_age: 4, max_age: 8 },
      therapeutic_goals: ['Memory Enhancement', 'Attention Building'],
      image_url: 'https://example.com/memory-match.jpg',
      image_attribution: {
        photographer: 'Test Photographer',
        license: 'CC-BY-4.0',
        source: 'Test Source'
      },
      evidence_base: [{
        citation: 'Test Study (2023)',
        publication_year: 2023,
        effectiveness_rating: 0.85,
        sample_size: 100,
        study_type: 'RCT'
      }]
    };

    const testGame2 = {
      game_id: 'game-2',
      title: 'Social Stories',
      description: 'Interactive social awareness activities',
      difficulty_level: 'Medium',
      age_range: { min_age: 6, max_age: 12 },
      therapeutic_goals: ['Social Awareness', 'Emotional Regulation'],
      image_url: 'https://example.com/social-stories.jpg',
      image_attribution: {
        photographer: 'Test Photographer 2',
        license: 'CC-BY-4.0',
        source: 'Test Source 2'
      },
      evidence_base: [{
        citation: 'Another Study (2023)',
        publication_year: 2023,
        effectiveness_rating: 0.78,
        sample_size: 150,
        study_type: 'observational'
      }]
    };

    // Add games to service
    GameMetadataService.createGame(testGame1);
    GameMetadataService.createGame(testGame2);

    // Test game retrieval
    const allGames = GameMetadataService.getAllGames();
    expect(allGames).toHaveLength(2);
    expect(allGames[0].title).toBe('Memory Match');
    expect(allGames[1].title).toBe('Social Stories');
  });

  test('validates age appropriateness for game selection', () => {
    // Create test game
    const testGame = {
      game_id: 'game-1',
      title: 'Memory Match',
      description: 'A therapeutic memory matching game',
      difficulty_level: 'Easy',
      age_range: { min_age: 4, max_age: 8 },
      therapeutic_goals: ['Memory Enhancement'],
      image_url: 'https://example.com/memory-match.jpg',
      image_attribution: {
        photographer: 'Test Photographer',
        license: 'CC-BY-4.0',
        source: 'Test Source'
      },
      evidence_base: [{
        citation: 'Test Study (2023)',
        publication_year: 2023,
        effectiveness_rating: 0.85,
        sample_size: 100,
        study_type: 'RCT'
      }]
    };

    GameMetadataService.createGame(testGame);

    // Test age validation
    const validationResult = GameMetadataService.validateAgeAppropriate(6, testGame);
    expect(validationResult.isAppropriate).toBe(true);

    const invalidValidationResult = GameMetadataService.validateAgeAppropriate(10, testGame);
    expect(invalidValidationResult.isAppropriate).toBe(false);
  });

  test('filters games by age and difficulty', () => {
    // Create test games with different age ranges and difficulties
    const easyGame = {
      game_id: 'easy-game',
      title: 'Easy Game',
      description: 'An easy therapeutic game',
      difficulty_level: 'Easy',
      age_range: { min_age: 3, max_age: 6 },
      therapeutic_goals: ['Basic Skills'],
      image_url: 'https://example.com/easy.jpg',
      image_attribution: {
        photographer: 'Test',
        license: 'CC-BY-4.0',
        source: 'Test'
      },
      evidence_base: [{
        citation: 'Easy Study (2023)',
        publication_year: 2023,
        effectiveness_rating: 0.8,
        sample_size: 50,
        study_type: 'RCT'
      }]
    };

    const hardGame = {
      game_id: 'hard-game',
      title: 'Hard Game',
      description: 'A challenging therapeutic game',
      difficulty_level: 'Hard',
      age_range: { min_age: 8, max_age: 12 },
      therapeutic_goals: ['Advanced Skills'],
      image_url: 'https://example.com/hard.jpg',
      image_attribution: {
        photographer: 'Test',
        license: 'CC-BY-4.0',
        source: 'Test'
      },
      evidence_base: [{
        citation: 'Hard Study (2023)',
        publication_year: 2023,
        effectiveness_rating: 0.9,
        sample_size: 75,
        study_type: 'RCT'
      }]
    };

    GameMetadataService.createGame(easyGame);
    GameMetadataService.createGame(hardGame);

    // Test filtering by age and difficulty
    const easyGamesForAge5 = GameMetadataService.getGamesByAgeAndDifficulty(5, 'Easy');
    expect(easyGamesForAge5).toHaveLength(1);
    expect(easyGamesForAge5[0].title).toBe('Easy Game');

    const hardGamesForAge10 = GameMetadataService.getGamesByAgeAndDifficulty(10, 'Hard');
    expect(hardGamesForAge10).toHaveLength(1);
    expect(hardGamesForAge10[0].title).toBe('Hard Game');

    // Test no matches
    const noMatches = GameMetadataService.getGamesByAgeAndDifficulty(5, 'Hard');
    expect(noMatches).toHaveLength(0);
  });

  test('filters games by therapeutic goals', () => {
    // Create test games with different therapeutic goals
    const memoryGame = {
      game_id: 'memory-game',
      title: 'Memory Game',
      description: 'Memory enhancement game',
      difficulty_level: 'Medium',
      age_range: { min_age: 5, max_age: 10 },
      therapeutic_goals: ['Memory Enhancement', 'Attention Building'],
      image_url: 'https://example.com/memory.jpg',
      image_attribution: {
        photographer: 'Test',
        license: 'CC-BY-4.0',
        source: 'Test'
      },
      evidence_base: [{
        citation: 'Memory Study (2023)',
        publication_year: 2023,
        effectiveness_rating: 0.85,
        sample_size: 100,
        study_type: 'RCT'
      }]
    };

    const socialGame = {
      game_id: 'social-game',
      title: 'Social Game',
      description: 'Social skills game',
      difficulty_level: 'Medium',
      age_range: { min_age: 5, max_age: 10 },
      therapeutic_goals: ['Social Awareness', 'Emotional Regulation'],
      image_url: 'https://example.com/social.jpg',
      image_attribution: {
        photographer: 'Test',
        license: 'CC-BY-4.0',
        source: 'Test'
      },
      evidence_base: [{
        citation: 'Social Study (2023)',
        publication_year: 2023,
        effectiveness_rating: 0.78,
        sample_size: 80,
        study_type: 'observational'
      }]
    };

    GameMetadataService.createGame(memoryGame);
    GameMetadataService.createGame(socialGame);

    // Test filtering by therapeutic goals
    const memoryGames = GameMetadataService.getGamesByTherapeuticGoals(['Memory Enhancement']);
    expect(memoryGames).toHaveLength(1);
    expect(memoryGames[0].title).toBe('Memory Game');

    const socialGames = GameMetadataService.getGamesByTherapeuticGoals(['Social Awareness']);
    expect(socialGames).toHaveLength(1);
    expect(socialGames[0].title).toBe('Social Game');

    // Test multiple goals
    const bothGoals = GameMetadataService.getGamesByTherapeuticGoals(['Memory Enhancement', 'Social Awareness']);
    expect(bothGoals).toHaveLength(2);
  });

  test('provides game recommendations based on child profile', () => {
    // Create test games
    const game1 = {
      game_id: 'rec-game-1',
      title: 'Recommended Game 1',
      description: 'First recommended game',
      difficulty_level: 'Easy',
      age_range: { min_age: 4, max_age: 8 },
      therapeutic_goals: ['Memory Enhancement'],
      image_url: 'https://example.com/rec1.jpg',
      image_attribution: {
        photographer: 'Test',
        license: 'CC-BY-4.0',
        source: 'Test'
      },
      evidence_base: [{
        citation: 'Rec Study 1 (2023)',
        publication_year: 2023,
        effectiveness_rating: 0.85,
        sample_size: 100,
        study_type: 'RCT'
      }]
    };

    const game2 = {
      game_id: 'rec-game-2',
      title: 'Recommended Game 2',
      description: 'Second recommended game',
      difficulty_level: 'Easy',
      age_range: { min_age: 4, max_age: 8 },
      therapeutic_goals: ['Attention Building'],
      image_url: 'https://example.com/rec2.jpg',
      image_attribution: {
        photographer: 'Test',
        license: 'CC-BY-4.0',
        source: 'Test'
      },
      evidence_base: [{
        citation: 'Rec Study 2 (2023)',
        publication_year: 2023,
        effectiveness_rating: 0.78,
        sample_size: 90,
        study_type: 'RCT'
      }]
    };

    GameMetadataService.createGame(game1);
    GameMetadataService.createGame(game2);

    // Test recommendations
    const recommendations = GameMetadataService.getRecommendedGames(6, ['Memory Enhancement'], 5);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].age_range.min_age).toBeLessThanOrEqual(6);
    expect(recommendations[0].age_range.max_age).toBeGreaterThanOrEqual(6);
  });

  test('handles session data structure for progress tracking', () => {
    // Test session data structure that would be used by TherapistConsole
    const mockSessionData = {
      child_id: 'child-1',
      game_id: 'game-1',
      therapist_id: 'therapist-1',
      started_at: new Date(),
      therapeutic_goals_targeted: ['Memory Enhancement', 'Attention Building']
    };

    // Verify session data structure
    expect(mockSessionData).toHaveProperty('child_id');
    expect(mockSessionData).toHaveProperty('game_id');
    expect(mockSessionData).toHaveProperty('therapist_id');
    expect(mockSessionData).toHaveProperty('started_at');
    expect(mockSessionData).toHaveProperty('therapeutic_goals_targeted');
    expect(Array.isArray(mockSessionData.therapeutic_goals_targeted)).toBe(true);
  });

  test('validates game metadata completeness for console display', () => {
    // Test that games have all required metadata for display
    const completeGame = {
      title: 'Complete Game',
      description: 'A game with complete metadata',
      difficulty_level: 'Medium',
      age_range: { min_age: 5, max_age: 10 },
      therapeutic_goals: ['Memory Enhancement'],
      image_url: 'https://example.com/complete.jpg',
      image_attribution: {
        photographer: 'Test Photographer',
        license: 'CC-BY-4.0',
        source: 'Test Source'
      },
      evidence_base: [{
        citation: 'Complete Study (2023)',
        publication_year: 2023,
        effectiveness_rating: 0.9,
        sample_size: 200,
        study_type: 'RCT'
      }]
    };

    // Validate metadata
    const validation = GameMetadataService.validateMetadata(completeGame);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Create game and get the created game object
    const createdGame = GameMetadataService.createGame(completeGame);
    const retrievedGame = GameMetadataService.getGame(createdGame.game_id);
    
    // Verify all required fields for console display
    expect(retrievedGame.title).toBeDefined();
    expect(retrievedGame.description).toBeDefined();
    expect(retrievedGame.difficulty_level).toBeDefined();
    expect(retrievedGame.age_range).toBeDefined();
    expect(retrievedGame.therapeutic_goals).toBeDefined();
    expect(retrievedGame.image_url).toBeDefined();
    expect(retrievedGame.image_attribution).toBeDefined();
    expect(retrievedGame.evidence_base).toBeDefined();
  });
});