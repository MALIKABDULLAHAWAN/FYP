/**
 * ErrorHandlingService - Comprehensive error handling and fallback systems
 * Implements robust asset loading fallbacks, session preservation, and error logging
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

/**
 * @typedef {import('./types.js').ImageAsset} ImageAsset
 */

class ErrorHandlingService {
  constructor() {
    this.errorLog = [];
    this.fallbackAssetCache = new Map();
    this.therapeuticContextCache = new Map();
    this.sessionPreservationLog = [];
    this.errorCounter = 0;
    
    // Initialize fallback assets
    this.initializeFallbackAssets();
  }

  /**
   * Initialize fallback assets for various contexts
   */
  initializeFallbackAssets() {
    // Generic fallback assets with guaranteed compliance
    this.fallbackAssets = {
      'therapist': {
        url: '/images/fallback/professional-therapist.jpg',
        altText: 'Professional therapist in clinical setting',
        width: 48,
        height: 48,
        accessibility: {
          colorContrast: 7.0,
          screenReaderCompatible: true,
          focusIndicator: 'outline'
        },
        therapeuticContext: {
          ageAppropriate: true,
          culturallySensitive: true,
          license: 'therapeutic-use-approved',
          therapeuticGoals: ['professional-presentation', 'trust-building'],
          evidenceBased: true,
          clinicallyValidated: true,
          childSafe: true,
          distressingContent: false,
          positiveReinforcement: true,
          clearSubject: true,
          backgroundDistraction: false
        }
      },
      'activity': {
        url: '/images/fallback/therapeutic-activity.jpg',
        altText: 'Child-friendly therapeutic activity',
        width: 48,
        height: 48,
        accessibility: {
          colorContrast: 7.0,
          screenReaderCompatible: true,
          focusIndicator: 'outline'
        },
        therapeuticContext: {
          ageAppropriate: true,
          culturallySensitive: true,
          license: 'therapeutic-use-approved',
          therapeuticGoals: ['engagement', 'learning'],
          evidenceBased: true,
          clinicallyValidated: true,
          childSafe: true,
          distressingContent: false,
          positiveReinforcement: true,
          clearSubject: true,
          backgroundDistraction: false,
          engagingForChildren: true
        }
      },
      'medical': {
        url: '/images/fallback/medical-icon.jpg',
        altText: 'Medical and clinical indicator',
        width: 48,
        height: 48,
        accessibility: {
          colorContrast: 7.0,
          screenReaderCompatible: true,
          focusIndicator: 'outline'
        },
        therapeuticContext: {
          ageAppropriate: true,
          culturallySensitive: true,
          license: 'therapeutic-use-approved',
          therapeuticGoals: ['clinical-tracking', 'professional-standards'],
          evidenceBased: true,
          clinicallyValidated: true,
          childSafe: true,
          distressingContent: false,
          positiveReinforcement: true,
          clearSubject: true,
          backgroundDistraction: false,
          professionalAppearance: true
        }
      },
      'ui': {
        url: '/images/fallback/ui-element.jpg',
        altText: 'User interface element',
        width: 24,
        height: 24,
        accessibility: {
          colorContrast: 7.0,
          screenReaderCompatible: true,
          focusIndicator: 'outline'
        },
        therapeuticContext: {
          ageAppropriate: true,
          culturallySensitive: true,
          license: 'therapeutic-use-approved',
          therapeuticGoals: ['navigation', 'usability'],
          evidenceBased: true,
          clinicallyValidated: true,
          childSafe: true,
          distressingContent: false,
          positiveReinforcement: true,
          clearSubject: true,
          backgroundDistraction: false
        }
      },
      'generic': {
        url: '/images/fallback/generic-therapeutic.jpg',
        altText: 'Therapeutic interface element',
        width: 32,
        height: 32,
        accessibility: {
          colorContrast: 7.0,
          screenReaderCompatible: true,
          focusIndicator: 'outline'
        },
        therapeuticContext: {
          ageAppropriate: true,
          culturallySensitive: true,
          license: 'therapeutic-use-approved',
          therapeuticGoals: ['general-therapeutic-use'],
          evidenceBased: true,
          clinicallyValidated: true,
          childSafe: true,
          distressingContent: false,
          positiveReinforcement: true,
          clearSubject: true,
          backgroundDistraction: false
        }
      }
    };
  }

  /**
   * Handle asset loading failure with fallback selection
   * @param {string} assetUrl - URL of failed asset
   * @param {string} category - Asset category
   * @param {string} context - Therapeutic context
   * @param {Error} error - Original error
   * @returns {ImageAsset}
   */
  handleAssetLoadingFailure(assetUrl, category, context, error) {
    const errorId = this.generateErrorId();
    
    // Log the error for clinical review
    this.logError({
      errorId,
      type: 'asset-loading-failure',
      assetUrl,
      category,
      context,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: 'medium'
    });
    
    // Select appropriate fallback asset
    const fallbackAsset = this.selectFallbackAsset(category, context);
    
    // Cache the fallback for this specific asset
    this.fallbackAssetCache.set(assetUrl, {
      fallbackAsset,
      reason: 'loading-failure',
      originalCategory: category,
      originalContext: context,
      cachedAt: new Date().toISOString()
    });
    
    return fallbackAsset;
  }

  /**
   * Select appropriate fallback asset based on category and context
   * @param {string} category - Asset category
   * @param {string} context - Therapeutic context
   * @returns {ImageAsset}
   */
  selectFallbackAsset(category, context) {
    // Try to match category first
    if (this.fallbackAssets[category]) {
      return { ...this.fallbackAssets[category] };
    }
    
    // Try to infer category from context
    if (context.includes('therapist') || context.includes('medical')) {
      return { ...this.fallbackAssets['medical'] };
    }
    
    if (context.includes('activity') || context.includes('speech')) {
      return { ...this.fallbackAssets['activity'] };
    }
    
    if (context.includes('ui') || context.includes('nav') || context.includes('button')) {
      return { ...this.fallbackAssets['ui'] };
    }
    
    // Default to generic fallback
    return { ...this.fallbackAssets['generic'] };
  }

  /**
   * Handle metadata service unavailability with cached context
   * @param {string} gameId - Game identifier
   * @param {Error} error - Service error
   * @returns {Object}
   */
  handleMetadataServiceFailure(gameId, error) {
    const errorId = this.generateErrorId();
    
    // Log the error
    this.logError({
      errorId,
      type: 'metadata-service-failure',
      gameId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: 'high'
    });
    
    // Try to retrieve cached therapeutic context
    const cachedContext = this.therapeuticContextCache.get(gameId);
    
    if (cachedContext) {
      return {
        success: true,
        source: 'cache',
        data: cachedContext,
        warning: 'Using cached therapeutic context due to service unavailability'
      };
    }
    
    // Return minimal safe context if no cache available
    return {
      success: false,
      source: 'fallback',
      data: this.getMinimalTherapeuticContext(gameId),
      error: 'Metadata service unavailable and no cached context found',
      recommendation: 'Continue with basic therapeutic functionality'
    };
  }

  /**
   * Get minimal therapeutic context for fallback
   * @param {string} gameId - Game identifier
   * @returns {Object}
   */
  getMinimalTherapeuticContext(gameId) {
    return {
      id: gameId,
      name: 'Therapeutic Activity',
      therapeuticGoals: ['engagement', 'communication'],
      difficultyLevel: 3,
      evidenceBase: [],
      adaptations: [],
      fallbackMode: true,
      limitedFunctionality: true
    };
  }

  /**
   * Cache therapeutic context for future fallback use
   * @param {string} gameId - Game identifier
   * @param {Object} context - Therapeutic context data
   */
  cacheTherapeuticContext(gameId, context) {
    this.therapeuticContextCache.set(gameId, {
      ...context,
      cachedAt: new Date().toISOString()
    });
  }

  /**
   * Handle enhancement processing failure with graceful degradation
   * @param {string} componentName - Component being enhanced
   * @param {string} originalComponent - Original component code
   * @param {Error} error - Processing error
   * @returns {Object}
   */
  handleEnhancementFailure(componentName, originalComponent, error) {
    const errorId = this.generateErrorId();
    
    // Log the error
    this.logError({
      errorId,
      type: 'enhancement-processing-failure',
      componentName,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: 'high'
    });
    
    // Preserve original component functionality
    this.logSessionPreservation({
      componentName,
      action: 'preserved-original-functionality',
      reason: 'enhancement-failure',
      errorId,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      component: originalComponent,
      preservedOriginal: true,
      error: error.message,
      errorId,
      recommendation: 'Original component functionality preserved - enhancement can be retried later'
    };
  }

  /**
   * Handle validation error with detailed logging
   * @param {string} validationType - Type of validation that failed
   * @param {Object} validationResult - Validation result
   * @param {string} context - Context of validation
   * @returns {Object}
   */
  handleValidationError(validationType, validationResult, context) {
    const errorId = this.generateErrorId();
    
    // Log validation error for clinical review
    this.logError({
      errorId,
      type: 'validation-error',
      validationType,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      context,
      timestamp: new Date().toISOString(),
      severity: 'medium'
    });
    
    return {
      errorId,
      validationType,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      recommendation: this.getValidationErrorRecommendation(validationType, validationResult)
    };
  }

  /**
   * Get recommendation for validation error
   * @param {string} validationType - Type of validation
   * @param {Object} validationResult - Validation result
   * @returns {string}
   */
  getValidationErrorRecommendation(validationType, validationResult) {
    if (validationType === 'accessibility') {
      return 'Use fallback asset with guaranteed accessibility compliance';
    }
    
    if (validationType === 'therapeutic-suitability') {
      return 'Select alternative asset that meets therapeutic criteria';
    }
    
    if (validationType === 'functionality-preservation') {
      return 'Preserve original component - do not apply enhancement';
    }
    
    return 'Review errors and apply appropriate fallback strategy';
  }

  /**
   * Ensure enhancement failures don't disrupt therapy sessions
   * @param {string} sessionId - Active session identifier
   * @param {Error} error - Enhancement error
   * @returns {Object}
   */
  preserveTherapySession(sessionId, error) {
    const errorId = this.generateErrorId();
    
    // Log session preservation
    this.logSessionPreservation({
      sessionId,
      action: 'session-preserved',
      reason: 'enhancement-failure',
      error: error.message,
      errorId,
      timestamp: new Date().toISOString()
    });
    
    // Log error without disrupting session
    this.logError({
      errorId,
      type: 'session-preservation',
      sessionId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: 'critical',
      sessionDisrupted: false
    });
    
    return {
      sessionPreserved: true,
      sessionId,
      errorId,
      message: 'Therapy session continues with original functionality',
      backgroundErrorLogged: true
    };
  }

  /**
   * Log session preservation event
   * @param {Object} preservationData - Preservation event data
   */
  logSessionPreservation(preservationData) {
    this.sessionPreservationLog.push(preservationData);
  }

  /**
   * Log error for clinical review
   * @param {Object} errorData - Error data
   */
  logError(errorData) {
    this.errorLog.push({
      ...errorData,
      errorNumber: ++this.errorCounter
    });
  }

  /**
   * Generate unique error ID
   * @returns {string}
   */
  generateErrorId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `err_${timestamp}_${random}`;
  }

  /**
   * Get error log for clinical review
   * @param {Object} filters - Optional filters
   * @returns {Object[]}
   */
  getErrorLog(filters = {}) {
    let log = [...this.errorLog];
    
    if (filters.type) {
      log = log.filter(entry => entry.type === filters.type);
    }
    
    if (filters.severity) {
      log = log.filter(entry => entry.severity === filters.severity);
    }
    
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      log = log.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= new Date(start) && entryDate <= new Date(end);
      });
    }
    
    return log;
  }

  /**
   * Get session preservation log
   * @returns {Object[]}
   */
  getSessionPreservationLog() {
    return [...this.sessionPreservationLog];
  }

  /**
   * Get fallback asset cache statistics
   * @returns {Object}
   */
  getFallbackCacheStatistics() {
    const cacheEntries = Array.from(this.fallbackAssetCache.entries());
    
    const byCategory = {};
    const byReason = {};
    
    cacheEntries.forEach(([url, data]) => {
      byCategory[data.originalCategory] = (byCategory[data.originalCategory] || 0) + 1;
      byReason[data.reason] = (byReason[data.reason] || 0) + 1;
    });
    
    return {
      totalCachedFallbacks: cacheEntries.length,
      byCategory,
      byReason,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Export comprehensive error report for clinical review
   * @returns {Object}
   */
  exportErrorReport() {
    const errorsByType = {};
    const errorsBySeverity = {};
    
    this.errorLog.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });
    
    return {
      summary: {
        totalErrors: this.errorLog.length,
        errorsByType: Object.entries(errorsByType).sort(([,a], [,b]) => b - a),
        errorsBySeverity: Object.entries(errorsBySeverity).sort(([,a], [,b]) => b - a),
        sessionsPreserved: this.sessionPreservationLog.length,
        fallbacksUsed: this.fallbackAssetCache.size
      },
      errorLog: this.errorLog,
      sessionPreservationLog: this.sessionPreservationLog,
      fallbackCacheStatistics: this.getFallbackCacheStatistics(),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Clear error logs (use with caution - for testing/reset only)
   */
  clearErrorLogs() {
    this.errorLog = [];
    this.sessionPreservationLog = [];
    this.errorCounter = 0;
  }

  /**
   * Clear fallback cache
   */
  clearFallbackCache() {
    this.fallbackAssetCache.clear();
    this.therapeuticContextCache.clear();
  }
}

export default ErrorHandlingService;
