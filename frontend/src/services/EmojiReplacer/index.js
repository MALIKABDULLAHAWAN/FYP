/**
 * Emoji Replacer System - Main entry point
 * Provides centralized access to emoji replacement functionality with full system integration
 */

import EmojiReplacer from './EmojiReplacer.js';
import AssetManager from './AssetManager.js';
import ValidationService from './ValidationService.js';
import GameMetadataService from './GameMetadataService.js';
import AccessibilityValidator from './AccessibilityValidator.js';
import TherapeuticAuditService from './TherapeuticAuditService.js';
import ErrorHandlingService from './ErrorHandlingService.js';
import SystemIntegration from './SystemIntegration.js';
import SystemConfiguration from './SystemConfiguration.js';

// Export main classes
export { 
  EmojiReplacer, 
  AssetManager,
  ValidationService,
  GameMetadataService,
  AccessibilityValidator,
  TherapeuticAuditService,
  ErrorHandlingService,
  SystemIntegration,
  SystemConfiguration
};

// Export types for JSDoc usage
export * from './types.js';

// Create singleton instances for global use (lazy initialization)
let _systemIntegration = null;

function getSystemIntegration() {
  if (!_systemIntegration) {
    _systemIntegration = new SystemIntegration();
  }
  return _systemIntegration;
}

// Export getter function
export { getSystemIntegration };

// Export configuration utilities
import { 
  configurationManager, 
  assetDatabaseInitializer, 
  systemHealthMonitor 
} from './SystemConfiguration.js';

export { 
  configurationManager, 
  assetDatabaseInitializer, 
  systemHealthMonitor 
};

/**
 * Initialize the complete emoji replacement system
 * @param {Object} options - Initialization options
 * @returns {Promise<Object>}
 */
export async function initializeEmojiReplacer(options = {}) {
  try {
    const si = getSystemIntegration();
    const result = await si.initializeSystem();
    
    if (result.success) {
      console.log('Emoji Replacer System initialized successfully');
      
      // Start health monitoring if enabled
      if (options.enableHealthMonitoring !== false) {
        systemHealthMonitor.startMonitoring(si);
      }
    } else {
      console.warn('Emoji Replacer System initialized with warnings:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to initialize Emoji Replacer System:', error);
    throw error;
  }
}

/**
 * Process emoji replacement for a React component with full integration
 * @param {string} componentCode - React component code as string
 * @param {string} componentName - Component name for tracking
 * @param {Object} options - Processing options
 * @returns {Promise<EnhancedComponent>}
 */
export async function processComponent(componentCode, componentName = 'UnknownComponent', options = {}) {
  const si = getSystemIntegration();
  return await si.processEmojiReplacement(componentCode, componentName, options);
}

/**
 * Process multiple components in batch
 * @param {Object[]} components - Array of {code, name} objects
 * @param {Object} options - Processing options
 * @returns {Promise<Object[]>}
 */
export async function processBatchComponents(components, options = {}) {
  const si = getSystemIntegration();
  return await si.processBatchComponents(components, options);
}

/**
 * Get therapeutic asset for specific context
 * @param {string} category - Asset category (therapist, activity, medical, ui)
 * @param {string} subcategory - Specific asset type
 * @returns {Promise<ImageAsset>}
 */
export async function getTherapeuticAsset(category, subcategory) {
  const si = getSystemIntegration();
  switch (category) {
    case 'therapist':
      return await si.assetManager.getTherapistIcon(subcategory);
    case 'activity':
      return await si.assetManager.getChildActivityIcon(subcategory);
    case 'medical':
      return await si.assetManager.getMedicalIcon(subcategory);
    case 'ui':
    default:
      return await si.assetManager.getUIIcon(subcategory);
  }
}

/**
 * Get system status and health
 * @returns {Object}
 */
export function getSystemStatus() {
  const si = getSystemIntegration();
  return si.getSystemStatus();
}

/**
 * Export comprehensive system report
 * @returns {Object}
 */
export function exportSystemReport() {
  const si = getSystemIntegration();
  return si.exportSystemReport();
}

/**
 * Update therapeutic criteria
 * @param {Object} criteria - New criteria
 * @param {string} reason - Reason for update
 * @returns {Object}
 */
export function updateTherapeuticCriteria(criteria, reason = 'manual-update') {
  return configurationManager.updateTherapeuticCriteria(criteria, reason);
}

/**
 * Get validation audit trail for clinical review
 * @param {Object} filters - Optional filters
 * @returns {Object[]}
 */
export function getValidationAuditTrail(filters = {}) {
  const si = getSystemIntegration();
  return si.therapeuticAuditService.getValidationAuditTrail(filters);
}

/**
 * Get error log for clinical review
 * @param {Object} filters - Optional filters
 * @returns {Object[]}
 */
export function getErrorLog(filters = {}) {
  const si = getSystemIntegration();
  return si.errorHandler.getErrorLog(filters);
}

/**
 * Clear all cached assets
 */
export function clearAssetCache() {
  const si = getSystemIntegration();
  si.assetManager.clearCache();
}

/**
 * Reset entire system (for testing/maintenance)
 */
export function resetSystem() {
  const si = getSystemIntegration();
  si.resetSystem();
}

// Default export with full API
export default {
  // Classes
  EmojiReplacer,
  AssetManager,
  ValidationService,
  GameMetadataService,
  AccessibilityValidator,
  TherapeuticAuditService,
  ErrorHandlingService,
  SystemIntegration,
  SystemConfiguration,
  
  // Getter function for singleton
  getSystemIntegration,
  
  // Configuration utilities
  configurationManager,
  assetDatabaseInitializer,
  systemHealthMonitor,
  
  // API functions
  initializeEmojiReplacer,
  processComponent,
  processBatchComponents,
  getTherapeuticAsset,
  getSystemStatus,
  exportSystemReport,
  updateTherapeuticCriteria,
  getValidationAuditTrail,
  getErrorLog,
  clearAssetCache,
  resetSystem
};
