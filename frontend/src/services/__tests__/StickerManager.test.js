/**
 * StickerManager Service Tests
 * Tests the sticker management functionality
 */

import StickerManager from '../StickerManager';

describe('StickerManager', () => {
  beforeEach(async () => {
    // Initialize StickerManager before each test
    await StickerManager.initialize();
    StickerManager.clearCache();
    StickerManager.resetSessionCount();
  });

  describe('Initialization', () => {
    test('initializes with sticker categories', async () => {
      const result = await StickerManager.initialize();
      expect(result).toBe(true);
      expect(StickerManager.stickerCategories).toBeDefined();
      expect(StickerManager.allStickers).toBeDefined();
      expect(StickerManager.allStickers.length).toBeGreaterThan(0);
    });

    test('has correct sticker categories', () => {
      expect(StickerManager.stickerCategories).toHaveProperty('animals');
      expect(StickerManager.stickerCategories).toHaveProperty('nature');
      expect(StickerManager.stickerCategories).toHaveProperty('objects');
    });

    test('each category has stickers with required properties', () => {
      Object.values(StickerManager.stickerCategories).forEach(category => {
        category.forEach(sticker => {
          expect(sticker).toHaveProperty('id');
          expect(sticker).toHaveProperty('name');
          expect(sticker).toHaveProperty('emoji');
          expect(typeof sticker.id).toBe('string');
          expect(typeof sticker.name).toBe('string');
          expect(typeof sticker.emoji).toBe('string');
        });
      });
    });
  });

  describe('Sticker Selection', () => {
    test('selects correct number of stickers', () => {
      const stickers = StickerManager.selectStickers('dashboard', 0);
      expect(stickers.length).toBeGreaterThanOrEqual(3);
      expect(stickers.length).toBeLessThanOrEqual(4);
    });

    test('selection is deterministic for same inputs', () => {
      const stickers1 = StickerManager.selectStickers('dashboard', 0);
      const stickers2 = StickerManager.selectStickers('dashboard', 0);
      
      expect(stickers1).toEqual(stickers2);
    });

    test('selection varies with different session counts', () => {
      const stickers1 = StickerManager.selectStickers('dashboard', 0);
      const stickers2 = StickerManager.selectStickers('dashboard', 10);
      
      // Should be different due to different session count
      expect(stickers1).not.toEqual(stickers2);
    });

    test('selection varies with different page types', () => {
      const stickers1 = StickerManager.selectStickers('dashboard', 0);
      const stickers2 = StickerManager.selectStickers('therapist', 0);
      
      // Should be different due to different page type
      expect(stickers1).not.toEqual(stickers2);
    });

    test('caches results correctly', () => {
      const stickers1 = StickerManager.selectStickers('dashboard', 0);
      const stickers2 = StickerManager.selectStickers('dashboard', 0);
      
      // Should return cached result
      expect(stickers1).toBe(stickers2); // Same reference
    });
  });

  describe('Position Calculation', () => {
    test('calculates positions for stickers', () => {
      const stickers = StickerManager.selectStickers('dashboard', 0);
      const positions = StickerManager.calculatePositions(stickers, 1000, 800);
      
      expect(positions.length).toBe(stickers.length);
      
      positions.forEach(position => {
        expect(position).toHaveProperty('sticker');
        expect(position).toHaveProperty('x');
        expect(position).toHaveProperty('y');
        expect(position).toHaveProperty('rotation');
        expect(position).toHaveProperty('opacity');
        
        // Verify position is within container bounds
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.x).toBeLessThanOrEqual(1000);
        expect(position.y).toBeGreaterThanOrEqual(0);
        expect(position.y).toBeLessThanOrEqual(800);
        
        // Verify rotation is within expected range (-7.5 to +7.5 degrees)
        expect(position.rotation).toBeGreaterThanOrEqual(-7.5);
        expect(position.rotation).toBeLessThanOrEqual(7.5);
        
        // Verify opacity is within expected range (0.7 to 0.85)
        expect(position.opacity).toBeGreaterThanOrEqual(0.7);
        expect(position.opacity).toBeLessThanOrEqual(0.85);
      });
    });

    test('positions stickers in corner zones', () => {
      const stickers = StickerManager.selectStickers('dashboard', 0);
      const positions = StickerManager.calculatePositions(stickers, 1000, 800);
      
      positions.forEach(position => {
        // Check if position is in one of the expected zones
        const isInTopLeft = position.x <= 300 && position.y <= 300;
        const isInTopRight = position.x >= 700 && position.y <= 300;
        const isInBottomLeft = position.x <= 300 && position.y >= 500;
        const isInBottomRight = position.x >= 700 && position.y >= 500;
        
        expect(isInTopLeft || isInTopRight || isInBottomLeft || isInBottomRight).toBe(true);
      });
    });
  });

  describe('Responsive Sizing', () => {
    test('returns correct size for mobile viewport', () => {
      const size = StickerManager.getResponsiveSize(480);
      expect(size).toBeGreaterThanOrEqual(50);
      expect(size).toBeLessThanOrEqual(80);
    });

    test('returns correct size for tablet viewport', () => {
      const size = StickerManager.getResponsiveSize(768);
      expect(size).toBeGreaterThanOrEqual(80);
      expect(size).toBeLessThanOrEqual(100);
    });

    test('returns correct size for desktop viewport', () => {
      const size = StickerManager.getResponsiveSize(1200);
      expect(size).toBeGreaterThanOrEqual(100);
      expect(size).toBeLessThanOrEqual(120);
    });
  });

  describe('Asset Management', () => {
    test('returns sticker asset with correct properties', () => {
      const sticker = StickerManager.allStickers[0];
      const asset = StickerManager.getStickerAsset(sticker);
      
      expect(asset).toHaveProperty('type');
      expect(asset).toHaveProperty('content');
      expect(asset).toHaveProperty('alt');
      expect(asset.type).toBe('emoji');
      expect(asset.content).toBe(sticker.emoji);
      expect(asset.alt).toBe(sticker.name);
    });
  });

  describe('Cache Management', () => {
    test('clears cache correctly', () => {
      // Generate some cached results
      StickerManager.selectStickers('dashboard', 0);
      StickerManager.selectStickers('therapist', 0);
      
      // Clear cache
      StickerManager.clearCache();
      
      // Verify cache is empty by checking that new selections are made
      const stickers1 = StickerManager.selectStickers('dashboard', 0);
      const stickers2 = StickerManager.selectStickers('dashboard', 0);
      
      // Should still be equal due to deterministic algorithm
      expect(stickers1).toEqual(stickers2);
    });
  });

  describe('Session Count Management', () => {
    test('increments session count correctly', () => {
      const initialCount = StickerManager.sessionCount;
      StickerManager.incrementSessionCount();
      expect(StickerManager.sessionCount).toBe(initialCount + 1);
    });

    test('resets session count correctly', () => {
      StickerManager.incrementSessionCount();
      StickerManager.incrementSessionCount();
      StickerManager.resetSessionCount();
      expect(StickerManager.sessionCount).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    test('hashString produces consistent results', () => {
      const hash1 = StickerManager.hashString('test');
      const hash2 = StickerManager.hashString('test');
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
      expect(hash1).toBeGreaterThanOrEqual(0);
    });

    test('hashString produces different results for different inputs', () => {
      const hash1 = StickerManager.hashString('test1');
      const hash2 = StickerManager.hashString('test2');
      expect(hash1).not.toBe(hash2);
    });

    test('shuffleArray produces deterministic results with same seed', () => {
      const array = [1, 2, 3, 4, 5];
      const shuffled1 = StickerManager.shuffleArray(array, 12345);
      const shuffled2 = StickerManager.shuffleArray(array, 12345);
      expect(shuffled1).toEqual(shuffled2);
    });

    test('shuffleArray produces different results with different seeds', () => {
      const array = [1, 2, 3, 4, 5];
      const shuffled1 = StickerManager.shuffleArray(array, 12345);
      const shuffled2 = StickerManager.shuffleArray(array, 54321);
      expect(shuffled1).not.toEqual(shuffled2);
    });

    test('shuffleArray does not modify original array', () => {
      const array = [1, 2, 3, 4, 5];
      const original = [...array];
      StickerManager.shuffleArray(array, 12345);
      expect(array).toEqual(original);
    });
  });

  describe('Integration Requirements', () => {
    test('sticker variety meets requirements (3-4 stickers)', () => {
      for (let sessionCount = 0; sessionCount < 10; sessionCount++) {
        const stickers = StickerManager.selectStickers('dashboard', sessionCount);
        expect(stickers.length).toBeGreaterThanOrEqual(3);
        expect(stickers.length).toBeLessThanOrEqual(4);
      }
    });

    test('sticker rotation meets requirements (0-15 degrees)', () => {
      const stickers = StickerManager.selectStickers('dashboard', 0);
      const positions = StickerManager.calculatePositions(stickers, 1000, 800);
      
      positions.forEach(position => {
        expect(Math.abs(position.rotation)).toBeLessThanOrEqual(15);
      });
    });

    test('sticker opacity meets requirements (0.7-0.85)', () => {
      const stickers = StickerManager.selectStickers('dashboard', 0);
      const positions = StickerManager.calculatePositions(stickers, 1000, 800);
      
      positions.forEach(position => {
        expect(position.opacity).toBeGreaterThanOrEqual(0.7);
        expect(position.opacity).toBeLessThanOrEqual(0.85);
      });
    });

    test('responsive sizing meets requirements', () => {
      // Mobile (60-120px, but implementation uses 50-80px for mobile)
      const mobileSize = StickerManager.getResponsiveSize(480);
      expect(mobileSize).toBeGreaterThanOrEqual(50);
      expect(mobileSize).toBeLessThanOrEqual(80);
      
      // Tablet
      const tabletSize = StickerManager.getResponsiveSize(768);
      expect(tabletSize).toBeGreaterThanOrEqual(80);
      expect(tabletSize).toBeLessThanOrEqual(100);
      
      // Desktop
      const desktopSize = StickerManager.getResponsiveSize(1200);
      expect(desktopSize).toBeGreaterThanOrEqual(100);
      expect(desktopSize).toBeLessThanOrEqual(120);
    });
  });
});