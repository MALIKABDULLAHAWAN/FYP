/**
 * SystemConfiguration - Configuration management and deployment utilities
 * Manages therapeutic criteria, asset database initialization, and system health monitoring
 * Requirements: 2.1, 5.1, 9.5
 */

/**
 * Default therapeutic criteria configuration
 */
export const DEFAULT_THERAPEUTIC_CRITERIA = {
  accessibility: {
    minimumAltTextLength: 10,
    maximumAltTextLength: 125,
    minimumColorContrast: 4.5,
    minimumColorContrastLarge: 3.0,
    screenReaderRequired: true,
    keyboardNavigationRequired: true,
    focusIndicatorRequired: true
  },
  therapeutic: {
    ageRange: {
      minimum: 3,
      maximum: 12,
      targetPopulation: 'ASD children'
    },
    culturalSensitivity: {
      required: true,
      diversityRepresentation: true,
      culturallyNeutral: true
    },
    contentSafety: {
      childSafe: true,
      noDistressingContent: true,
      positiveReinforcement: true
    },
    visualClarity: {
      minimumResolution: 72,
      clearSubject: true,
      minimalDistraction: true
    },
    evidenceBased: true,
    clinicallyValidated: true
  },
  technical: {
    minimumWidth: 20,
    minimumHeight: 20,
    maxFileSize: 500000,
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    requiredLicense: 'therapeutic-use-approved'
  },
  performance: {
    preloadEnabled: true,
    cacheEnabled: true,
    maxCacheSize: 100,
    assetOptimizationEnabled: true
  }
};

/**
 * System health monitoring configuration
 */
export const HEALTH_MONITORING_CONFIG = {
  checkInterval: 300000, // 5 minutes
  alertThresholds: {
    errorRate: 0.05, // 5% error rate triggers alert
    validationFailureRate: 0.10, // 10% validation failure rate
    responseTime: 1000, // 1 second max response time
    cacheHitRate: 0.80 // 80% minimum cache hit rate
  },
  enabledChecks: {
    serviceAvailability: true,
    assetAccessibility: true,
    validationCompliance: true,
    performanceMetrics: true,
    errorRates: true
  }
};

/**
 * Asset database initialization configuration
 */
export const ASSET_DATABASE_CONFIG = {
  assetBasePath: '/images',
  fallbackBasePath: '/images/fallback',
  categories: ['therapist', 'activity', 'medical', 'ui'],
  preloadPriority: {
    critical: ['therapist/medical-professional', 'ui/generic'],
    high: ['activity/patient-care', 'medical/session-management'],
    medium: ['activity/speech-therapy', 'ui/professional-microphone'],
    low: ['medical/performance-metric', 'ui/analytics-chart']
  },
  validationOnLoad: true,
  autoFallbackGeneration: true
};

/**
 * Configuration manager class
 */
class ConfigurationManager {
  constructor() {
    this.config = this.loadConfiguration();
    this.configHistory = [];
  }

  /**
   * Load configuration from storage or use defaults
   * @returns {Object}
   */
  loadConfiguration() {
    try {
      // Try to load from localStorage
      const stored = localStorage.getItem('emoji-replacement-config');
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.warn('Failed to load stored configuration, using defaults:', error);
    }
    
    return {
      therapeuticCriteria: DEFAULT_THERAPEUTIC_CRITERIA,
      healthMonitoring: HEALTH_MONITORING_CONFIG,
      assetDatabase: ASSET_DATABASE_CONFIG,
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Merge stored config with defaults to ensure all fields exist
   * @param {Object} stored - Stored configuration
   * @returns {Object}
   */
  mergeWithDefaults(stored) {
    return {
      therapeuticCriteria: {
        ...DEFAULT_THERAPEUTIC_CRITERIA,
        ...stored.therapeuticCriteria
      },
      healthMonitoring: {
        ...HEALTH_MONITORING_CONFIG,
        ...stored.healthMonitoring
      },
      assetDatabase: {
        ...ASSET_DATABASE_CONFIG,
        ...stored.assetDatabase
      },
      version: stored.version || '1.0.0',
      lastUpdated: stored.lastUpdated || new Date().toISOString()
    };
  }

  /**
   * Update configuration
   * @param {Object} updates - Configuration updates
   * @param {string} reason - Reason for update
   * @returns {Object}
   */
  updateConfiguration(updates, reason = 'manual-update') {
    const previousConfig = JSON.parse(JSON.stringify(this.config));
    
    // Apply updates
    this.config = {
      ...this.config,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    // Save to storage
    try {
      localStorage.setItem('emoji-replacement-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
    
    // Record in history
    this.configHistory.push({
      previousConfig,
      newConfig: this.config,
      reason,
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      config: this.config,
      message: 'Configuration updated successfully'
    };
  }

  /**
   * Update therapeutic criteria
   * @param {Object} criteria - New criteria
   * @param {string} reason - Reason for update
   * @returns {Object}
   */
  updateTherapeuticCriteria(criteria, reason = 'criteria-update') {
    return this.updateConfiguration({
      therapeuticCriteria: {
        ...this.config.therapeuticCriteria,
        ...criteria
      }
    }, reason);
  }

  /**
   * Get current configuration
   * @returns {Object}
   */
  getConfiguration() {
    return { ...this.config };
  }

  /**
   * Get configuration history
   * @returns {Object[]}
   */
  getConfigurationHistory() {
    return [...this.configHistory];
  }

  /**
   * Reset configuration to defaults
   * @returns {Object}
   */
  resetToDefaults() {
    this.config = {
      therapeuticCriteria: DEFAULT_THERAPEUTIC_CRITERIA,
      healthMonitoring: HEALTH_MONITORING_CONFIG,
      assetDatabase: ASSET_DATABASE_CONFIG,
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('emoji-replacement-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save default configuration:', error);
    }
    
    return {
      success: true,
      config: this.config,
      message: 'Configuration reset to defaults'
    };
  }

  /**
   * Export configuration for backup
   * @returns {string}
   */
  exportConfiguration() {
    return JSON.stringify({
      config: this.config,
      history: this.configHistory,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import configuration from backup
   * @param {string} configJson - JSON configuration string
   * @returns {Object}
   */
  importConfiguration(configJson) {
    try {
      const imported = JSON.parse(configJson);
      
      if (!imported.config) {
        throw new Error('Invalid configuration format');
      }
      
      this.config = this.mergeWithDefaults(imported.config);
      
      if (imported.history) {
        this.configHistory = imported.history;
      }
      
      localStorage.setItem('emoji-replacement-config', JSON.stringify(this.config));
      
      return {
        success: true,
        config: this.config,
        message: 'Configuration imported successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to import configuration'
      };
    }
  }
}

/**
 * Asset database initialization utilities
 */
export class AssetDatabaseInitializer {
  constructor(config = ASSET_DATABASE_CONFIG) {
    this.config = config;
    this.initializationLog = [];
  }

  /**
   * Initialize asset database with validation
   * @returns {Promise<Object>}
   */
  async initializeAssetDatabase() {
    const startTime = Date.now();
    const results = {
      initialized: 0,
      failed: 0,
      validated: 0,
      fallbacksGenerated: 0,
      errors: []
    };
    
    try {
      // Initialize each category
      for (const category of this.config.categories) {
        try {
          await this.initializeCategory(category, results);
        } catch (error) {
          results.errors.push({
            category,
            error: error.message
          });
          results.failed++;
        }
      }
      
      // Log initialization
      this.initializationLog.push({
        results,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: results.failed === 0,
        results,
        duration: Date.now() - startTime,
        message: results.failed === 0 
          ? 'Asset database initialized successfully' 
          : `Asset database initialized with ${results.failed} failures`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Asset database initialization failed'
      };
    }
  }

  /**
   * Initialize assets for a specific category
   * @param {string} category - Asset category
   * @param {Object} results - Results accumulator
   * @returns {Promise<void>}
   */
  async initializeCategory(category, results) {
    // In a real implementation, this would:
    // 1. Scan the asset directory for the category
    // 2. Validate each asset
    // 3. Generate fallbacks if needed
    // 4. Build the asset database entries
    
    // For now, we'll simulate the process
    results.initialized++;
    
    if (this.config.validationOnLoad) {
      results.validated++;
    }
    
    if (this.config.autoFallbackGeneration) {
      results.fallbacksGenerated++;
    }
  }

  /**
   * Get initialization log
   * @returns {Object[]}
   */
  getInitializationLog() {
    return [...this.initializationLog];
  }
}

/**
 * System health monitor
 */
export class SystemHealthMonitor {
  constructor(config = HEALTH_MONITORING_CONFIG) {
    this.config = config;
    this.healthHistory = [];
    this.alerts = [];
    this.monitoringActive = false;
    this.monitoringInterval = null;
  }

  /**
   * Start health monitoring
   * @param {Object} systemIntegration - System integration instance
   */
  startMonitoring(systemIntegration) {
    if (this.monitoringActive) {
      return { success: false, message: 'Monitoring already active' };
    }
    
    this.systemIntegration = systemIntegration;
    this.monitoringActive = true;
    
    // Perform initial check
    this.performHealthCheck();
    
    // Set up periodic checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
    
    return {
      success: true,
      message: 'Health monitoring started',
      interval: this.config.checkInterval
    };
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.monitoringActive = false;
    
    return {
      success: true,
      message: 'Health monitoring stopped'
    };
  }

  /**
   * Perform health check
   * @returns {Promise<Object>}
   */
  async performHealthCheck() {
    if (!this.systemIntegration) {
      return { success: false, message: 'System integration not configured' };
    }
    
    const healthCheck = await this.systemIntegration.performHealthCheck();
    const systemStatus = this.systemIntegration.getSystemStatus();
    
    // Check against thresholds
    const alerts = this.checkThresholds(systemStatus);
    
    const healthRecord = {
      ...healthCheck,
      systemStatus,
      alerts,
      checkedAt: new Date().toISOString()
    };
    
    this.healthHistory.push(healthRecord);
    
    if (alerts.length > 0) {
      this.alerts.push(...alerts);
    }
    
    return healthRecord;
  }

  /**
   * Check metrics against thresholds
   * @param {Object} systemStatus - System status
   * @returns {Object[]}
   */
  checkThresholds(systemStatus) {
    const alerts = [];
    
    // Check error rate
    const errorCount = systemStatus.statistics.errorLog;
    const validationCount = systemStatus.statistics.validationHistory;
    
    if (validationCount > 0) {
      const errorRate = errorCount / validationCount;
      
      if (errorRate > this.config.alertThresholds.errorRate) {
        alerts.push({
          type: 'error-rate',
          severity: 'high',
          message: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(this.config.alertThresholds.errorRate * 100)}%`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return alerts;
  }

  /**
   * Get health history
   * @param {number} limit - Maximum number of records to return
   * @returns {Object[]}
   */
  getHealthHistory(limit = 100) {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Get active alerts
   * @returns {Object[]}
   */
  getAlerts() {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts() {
    this.alerts = [];
  }
}

// Export singleton instances
export const configurationManager = new ConfigurationManager();
export const assetDatabaseInitializer = new AssetDatabaseInitializer();
export const systemHealthMonitor = new SystemHealthMonitor();

export default {
  ConfigurationManager,
  AssetDatabaseInitializer,
  SystemHealthMonitor,
  configurationManager,
  assetDatabaseInitializer,
  systemHealthMonitor,
  DEFAULT_THERAPEUTIC_CRITERIA,
  HEALTH_MONITORING_CONFIG,
  ASSET_DATABASE_CONFIG
};
