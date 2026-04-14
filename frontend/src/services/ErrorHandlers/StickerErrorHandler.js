/**
 * StickerErrorHandler - Handles sticker loading failures with graceful degradation
 * 
 * Provides comprehensive error handling for:
 * - Sticker asset loading failures
 * - SVG parsing errors
 * - Category-specific fallbacks
 * - Graceful degradation without stickers
 * 
 * Requirements: 5.4, 5.5
 */

class StickerErrorHandler {
  constructor() {
    this.failureLog = [];
    this.failedAssets = new Set();
    this.fallbackStickers = this.initializeFallbackStickers();
    this.degradationMode = false;
    this.retryAttempts = new Map();
    this.maxRetries = 2;
  }

  /**
   * Initialize fallback stickers for different categories
   */
  initializeFallbackStickers() {
    return {
      animals: {
        fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMjAiIGZpbGw9IiM3RUQzMjEiIG9wYWNpdHk9IjAuNyIvPgo8Y2lyY2xlIGN4PSIyNSIgY3k9IjI1IiByPSIzIiBmaWxsPSJ3aGl0ZSIvPgo8Y2lyY2xlIGN4PSIzNSIgY3k9IjI1IiByPSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjUgMzVRMzAgNDAgMzUgMzUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K',
        alt: 'Friendly animal',
        category: 'animals'
      },
      nature: {
        fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTUiIGZpbGw9IiNGNUE2MjMiIG9wYWNpdHk9IjAuNyIvPgo8cGF0aCBkPSJNMzAgMTVMMzUgMjVIMjVMMzAgMTVaIiBmaWxsPSIjN0VEMzIxIi8+CjxwYXRoIGQ9Ik0zMCAyNUwzNSAzNUgyNUwzMCAyNVoiIGZpbGw9IiM3RUQzMjEiLz4KPHBhdGggZD0iTTMwIDM1TDM1IDQ1SDI1TDMwIDM1WiIgZmlsbD0iIzdFRDMyMSIvPgo8L3N2Zz4K',
        alt: 'Nature element',
        category: 'nature'
      },
      objects: {
        fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBvbHlnb24gcG9pbnRzPSIzMCwxMCA0MCwyNSAzNSw0MCAyNSw0MCAyMCwyNSIgZmlsbD0iIzRBOTBFMiIgb3BhY2l0eT0iMC43Ii8+CjxjaXJjbGUgY3g9IjMwIiBjeT0iMjUiIHI9IjMiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
        alt: 'Decorative object',
        category: 'objects'
      },
      generic: {
        fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTgiIGZpbGw9IiNCRDEwRTAiIG9wYWNpdHk9IjAuNyIvPgo8cGF0aCBkPSJNMzAgMTVMMzMgMjRIMjcgMjRMMzAgMTVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzAgNDVMMzMgMzZIMjcgMzZMMzAgNDVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTUgMzBMMjQgMzNMMjQgMjdMMTUgMzBaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNDUgMzBMMzYgMzNMMzYgMjdMNDUgMzBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
        alt: 'Decorative element',
        category: 'generic'
      }
    };
  }

  /**
   * Handle sticker loading failure with progressive fallbacks
   * 
   * @param {Object} sticker - Sticker object that failed to load
   * @param {Error} error - Loading error
   * @param {string} context - Context where sticker was being used
   * @returns {Object} Fallback handling result
   */
  handleStickerLoadingFailure(sticker, error, context = 'page-decoration') {
    const failureId = this.generateFailureId();
    const timestamp = new Date().toISOString();

    // Log the failure
    this.logFailure({
      failureId,
      stickerId: sticker.id,
      stickerUrl: sticker.svgPath,
      category: this.extractCategory(sticker),
      error: error?.message || 'Unknown loading error',
      context,
      timestamp,
      severity: 'low' // Sticker failures are low severity
    });

    // Mark asset as failed
    this.failedAssets.add(sticker.svgPath);

    // Check if we should retry
    const retryKey = sticker.svgPath;
    const attempts = this.retryAttempts.get(retryKey) || 0;

    if (attempts < this.maxRetries) {
      // Schedule retry
      this.scheduleRetry(sticker, attempts + 1);
    }

    // Return fallback sticker
    const fallback = this.selectFallbackSticker(sticker);

    return {
      success: true,
      fallbackUsed: true,
      fallbackSticker: fallback,
      originalSticker: sticker,
      retryScheduled: attempts < this.maxRetries,
      failureId,
      gracefulDegradation: true,
      userImpact: 'minimal' // Stickers are decorative only
    };
  }

  /**
   * Handle multiple sticker failures (category-wide failure)
   */
  handleCategoryFailure(category, failedStickers, context = 'page-decoration') {
    const failureId = this.generateFailureId();
    const timestamp = new Date().toISOString();

    // Log category failure
    this.logFailure({
      failureId,
      type: 'category-failure',
      category,
      failedCount: failedStickers.length,
      context,
      timestamp,
      severity: 'medium'
    });

    // Check if we should enter degradation mode
    const totalFailures = this.failedAssets.size;
    const failureRate = totalFailures / (totalFailures + 10); // Assume 10 successful loads

    if (failureRate > 0.5) {
      this.enterDegradationMode();
    }

    // Return category fallback or empty result
    const fallback = this.fallbackStickers[category] || this.fallbackStickers.generic;

    return {
      success: true,
      categoryFallback: true,
      fallbackSticker: fallback,
      failedStickers,
      degradationMode: this.degradationMode,
      failureId,
      recommendation: this.degradationMode 
        ? 'Continue without stickers for better performance'
        : 'Using fallback stickers for this category'
    };
  }

  /**
   * Handle complete sticker system failure
   */
  handleSystemFailure(error, context = 'sticker-system') {
    const failureId = this.generateFailureId();
    const timestamp = new Date().toISOString();

    // Log system failure
    this.logFailure({
      failureId,
      type: 'system-failure',
      error: error?.message || 'Sticker system unavailable',
      context,
      timestamp,
      severity: 'high'
    });

    // Enter degradation mode
    this.enterDegradationMode();

    return {
      success: false,
      systemFailure: true,
      degradationMode: true,
      failureId,
      userMessage: 'Continuing without decorative elements for better performance',
      impact: 'visual-only', // No functional impact
      recommendation: 'Application continues normally without stickers'
    };
  }

  /**
   * Select appropriate fallback sticker
   */
  selectFallbackSticker(originalSticker) {
    const category = this.extractCategory(originalSticker);
    const fallback = this.fallbackStickers[category] || this.fallbackStickers.generic;

    return {
      ...fallback,
      id: `fallback-${originalSticker.id}`,
      name: `Fallback ${originalSticker.name}`,
      svgPath: fallback.fallback,
      isFallback: true,
      originalId: originalSticker.id
    };
  }

  /**
   * Extract category from sticker object
   */
  extractCategory(sticker) {
    if (sticker.svgPath && sticker.svgPath.includes('/animals/')) return 'animals';
    if (sticker.svgPath && sticker.svgPath.includes('/nature/')) return 'nature';
    if (sticker.svgPath && sticker.svgPath.includes('/objects/')) return 'objects';
    return 'generic';
  }

  /**
   * Schedule retry for failed sticker
   */
  scheduleRetry(sticker, attemptNumber) {
    const retryKey = sticker.svgPath;
    this.retryAttempts.set(retryKey, attemptNumber);

    const retryDelay = 3000 * attemptNumber; // Increasing delay

    setTimeout(async () => {
      try {
        // Test if sticker can be loaded now
        const success = await this.testStickerLoad(sticker.svgPath);
        
        if (success) {
          // Success - remove from failed assets
          this.failedAssets.delete(sticker.svgPath);
          this.retryAttempts.delete(retryKey);
          
          this.logSuccess({
            stickerId: sticker.id,
            stickerUrl: sticker.svgPath,
            attemptNumber,
            timestamp: new Date().toISOString()
          });
        } else if (attemptNumber < this.maxRetries) {
          // Schedule next retry
          this.scheduleRetry(sticker, attemptNumber + 1);
        }
      } catch (error) {
        // Retry failed, schedule next if under limit
        if (attemptNumber < this.maxRetries) {
          this.scheduleRetry(sticker, attemptNumber + 1);
        }
      }
    }, retryDelay);
  }

  /**
   * Test if sticker can be loaded
   */
  testStickerLoad(stickerUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = stickerUrl;
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  /**
   * Enter degradation mode (no stickers)
   */
  enterDegradationMode() {
    if (!this.degradationMode) {
      this.degradationMode = true;
      
      this.logFailure({
        failureId: this.generateFailureId(),
        type: 'degradation-mode-entered',
        reason: 'High failure rate detected',
        timestamp: new Date().toISOString(),
        severity: 'medium'
      });
    }
  }

  /**
   * Exit degradation mode
   */
  exitDegradationMode() {
    if (this.degradationMode) {
      this.degradationMode = false;
      this.failedAssets.clear();
      this.retryAttempts.clear();
      
      this.logSuccess({
        type: 'degradation-mode-exited',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check if sticker should be skipped due to previous failures
   */
  shouldSkipSticker(sticker) {
    if (this.degradationMode) return true;
    if (this.failedAssets.has(sticker.svgPath)) return true;
    
    return false;
  }

  /**
   * Get safe stickers (excluding failed ones)
   */
  filterSafeStickers(stickers) {
    if (this.degradationMode) return [];
    
    return stickers.filter(sticker => !this.shouldSkipSticker(sticker));
  }

  /**
   * Handle SVG parsing error
   */
  handleSVGParsingError(stickerUrl, error) {
    const failureId = this.generateFailureId();
    
    this.logFailure({
      failureId,
      type: 'svg-parsing-error',
      stickerUrl,
      error: error.message,
      timestamp: new Date().toISOString(),
      severity: 'medium'
    });

    // Mark as failed
    this.failedAssets.add(stickerUrl);

    return {
      success: false,
      parsingError: true,
      failureId,
      recommendation: 'Skip this sticker and continue with others'
    };
  }

  /**
   * Generate failure ID
   */
  generateFailureId() {
    return `sticker_fail_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Log sticker failure
   */
  logFailure(failureData) {
    this.failureLog.push({
      ...failureData,
      id: failureData.failureId || this.generateFailureId()
    });

    // Keep log size manageable
    if (this.failureLog.length > 200) {
      this.failureLog = this.failureLog.slice(-100);
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
   * Get failure statistics
   */
  getFailureStatistics() {
    const stats = {
      totalFailures: 0,
      byCategory: {},
      byType: {},
      degradationMode: this.degradationMode,
      failedAssets: this.failedAssets.size,
      successfulRetries: 0
    };

    this.failureLog.forEach(entry => {
      if (entry.type === 'retry-success') {
        stats.successfulRetries++;
      } else {
        stats.totalFailures++;
        
        if (entry.category) {
          stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
        }
        
        if (entry.type) {
          stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
        }
      }
    });

    return stats;
  }

  /**
   * Get health status of sticker system
   */
  getSystemHealth() {
    const stats = this.getFailureStatistics();
    const recentFailures = this.getRecentFailures(30); // Last 30 minutes
    
    let healthStatus = 'healthy';
    let healthScore = 100;

    if (this.degradationMode) {
      healthStatus = 'degraded';
      healthScore = 30;
    } else if (recentFailures.length > 5) {
      healthStatus = 'warning';
      healthScore = 60;
    } else if (stats.failedAssets > 0) {
      healthStatus = 'minor-issues';
      healthScore = 80;
    }

    return {
      status: healthStatus,
      score: healthScore,
      degradationMode: this.degradationMode,
      recentFailures: recentFailures.length,
      totalFailedAssets: stats.failedAssets,
      recommendation: this.getHealthRecommendation(healthStatus)
    };
  }

  /**
   * Get health recommendation
   */
  getHealthRecommendation(healthStatus) {
    const recommendations = {
      healthy: 'Sticker system operating normally',
      'minor-issues': 'Some stickers may not load, but system is stable',
      warning: 'Multiple sticker failures detected, monitoring recommended',
      degraded: 'Sticker system disabled for performance, check network connectivity'
    };

    return recommendations[healthStatus] || 'Unknown status';
  }

  /**
   * Clear logs and reset system
   */
  clearLogs() {
    this.failureLog = [];
    this.failedAssets.clear();
    this.retryAttempts.clear();
    this.exitDegradationMode();
  }

  /**
   * Get recent failures
   */
  getRecentFailures(minutes = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.failureLog.filter(entry => 
      new Date(entry.timestamp) > cutoff && entry.type !== 'retry-success'
    );
  }

  /**
   * Force degradation mode for testing
   */
  forceDegradationMode(enabled = true) {
    if (enabled) {
      this.enterDegradationMode();
    } else {
      this.exitDegradationMode();
    }
  }
}

// Export singleton instance
export default new StickerErrorHandler();