/**
 * Unit tests for GameMetadataService age appropriateness validation
 * Tests age validation, developmental stage consideration, and therapist overrides
 * 
 * Requirements: 4.5, 7.1, 7.2, 7.3, 7.4
 */

import GameMetadataService from '../GameMetadataService.js';

describe('GameMetadataService - Age Appropriateness Validation', () => {
  let service;

  beforeEach(() => {
    service = GameMetadataService;
    service.clear();
  });

  afterEach(() => {
    service.clear();
  });

  // Sample game data for testing
  const createTestGame = (overrides = {}) => {
    const baseGame = {
      title: 'Test Game',
      description: 'A test game for validation',
      therapeutic_goals: ['Speech Articulation', 'Language Development'],
      difficulty_level: 'Easy',
      age_range: {
        min_age: 5,
        max_age: 8,
        developmental_stage: 'middle-childhood',
      },
      image_url: 'https://example.com/image.jpg',
      image_attribution: {
        photographer: 'Test Photographer',
        license: 'CC-BY-4.0',
        source: 'Test Source',
        usage_rights: 'Educational use',
      },
      evidence_base: [
        {
          citation: 'Test Citation',
          publication_year: 2020,
          effectiveness_rating: 0.85,
          sample_size: 100,
          study_type: 'RCT',
        },
      ],
    };

    // Carefully merge overrides to preserve required fields
    const result = { ...baseGame };
    
    // Override simple fields
    if (overrides.title !== undefined) result.title = overrides.title;
    if (overrides.description !== undefined) result.description = overrides.description;
    if (overrides.difficulty_level !== undefined) result.difficulty_level = overrides.difficulty_level;
    if (overrides.image_url !== undefined) result.image_url = overrides.image_url;
    if (overrides.therapeutic_goals !== undefined) result.therapeutic_goals = overrides.therapeutic_goals;
    
    // Merge nested objects
    if (overrides.age_range) {
      result.age_range = { ...baseGame.age_range, ...overrides.age_range };
    }
    if (overrides.image_attribution) {
      result.image_attribution = { ...baseGame.image_attribution, ...overrides.image_attribution };
    }
    if (overrides.evidence_base) {
      result.evidence_base = overrides.evidence_base;
    }

    return result;
  };

  describe('validateAgeAppropriate', () => {
    test('should validate age-appropriate game selection', () => {
      const game = service.createGame(createTestGame());
      const result = service.validateAgeAppropriate(6, game);

      expect(result.isAppropriate).toBe(true);
      expect(result.reason).toBe('Game is age-appropriate');
      expect(result.hasOverride).toBe(false);
    });

    test('should reject game when child is too young', () => {
      const game = service.createGame(createTestGame());
      const result = service.validateAgeAppropriate(3, game);

      expect(result.isAppropriate).toBe(false);
      expect(result.reason).toContain('too young');
      expect(result.reason).toContain('5-8');
      expect(result.hasOverride).toBe(false);
    });

    test('should reject game when child is too old', () => {
      const game = service.createGame(createTestGame());
      const result = service.validateAgeAppropriate(10, game);

      expect(result.isAppropriate).toBe(false);
      expect(result.reason).toContain('too old');
      expect(result.reason).toContain('5-8');
      expect(result.hasOverride).toBe(false);
    });

    test('should accept game at minimum age boundary', () => {
      const game = service.createGame(createTestGame());
      const result = service.validateAgeAppropriate(5, game);

      expect(result.isAppropriate).toBe(true);
    });

    test('should accept game at maximum age boundary', () => {
      const game = service.createGame(createTestGame());
      const result = service.validateAgeAppropriate(8, game);

      expect(result.isAppropriate).toBe(true);
    });

    test('should handle invalid input parameters', () => {
      const game = service.createGame(createTestGame());
      const result = service.validateAgeAppropriate('invalid', game);

      expect(result.isAppropriate).toBe(false);
      expect(result.reason).toContain('Invalid input');
    });

    test('should handle null game', () => {
      const result = service.validateAgeAppropriate(6, null);

      expect(result.isAppropriate).toBe(false);
      expect(result.reason).toContain('Invalid input');
    });
  });

  describe('developmental stage consideration', () => {
    test('should validate developmental stage appropriateness', () => {
      const game = service.createGame(
        createTestGame({
          age_range: {
            min_age: 6,
            max_age: 8,
            developmental_stage: 'middle-childhood',
          },
        })
      );

      const result = service.validateAgeAppropriate(7, game, 'middle-childhood');

      expect(result.isAppropriate).toBe(true);
    });

    test('should reject game for incompatible developmental stage', () => {
      const game = service.createGame(
        createTestGame({
          age_range: {
            min_age: 6,
            max_age: 8,
            developmental_stage: 'late-childhood',
          },
        })
      );

      // Use age 7 which is within the range, but developmental stage is incompatible
      const result = service.validateAgeAppropriate(7, game, 'early-childhood');

      expect(result.isAppropriate).toBe(false);
      expect(result.reason).toContain('developmental stage');
    });

    test('should allow reinforcement games (one level below)', () => {
      const game = service.createGame(
        createTestGame({
          age_range: {
            min_age: 5,
            max_age: 8,
            developmental_stage: 'early-childhood',
          },
        })
      );

      // Middle-childhood child (age 9) can play early-childhood game (age 5-8) for reinforcement
      // But we need to use an age within the game's range, so use age 7
      const result = service.validateAgeAppropriate(7, game, 'middle-childhood');

      expect(result.isAppropriate).toBe(true);
    });

    test('should handle unknown developmental stages gracefully', () => {
      const game = service.createGame(
        createTestGame({
          age_range: {
            min_age: 6,
            max_age: 8,
            developmental_stage: 'unknown-stage',
          },
        })
      );

      const result = service.validateAgeAppropriate(7, game, 'unknown-child-stage');

      // Should be considered compatible when stages are unknown
      expect(result.isAppropriate).toBe(true);
    });
  });

  describe('therapist override capability', () => {
    test('should allow therapist override for age-inappropriate game', () => {
      const game = service.createGame(createTestGame());

      // First validation should fail
      let result = service.validateAgeAppropriate(3, game);
      expect(result.isAppropriate).toBe(false);

      // Log therapist override
      const override = service.logTherapistOverride(
        'child-123',
        game.game_id,
        'therapist-456',
        'Clinical assessment indicates readiness despite age'
      );

      expect(override).toBeDefined();
      expect(override.override_id).toBeDefined();
      expect(override.is_active).toBe(true);

      // After override, validation should pass
      result = service.validateAgeAppropriate(3, game);
      expect(result.isAppropriate).toBe(true);
      expect(result.hasOverride).toBe(true);
      expect(result.reason).toContain('Therapist override');
    });

    test('should track override reason in audit trail', () => {
      const game = service.createGame(createTestGame());
      const reason = 'Child demonstrates advanced language skills';

      service.logTherapistOverride(
        'child-123',
        game.game_id,
        'therapist-456',
        reason
      );

      const auditTrail = service.getAuditTrail(game.game_id);
      const overrideEntry = auditTrail.find((entry) => entry.action === 'THERAPIST_OVERRIDE');

      expect(overrideEntry).toBeDefined();
      expect(overrideEntry.new_data.reason).toBe(reason);
    });

    test('should revoke therapist override', () => {
      const game = service.createGame(createTestGame());

      const override = service.logTherapistOverride(
        'child-123',
        game.game_id,
        'therapist-456',
        'Test override'
      );

      // Validation should pass with active override
      let result = service.validateAgeAppropriate(3, game);
      expect(result.isAppropriate).toBe(true);

      // Revoke override
      service.revokeTherapistOverride(override.override_id);

      // Validation should fail after revoke
      result = service.validateAgeAppropriate(3, game);
      expect(result.isAppropriate).toBe(false);
    });

    test('should retrieve all overrides for a game', () => {
      const game = service.createGame(createTestGame());

      service.logTherapistOverride('child-1', game.game_id, 'therapist-1', 'Reason 1');
      service.logTherapistOverride('child-2', game.game_id, 'therapist-2', 'Reason 2');

      const overrides = service.getTherapistOverrides(game.game_id);

      expect(overrides).toHaveLength(2);
      expect(overrides[0].child_id).toBe('child-1');
      expect(overrides[1].child_id).toBe('child-2');
    });
  });

  describe('getAgeAppropriateAlternatives', () => {
    test('should suggest age-appropriate alternatives with similar goals', () => {
      const game1 = service.createGame(
        createTestGame({
          title: 'Original Game',
          age_range: { min_age: 9, max_age: 12, developmental_stage: 'late-childhood' },
          therapeutic_goals: ['Speech Articulation', 'Language Development'],
        })
      );

      const game2 = service.createGame(
        createTestGame({
          title: 'Alternative 1',
          age_range: { min_age: 5, max_age: 8, developmental_stage: 'middle-childhood' },
          therapeutic_goals: ['Speech Articulation', 'Social Awareness'],
        })
      );

      const game3 = service.createGame(
        createTestGame({
          title: 'Alternative 2',
          age_range: { min_age: 5, max_age: 8, developmental_stage: 'middle-childhood' },
          therapeutic_goals: ['Language Development', 'Cognitive Development'],
        })
      );

      const alternatives = service.getAgeAppropriateAlternatives(6, game1);

      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives.some((g) => g.game_id === game2.game_id)).toBe(true);
      expect(alternatives.some((g) => g.game_id === game3.game_id)).toBe(true);
      expect(alternatives.some((g) => g.game_id === game1.game_id)).toBe(false); // Original excluded
    });

    test('should exclude original game from alternatives', () => {
      const game = service.createGame(createTestGame());
      const alternatives = service.getAgeAppropriateAlternatives(6, game);

      expect(alternatives.every((g) => g.game_id !== game.game_id)).toBe(true);
    });

    test('should only suggest age-appropriate alternatives', () => {
      const game1 = service.createGame(
        createTestGame({
          title: 'Original Game',
          age_range: { min_age: 9, max_age: 12, developmental_stage: 'late-childhood' },
          therapeutic_goals: ['Speech Articulation'],
        })
      );

      const game2 = service.createGame(
        createTestGame({
          title: 'Too Young',
          age_range: { min_age: 3, max_age: 4, developmental_stage: 'early-childhood' },
          therapeutic_goals: ['Speech Articulation'],
        })
      );

      const game3 = service.createGame(
        createTestGame({
          title: 'Just Right',
          age_range: { min_age: 5, max_age: 8, developmental_stage: 'middle-childhood' },
          therapeutic_goals: ['Speech Articulation'],
        })
      );

      const alternatives = service.getAgeAppropriateAlternatives(6, game1);

      expect(alternatives.some((g) => g.game_id === game3.game_id)).toBe(true);
      expect(alternatives.some((g) => g.game_id === game2.game_id)).toBe(false);
    });

    test('should require shared therapeutic goals', () => {
      const game1 = service.createGame(
        createTestGame({
          title: 'Original Game',
          age_range: { min_age: 9, max_age: 12, developmental_stage: 'late-childhood' },
          therapeutic_goals: ['Speech Articulation'],
        })
      );

      const game2 = service.createGame(
        createTestGame({
          title: 'Different Goals',
          age_range: { min_age: 5, max_age: 8, developmental_stage: 'middle-childhood' },
          therapeutic_goals: ['Fine Motor Skills', 'Gross Motor Skills'],
        })
      );

      const alternatives = service.getAgeAppropriateAlternatives(6, game1);

      expect(alternatives.some((g) => g.game_id === game2.game_id)).toBe(false);
    });

    test('should respect limit parameter', () => {
      // Create multiple alternatives
      for (let i = 0; i < 5; i++) {
        service.createGame(
          createTestGame({
            title: `Alternative ${i}`,
            age_range: { min_age: 5, max_age: 8, developmental_stage: 'middle-childhood' },
            therapeutic_goals: ['Speech Articulation'],
          })
        );
      }

      const game = service.createGame(
        createTestGame({
          title: 'Original',
          age_range: { min_age: 9, max_age: 12, developmental_stage: 'late-childhood' },
          therapeutic_goals: ['Speech Articulation'],
        })
      );

      const alternatives = service.getAgeAppropriateAlternatives(6, game, 2);

      expect(alternatives.length).toBeLessThanOrEqual(2);
    });

    test('should sort alternatives by effectiveness rating', () => {
      const game1 = service.createGame(
        createTestGame({
          title: 'Original',
          age_range: { min_age: 9, max_age: 12, developmental_stage: 'late-childhood' },
          therapeutic_goals: ['Speech Articulation'],
        })
      );

      const game2 = service.createGame(
        createTestGame({
          title: 'Less Effective',
          age_range: { min_age: 5, max_age: 8, developmental_stage: 'middle-childhood' },
          therapeutic_goals: ['Speech Articulation'],
          evidence_base: [
            {
              citation: 'Test',
              publication_year: 2020,
              effectiveness_rating: 0.6,
              sample_size: 50,
              study_type: 'observational',
            },
          ],
        })
      );

      const game3 = service.createGame(
        createTestGame({
          title: 'More Effective',
          age_range: { min_age: 5, max_age: 8, developmental_stage: 'middle-childhood' },
          therapeutic_goals: ['Speech Articulation'],
          evidence_base: [
            {
              citation: 'Test',
              publication_year: 2020,
              effectiveness_rating: 0.95,
              sample_size: 200,
              study_type: 'RCT',
            },
          ],
        })
      );

      const alternatives = service.getAgeAppropriateAlternatives(6, game1);

      // More effective game should come first
      expect(alternatives[0].game_id).toBe(game3.game_id);
      expect(alternatives[1].game_id).toBe(game2.game_id);
    });
  });

  describe('integration with game selection', () => {
    test('should prevent age-inappropriate game selection without override', () => {
      const game = service.createGame(createTestGame());
      const validation = service.validateAgeAppropriate(3, game);

      expect(validation.isAppropriate).toBe(false);
    });

    test('should allow age-appropriate game selection', () => {
      const game = service.createGame(createTestGame());
      const validation = service.validateAgeAppropriate(6, game);

      expect(validation.isAppropriate).toBe(true);
    });

    test('should provide alternatives when game is not age-appropriate', () => {
      const game1 = service.createGame(
        createTestGame({
          title: 'Too Old',
          age_range: { min_age: 9, max_age: 12, developmental_stage: 'late-childhood' },
          therapeutic_goals: ['Speech Articulation'],
        })
      );

      const game2 = service.createGame(
        createTestGame({
          title: 'Just Right',
          age_range: { min_age: 5, max_age: 8, developmental_stage: 'middle-childhood' },
          therapeutic_goals: ['Speech Articulation'],
        })
      );

      const validation = service.validateAgeAppropriate(6, game1);
      expect(validation.isAppropriate).toBe(false);

      const alternatives = service.getAgeAppropriateAlternatives(6, game1);
      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives.some((g) => g.game_id === game2.game_id)).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle games with no alternatives', () => {
      const game = service.createGame(
        createTestGame({
          therapeutic_goals: ['Unique Goal'],
        })
      );

      const alternatives = service.getAgeAppropriateAlternatives(6, game);

      expect(Array.isArray(alternatives)).toBe(true);
      expect(alternatives.length).toBe(0);
    });

    test('should handle age range of 1 year', () => {
      const game = service.createGame(
        createTestGame({
          age_range: { min_age: 7, max_age: 7, developmental_stage: 'middle-childhood' },
        })
      );

      const result1 = service.validateAgeAppropriate(7, game);
      const result2 = service.validateAgeAppropriate(6, game);

      expect(result1.isAppropriate).toBe(true);
      expect(result2.isAppropriate).toBe(false);
    });

    test('should handle full age range (3-12)', () => {
      const game = service.createGame(
        createTestGame({
          age_range: { min_age: 3, max_age: 12, developmental_stage: 'early-childhood' },
        })
      );

      for (let age = 3; age <= 12; age++) {
        const result = service.validateAgeAppropriate(age, game);
        expect(result.isAppropriate).toBe(true);
      }
    });

    test('should clear overrides when service is cleared', () => {
      const game = service.createGame(createTestGame());

      service.logTherapistOverride('child-123', game.game_id, 'therapist-456', 'Test');

      let result = service.validateAgeAppropriate(3, game);
      expect(result.hasOverride).toBe(true);

      service.clear();

      const game2 = service.createGame(createTestGame());
      result = service.validateAgeAppropriate(3, game2);
      expect(result.hasOverride).toBe(false);
    });
  });
});
