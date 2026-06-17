/**
 * GameImageManager Service
 * 
 * Manages therapeutic game images with:
 * - Upload handling and validation
 * - Image optimization pipeline
 * - Responsive image generation
 * - CDN storage integration
 * - Caching with cache headers
 * - Comprehensive error handling and fallbacks
 */

import unifiedErrorHandler from './ErrorHandlers/index.js';

class GameImageManager {
  constructor() {
    this.imageCache = new Map();
    this.uploadQueue = [];
    this.optimizationConfig = {
      formats: ['webp', 'jpeg'],
      sizes: [
        { width: 120, quality: 85, name: 'thumbnail' },
        { width: 320, quality: 80, name: 'mobile' },
        { width: 640, quality: 80, name: 'tablet' },
        { width: 1024, quality: 75, name: 'desktop' },
      ],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      targetFileSize: {
        thumbnail: 20 * 1024,   // 20KB
        mobile: 100 * 1024,     // 100KB
        tablet: 200 * 1024,     // 200KB
        desktop: 300 * 1024,    // 300KB
      },
    };
  }

  /**
   * Validate image file
   */
  validateImage(file) {
    const errors = [];

    // Check file size
    if (file.size > this.optimizationConfig.maxFileSize) {
      errors.push(`File size exceeds maximum of ${this.optimizationConfig.maxFileSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(file.type)) {
      errors.push('File must be JPEG, PNG, or WebP format');
    }

    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      errors.push('File extension must be .jpg, .jpeg, .png, or .webp');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate therapeutic appropriateness
   */
  validateTherapeuticAppropriateness(imageData) {
    // In production, this would use ML/AI to detect inappropriate content
    // For now, we'll do basic checks
    const errors = [];

    // Check image dimensions (should be reasonable)
    if (imageData.width < 100 || imageData.height < 100) {
      errors.push('Image dimensions too small (minimum 100x100px)');
    }

    if (imageData.width > 4000 || imageData.height > 4000) {
      errors.push('Image dimensions too large (maximum 4000x4000px)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate licensing and attribution
   */
  validateAttribution(attribution) {
    const errors = [];

    if (!attribution.photographer || typeof attribution.photographer !== 'string') {
      errors.push('Photographer name is required');
    }

    if (!attribution.license || typeof attribution.license !== 'string') {
      errors.push('License is required');
    }

    if (!attribution.source || typeof attribution.source !== 'string') {
      errors.push('Source is required');
    }

    if (!attribution.usage_rights || typeof attribution.usage_rights !== 'string') {
      errors.push('Usage rights are required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Upload and process image
   */
  async uploadImage(file, gameId, attribution) {
    try {
      // Validate file
      const fileValidation = this.validateImage(file);
      if (!fileValidation.valid) {
        throw new Error(`File validation failed: ${fileValidation.errors.join(', ')}`);
      }

      // Validate attribution
      const attributionValidation = this.validateAttribution(attribution);
      if (!attributionValidation.valid) {
        throw new Error(`Attribution validation failed: ${attributionValidation.errors.join(', ')}`);
      }

      // Read file as data URL (in production, would upload to CDN)
      const imageData = await this.readFileAsDataURL(file);

      // Validate therapeutic appropriateness
      const imageInfo = await this.getImageInfo(imageData);
      const appropriatenessValidation = this.validateTherapeuticAppropriateness(imageInfo);
      if (!appropriatenessValidation.valid) {
        throw new Error(`Therapeutic appropriateness validation failed: ${appropriatenessValidation.errors.join(', ')}`);
      }

      // Generate optimized versions
      const optimizedImages = await this.generateOptimizedVersions(imageData, gameId);

      // Store in cache
      const imageRecord = {
        game_id: gameId,
        original_url: imageData,
        optimized_versions: optimizedImages,
        attribution: attribution,
        uploaded_at: new Date().toISOString(),
        cache_headers: {
          'Cache-Control': 'public, max-age=31536000',
          'Content-Type': 'image/webp',
        },
      };

      this.imageCache.set(gameId, imageRecord);

      return imageRecord;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Read file as data URL
   */
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get image information
   */
  async getImageInfo(imageData) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
        });
      };
      img.onerror = () => {
        resolve({
          width: 0,
          height: 0,
          aspectRatio: 1,
        });
      };
      img.src = imageData;
    });
  }

  /**
   * Generate optimized image versions
   */
  async generateOptimizedVersions(imageData, gameId) {
    const optimized = {};

    for (const size of this.optimizationConfig.sizes) {
      // In production, would use image processing library (sharp, ImageMagick, etc.)
      // For now, we'll create placeholder URLs
      optimized[size.name] = {
        url: `${imageData}#${size.name}`,
        width: size.width,
        quality: size.quality,
        format: 'webp',
        targetSize: this.optimizationConfig.targetFileSize[size.name],
      };
    }

    return optimized;
  }

  /**
   * Get image by game ID with error handling
   */
  async getImage(gameId, size = 'desktop') {
    try {
      const imageRecord = this.imageCache.get(gameId);
      if (!imageRecord) {
        // Handle missing image with fallback
        const fallbackResult = await unifiedErrorHandler.handleImageFailure(
          `missing-image-${gameId}`,
          'game',
          gameId,
          new Error('Image not found in cache')
        );

        return {
          url: fallbackResult.fallbackSticker?.url || '/assets/fallbacks/game-placeholder.svg',
          attribution: { photographer: 'System', license: 'Internal', source: 'Fallback' },
          cacheHeaders: { 'Cache-Control': 'public, max-age=3600' },
          fallback: true,
          errorId: fallbackResult.errorId
        };
      }

      const imageUrl = imageRecord.optimized_versions[size]?.url || imageRecord.original_url;
      
      // Test if image is accessible
      try {
        await this.testImageAccessibility(imageUrl);
        
        return {
          url: imageUrl,
          attribution: imageRecord.attribution,
          cacheHeaders: imageRecord.cache_headers,
          fallback: false
        };
      } catch (loadError) {
        // Handle image loading failure
        const fallbackResult = await unifiedErrorHandler.handleImageFailure(
          imageUrl,
          'game',
          gameId,
          loadError
        );

        return {
          url: fallbackResult.imageUrl,
          attribution: imageRecord.attribution,
          cacheHeaders: imageRecord.cache_headers,
          fallback: true,
          errorId: fallbackResult.errorId,
          userMessage: fallbackResult.userMessage
        };
      }
    } catch (error) {
      // System error - use emergency fallback
      const fallbackResult = await unifiedErrorHandler.handleImageFailure(
        `system-error-${gameId}`,
        'game',
        gameId,
        error
      );

      return {
        url: '/assets/fallbacks/game-placeholder.svg',
        attribution: { photographer: 'System', license: 'Internal', source: 'Emergency Fallback' },
        cacheHeaders: { 'Cache-Control': 'public, max-age=3600' },
        fallback: true,
        systemError: true,
        errorId: fallbackResult.errorId
      };
    }
  }

  /**
   * Test if image is accessible
   */
  async testImageAccessibility(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = imageUrl;
      
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Image load timeout')), 5000);
    });
  }

  /**
   * Get responsive image URLs with error handling
   */
  async getResponsiveImageUrls(gameId) {
    try {
      const imageRecord = this.imageCache.get(gameId);
      if (!imageRecord) {
        const fallbackResult = await unifiedErrorHandler.handleImageFailure(
          `missing-responsive-${gameId}`,
          'game',
          gameId,
          new Error('Responsive images not found')
        );

        // Return fallback URLs for all sizes
        const fallbackUrl = fallbackResult.imageUrl || '/assets/fallbacks/game-placeholder.svg';
        return {
          thumbnail: fallbackUrl,
          mobile: fallbackUrl,
          tablet: fallbackUrl,
          desktop: fallbackUrl,
          original: fallbackUrl,
          attribution: { photographer: 'System', license: 'Internal', source: 'Fallback' },
          fallback: true,
          errorId: fallbackResult.errorId
        };
      }

      // Test accessibility of primary image
      const primaryUrl = imageRecord.optimized_versions.desktop?.url || imageRecord.original_url;
      
      try {
        await this.testImageAccessibility(primaryUrl);
        
        return {
          thumbnail: imageRecord.optimized_versions.thumbnail.url,
          mobile: imageRecord.optimized_versions.mobile.url,
          tablet: imageRecord.optimized_versions.tablet.url,
          desktop: imageRecord.optimized_versions.desktop.url,
          original: imageRecord.original_url,
          attribution: imageRecord.attribution,
          fallback: false
        };
      } catch (loadError) {
        const fallbackResult = await unifiedErrorHandler.handleImageFailure(
          primaryUrl,
          'game',
          gameId,
          loadError
        );

        const fallbackUrl = fallbackResult.imageUrl;
        return {
          thumbnail: fallbackUrl,
          mobile: fallbackUrl,
          tablet: fallbackUrl,
          desktop: fallbackUrl,
          original: fallbackUrl,
          attribution: imageRecord.attribution,
          fallback: true,
          errorId: fallbackResult.errorId,
          userMessage: fallbackResult.userMessage
        };
      }
    } catch (error) {
      const fallbackResult = await unifiedErrorHandler.handleImageFailure(
        `system-responsive-${gameId}`,
        'game',
        gameId,
        error
      );

      const fallbackUrl = '/assets/fallbacks/game-placeholder.svg';
      return {
        thumbnail: fallbackUrl,
        mobile: fallbackUrl,
        tablet: fallbackUrl,
        desktop: fallbackUrl,
        original: fallbackUrl,
        attribution: { photographer: 'System', license: 'Internal', source: 'Emergency Fallback' },
        fallback: true,
        systemError: true,
        errorId: fallbackResult.errorId
      };
    }
  }

  /**
   * Delete image
   */
  deleteImage(gameId) {
    return this.imageCache.delete(gameId);
  }

  /**
   * Clear all cached images
   */
  clearCache() {
    this.imageCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    let totalSize = 0;
    this.imageCache.forEach(record => {
      totalSize += JSON.stringify(record).length;
    });

    return {
      cachedImages: this.imageCache.size,
      totalCacheSize: totalSize,
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      cacheUtilization: (totalSize / (100 * 1024 * 1024)) * 100,
    };
  }
}

// Export singleton instance
export default new GameImageManager();
