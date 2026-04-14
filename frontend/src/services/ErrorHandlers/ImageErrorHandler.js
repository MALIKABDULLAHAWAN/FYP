/**
 * ImageErrorHandler - Handles image loading failures with fallback images
 * 
 * Provides robust error handling for:
 * - Game image loading failures
 * - Therapeutic photograph failures
 * - Sticker asset loading failures
 * - CDN connectivity issues
 * 
 * Requirements: 5.4, 5.5
 */

class ImageErrorHandler {
  constructor() {
    this.failureLog = [];
    this.retryAttempts = new Map();
    this.fallbackImages = this.initializeFallbackImages();
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Initialize fallback images for different contexts
   */
  initializeFallbackImages() {
    return {
      game: {
        primary: '/assets/fallbacks/game-placeholder.svg',
        secondary: '/assets/fallbacks/activity-icon.svg',
        tertiary: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGOUZBIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiM0QTkwRTIiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeD0iODgiIHk9Ijg4Ij4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+',
        alt: 'Therapeutic game activity'
      },
      sticker: {
        primary: '/assets/fallbacks/sticker-placeholder.svg',
        secondary: '/assets/fallbacks/decoration-icon.svg',
        tertiary: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjMwIiBmaWxsPSIjN0VEMzIxIiBvcGFjaXR5PSIwLjciLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeD0iNDIiIHk9IjQyIj4KPHBhdGggZD0iTTggMkw5LjA5IDYuMjZMMTQgN0w5LjA5IDkuNzRMOCAxNEw2LjkxIDkuNzRMMiA3TDYuOTEgNi4yNkw4IDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+',
        alt: 'Decorative sticker'
      },
      thumbnail: {
        primary: '/assets/fallbacks/thumbnail-placeholder.svg',
        secondary: '/assets/fallbacks/image-icon.svg',
        tertiary: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRTBFN0ZGIi8+CjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNEE5MEUyIiBvcGFjaXR5PSIwLjUiLz4KPC9zdmc+',
        alt: 'Image thumbnail'
      }
    };
  }

  /**
   * Handle image loading failure with progressive fallbacks
   * 
   * @param {string} imageUrl - Original image URL that failed
   * @param {string} imageType - Type of image (game, sticker, thumbnail)
   * @param {string} gameId - Associated game ID (if applicable)
   * @param {Error} error - Original loading error
   * @returns {Promise<Object>} Fallback image information
   */
  async handleImageLoadingFailure(imageUrl, imageType = 'game', gameId = null, error = null) {
    const failureId = this.generateFailureId();
    const timestamp = new Date().toISOString();

    // Log the failure
    this.logFailure({
      failureId,
      imageUrl,
      imageType,
      gameId,
      error: error?.message || 'Unknown error',
      timestamp,
      severity: 'medium'
    });

    // Check retry attempts
    const retryKey = `${imageUrl}-${imageType}`;
    const attempts = this.retryAttempts.get(retryKey) || 0;

    if (attempts < this.maxRetries) {
      // Schedule retry
      this.scheduleRetry(imageUrl, imageType, gameId, attempts + 1);
    }

    // Return immediate fallback
    const fallback = this.selectFallbackImage(imageType, gameId);
    
    return {
      success: true,
      fallbackUsed: true,
      fallbackLevel: this.determineFallbackLevel(attempts),
      imageUrl: fallback.url,
      altText: fallback.alt,
      retryScheduled: attempts < this.maxRetries,
      nextRetryIn: attempts < this.maxRetries ? this.retryDelay : null,
      failureId,
      userMessage: this.generateUserFriendlyMessage(imageType, attempts)
    };
  }

  /**
   * Select appropriate fallback image based on type and context
   */
  selectFallbackImage(imageType, gameId = null) {
    const fallbacks = this.fallbackImages[imageType] || this.fallbackImages.game;
    
    // Try primary fallback first
    return {
      url: fallbacks.primary,
      alt: fallbacks.alt,
      level: 'primary'
    };
  }

  /**
   * Schedule retry attempt for failed image
   */
  scheduleRetry(imageUrl, imageType, gameId, attemptNumber) {
    const retryKey = `${imageUrl}-${imageType}`;
    this.retryAttempts.set(retryKey, attemptNumber);

    setTimeout(async () => {
      try {
        // Attempt to load the original image again
        const success = await this.testImageLoad(imageUrl);
        
        if (success) {
          // Image loaded successfully, clear retry attempts
          this.retryAttempts.delete(retryKey);
          
          // Notify success (could emit event or call callback)
          this.logSuccess({
            imageUrl,
            imageType,
            gameId,
            attemptNumber,
            timestamp: new Date().toISOString()
          });
        } else if (attemptNumber < this.maxRetries) {
          // Schedule next retry
          this.scheduleRetry(imageUrl, imageType, gameId, attemptNumber + 1);
        } else {
          // Max retries reached, log persistent failure
          this.logPersistentFailure({
            imageUrl,
            imageType,
            gameId,
            maxAttemptsReached: true,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        // Retry failed, schedule next attempt if under limit
        if (attemptNumber < this.maxRetries) {
          this.scheduleRetry(imageUrl, imageType, gameId, attemptNumber + 1);
        }
      }
    }, this.retryDelay);
  }

  /**
   * Test if an image can be loaded
   */
  testImageLoad(imageUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imageUrl;
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(false), 10000);
    });
  }

  /**
   * Determine fallback level based on retry attempts
   */
  determineFallbackLevel(attempts) {
    if (attempts === 0) return 'primary';
    if (attempts === 1) return 'secondary';
    return 'tertiary';
  }

  /**
   * Generate user-friendly error message
   */
  generateUserFriendlyMessage(imageType, attempts) {
    const messages = {
      game: {
        0: 'Loading game image...',
        1: 'Using backup game image',
        2: 'Using simple game icon',
        3: 'Game ready without image'
      },
      sticker: {
        0: 'Loading decoration...',
        1: 'Using backup decoration',
        2: 'Using simple decoration',
        3: 'Continuing without decoration'
      },
      thumbnail: {
        0: 'Loading preview...',
        1: 'Using backup preview',
        2: 'Using simple preview',
        3: 'Preview unavailable'
      }
    };

    return messages[imageType]?.[attempts] || messages.game[attempts] || 'Content loading...';
  }

  /**
   * Handle CDN connectivity issues
   */
  async handleCDNFailure(cdnUrl, alternativeCDNs = []) {
    const failureId = this.generateFailureId();
    
    this.logFailure({
      failureId,
      type: 'cdn-failure',
      cdnUrl,
      timestamp: new Date().toISOString(),
      severity: 'high'
    });

    // Try alternative CDNs
    for (const altCDN of alternativeCDNs) {
      try {
        const success = await this.testCDNConnectivity(altCDN);
        if (success) {
          return {
            success: true,
            alternativeCDN: altCDN,
            failureId,
            message: 'Switched to alternative CDN'
          };
        }
      } catch (error) {
        // Continue to next alternative
      }
    }

    // All CDNs failed, use local fallbacks
    return {
      success: false,
      usingLocalFallbacks: true,
      failureId,
      message: 'Using local fallback images due to CDN unavailability'
    };
  }

  /**
   * Test CDN connectivity
   */
  async testCDNConnectivity(cdnUrl) {
    try {
      const response = await fetch(`${cdnUrl}/health-check`, {
        method: 'HEAD',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get fallback image for immediate use
   */
  getImmediateFallback(imageType, size = 'medium') {
    const fallbacks = this.fallbackImages[imageType] || this.fallbackImages.game;
    
    return {
      url: fallbacks.tertiary, // Use inline SVG for immediate availability
      alt: fallbacks.alt,
      immediate: true,
      size: this.getSizeForFallback(size)
    };
  }

  /**
   * Get appropriate size for fallback image
   */
  getSizeForFallback(size) {
    const sizes = {
      small: { width: 60, height: 60 },
      medium: { width: 120, height: 120 },
      large: { width: 200, height: 200 }
    };
    
    return sizes[size] || sizes.medium;
  }

  /**
   * Generate unique failure ID
   */
  generateFailureId() {
    return `img_fail_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Log image loading failure
   */
  logFailure(failureData) {
    this.failureLog.push({
      ...failureData,
      id: this.generateFailureId()
    });

    // Keep log size manageable
    if (this.failureLog.length > 1000) {
      this.failureLog = this.failureLog.slice(-500);
    }
  }

  /**
   * Log successful retry
   */
  logSuccess(successData) {
    this.failureLog.push({
      ...successData,
      type: 'retry-success',
      id: this.generateFailureId()
    });
  }

  /**
   * Log persistent failure
   */
  logPersistentFailure(failureData) {
    this.failureLog.push({
      ...failureData,
      type: 'persistent-failure',
      id: this.generateFailureId(),
      severity: 'high'
    });
  }

  /**
   * Get failure statistics
   */
  getFailureStatistics() {
    const stats = {
      totalFailures: 0,
      byType: {},
      bySeverity: {},
      persistentFailures: 0,
      successfulRetries: 0
    };

    this.failureLog.forEach(entry => {
      if (entry.type === 'persistent-failure') {
        stats.persistentFailures++;
      } else if (entry.type === 'retry-success') {
        stats.successfulRetries++;
      } else {
        stats.totalFailures++;
        stats.byType[entry.imageType] = (stats.byType[entry.imageType] || 0) + 1;
        stats.bySeverity[entry.severity] = (stats.bySeverity[entry.severity] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Clear failure log and retry attempts
   */
  clearLogs() {
    this.failureLog = [];
    this.retryAttempts.clear();
  }

  /**
   * Get recent failures for monitoring
   */
  getRecentFailures(minutes = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.failureLog.filter(entry => 
      new Date(entry.timestamp) > cutoff
    );
  }
}

// Export singleton instance
export default new ImageErrorHandler();