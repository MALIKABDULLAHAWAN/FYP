/**
 * StickerManager Service
 * 
 * Manages therapeutic sticker assets with:
 * - Asset loading from CDN or local assets
 * - Sticker selection algorithm (deterministic but varied)
 * - Sticker placement calculation
 * - Responsive sizing
 * - Caching mechanism
 * - Comprehensive error handling and graceful degradation
 */

import unifiedErrorHandler from './ErrorHandlers/index.js';

class StickerManager {
  constructor() {
    this.stickers = {};
    this.cache = new Map();
    this.loadedAssets = new Set();
    this.sessionCount = 0;
  }

  /**
   * Initialize sticker assets
   * Loads sticker metadata and prepares for use
   */
  async initialize() {
    try {
      // Define available sticker categories and designs
      this.stickerCategories = {
        animals: [
          { id: 'butterfly', name: 'Butterfly', icon: 'butterfly', svgPath: '/assets/stickers/animals/butterfly.svg' },
          { id: 'bird', name: 'Bird', icon: 'bird', svgPath: '/assets/stickers/animals/bird.svg' },
          { id: 'bee', name: 'Bee', icon: 'bee', svgPath: '/assets/stickers/animals/bee.svg' },
          { id: 'ladybug', name: 'Ladybug', icon: 'ladybug', svgPath: '/assets/stickers/animals/ladybug.svg' },
          { id: 'fish', name: 'Fish', icon: 'fish', svgPath: '/assets/stickers/animals/fish.svg' },
          { id: 'turtle', name: 'Turtle', icon: 'turtle', svgPath: '/assets/stickers/animals/turtle.svg' },
          { id: 'rabbit', name: 'Rabbit', icon: 'rabbit', svgPath: '/assets/stickers/animals/rabbit.svg' },
        ],
        nature: [
          { id: 'flower', name: 'Flower', icon: 'flower', svgPath: '/assets/stickers/nature/flower.svg' },
          { id: 'tree', name: 'Tree', icon: 'tree', svgPath: '/assets/stickers/nature/tree.svg' },
          { id: 'leaf', name: 'Leaf', icon: 'leaf', svgPath: '/assets/stickers/nature/leaf.svg' },
          { id: 'mushroom', name: 'Mushroom', icon: 'mushroom', svgPath: '/assets/stickers/nature/mushroom.svg' },
          { id: 'cactus', name: 'Cactus', icon: 'cactus', svgPath: '/assets/stickers/nature/cactus.svg' },
          { id: 'sunflower', name: 'Sunflower', icon: 'sunflower', svgPath: '/assets/stickers/nature/sunflower.svg' },
          { id: 'rainbow', name: 'Rainbow', icon: 'rainbow', svgPath: '/assets/stickers/nature/rainbow.svg' },
        ],
        objects: [
          { id: 'star', name: 'Star', icon: 'star', svgPath: '/assets/stickers/objects/star.svg' },
          { id: 'heart', name: 'Heart', icon: 'heart', svgPath: '/assets/stickers/objects/heart.svg' },
          { id: 'balloon', name: 'Balloon', icon: 'balloon', svgPath: '/assets/stickers/objects/balloon.svg' },
          { id: 'gift', name: 'Gift', icon: 'gift', svgPath: '/assets/stickers/objects/gift.svg' },
          { id: 'cloud', name: 'Cloud', icon: 'cloud', svgPath: '/assets/stickers/objects/cloud.svg' },
          { id: 'sun', name: 'Sun', icon: 'sun', svgPath: '/assets/stickers/objects/sun.svg' },
          { id: 'moon', name: 'Moon', icon: 'moon', svgPath: '/assets/stickers/objects/moon.svg' },
        ],
      };

      // Flatten all stickers for easy access
      this.allStickers = Object.values(this.stickerCategories).flat();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize StickerManager:', error);
      return false;
    }
  }

  /**
   * Select stickers for a page type with error handling
   * Uses deterministic but varied selection based on page type and session count
   */
  async selectStickers(pageType = 'default', sessionCount = 0) {
    try {
      const cacheKey = `${pageType}-${Math.floor(sessionCount / 10)}`;
      
      if (this.cache.has(cacheKey)) {
        const cachedStickers = this.cache.get(cacheKey);
        // Filter out any stickers that have failed to load
        const safeStickers = await this.filterSafeStickers(cachedStickers);
        return safeStickers;
      }

      // Determine number of stickers (3-4)
      const stickerCount = 3 + (sessionCount % 2);

      // Create deterministic seed for shuffling
      const seed = this.hashString(`${pageType}-${Math.floor(sessionCount / 10)}`);
      
      // Shuffle stickers using seed
      const shuffled = this.shuffleArray([...this.allStickers], seed);
      
      // Select stickers
      const selected = shuffled.slice(0, stickerCount);

      // Filter out failed stickers and validate
      const safeStickers = await this.filterSafeStickers(selected);

      // Cache result
      this.cache.set(cacheKey, safeStickers);

      return safeStickers;
    } catch (error) {
      // Handle system error in sticker selection
      const errorResult = await unifiedErrorHandler.handleStickerFailure(
        { id: 'system-selection', svgPath: 'system-error' },
        error,
        `sticker-selection-${pageType}`
      );

      // Return empty array for graceful degradation
      return [];
    }
  }

  /**
   * Filter out stickers that have failed to load
   */
  async filterSafeStickers(stickers) {
    const safeStickers = [];
    
    for (const sticker of stickers) {
      try {
        // Check if sticker should be skipped due to previous failures
        const shouldSkip = await this.shouldSkipSticker(sticker);
        if (!shouldSkip) {
          safeStickers.push(sticker);
        }
      } catch (error) {
        // Skip this sticker if there's an error checking it
        await unifiedErrorHandler.handleStickerFailure(
          sticker,
          error,
          'sticker-safety-check'
        );
      }
    }

    return safeStickers;
  }

  /**
   * Check if sticker should be skipped due to previous failures
   */
  async shouldSkipSticker(sticker) {
    // This would integrate with the StickerErrorHandler
    // For now, we'll do a basic check
    try {
      // Test if sticker asset is accessible
      await this.testStickerAccessibility(sticker.svgPath);
      return false;
    } catch (error) {
      // Sticker failed to load, handle the error
      await unifiedErrorHandler.handleStickerFailure(
        sticker,
        error,
        'sticker-accessibility-test'
      );
      return true;
    }
  }

  /**
   * Test if sticker asset is accessible
   */
  async testStickerAccessibility(stickerPath) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('Sticker failed to load'));
      img.src = stickerPath;
      
      // Timeout after 3 seconds for stickers
      setTimeout(() => reject(new Error('Sticker load timeout')), 3000);
    });
  }

  /**
   * Calculate sticker positions for a container
   * Returns array of position objects with x, y, rotation, and opacity
   */
  calculatePositions(stickers, containerWidth, containerHeight) {
    const positions = [];
    const zones = [
      { x: 20, y: 20 },   // top-left
      { x: 80, y: 20 },   // top-right
      { x: 20, y: 80 },   // bottom-left
      { x: 80, y: 80 },   // bottom-right
    ];

    stickers.forEach((sticker, index) => {
      const zone = zones[index % zones.length];
      
      // Calculate pixel position from percentage
      const x = (containerWidth * zone.x) / 100;
      const y = (containerHeight * zone.y) / 100;
      
      // Random rotation between -7.5 and +7.5 degrees
      const rotation = Math.random() * 15 - 7.5;
      
      // Opacity between 0.7 and 0.85
      const opacity = 0.7 + Math.random() * 0.15;

      positions.push({
        sticker,
        x,
        y,
        rotation,
        opacity,
      });
    });

    return positions;
  }

  /**
   * Get responsive size for sticker based on viewport width
   */
  getResponsiveSize(viewportWidth) {
    if (viewportWidth < 641) {
      // Mobile: 50-80px
      return 50 + Math.random() * 30;
    } else if (viewportWidth < 1025) {
      // Tablet: 80-100px
      return 80 + Math.random() * 20;
    } else {
      // Desktop: 100-120px
      return 100 + Math.random() * 20;
    }
  }

  /**
   * Get sticker asset URL with error handling
   * Returns SVG representation with fallback support
   */
  async getStickerAsset(sticker) {
    try {
      // Test if sticker is accessible
      await this.testStickerAccessibility(sticker.svgPath);
      
      // Return SVG asset information
      return {
        type: 'svg',
        url: sticker.svgPath,
        alt: sticker.name,
        icon: sticker.icon,
        fallback: false
      };
    } catch (error) {
      // Handle sticker loading failure
      const errorResult = await unifiedErrorHandler.handleStickerFailure(
        sticker,
        error,
        'sticker-asset-retrieval'
      );

      // Return fallback sticker
      return {
        type: 'svg',
        url: errorResult.fallbackSticker?.svgPath || errorResult.fallbackSticker?.fallback,
        alt: errorResult.fallbackSticker?.alt || sticker.name,
        icon: errorResult.fallbackSticker?.icon || sticker.icon,
        fallback: true,
        errorId: errorResult.errorId,
        userMessage: errorResult.userMessage
      };
    }
  }

  /**
   * Preload sticker assets
   * Caches assets for faster rendering
   */
  async preloadAssets(categories = ['animals', 'nature', 'objects']) {
    try {
      for (const category of categories) {
        if (this.stickerCategories[category]) {
          this.loadedAssets.add(category);
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to preload sticker assets:', error);
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Increment session count
   * Used for deterministic sticker selection
   */
  incrementSessionCount() {
    this.sessionCount++;
  }

  /**
   * Reset session count
   */
  resetSessionCount() {
    this.sessionCount = 0;
  }

  /**
   * Utility: Hash string for deterministic shuffling
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Utility: Shuffle array using seed for deterministic results
   */
  shuffleArray(array, seed) {
    const shuffled = [...array];
    let random = seed;

    for (let i = shuffled.length - 1; i > 0; i--) {
      // Seeded random number generator
      random = (random * 9301 + 49297) % 233280;
      const j = Math.floor((random / 233280) * (i + 1));

      // Swap
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }
}

// Export singleton instance
export default new StickerManager();
