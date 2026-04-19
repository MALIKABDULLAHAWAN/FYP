/**
 * ComprehensiveErrorLogger - Centralized error logging and user-friendly error messages
 * 
 * Provides comprehensive error logging for:
 * - All error handler services
 * - User-friendly error messages
 * - Error categorization and severity
 * - Error reporting and analytics
 * - Graceful degradation coordination
 * 
 * Requirements: 5.4, 5.5, 7.2
 */

class ComprehensiveErrorLogger {
  constructor() {
    this.errorLog = [];
    this.userMessages = [];
    this.errorCategories = this.initializeErrorCategories();
    this.severityLevels = this.initializeSeverityLevels();
    this.userNotificationQueue = [];
    this.errorCounter = 0;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize error categories
   */
  initializeErrorCategories() {
    return {
      IMAGE_LOADING: {
        name: 'Image Loading',
        icon: '🖼️',
        userFriendly: 'Image Loading Issues',
        description: 'Problems loading game images or stickers'
      },
      METADATA_VALIDATION: {
        name: 'Metadata Validation',
        icon: '📝',
        userFriendly: 'Form Validation',
        description: 'Issues with game information validation'
      },
      AGE_VALIDATION: {
        name: 'Age Validation',
        icon: '🎂',
        userFriendly: 'Age Appropriateness',
        description: 'Age-related game access restrictions'
      },
      STICKER_LOADING: {
        name: 'Sticker Loading',
        icon: '✨',
        userFriendly: 'Decorative Elements',
        description: 'Issues with decorative sticker elements'
      },
      DATABASE_CONNECTION: {
        name: 'Database Connection',
        icon: '🔌',
        userFriendly: 'Connection Issues',
        description: 'Database connectivity problems'
      },
      SYSTEM_ERROR: {
        name: 'System Error',
        icon: '⚠️',
        userFriendly: 'System Issues',
        description: 'General system errors'
      }
    };
  }

  /**
   * Initialize severity levels
   */
  initializeSeverityLevels() {
    return {
      LOW: {
        level: 1,
        name: 'Low',
        color: '#7ED321',
        userImpact: 'minimal',
        description: 'Minor issues that don\'t affect functionality'
      },
      MEDIUM: {
        level: 2,
        name: 'Medium',
        color: '#F5A623',
        userImpact: 'moderate',
        description: 'Issues that may affect some features'
      },
      HIGH: {
        level: 3,
        name: 'High',
        color: '#E74C3C',
        userImpact: 'significant',
        description: 'Issues that affect important functionality'
      },
      CRITICAL: {
        level: 4,
        name: 'Critical',
        color: '#8B0000',
        userImpact: 'severe',
        description: 'Critical issues that may prevent app usage'
      }
    };
  }

  /**
   * Log comprehensive error with user-friendly messaging
   * 
   * @param {string} category - Error category
   * @param {string} severity - Error severity (LOW, MEDIUM, HIGH, CRITICAL)
   * @param {string} technicalMessage - Technical error message
   * @param {string} userMessage - User-friendly message
   * @param {Object} context - Additional context
   * @param {Object} errorData - Original error data
   * @returns {string} Error ID
   */
  logError(category, severity, technicalMessage, userMessage, context = {}, errorData = {}) {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();

    const logEntry = {
      errorId,
      sessionId: this.sessionId,
      category,
      severity,
      technicalMessage,
      userMessage,
      context,
      errorData,
      timestamp,
      errorNumber: ++this.errorCounter,
      resolved: false,
      userNotified: false
    };

    // Add to error log
    this.errorLog.push(logEntry);

    // Add user-friendly message to queue
    this.queueUserNotification(logEntry);

    // Keep log size manageable
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-500);
    }

    return errorId;
  }

  /**
   * Queue user notification
   */
  queueUserNotification(logEntry) {
    const categoryInfo = this.errorCategories[logEntry.category];
    const severityInfo = this.severityLevels[logEntry.severity];

    const notification = {
      id: logEntry.errorId,
      category: logEntry.category,
      severity: logEntry.severity,
      icon: categoryInfo?.icon || '⚠️',
      title: categoryInfo?.userFriendly || 'System Notice',
      message: logEntry.userMessage,
      color: severityInfo?.color || '#F5A623',
      timestamp: logEntry.timestamp,
      autoHide: logEntry.severity === 'LOW',
      hideDelay: this.getHideDelay(logEntry.severity),
      actions: this.generateNotificationActions(logEntry)
    };

    this.userNotificationQueue.push(notification);

    // Keep notification queue manageable
    if (this.userNotificationQueue.length > 20) {
      this.userNotificationQueue = this.userNotificationQueue.slice(-10);
    }
  }

  /**
   * Get hide delay for notification based on severity
   */
  getHideDelay(severity) {
    const delays = {
      LOW: 3000,      // 3 seconds
      MEDIUM: 5000,   // 5 seconds
      HIGH: 8000,     // 8 seconds
      CRITICAL: 0     // Don't auto-hide
    };

    return delays[severity] || 5000;
  }

  /**
   * Generate notification actions based on error type
   */
  generateNotificationActions(logEntry) {
    const actions = [];

    switch (logEntry.category) {
      case 'IMAGE_LOADING':
        actions.push({
          label: 'Retry',
          action: 'retry-image-load',
          data: logEntry.context
        });
        break;

      case 'METADATA_VALIDATION':
        actions.push({
          label: 'Fix Issues',
          action: 'show-validation-errors',
          data: logEntry.context
        });
        break;

      case 'AGE_VALIDATION':
        if (logEntry.context.alternatives?.length > 0) {
          actions.push({
            label: 'See Alternatives',
            action: 'show-alternatives',
            data: logEntry.context.alternatives
          });
        }
        break;

      case 'DATABASE_CONNECTION':
        if (logEntry.context.cachedDataAvailable) {
          actions.push({
            label: 'Use Cached Data',
            action: 'use-cached-data',
            data: logEntry.context
          });
        }
        break;
    }

    // Always add dismiss action
    actions.push({
      label: 'Dismiss',
      action: 'dismiss',
      data: { errorId: logEntry.errorId }
    });

    return actions;
  }

  /**
   * Log image loading error
   */
  logImageError(imageUrl, imageType, error, fallbackUsed = false, context = {}) {
    const userMessage = fallbackUsed
      ? `Using backup ${imageType} image`
      : `${imageType} image temporarily unavailable`;

    return this.logError(
      'IMAGE_LOADING',
      fallbackUsed ? 'LOW' : 'MEDIUM',
      `Image loading failed: ${error.message}`,
      userMessage,
      { imageUrl, imageType, fallbackUsed, ...context },
      { error: error.message, stack: error.stack }
    );
  }

  /**
   * Log metadata validation error
   */
  logMetadataValidationError(validationErrors, context = {}) {
    const errorCount = validationErrors.length;
    const userMessage = errorCount === 1
      ? 'Please fix the highlighted field'
      : `Please fix ${errorCount} highlighted fields`;

    return this.logError(
      'METADATA_VALIDATION',
      'MEDIUM',
      `Metadata validation failed: ${validationErrors.join(', ')}`,
      userMessage,
      { validationErrors, errorCount, ...context },
      { validationErrors }
    );
  }

  /**
   * Log age validation error
   */
  logAgeValidationError(childAge, gameAgeRange, alternatives = [], context = {}) {
    const hasAlternatives = alternatives.length > 0;
    const userMessage = hasAlternatives
      ? `This game isn't quite right for you, but we found ${alternatives.length} perfect alternatives!`
      : 'This game isn\'t the right fit, but we\'re looking for better options for you!';

    return this.logError(
      'AGE_VALIDATION',
      'MEDIUM',
      `Age validation failed: child age ${childAge} not in range ${gameAgeRange.min_age}-${gameAgeRange.max_age}`,
      userMessage,
      { childAge, gameAgeRange, alternatives, hasAlternatives, ...context },
      { childAge, gameAgeRange }
    );
  }

  /**
   * Log sticker loading error
   */
  logStickerError(stickerId, error, fallbackUsed = false, context = {}) {
    const userMessage = fallbackUsed
      ? 'Using simple decorations'
      : 'Some decorations may not appear';

    return this.logError(
      'STICKER_LOADING',
      'LOW',
      `Sticker loading failed: ${error.message}`,
      userMessage,
      { stickerId, fallbackUsed, ...context },
      { error: error.message }
    );
  }

  /**
   * Log database connection error
   */
  logDatabaseError(operation, error, offlineMode = false, cachedDataAvailable = false, context = {}) {
    const userMessage = offlineMode
      ? cachedDataAvailable
        ? 'Working offline with saved data'
        : 'Working offline - some features may be limited'
      : 'Connection issue - please try again';

    return this.logError(
      'DATABASE_CONNECTION',
      offlineMode ? 'HIGH' : 'MEDIUM',
      `Database error during ${operation}: ${error.message}`,
      userMessage,
      { operation, offlineMode, cachedDataAvailable, ...context },
      { error: error.message, stack: error.stack }
    );
  }

  /**
   * Log system error
   */
  logSystemError(component, error, context = {}) {
    const userMessage = 'Something went wrong, but we\'re handling it. Please try again.';

    return this.logError(
      'SYSTEM_ERROR',
      'HIGH',
      `System error in ${component}: ${error.message}`,
      userMessage,
      { component, ...context },
      { error: error.message, stack: error.stack }
    );
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId, resolution = 'resolved') {
    const error = this.errorLog.find(e => e.errorId === errorId);
    if (error) {
      error.resolved = true;
      error.resolution = resolution;
      error.resolvedAt = new Date().toISOString();
    }

    // Remove from notification queue
    this.userNotificationQueue = this.userNotificationQueue.filter(n => n.id !== errorId);
  }

  /**
   * Mark user as notified
   */
  markUserNotified(errorId) {
    const error = this.errorLog.find(e => e.errorId === errorId);
    if (error) {
      error.userNotified = true;
      error.notifiedAt = new Date().toISOString();
    }
  }

  /**
   * Get pending user notifications
   */
  getPendingNotifications() {
    return [...this.userNotificationQueue];
  }

  /**
   * Clear notification from queue
   */
  clearNotification(notificationId) {
    this.userNotificationQueue = this.userNotificationQueue.filter(n => n.id !== notificationId);
    this.markUserNotified(notificationId);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    const stats = {
      totalErrors: this.errorLog.length,
      resolvedErrors: this.errorLog.filter(e => e.resolved).length,
      unresolvedErrors: this.errorLog.filter(e => !e.resolved).length,
      byCategory: {},
      bySeverity: {},
      byTimeRange: this.getErrorsByTimeRange(),
      sessionId: this.sessionId,
      generatedAt: new Date().toISOString()
    };

    this.errorLog.forEach(error => {
      // By category
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      
      // By severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get errors by time range
   */
  getErrorsByTimeRange() {
    const now = new Date();
    const ranges = {
      lastHour: new Date(now.getTime() - 60 * 60 * 1000),
      last6Hours: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      last24Hours: new Date(now.getTime() - 24 * 60 * 60 * 1000)
    };

    const stats = {
      lastHour: 0,
      last6Hours: 0,
      last24Hours: 0
    };

    this.errorLog.forEach(error => {
      const errorTime = new Date(error.timestamp);
      
      if (errorTime > ranges.lastHour) stats.lastHour++;
      if (errorTime > ranges.last6Hours) stats.last6Hours++;
      if (errorTime > ranges.last24Hours) stats.last24Hours++;
    });

    return stats;
  }

  /**
   * Get system health overview
   */
  getSystemHealthOverview() {
    const stats = this.getErrorStatistics();
    const recentErrors = stats.byTimeRange.lastHour;
    const criticalErrors = stats.bySeverity.CRITICAL || 0;
    const highErrors = stats.bySeverity.HIGH || 0;

    let healthStatus = 'healthy';
    let healthScore = 100;

    if (criticalErrors > 0) {
      healthStatus = 'critical';
      healthScore = 20;
    } else if (highErrors > 2) {
      healthStatus = 'degraded';
      healthScore = 40;
    } else if (recentErrors > 5) {
      healthStatus = 'warning';
      healthScore = 70;
    } else if (recentErrors > 0) {
      healthStatus = 'minor-issues';
      healthScore = 85;
    }

    return {
      status: healthStatus,
      score: healthScore,
      recentErrors,
      criticalErrors,
      highErrors,
      totalErrors: stats.totalErrors,
      resolvedErrors: stats.resolvedErrors,
      recommendation: this.getHealthRecommendation(healthStatus),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health recommendation
   */
  getHealthRecommendation(healthStatus) {
    const recommendations = {
      healthy: 'All systems operating normally',
      'minor-issues': 'Minor issues detected, system is stable',
      warning: 'Multiple issues detected, monitoring recommended',
      degraded: 'System experiencing significant issues',
      critical: 'Critical issues detected, immediate attention required'
    };

    return recommendations[healthStatus] || 'Unknown status';
  }

  /**
   * Export error report for analysis
   */
  exportErrorReport() {
    const stats = this.getErrorStatistics();
    const health = this.getSystemHealthOverview();

    return {
      summary: {
        sessionId: this.sessionId,
        totalErrors: stats.totalErrors,
        resolvedErrors: stats.resolvedErrors,
        systemHealth: health,
        generatedAt: new Date().toISOString()
      },
      statistics: stats,
      recentErrors: this.getRecentErrors(60), // Last hour
      errorLog: this.errorLog.map(error => ({
        ...error,
        // Remove sensitive data
        errorData: error.errorData ? { ...error.errorData, stack: undefined } : undefined
      })),
      notifications: this.userNotificationQueue
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(minutes = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.errorLog.filter(error => 
      new Date(error.timestamp) > cutoff
    );
  }

  /**
   * Generate error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * Clear all logs (use with caution)
   */
  clearAllLogs() {
    this.errorLog = [];
    this.userMessages = [];
    this.userNotificationQueue = [];
    this.errorCounter = 0;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Get error by ID
   */
  getError(errorId) {
    return this.errorLog.find(error => error.errorId === errorId);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category) {
    return this.errorLog.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity) {
    return this.errorLog.filter(error => error.severity === severity);
  }
}

// Export singleton instance
export default new ComprehensiveErrorLogger();