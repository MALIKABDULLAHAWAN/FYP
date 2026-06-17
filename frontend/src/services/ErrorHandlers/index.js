/**
 * Error Handlers Index
 * 
 * Centralized export of all error handling services for the child-friendly UI enhancement.
 * Provides comprehensive error handling and fallback mechanisms for:
 * - Image loading failures
 * - Metadata validation errors
 * - Age appropriateness validation
 * - Sticker loading failures
 * - Database connection issues
 * 
 * Requirements: 5.4, 5.5, 7.2
 */

import ImageErrorHandler from './ImageErrorHandler.js';
import MetadataValidationHandler from './MetadataValidationHandler.js';
import AgeValidationErrorHandler from './AgeValidationErrorHandler.js';
import StickerErrorHandler from './StickerErrorHandler.js';
import DatabaseErrorHandler from './DatabaseErrorHandler.js';
import ComprehensiveErrorLogger from './ComprehensiveErrorLogger.js';

/**
 * Unified Error Handler Service
 * 
 * Provides a single interface to all error handling services
 * with integrated logging and user-friendly messaging
 */
class UnifiedErrorHandler {
  constructor() {
    this.imageHandler = ImageErrorHandler;
    this.metadataHandler = MetadataValidationHandler;
    this.ageHandler = AgeValidationErrorHandler;
    this.stickerHandler = StickerErrorHandler;
    this.databaseHandler = DatabaseErrorHandler;
    this.logger = ComprehensiveErrorLogger;
  }

  /**
   * Handle image loading failure with comprehensive logging
   */
  async handleImageFailure(imageUrl, imageType, gameId, error) {
    try {
      // Handle the error with specific handler
      const result = await this.imageHandler.handleImageLoadingFailure(
        imageUrl, 
        imageType, 
        gameId, 
        error
      );

      // Log to comprehensive logger
      const errorId = this.logger.logImageError(
        imageUrl,
        imageType,
        error,
        result.fallbackUsed,
        {
          gameId,
          fallbackLevel: result.fallbackLevel,
          retryScheduled: result.retryScheduled
        }
      );

      return {
        ...result,
        errorId,
        loggedToSystem: true
      };
    } catch (handlerError) {
      // Fallback if handler itself fails
      const errorId = this.logger.logSystemError('ImageErrorHandler', handlerError, {
        originalError: error.message,
        imageUrl,
        imageType
      });

      return {
        success: false,
        systemError: true,
        errorId,
        fallbackUsed: false,
        userMessage: 'Image temporarily unavailable'
      };
    }
  }

  /**
   * Handle metadata validation failure with comprehensive logging
   */
  handleMetadataValidation(metadata, validationResult, context) {
    try {
      // Handle the error with specific handler
      const result = this.metadataHandler.handleValidationFailure(
        metadata,
        validationResult,
        context
      );

      // Log to comprehensive logger
      const errorId = this.logger.logMetadataValidationError(
        validationResult.errors || [],
        {
          context,
          suggestions: result.suggestions,
          canRetry: result.canRetry
        }
      );

      return {
        ...result,
        errorId,
        loggedToSystem: true
      };
    } catch (handlerError) {
      // Fallback if handler itself fails
      const errorId = this.logger.logSystemError('MetadataValidationHandler', handlerError, {
        metadata: Object.keys(metadata),
        context
      });

      return {
        success: false,
        systemError: true,
        errorId,
        userMessage: 'Please check your information and try again'
      };
    }
  }

  /**
   * Handle age validation failure with comprehensive logging
   */
  handleAgeValidation(childAge, game, validationResult, context) {
    try {
      // Handle the error with specific handler
      const result = this.ageHandler.handleAgeValidationFailure(
        childAge,
        game,
        validationResult,
        context
      );

      // Log to comprehensive logger
      const errorId = this.logger.logAgeValidationError(
        childAge,
        game.age_range,
        result.alternatives?.games || [],
        {
          gameId: game.game_id,
          gameName: game.title,
          context,
          therapistOverride: result.therapistOverride
        }
      );

      return {
        ...result,
        errorId,
        loggedToSystem: true
      };
    } catch (handlerError) {
      // Fallback if handler itself fails
      const errorId = this.logger.logSystemError('AgeValidationErrorHandler', handlerError, {
        childAge,
        gameId: game.game_id,
        context
      });

      return {
        success: false,
        systemError: true,
        errorId,
        blocked: true,
        userMessage: 'Unable to validate game appropriateness. Please try again.'
      };
    }
  }

  /**
   * Handle sticker loading failure with comprehensive logging
   */
  handleStickerFailure(sticker, error, context) {
    try {
      // Handle the error with specific handler
      const result = this.stickerHandler.handleStickerLoadingFailure(
        sticker,
        error,
        context
      );

      // Log to comprehensive logger
      const errorId = this.logger.logStickerError(
        sticker.id,
        error,
        result.fallbackUsed,
        {
          stickerUrl: sticker.svgPath,
          category: this.stickerHandler.extractCategory(sticker),
          context,
          gracefulDegradation: result.gracefulDegradation
        }
      );

      return {
        ...result,
        errorId,
        loggedToSystem: true
      };
    } catch (handlerError) {
      // Fallback if handler itself fails
      const errorId = this.logger.logSystemError('StickerErrorHandler', handlerError, {
        stickerId: sticker.id,
        originalError: error.message,
        context
      });

      return {
        success: false,
        systemError: true,
        errorId,
        gracefulDegradation: true,
        userMessage: 'Continuing without decorative elements'
      };
    }
  }

  /**
   * Handle database connection failure with comprehensive logging
   */
  handleDatabaseFailure(error, operation, context) {
    try {
      // Handle the error with specific handler
      const result = this.databaseHandler.handleConnectionFailure(
        error,
        operation,
        context
      );

      // Log to comprehensive logger
      const errorId = this.logger.logDatabaseError(
        operation,
        error,
        result.offlineMode,
        result.cachedDataAvailable,
        {
          context,
          queuedForSync: result.queuedForSync,
          reconnectScheduled: result.reconnectScheduled
        }
      );

      return {
        ...result,
        errorId,
        loggedToSystem: true
      };
    } catch (handlerError) {
      // Fallback if handler itself fails
      const errorId = this.logger.logSystemError('DatabaseErrorHandler', handlerError, {
        operation,
        originalError: error.message,
        context
      });

      return {
        success: false,
        systemError: true,
        errorId,
        offlineMode: true,
        userMessage: 'Connection issue - working offline'
      };
    }
  }

  /**
   * Get system health overview from all handlers
   */
  getSystemHealth() {
    const overallHealth = this.logger.getSystemHealthOverview();
    
    const componentHealth = {
      images: this.imageHandler.getFailureStatistics(),
      metadata: this.metadataHandler.getValidationStatistics(),
      ageValidation: this.ageHandler.getValidationStatistics(),
      stickers: this.stickerHandler.getSystemHealth(),
      database: this.databaseHandler.getSystemHealth()
    };

    return {
      overall: overallHealth,
      components: componentHealth,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get pending user notifications from all sources
   */
  getPendingNotifications() {
    return this.logger.getPendingNotifications();
  }

  /**
   * Clear notification and mark as handled
   */
  clearNotification(notificationId) {
    this.logger.clearNotification(notificationId);
  }

  /**
   * Export comprehensive error report
   */
  exportErrorReport() {
    const mainReport = this.logger.exportErrorReport();
    
    const componentReports = {
      imageHandler: this.imageHandler.getFailureStatistics(),
      metadataHandler: this.metadataHandler.getValidationStatistics(),
      ageHandler: this.ageHandler.getValidationStatistics(),
      stickerHandler: this.stickerHandler.getFailureStatistics(),
      databaseHandler: this.databaseHandler.getConnectionStatistics()
    };

    return {
      ...mainReport,
      componentReports,
      systemHealth: this.getSystemHealth()
    };
  }

  /**
   * Clear all logs from all handlers (use with caution)
   */
  clearAllLogs() {
    this.logger.clearAllLogs();
    this.imageHandler.clearLogs();
    this.metadataHandler.clearLog();
    this.ageHandler.clearLogs();
    this.stickerHandler.clearLogs();
    this.databaseHandler.clearLogs();
  }

  /**
   * Force offline mode for testing
   */
  forceOfflineMode(enabled = true) {
    this.databaseHandler.forceOfflineMode(enabled);
  }

  /**
   * Force sticker degradation mode for testing
   */
  forceStickerDegradation(enabled = true) {
    this.stickerHandler.forceDegradationMode(enabled);
  }
}

// Create and export unified handler instance
const unifiedErrorHandler = new UnifiedErrorHandler();

// Export individual handlers for direct access if needed
export {
  ImageErrorHandler,
  MetadataValidationHandler,
  AgeValidationErrorHandler,
  StickerErrorHandler,
  DatabaseErrorHandler,
  ComprehensiveErrorLogger,
  unifiedErrorHandler as default
};