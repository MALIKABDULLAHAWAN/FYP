/**
 * AccessibilityValidator - Comprehensive accessibility compliance validation
 * Validates alt text, color contrast, screen reader compatibility, and keyboard navigation
 * Requirements: 4.1, 4.2, 4.3
 */

/**
 * @typedef {import('./types.js').ImageAsset} ImageAsset
 * @typedef {import('./types.js').ValidationResult} ValidationResult
 */

class AccessibilityValidator {
  constructor() {
    this.accessibilityCriteria = {
      minimumAltTextLength: 10,
      maximumAltTextLength: 125,
      minimumColorContrast: 4.5, // WCAG AA standard
      minimumColorContrastLarge: 3.0, // WCAG AA for large text
      screenReaderRequired: true,
      keyboardNavigationRequired: true,
      focusIndicatorRequired: true
    };
    
    this.validationLog = [];
  }

  /**
   * Validate alt text for therapeutic appropriateness
   * @param {string} altText - Alt text to validate
   * @param {string} context - Therapeutic context
   * @returns {ValidationResult}
   */
  validateAltText(altText, context = 'general') {
    const errors = [];
    const warnings = [];
    
    // Check minimum length
    if (!altText || altText.trim().length === 0) {
      errors.push('Alt text is required for all therapeutic images');
      return this.createValidationResult(false, errors, warnings);
    }
    
    const trimmedLength = altText.trim().length;
    
    if (trimmedLength < this.accessibilityCriteria.minimumAltTextLength) {
      errors.push(
        `Alt text too short: ${trimmedLength} characters (minimum ${this.accessibilityCriteria.minimumAltTextLength} required)`
      );
    }
    
    // Check maximum length
    if (trimmedLength > this.accessibilityCriteria.maximumAltTextLength) {
      warnings.push(
        `Alt text may be too long: ${trimmedLength} characters (recommended maximum ${this.accessibilityCriteria.maximumAltTextLength})`
      );
    }
    
    // Check for therapeutic appropriateness
    const inappropriateTerms = ['emoji', 'icon', 'image', 'picture'];
    const lowerAltText = altText.toLowerCase();
    
    inappropriateTerms.forEach(term => {
      if (lowerAltText.includes(term)) {
        warnings.push(
          `Alt text contains generic term "${term}" - consider more descriptive therapeutic language`
        );
      }
    });
    
    // Check for therapeutic context alignment
    if (context.includes('medical') || context.includes('therapist')) {
      const medicalTerms = ['therapist', 'clinical', 'professional', 'medical', 'therapeutic'];
      const hasMedicalContext = medicalTerms.some(term => lowerAltText.includes(term));
      
      if (!hasMedicalContext) {
        warnings.push('Alt text may lack appropriate medical/therapeutic context');
      }
    }
    
    // Check for child-friendly language in activity contexts
    if (context.includes('activity') || context.includes('speech')) {
      const hasComplexLanguage = /\b(utilize|implement|facilitate|demonstrate)\b/i.test(altText);
      
      if (hasComplexLanguage) {
        warnings.push('Alt text may contain overly complex language for child-focused context');
      }
    }
    
    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Validate color contrast for therapeutic visibility
   * @param {number} contrastRatio - Color contrast ratio
   * @param {boolean} isLargeText - Whether text is large (18pt+ or 14pt+ bold)
   * @returns {ValidationResult}
   */
  validateColorContrast(contrastRatio, isLargeText = false) {
    const errors = [];
    const warnings = [];
    
    if (typeof contrastRatio !== 'number' || isNaN(contrastRatio)) {
      errors.push('Invalid color contrast ratio provided');
      return this.createValidationResult(false, errors, warnings);
    }
    
    const minimumRequired = isLargeText 
      ? this.accessibilityCriteria.minimumColorContrastLarge 
      : this.accessibilityCriteria.minimumColorContrast;
    
    if (contrastRatio < minimumRequired) {
      errors.push(
        `Insufficient color contrast: ${contrastRatio.toFixed(2)} (minimum ${minimumRequired} required for ${isLargeText ? 'large' : 'normal'} text)`
      );
    }
    
    // Warn if below AAA standard (7:1 for normal, 4.5:1 for large)
    const aaaStandard = isLargeText ? 4.5 : 7.0;
    if (contrastRatio >= minimumRequired && contrastRatio < aaaStandard) {
      warnings.push(
        `Color contrast meets AA standard but below AAA (${aaaStandard}:1) - consider improving for enhanced accessibility`
      );
    }
    
    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Validate screen reader compatibility
   * @param {ImageAsset} asset - Image asset to validate
   * @returns {ValidationResult}
   */
  validateScreenReaderCompatibility(asset) {
    const errors = [];
    const warnings = [];
    
    // Check if screen reader compatibility is explicitly set
    if (!asset.accessibility || typeof asset.accessibility.screenReaderCompatible === 'undefined') {
      errors.push('Screen reader compatibility not specified');
      return this.createValidationResult(false, errors, warnings);
    }
    
    if (!asset.accessibility.screenReaderCompatible) {
      errors.push('Asset is not compatible with screen readers - this is required for therapeutic use');
    }
    
    // Validate alt text exists for screen readers
    const altTextValidation = this.validateAltText(asset.altText, 'screen-reader');
    if (!altTextValidation.suitable) {
      errors.push(...altTextValidation.errors.map(e => `Screen reader issue: ${e}`));
    }
    
    // Check for ARIA attributes if available
    if (asset.ariaLabel && asset.ariaLabel !== asset.altText) {
      warnings.push('ARIA label differs from alt text - ensure consistency for screen reader users');
    }
    
    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Validate complete accessibility compliance for an asset
   * @param {ImageAsset} asset - Image asset to validate
   * @param {string} context - Therapeutic context
   * @returns {ValidationResult}
   */
  validateAccessibilityCompliance(asset, context = 'general') {
    const errors = [];
    const warnings = [];
    const startTime = Date.now();
    
    // Validate alt text
    const altTextValidation = this.validateAltText(asset.altText, context);
    errors.push(...altTextValidation.errors);
    warnings.push(...altTextValidation.warnings);
    
    // Validate color contrast
    if (asset.accessibility && typeof asset.accessibility.colorContrast === 'number') {
      const contrastValidation = this.validateColorContrast(asset.accessibility.colorContrast);
      errors.push(...contrastValidation.errors);
      warnings.push(...contrastValidation.warnings);
    } else {
      errors.push('Color contrast information missing');
    }
    
    // Validate screen reader compatibility
    const screenReaderValidation = this.validateScreenReaderCompatibility(asset);
    errors.push(...screenReaderValidation.errors);
    warnings.push(...screenReaderValidation.warnings);
    
    // Validate focus indicator for keyboard navigation
    if (asset.accessibility && !asset.accessibility.focusIndicator) {
      warnings.push('No focus indicator specified - keyboard navigation may be impaired');
    }
    
    const result = this.createValidationResult(
      errors.length === 0,
      errors,
      warnings,
      {
        processingTime: Date.now() - startTime,
        context,
        assetUrl: asset.url
      }
    );
    
    // Log validation for audit trail
    this.logValidation(result);
    
    return result;
  }

  /**
   * Validate keyboard navigation preservation in component
   * @param {string} componentCode - Component code to validate
   * @returns {ValidationResult}
   */
  validateKeyboardNavigation(componentCode) {
    const errors = [];
    const warnings = [];
    
    // Check for tabIndex attributes
    const tabIndexPattern = /tabIndex\s*=\s*{?["']?(-?\d+)["']?}?/g;
    const tabIndexMatches = [...componentCode.matchAll(tabIndexPattern)];
    
    // Check for negative tabIndex (removes from tab order)
    const negativeTabIndex = tabIndexMatches.filter(match => parseInt(match[1]) < 0);
    if (negativeTabIndex.length > 0) {
      warnings.push(
        `${negativeTabIndex.length} elements have negative tabIndex - may impair keyboard navigation`
      );
    }
    
    // Check for positive tabIndex (disrupts natural tab order)
    const positiveTabIndex = tabIndexMatches.filter(match => parseInt(match[1]) > 0);
    if (positiveTabIndex.length > 0) {
      warnings.push(
        `${positiveTabIndex.length} elements have positive tabIndex - may disrupt natural tab order`
      );
    }
    
    // Check for interactive elements (buttons, links, inputs)
    const interactivePattern = /<(button|a|input|select|textarea)[^>]*>/g;
    const interactiveElements = [...componentCode.matchAll(interactivePattern)];
    
    // Check if interactive elements have keyboard handlers
    const keyboardHandlerPattern = /on(KeyDown|KeyUp|KeyPress)\s*=/g;
    const keyboardHandlers = [...componentCode.matchAll(keyboardHandlerPattern)];
    
    if (interactiveElements.length > 0 && keyboardHandlers.length === 0) {
      warnings.push(
        'Interactive elements found but no keyboard event handlers - ensure keyboard accessibility'
      );
    }
    
    // Check for focus management
    const focusPattern = /\.focus\(\)|ref\s*=\s*{[^}]*focus/g;
    const focusManagement = [...componentCode.matchAll(focusPattern)];
    
    if (interactiveElements.length > 5 && focusManagement.length === 0) {
      warnings.push(
        'Complex component with multiple interactive elements but no explicit focus management'
      );
    }
    
    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Validate focus management preservation
   * @param {string} originalCode - Original component code
   * @param {string} enhancedCode - Enhanced component code
   * @returns {ValidationResult}
   */
  validateFocusManagement(originalCode, enhancedCode) {
    const errors = [];
    const warnings = [];
    
    // Extract focus-related patterns from both versions
    const focusPattern = /\.focus\(\)|autoFocus|ref\s*=\s*{[^}]*focus/g;
    const originalFocus = [...originalCode.matchAll(focusPattern)];
    const enhancedFocus = [...enhancedCode.matchAll(focusPattern)];
    
    if (originalFocus.length > enhancedFocus.length) {
      errors.push(
        `Focus management may have been lost: original had ${originalFocus.length} focus points, enhanced has ${enhancedFocus.length}`
      );
    }
    
    // Check for aria-live regions (important for dynamic content)
    const ariaLivePattern = /aria-live\s*=\s*["'](polite|assertive|off)["']/g;
    const originalAriaLive = [...originalCode.matchAll(ariaLivePattern)];
    const enhancedAriaLive = [...enhancedCode.matchAll(ariaLivePattern)];
    
    if (originalAriaLive.length > enhancedAriaLive.length) {
      warnings.push('Some ARIA live regions may have been lost during enhancement');
    }
    
    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Validate tab order maintenance
   * @param {string} componentCode - Component code to validate
   * @returns {ValidationResult}
   */
  validateTabOrder(componentCode) {
    const errors = [];
    const warnings = [];
    
    // Extract all tabIndex values in order
    const tabIndexPattern = /tabIndex\s*=\s*{?["']?(-?\d+)["']?}?/g;
    const tabIndexMatches = [...componentCode.matchAll(tabIndexPattern)];
    const tabIndexValues = tabIndexMatches.map(match => parseInt(match[1]));
    
    // Check for tab order disruption (positive tabIndex values)
    const positiveIndices = tabIndexValues.filter(val => val > 0);
    if (positiveIndices.length > 0) {
      warnings.push(
        `Tab order may be disrupted by ${positiveIndices.length} positive tabIndex values: ${positiveIndices.join(', ')}`
      );
      
      // Check if they're sequential
      const sortedPositive = [...positiveIndices].sort((a, b) => a - b);
      const hasGaps = sortedPositive.some((val, idx) => {
        if (idx === 0) return false;
        return val !== sortedPositive[idx - 1] + 1;
      });
      
      if (hasGaps) {
        warnings.push('Tab order has gaps - may cause confusing navigation experience');
      }
    }
    
    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Create standardized validation result
   * @param {boolean} suitable - Whether validation passed
   * @param {string[]} errors - Validation errors
   * @param {string[]} warnings - Validation warnings
   * @param {Object} metadata - Additional metadata
   * @returns {ValidationResult}
   */
  createValidationResult(suitable, errors, warnings, metadata = {}) {
    return {
      suitable,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
      ...metadata
    };
  }

  /**
   * Log validation for audit trail
   * @param {ValidationResult} result - Validation result to log
   */
  logValidation(result) {
    this.validationLog.push({
      ...result,
      loggedAt: new Date().toISOString()
    });
  }

  /**
   * Get validation log for compliance review
   * @param {Object} filters - Optional filters (suitable, context, dateRange)
   * @returns {ValidationResult[]}
   */
  getValidationLog(filters = {}) {
    let log = [...this.validationLog];
    
    if (typeof filters.suitable === 'boolean') {
      log = log.filter(entry => entry.suitable === filters.suitable);
    }
    
    if (filters.context) {
      log = log.filter(entry => entry.context === filters.context);
    }
    
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      log = log.filter(entry => {
        const entryDate = new Date(entry.validatedAt);
        return entryDate >= new Date(start) && entryDate <= new Date(end);
      });
    }
    
    return log;
  }

  /**
   * Clear validation log
   */
  clearValidationLog() {
    this.validationLog = [];
  }

  /**
   * Export accessibility compliance report
   * @returns {Object}
   */
  exportComplianceReport() {
    const totalValidations = this.validationLog.length;
    const passedValidations = this.validationLog.filter(v => v.suitable).length;
    const failedValidations = totalValidations - passedValidations;
    
    const errorFrequency = {};
    const warningFrequency = {};
    
    this.validationLog.forEach(validation => {
      validation.errors.forEach(error => {
        errorFrequency[error] = (errorFrequency[error] || 0) + 1;
      });
      validation.warnings.forEach(warning => {
        warningFrequency[warning] = (warningFrequency[warning] || 0) + 1;
      });
    });
    
    return {
      summary: {
        totalValidations,
        passedValidations,
        failedValidations,
        complianceRate: totalValidations > 0 
          ? ((passedValidations / totalValidations) * 100).toFixed(2) + '%' 
          : '0%'
      },
      criteria: this.accessibilityCriteria,
      topErrors: Object.entries(errorFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      topWarnings: Object.entries(warningFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      generatedAt: new Date().toISOString()
    };
  }
}

export default AccessibilityValidator;
