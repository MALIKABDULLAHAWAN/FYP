/**
 * Basic Error Handlers Test Suite
 * 
 * Tests core functionality of error handling services
 * 
 * Requirements: 5.4, 5.5, 7.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DOM APIs for testing
global.Image = class Image {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
  }
  
  set src(value) {
    this._src = value;
    setTimeout(() => {
      if (value.includes('failed') || value.includes('error')) {
        if (this.onerror) this.onerror();
      } else {
        if (this.onload) this.onload();
      }
    }, 10);
  }
  
  get src() {
    return this._src;
  }
};

global.fetch = vi.fn();

// Import handlers after mocking
import ImageErrorHandler from '../ImageErrorHandler.js';
import MetadataValidationHandler from '../MetadataValidationHandler.js';
import AgeValidationErrorHandler from '../AgeValidationErrorHandler.js';
import StickerErrorHandler from '../StickerErrorHandler.js';
import DatabaseErrorHandler from '../DatabaseErrorHandler.js';
import ComprehensiveErrorLogger from '../ComprehensiveErrorLogger.js';

describe('Error Handlers Basic Tests', () => {
  beforeEach(() => {
    // Clear all logs before each test
    ImageErrorHandler.clearLogs();
    MetadataValidationHandler.clearLog();
    AgeValidationErrorHandler.clearLogs();
    StickerErrorHandler.clearLogs();
    DatabaseErrorHandler.clearLogs();
    ComprehensiveErrorLogger.clearAllLogs();
    
    // Reset fetch mock
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
  });

  describe('ImageErrorHandler', () => {
    it('should handle image loading failure with fallback', async () => {
      const imageUrl = 'https://example.com/failed-image.jpg';
      const error = new Error('Network error');
      
      const result = await ImageErrorHandler.handleImageLoadingFailure(
        imageUrl,
        'game',
        'game-123',
        error
      );

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.altText).toBeDefined();
      expect(result.failureId).toBeDefined();
      expect(result.userMessage).toContain('game');
    });

    it('should provide immediate fallback for critical situations', () => {
      const fallback = ImageErrorHandler.getImmediateFallback('game', 'large');
      
      expect(fallback.url).toBeDefined();
      expect(fallback.alt).toBeDefined();
      expect(fallback.immediate).toBe(true);
      expect(fallback.size).toEqual({ width: 200, height: 200 });
    });
  });

  describe('MetadataValidationHandler', () => {
    it('should handle validation failure with user-friendly messages', () => {
      const metadata = {
        title: '',
        description: 'Short',
        therapeutic_goals: [],
        difficulty_level: 'Invalid',
        age_range: { min_age: 15, max_age: 10 }
      };

      const validationResult = {
        valid: false,
        errors: [
          'Title is required',
          'Description too short',
          'At least one therapeutic goal required',
          'Invalid difficulty level',
          'Invalid age range'
        ]
      };

      const result = MetadataValidationHandler.handleValidationFailure(
        metadata,
        validationResult,
        'create-game'
      );

      expect(result.success).toBe(false);
      expect(result.errorId).toBeDefined();
      expect(result.errors).toHaveLength(5);
      expect(result.suggestions).toBeDefined();
      expect(result.userFriendlyMessages).toBeDefined();
      expect(result.canRetry).toBe(true);
    });

    it('should validate individual fields with immediate feedback', () => {
      const result = MetadataValidationHandler.validateField('title', '');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Please add a game title');
    });
  });

  describe('AgeValidationErrorHandler', () => {
    it('should handle age validation failure with child-friendly messages', () => {
      const childAge = 4;
      const game = {
        game_id: 'game-123',
        title: 'Advanced Math Game',
        age_range: { min_age: 8, max_age: 12 }
      };
      const validationResult = {
        isAppropriate: false,
        reason: 'Child is too young'
      };

      const result = AgeValidationErrorHandler.handleAgeValidationFailure(
        childAge,
        game,
        validationResult,
        'game-selection'
      );

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.userMessage).toContain('older');
      expect(result.childFriendlyExplanation).toBeDefined();
      expect(result.childFriendlyExplanation.icon).toBe('🎂');
      expect(result.alternatives.available).toBe(true);
    });

    it('should provide age-appropriate alternatives', () => {
      const childAge = 6;
      const originalGame = {
        game_id: 'game-456',
        title: 'Toddler Shapes',
        age_range: { min_age: 3, max_age: 4 },
        therapeutic_goals: ['shape-recognition', 'fine-motor-skills']
      };

      const alternatives = AgeValidationErrorHandler.getAgeAppropriateAlternatives(
        childAge,
        originalGame
      );

      expect(alternatives).toHaveLength(2);
      alternatives.forEach(alt => {
        expect(alt.age_range.min_age).toBeLessThanOrEqual(childAge);
        expect(alt.age_range.max_age).toBeGreaterThanOrEqual(childAge);
        expect(alt.similarity_score).toBeGreaterThan(0);
      });
    });
  });

  describe('StickerErrorHandler', () => {
    it('should handle sticker loading failure with graceful degradation', () => {
      const sticker = {
        id: 'butterfly',
        name: 'Butterfly',
        svgPath: '/assets/stickers/animals/butterfly.svg'
      };
      const error = new Error('SVG load failed');

      const result = StickerErrorHandler.handleStickerLoadingFailure(
        sticker,
        error,
        'page-decoration'
      );

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.fallbackSticker).toBeDefined();
      expect(result.gracefulDegradation).toBe(true);
      expect(result.userImpact).toBe('minimal');
    });

    it('should provide system health status', () => {
      const health = StickerErrorHandler.getSystemHealth();

      expect(health.status).toBeDefined();
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(health.recommendation).toBeDefined();
    });
  });

  describe('DatabaseErrorHandler', () => {
    it('should handle connection failure and enter offline mode', () => {
      const error = new Error('Connection refused');
      const operation = 'save-game-session';
      const context = { gameId: 'game-123', sessionData: {} };

      const result = DatabaseErrorHandler.handleConnectionFailure(error, operation, context);

      expect(result.success).toBe(false);
      expect(result.offlineMode).toBe(true);
      expect(result.userMessage).toBeDefined();
      expect(result.queuedForSync).toBeDefined();
      expect(result.reconnectScheduled).toBe(true);
      expect(DatabaseErrorHandler.offlineMode).toBe(true);
    });

    it('should cache data for offline use', () => {
      const operation = 'get-games';
      const context = { ageRange: [6, 8] };
      const data = [{ id: 'game-1', title: 'Test Game' }];

      DatabaseErrorHandler.cacheData(operation, context, data);

      const cached = DatabaseErrorHandler.getCachedData(operation, context);
      expect(cached.success).toBe(true);
      expect(cached.data).toEqual(data);
      expect(cached.cached).toBe(true);
    });
  });

  describe('ComprehensiveErrorLogger', () => {
    it('should log errors with comprehensive information', () => {
      const errorId = ComprehensiveErrorLogger.logError(
        'IMAGE_LOADING',
        'MEDIUM',
        'Failed to load game image',
        'Using backup image',
        { imageUrl: 'test.jpg', gameId: 'game-123' },
        { error: 'Network error' }
      );

      expect(errorId).toBeDefined();
      expect(ComprehensiveErrorLogger.errorLog).toHaveLength(1);
      
      const loggedError = ComprehensiveErrorLogger.getError(errorId);
      expect(loggedError.category).toBe('IMAGE_LOADING');
      expect(loggedError.severity).toBe('MEDIUM');
      expect(loggedError.userMessage).toBe('Using backup image');
    });

    it('should provide system health overview', () => {
      // Log some errors of different severities
      ComprehensiveErrorLogger.logError('SYSTEM_ERROR', 'CRITICAL', 'Critical error', 'System issue');
      ComprehensiveErrorLogger.logError('IMAGE_LOADING', 'LOW', 'Minor error', 'Using fallback');

      const health = ComprehensiveErrorLogger.getSystemHealthOverview();

      expect(health.status).toBeDefined();
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(health.criticalErrors).toBe(1);
      expect(health.recommendation).toBeDefined();
    });
  });
});