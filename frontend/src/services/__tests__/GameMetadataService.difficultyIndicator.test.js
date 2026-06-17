/**
 * Unit tests for DifficultyIndicator service integration
 * Tests difficulty indicator data structure and properties
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import GameMetadataService from '../GameMetadataService.js';

describe('GameMetadataService - Difficulty Indicator', () => {
  let service;

  beforeEach(() => {
    service = GameMetadataService;
    service.clear();
  });

  afterEach(() => {
    service.clear();
  });

  describe('getDifficultyIndicator', () => {
    test('should return complete Easy indicator object', () => {
      const indicator = service.getDifficultyIndicator('Easy');

      expect(indicator).toHaveProperty('difficulty', 'Easy');
      expect(indicator).toHaveProperty('displayLabel', 'Easy');
      expect(indicator).toHaveProperty('color');
      expect(indicator).toHaveProperty('icon');
      expect(indicator).toHaveProperty('description');
      expect(indicator).toHaveProperty('ageRange');
    });

    test('should return complete Medium indicator object', () => {
      const indicator = service.getDifficultyIndicator('Medium');

      expect(indicator).toHaveProperty('difficulty', 'Medium');
      expect(indicator).toHaveProperty('displayLabel', 'Medium');
      expect(indicator).toHaveProperty('color');
      expect(indicator).toHaveProperty('icon');
      expect(indicator).toHaveProperty('description');
      expect(indicator).toHaveProperty('ageRange');
    });

    test('should return complete Hard indicator object', () => {
      const indicator = service.getDifficultyIndicator('Hard');

      expect(indicator).toHaveProperty('difficulty', 'Hard');
      expect(indicator).toHaveProperty('displayLabel', 'Hard');
      expect(indicator).toHaveProperty('color');
      expect(indicator).toHaveProperty('icon');
      expect(indicator).toHaveProperty('description');
      expect(indicator).toHaveProperty('ageRange');
    });

    test('should have valid color codes', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      // Check hex color format
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      expect(easy.color).toMatch(hexColorRegex);
      expect(medium.color).toMatch(hexColorRegex);
      expect(hard.color).toMatch(hexColorRegex);
    });

    test('should have distinct colors for each difficulty', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      expect(easy.color).not.toBe(medium.color);
      expect(medium.color).not.toBe(hard.color);
      expect(easy.color).not.toBe(hard.color);
    });

    test('should have non-empty descriptions', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      expect(easy.description).toBeTruthy();
      expect(easy.description.length).toBeGreaterThan(0);
      expect(medium.description).toBeTruthy();
      expect(medium.description.length).toBeGreaterThan(0);
      expect(hard.description).toBeTruthy();
      expect(hard.description.length).toBeGreaterThan(0);
    });

    test('should have age range information', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      expect(easy.ageRange).toContain('3');
      expect(easy.ageRange).toContain('5');
      expect(medium.ageRange).toContain('6');
      expect(medium.ageRange).toContain('8');
      expect(hard.ageRange).toContain('9');
      expect(hard.ageRange).toContain('12');
    });

    test('should have icons for visual representation', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      expect(easy.icon).toBeTruthy();
      expect(medium.icon).toBeTruthy();
      expect(hard.icon).toBeTruthy();
      expect(typeof easy.icon).toBe('string');
      expect(typeof medium.icon).toBe('string');
      expect(typeof hard.icon).toBe('string');
    });

    test('should have progressive icons (more stars for harder difficulty)', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      // Count star characters
      const easyStars = (easy.icon.match(/⭐/g) || []).length;
      const mediumStars = (medium.icon.match(/⭐/g) || []).length;
      const hardStars = (hard.icon.match(/⭐/g) || []).length;

      expect(easyStars).toBeLessThan(mediumStars);
      expect(mediumStars).toBeLessThan(hardStars);
    });

    test('should return Medium as default for invalid difficulty', () => {
      const indicator = service.getDifficultyIndicator('InvalidDifficulty');

      expect(indicator.difficulty).toBe('Medium');
      expect(indicator.displayLabel).toBe('Medium');
    });

    test('should return Medium as default for null difficulty', () => {
      const indicator = service.getDifficultyIndicator(null);

      expect(indicator.difficulty).toBe('Medium');
    });

    test('should return Medium as default for undefined difficulty', () => {
      const indicator = service.getDifficultyIndicator(undefined);

      expect(indicator.difficulty).toBe('Medium');
    });

    test('should have consistent display labels', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      expect(easy.displayLabel).toBe(easy.difficulty);
      expect(medium.displayLabel).toBe(medium.difficulty);
      expect(hard.displayLabel).toBe(hard.difficulty);
    });

    test('should provide appropriate descriptions for UI display', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      // Easy should mention beginners
      expect(easy.description.toLowerCase()).toContain('beginner');

      // Medium should mention challenge
      expect(medium.description.toLowerCase()).toContain('challenge');

      // Hard should mention advanced
      expect(hard.description.toLowerCase()).toContain('advanced');
    });
  });

  describe('difficulty indicator usage in recommendations', () => {
    test('should use indicator colors in recommendation workflow', () => {
      const childProgress = {
        averageScore: 88,
        completionRate: 0.92,
        sessionCount: 5,
        recentScores: [85, 88, 90, 92, 89],
        currentDifficulty: 'Easy',
      };

      const recommendation = service.calculateDifficultyRecommendation('child-1', childProgress);
      const indicator = service.getDifficultyIndicator(recommendation.recommendedDifficulty);

      expect(indicator).toBeDefined();
      expect(indicator.color).toBeTruthy();
      expect(indicator.displayLabel).toBe(recommendation.recommendedDifficulty);
    });

    test('should provide indicator for all possible recommendations', () => {
      const difficulties = ['Easy', 'Medium', 'Hard'];

      difficulties.forEach((difficulty) => {
        const indicator = service.getDifficultyIndicator(difficulty);
        expect(indicator).toBeDefined();
        expect(indicator.difficulty).toBe(difficulty);
      });
    });
  });

  describe('difficulty indicator accessibility', () => {
    test('should have descriptive text for screen readers', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      // Each should have a description that can be read by screen readers
      expect(easy.description).toBeTruthy();
      expect(medium.description).toBeTruthy();
      expect(hard.description).toBeTruthy();

      // Descriptions should be meaningful
      expect(easy.description.length).toBeGreaterThan(10);
      expect(medium.description.length).toBeGreaterThan(10);
      expect(hard.description.length).toBeGreaterThan(10);
    });

    test('should provide age range information for context', () => {
      const easy = service.getDifficultyIndicator('Easy');
      const medium = service.getDifficultyIndicator('Medium');
      const hard = service.getDifficultyIndicator('Hard');

      // Age ranges should be clear and consistent
      expect(easy.ageRange).toMatch(/Ages \d+-\d+/);
      expect(medium.ageRange).toMatch(/Ages \d+-\d+/);
      expect(hard.ageRange).toMatch(/Ages \d+-\d+/);
    });
  });

  describe('difficulty indicator consistency', () => {
    test('should return consistent indicators across multiple calls', () => {
      const indicator1 = service.getDifficultyIndicator('Easy');
      const indicator2 = service.getDifficultyIndicator('Easy');

      expect(indicator1).toEqual(indicator2);
    });

    test('should maintain indicator properties across service operations', () => {
      const indicatorBefore = service.getDifficultyIndicator('Medium');

      // Perform some service operations
      service.calculateDifficultyRecommendation('child-1', {
        averageScore: 80,
        completionRate: 0.85,
        sessionCount: 5,
        recentScores: [78, 80, 82],
        currentDifficulty: 'Medium',
      });

      const indicatorAfter = service.getDifficultyIndicator('Medium');

      expect(indicatorBefore).toEqual(indicatorAfter);
    });
  });

  describe('difficulty indicator for UI components', () => {
    test('should provide all necessary properties for UI rendering', () => {
      const indicator = service.getDifficultyIndicator('Easy');

      // Check that all properties needed for UI are present
      expect(indicator.difficulty).toBeTruthy(); // For identification
      expect(indicator.displayLabel).toBeTruthy(); // For display
      expect(indicator.color).toBeTruthy(); // For styling
      expect(indicator.icon).toBeTruthy(); // For visual representation
      expect(indicator.description).toBeTruthy(); // For tooltips/help
      expect(indicator.ageRange).toBeTruthy(); // For context
    });

    test('should provide color values suitable for CSS', () => {
      const difficulties = ['Easy', 'Medium', 'Hard'];

      difficulties.forEach((difficulty) => {
        const indicator = service.getDifficultyIndicator(difficulty);
        // Color should be a valid CSS color value
        expect(indicator.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('should provide icons suitable for display', () => {
      const difficulties = ['Easy', 'Medium', 'Hard'];

      difficulties.forEach((difficulty) => {
        const indicator = service.getDifficultyIndicator(difficulty);
        // Icon should be a string (emoji or character)
        expect(typeof indicator.icon).toBe('string');
        expect(indicator.icon.length).toBeGreaterThan(0);
      });
    });
  });
});
