/**
 * ValidationService - Comprehensive therapeutic validation system
 * Validates assets and components for therapeutic appropriateness and accessibility
 */

import AccessibilityValidator from './AccessibilityValidator.js';

/**
 * @typedef {import('./types.js').ImageAsset} ImageAsset
 * @typedef {import('./types.js').ValidationResult} ValidationResult
 * @typedef {import('./types.js').TherapeuticMetadata} TherapeuticMetadata
 */

class ValidationService {
  constructor() {
    this.therapeuticCriteria = {
      minimumContrast: 4.5, // WCAG AA standard
      minimumWidth: 20,
      minimumHeight: 20,
      minimumAltTextLength: 10,
      maxFileSize: 500000, // 500KB
      requiredLicense: 'therapeutic-use-approved',
      culturalSensitivityRequired: true,
      ageAppropriateRequired: true
    };
    
    this.validationHistory = new Map();
    this.validationCounter = 0;
    this.accessibilityValidator = new AccessibilityValidator();
    this.accessibilityFailureLog = [];
  }

  /**
   * Validate therapeutic suitability of an image asset
   * @param {ImageAsset} asset - Image asset to validate
   * @param {string} context - Therapeutic context for validation
   * @returns {ValidationResult}
   */
  validateTherapeuticSuitability(asset, context = 'general') {
    const validationId = this.generateValidationId(asset);
    const startTime = Date.now();
    
    const errors = [];
    const warnings = [];
    
    // Step 1: Comprehensive accessibility validation using AccessibilityValidator
    const accessibilityValidation = this.accessibilityValidator.validateAccessibilityCompliance(asset, context);
    
    if (!accessibilityValidation.suitable) {
      // Log accessibility failure for prevention and fallback
      this.logAccessibilityFailure(asset, accessibilityValidation, context);
      errors.push(...accessibilityValidation.errors);
    }
    
    warnings.push(...accessibilityValidation.warnings);
    
    // Step 2: Validate therapeutic appropriateness
    if (!asset.therapeuticContext.ageAppropriate) {
      errors.push('Image not age-appropriate for target ASD population');
    }
    
    if (this.therapeuticCriteria.culturalSensitivityRequired && !asset.therapeuticContext.culturallySensitive) {
      warnings.push('Image may not be culturally sensitive');
    }
    
    // Step 3: Check technical requirements
    if (asset.width < this.therapeuticCriteria.minimumWidth || asset.height < this.therapeuticCriteria.minimumHeight) {
      errors.push(`Image dimensions below therapeutic minimum (${this.therapeuticCriteria.minimumWidth}x${this.therapeuticCriteria.minimumHeight}, got ${asset.width}x${asset.height})`);
    }
    
    // Step 4: Validate licensing and usage rights
    if (!asset.therapeuticContext.license || asset.therapeuticContext.license !== this.therapeuticCriteria.requiredLicense) {
      errors.push(`Invalid or missing usage license (required: ${this.therapeuticCriteria.requiredLicense}, got: ${asset.therapeuticContext.license})`);
    }
    
    // Step 5: Validate therapeutic goals
    if (!asset.therapeuticContext.therapeuticGoals || asset.therapeuticContext.therapeuticGoals.length === 0) {
      warnings.push('No therapeutic goals specified for asset');
    }
    
    // Step 6: Create validation result
    const result = {
      suitable: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
      validationId,
      processingTime: Date.now() - startTime,
      criteria: { ...this.therapeuticCriteria },
      accessibilityCompliance: accessibilityValidation.suitable
    };
    
    // Store validation history
    this.validationHistory.set(validationId, result);
    
    return result;
  }

  /**
   * Log accessibility failure for prevention and fallback
   * @param {ImageAsset} asset - Asset that failed validation
   * @param {ValidationResult} validation - Validation result
   * @param {string} context - Therapeutic context
   */
  logAccessibilityFailure(asset, validation, context) {
    this.accessibilityFailureLog.push({
      assetUrl: asset.url,
      context,
      errors: validation.errors,
      warnings: validation.warnings,
      failedAt: new Date().toISOString(),
      preventedUsage: true
    });
  }

  /**
   * Get fallback accessibility solution for failed asset
   * @param {string} context - Therapeutic context
   * @returns {Object}
   */
  getFallbackAccessibilitySolution(context) {
    return {
      useFallbackAsset: true,
      fallbackReason: 'accessibility-compliance-failure',
      context,
      recommendation: 'Use pre-validated fallback asset with guaranteed accessibility compliance',
      requiresReview: true
    };
  }

  /**
   * Get accessibility failure log for clinical review
   * @returns {Object[]}
   */
  getAccessibilityFailureLog() {
    return [...this.accessibilityFailureLog];
  }

  /**
   * Validate enhanced component for completeness and compliance
   * @param {string} enhancedCode - Enhanced component code
   * @param {Object[]} replacements - Applied emoji replacements
   * @returns {ValidationResult}
   */
  validateEnhancedComponent(enhancedCode, replacements) {
    const errors = [];
    const warnings = [];
    const startTime = Date.now();
    
    // Validate keyboard navigation preservation
    const keyboardValidation = this.accessibilityValidator.validateKeyboardNavigation(enhancedCode);
    errors.push(...keyboardValidation.errors);
    warnings.push(...keyboardValidation.warnings);
    
    // Validate tab order maintenance
    const tabOrderValidation = this.accessibilityValidator.validateTabOrder(enhancedCode);
    warnings.push(...tabOrderValidation.warnings);
    
    // Check for remaining emojis
    const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const remainingEmojis = enhancedCode.match(emojiPattern) || [];
    
    if (remainingEmojis.length > 0) {
      errors.push(`${remainingEmojis.length} emoji instances remain unprocessed: ${remainingEmojis.join(', ')}`);
    }
    
    // Check for proper image tags
    const imagePattern = /<img[^>]*>/g;
    const imageMatches = enhancedCode.match(imagePattern) || [];
    
    if (imageMatches.length !== replacements.length) {
      warnings.push(`Mismatch between expected (${replacements.length}) and actual (${imageMatches.length}) image replacements`);
    }
    
    // Check accessibility compliance
    const imagesWithoutAlt = /<img(?![^>]*alt=)[^>]*>/g;
    const imagesWithoutAltMatches = enhancedCode.match(imagesWithoutAlt) || [];
    
    if (imagesWithoutAltMatches.length > 0) {
      errors.push(`${imagesWithoutAltMatches.length} images missing alt text attributes`);
    }
    
    // Check for therapeutic class names
    const therapeuticImages = enhancedCode.match(/class(Name)?="[^"]*therapeutic-image[^"]*"/g) || [];
    if (therapeuticImages.length !== imageMatches.length) {
      warnings.push('Some images missing therapeutic-image class');
    }
    
    // Check for data attributes
    const therapeuticGoalsData = enhancedCode.match(/data-therapeutic-goals="[^"]*"/g) || [];
    if (therapeuticGoalsData.length !== imageMatches.length) {
      warnings.push('Some images missing therapeutic goals data attributes');
    }
    
    return {
      suitable: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      keyboardAccessible: keyboardValidation.suitable,
      tabOrderMaintained: tabOrderValidation.suitable,
      statistics: {
        totalImages: imageMatches.length,
        expectedReplacements: replacements.length,
        remainingEmojis: remainingEmojis.length,
        imagesWithoutAlt: imagesWithoutAltMatches.length
      }
    };
  }

  /**
   * Validate component functionality preservation
   * @param {string} originalCode - Original component code
   * @param {string} enhancedCode - Enhanced component code
   * @returns {ValidationResult}
   */
  validateFunctionalityPreservation(originalCode, enhancedCode) {
    const errors = [];
    const warnings = [];
    
    // Validate focus management preservation
    const focusValidation = this.accessibilityValidator.validateFocusManagement(originalCode, enhancedCode);
    errors.push(...focusValidation.errors);
    warnings.push(...focusValidation.warnings);
    
    // Check for preserved event handlers
    const eventHandlerPattern = /on[A-Z][a-zA-Z]*\s*=\s*{[^}]*}/g;
    const originalHandlers = originalCode.match(eventHandlerPattern) || [];
    const enhancedHandlers = enhancedCode.match(eventHandlerPattern) || [];
    
    if (originalHandlers.length !== enhancedHandlers.length) {
      errors.push(`Event handler count mismatch (original: ${originalHandlers.length}, enhanced: ${enhancedHandlers.length})`);
    }
    
    // Check for preserved className attributes
    const classNamePattern = /className\s*=\s*["'][^"']*["']/g;
    const originalClasses = originalCode.match(classNamePattern) || [];
    const enhancedClasses = enhancedCode.match(classNamePattern) || [];
    
    // Allow for additional therapeutic classes
    if (enhancedClasses.length < originalClasses.length) {
      warnings.push('Some className attributes may have been lost during enhancement');
    }
    
    // Check for preserved component structure
    const componentStructurePattern = /<[a-zA-Z][^>]*>/g;
    const originalElements = originalCode.match(componentStructurePattern) || [];
    const enhancedElements = enhancedCode.match(componentStructurePattern) || [];
    
    // Allow for additional img elements
    const originalImgCount = (originalCode.match(/<img[^>]*>/g) || []).length;
    const enhancedImgCount = (enhancedCode.match(/<img[^>]*>/g) || []).length;
    const expectedNewImages = enhancedImgCount - originalImgCount;
    
    if (enhancedElements.length < originalElements.length) {
      errors.push('Component structure may have been compromised during enhancement');
    }
    
    return {
      suitable: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
      focusManagementPreserved: focusValidation.suitable,
      statistics: {
        originalEventHandlers: originalHandlers.length,
        enhancedEventHandlers: enhancedHandlers.length,
        originalElements: originalElements.length,
        enhancedElements: enhancedElements.length,
        newImagesAdded: expectedNewImages
      }
    };
  }

  /**
   * Generate unique validation ID
   * @param {Object} asset - Asset or component being validated
   * @returns {string}
   */
  generateValidationId(asset) {
    const timestamp = Date.now();
    const counter = ++this.validationCounter;
    const assetHash = this.simpleHash(JSON.stringify(asset));
    return `val_${timestamp}_${counter}_${assetHash}`;
  }

  /**
   * Simple hash function for generating IDs
   * @param {string} str - String to hash
   * @returns {string}
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get validation history for audit trail
   * @param {string} validationId - Optional specific validation ID
   * @returns {ValidationResult|ValidationResult[]}
   */
  getValidationHistory(validationId = null) {
    if (validationId) {
      return this.validationHistory.get(validationId) || null;
    }
    
    return Array.from(this.validationHistory.values());
  }

  /**
   * Update therapeutic criteria
   * @param {Object} newCriteria - Updated criteria
   */
  updateTherapeuticCriteria(newCriteria) {
    this.therapeuticCriteria = {
      ...this.therapeuticCriteria,
      ...newCriteria
    };
  }

  /**
   * Clear validation history
   */
  clearValidationHistory() {
    this.validationHistory.clear();
  }

  /**
   * Export validation report
   * @returns {Object}
   */
  exportValidationReport() {
    const history = this.getValidationHistory();
    const totalValidations = history.length;
    const successfulValidations = history.filter(v => v.suitable).length;
    const failedValidations = totalValidations - successfulValidations;
    
    const commonErrors = {};
    const commonWarnings = {};
    
    history.forEach(validation => {
      validation.errors.forEach(error => {
        commonErrors[error] = (commonErrors[error] || 0) + 1;
      });
      validation.warnings.forEach(warning => {
        commonWarnings[warning] = (commonWarnings[warning] || 0) + 1;
      });
    });
    
    return {
      summary: {
        totalValidations,
        successfulValidations,
        failedValidations,
        successRate: totalValidations > 0 ? (successfulValidations / totalValidations * 100).toFixed(2) + '%' : '0%'
      },
      criteria: this.therapeuticCriteria,
      commonErrors: Object.entries(commonErrors).sort(([,a], [,b]) => b - a),
      commonWarnings: Object.entries(commonWarnings).sort(([,a], [,b]) => b - a),
      generatedAt: new Date().toISOString()
    };
  }
}

export default ValidationService;