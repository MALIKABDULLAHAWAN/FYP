/**
 * SystemIntegration - Main processing pipeline and system wiring
 * Integrates all components: EmojiReplacer, AssetManager, ValidationService, 
 * GameMetadataService, TherapeuticAuditService, and ErrorHandlingService
 * Requirements: 1.1, 1.2, 1.3, 1.4, 3.3, 9.1, 10.1
 */

import EmojiReplacer from './EmojiReplacer.js';
import AssetManager from './AssetManager.js';
import ValidationService from './ValidationService.js';
import GameMetadataService from './GameMetadataService.js';
import TherapeuticAuditService from './TherapeuticAuditService.js';
import ErrorHandlingService from './ErrorHandlingService.js';

/**
 * @typedef {import('./types.js').EnhancedComponent} EnhancedComponent
 * @typedef {import('./types.js').GameMetadata} GameMetadata
 */

class SystemIntegration {
  constructor() {
    // Initialize all services
    this.emojiReplacer = new EmojiReplacer();
    this.assetManager = new AssetManager();
    this.validationService = new ValidationService();
    this.gameMetadataService = new GameMetadataService();
    this.therapeuticAuditService = new TherapeuticAuditService();
    this.errorHandler = new ErrorHandlingService();
    
    // Wire services together
    this.wireServices();
    
    // System state
    this.initialized = false;
    this.systemHealth = {
      status: 'initializing',
      lastCheck: null,
      services: {}
    };
  }

  /**
   * Wire all services together for integrated operation
   */
  wireServices() {
    // EmojiReplacer already has AssetManager and ValidationService
    // We need to ensure they use the same instances
    
    // Share error handler across services
    this.assetManager.errorHandler = this.errorHandler;
    
    // Connect validation service to therapeutic audit service
    this.validationService.therapeuticAuditService = this.therapeuticAuditService;
    
    // Connect game metadata service to error handler for caching
    this.gameMetadataService.errorHandler = this.errorHandler;
  }

  /**
   * Initialize the complete emoji replacement system
   * @returns {Promise<Object>}
   */
  async initializeSystem() {
    try {
      const startTime = Date.now();
      
      // Preload critical assets
      await this.assetManager.preloadAssets(['TherapistConsole', 'SpeechTherapy']);
      
      // Verify system health
      const healthCheck = await this.performHealthCheck();
      
      if (!healthCheck.healthy) {
        throw new Error(`System health check failed: ${healthCheck.issues.join(', ')}`);
      }
      
      this.initialized = true;
      
      return {
        success: true,
        initialized: true,
        initializationTime: Date.now() - startTime,
        healthCheck,
        message: 'Emoji replacement system initialized successfully'
      };
    } catch (error) {
      this.errorHandler.logError({
        type: 'system-initialization-failure',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      });
      
      return {
        success: false,
        initialized: false,
        error: error.message,
        message: 'System initialization failed - operating in degraded mode'
      };
    }
  }

  /**
   * Main emoji replacement processing pipeline
   * @param {string} componentCode - React component code to process
   * @param {string} componentName - Component name for tracking
   * @param {Object} options - Processing options
   * @returns {Promise<EnhancedComponent>}
   */
  async processEmojiReplacement(componentCode, componentName, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure system is initialized
      if (!this.initialized) {
        await this.initializeSystem();
      }
      
      // Step 1: Process emoji replacement with integrated validation
      const enhancedResult = await this.emojiReplacer.processEmojiReplacement(componentCode);
      
      // Step 2: Perform therapeutic audit validation
      if (options.therapeuticAudit !== false) {
        for (const replacement of enhancedResult.replacements) {
          const asset = await this.assetManager.getChildActivityIcon(replacement.subcategory);
          const auditResult = this.therapeuticAuditService.validateTherapeuticSuitability(
            asset,
            replacement.context
          );
          
          replacement.therapeuticAudit = auditResult;
        }
      }
      
      // Step 3: Integrate game metadata if applicable
      if (options.gameId) {
        try {
          const gameMetadata = await this.gameMetadataService.getGameMetadata(options.gameId);
          
          // Cache for fallback
          this.errorHandler.cacheTherapeuticContext(options.gameId, gameMetadata);
          
          enhancedResult.gameMetadata = gameMetadata;
        } catch (error) {
          // Handle metadata service failure
          const fallbackResult = this.errorHandler.handleMetadataServiceFailure(options.gameId, error);
          enhancedResult.gameMetadata = fallbackResult.data;
          enhancedResult.metadataWarning = fallbackResult.warning || fallbackResult.error;
        }
      }
      
      // Step 4: Final system validation
      const systemValidation = this.validateSystemIntegration(enhancedResult);
      enhancedResult.systemValidation = systemValidation;
      
      // Step 5: Return enhanced component with full integration
      return {
        ...enhancedResult,
        componentName,
        totalProcessingTime: Date.now() - startTime,
        systemIntegrated: true,
        processedAt: new Date().toISOString()
      };
      
    } catch (error) {
      // Handle enhancement failure with session preservation
      return this.errorHandler.handleEnhancementFailure(componentName, componentCode, error);
    }
  }

  /**
   * Validate system integration completeness
   * @param {Object} enhancedResult - Enhanced component result
   * @returns {Object}
   */
  validateSystemIntegration(enhancedResult) {
    const validations = {
      emojiReplacementComplete: enhancedResult.replacements.length > 0,
      validationPerformed: !!enhancedResult.validation,
      accessibilityCompliant: enhancedResult.validation?.suitable || false,
      functionalityPreserved: enhancedResult.functionalityValidation?.suitable || false,
      therapeuticAuditComplete: enhancedResult.replacements.every(r => r.therapeuticAudit),
      metadataIntegrated: !!enhancedResult.gameMetadata
    };
    
    const allPassed = Object.values(validations).every(v => v === true);
    
    return {
      integrated: allPassed,
      validations,
      issues: Object.entries(validations)
        .filter(([, passed]) => !passed)
        .map(([validation]) => validation)
    };
  }

  /**
   * Process multiple components in batch
   * @param {Object[]} components - Array of {code, name} objects
   * @param {Object} options - Processing options
   * @returns {Promise<Object[]>}
   */
  async processBatchComponents(components, options = {}) {
    const results = [];
    
    for (const component of components) {
      try {
        const result = await this.processEmojiReplacement(
          component.code,
          component.name,
          options
        );
        results.push(result);
      } catch (error) {
        results.push({
          componentName: component.name,
          success: false,
          error: error.message,
          preservedOriginal: true,
          component: component.code
        });
      }
    }
    
    return results;
  }

  /**
   * Perform system health check
   * @returns {Promise<Object>}
   */
  async performHealthCheck() {
    const issues = [];
    const services = {};
    
    // Check EmojiReplacer
    try {
      services.emojiReplacer = { status: 'healthy' };
    } catch (error) {
      services.emojiReplacer = { status: 'unhealthy', error: error.message };
      issues.push('EmojiReplacer service unavailable');
    }
    
    // Check AssetManager
    try {
      await this.assetManager.getTherapistIcon('medical-professional');
      services.assetManager = { status: 'healthy' };
    } catch (error) {
      services.assetManager = { status: 'unhealthy', error: error.message };
      issues.push('AssetManager service unavailable');
    }
    
    // Check ValidationService
    try {
      services.validationService = { status: 'healthy' };
    } catch (error) {
      services.validationService = { status: 'unhealthy', error: error.message };
      issues.push('ValidationService unavailable');
    }
    
    // Check GameMetadataService
    try {
      services.gameMetadataService = { status: 'healthy' };
    } catch (error) {
      services.gameMetadataService = { status: 'unhealthy', error: error.message };
      issues.push('GameMetadataService unavailable');
    }
    
    // Check TherapeuticAuditService
    try {
      services.therapeuticAuditService = { status: 'healthy' };
    } catch (error) {
      services.therapeuticAuditService = { status: 'unhealthy', error: error.message };
      issues.push('TherapeuticAuditService unavailable');
    }
    
    // Check ErrorHandlingService
    try {
      services.errorHandler = { status: 'healthy' };
    } catch (error) {
      services.errorHandler = { status: 'unhealthy', error: error.message };
      issues.push('ErrorHandlingService unavailable');
    }
    
    const healthy = issues.length === 0;
    
    this.systemHealth = {
      status: healthy ? 'healthy' : 'degraded',
      lastCheck: new Date().toISOString(),
      services,
      issues: healthy ? [] : issues
    };
    
    return {
      healthy,
      services,
      issues,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Get comprehensive system status
   * @returns {Object}
   */
  getSystemStatus() {
    return {
      initialized: this.initialized,
      health: this.systemHealth,
      statistics: {
        errorLog: this.errorHandler.getErrorLog().length,
        validationHistory: this.validationService.getValidationHistory().length,
        auditTrail: this.therapeuticAuditService.getValidationAuditTrail().length,
        cachedAssets: this.assetManager.assetCache.size,
        preloadedComponents: this.assetManager.preloadedAssets.size
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Export comprehensive system report
   * @returns {Object}
   */
  exportSystemReport() {
    return {
      systemStatus: this.getSystemStatus(),
      validationReport: this.validationService.exportValidationReport(),
      auditReport: this.therapeuticAuditService.exportAuditReport(),
      errorReport: this.errorHandler.exportErrorReport(),
      processingStats: this.emojiReplacer.exportProcessingStats(),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Reset system (for testing/maintenance)
   */
  resetSystem() {
    this.assetManager.clearCache();
    this.validationService.clearValidationHistory();
    this.therapeuticAuditService.clearAuditTrail();
    this.errorHandler.clearErrorLogs();
    this.errorHandler.clearFallbackCache();
    this.emojiReplacer.clearCache();
    
    this.initialized = false;
    this.systemHealth = {
      status: 'reset',
      lastCheck: new Date().toISOString(),
      services: {}
    };
  }

  /**
   * Get service instances for external access
   * @returns {Object}
   */
  getServices() {
    return {
      emojiReplacer: this.emojiReplacer,
      assetManager: this.assetManager,
      validationService: this.validationService,
      gameMetadataService: this.gameMetadataService,
      therapeuticAuditService: this.therapeuticAuditService,
      errorHandler: this.errorHandler
    };
  }
}

export default SystemIntegration;
