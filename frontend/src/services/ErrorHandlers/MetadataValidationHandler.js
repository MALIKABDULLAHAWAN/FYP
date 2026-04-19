/**
 * MetadataValidationHandler - Handles metadata validation errors with user-friendly messages
 * 
 * Provides comprehensive validation error handling for:
 * - Game metadata validation failures
 * - Field-specific validation errors
 * - Child-friendly error messages
 * - Validation suggestions and corrections
 * 
 * Requirements: 5.4, 7.2
 */

class MetadataValidationHandler {
  constructor() {
    this.validationLog = [];
    this.fieldValidators = this.initializeFieldValidators();
    this.childFriendlyMessages = this.initializeChildFriendlyMessages();
  }

  /**
   * Initialize field-specific validators
   */
  initializeFieldValidators() {
    return {
      title: {
        required: true,
        minLength: 1,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
        message: 'Title must contain only letters, numbers, and basic punctuation'
      },
      description: {
        required: true,
        minLength: 10,
        maxLength: 500,
        message: 'Description should be between 10 and 500 characters'
      },
      therapeutic_goals: {
        required: true,
        minItems: 1,
        maxItems: 5,
        validValues: [
          'speech-articulation',
          'language-development',
          'social-awareness',
          'emotional-regulation',
          'fine-motor-skills',
          'gross-motor-skills',
          'cognitive-development',
          'problem-solving',
          'memory-enhancement',
          'attention-building'
        ],
        message: 'Please select 1-5 therapeutic goals from the available options'
      },
      difficulty_level: {
        required: true,
        validValues: ['Easy', 'Medium', 'Hard'],
        message: 'Difficulty must be Easy, Medium, or Hard'
      },
      age_range: {
        required: true,
        minAge: 3,
        maxAge: 12,
        message: 'Age range must be between 3 and 12 years'
      },
      image_url: {
        required: true,
        pattern: /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i,
        message: 'Image URL must be a valid web address ending in .jpg, .png, or .webp'
      },
      evidence_base: {
        required: true,
        minItems: 1,
        message: 'At least one research reference is required'
      }
    };
  }

  /**
   * Initialize child-friendly error messages
   */
  initializeChildFriendlyMessages() {
    return {
      title: {
        required: 'Please add a game title',
        tooShort: 'Game title is too short',
        tooLong: 'Game title is too long (maximum 100 characters)',
        invalidChars: 'Game title contains invalid characters'
      },
      description: {
        required: 'Please add a game description',
        tooShort: 'Description needs to be longer (at least 10 characters)',
        tooLong: 'Description is too long (maximum 500 characters)'
      },
      therapeutic_goals: {
        required: 'Please choose at least one therapeutic goal',
        tooMany: 'Please choose no more than 5 therapeutic goals',
        invalid: 'Please select goals from the available options'
      },
      difficulty_level: {
        required: 'Please select a difficulty level',
        invalid: 'Difficulty must be Easy, Medium, or Hard'
      },
      age_range: {
        required: 'Please specify the age range',
        minTooLow: 'Minimum age must be at least 3 years',
        maxTooHigh: 'Maximum age cannot exceed 12 years',
        invalidRange: 'Minimum age cannot be greater than maximum age'
      },
      image_url: {
        required: 'Please provide an image for this game',
        invalid: 'Image must be a valid web address (URL)',
        wrongFormat: 'Image must be in JPG, PNG, or WebP format'
      },
      image_attribution: {
        photographer: 'Please provide the photographer\'s name',
        license: 'Please specify the image license',
        source: 'Please provide the image source'
      },
      evidence_base: {
        required: 'Please add at least one research reference',
        invalidCitation: 'Citation format is not valid',
        missingYear: 'Publication year is required',
        invalidRating: 'Effectiveness rating must be between 0 and 1'
      }
    };
  }

  /**
   * Handle metadata validation failure with detailed error analysis
   * 
   * @param {Object} metadata - The metadata object that failed validation
   * @param {Object} validationResult - Result from validation service
   * @param {string} context - Context of validation (create, update, etc.)
   * @returns {Object} Processed validation error with suggestions
   */
  handleValidationFailure(metadata, validationResult, context = 'validation') {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();

    // Log the validation failure
    this.logValidationError({
      errorId,
      metadata,
      validationResult,
      context,
      timestamp,
      severity: 'medium'
    });

    // Process each validation error
    const processedErrors = this.processValidationErrors(validationResult.errors || []);
    const suggestions = this.generateSuggestions(metadata, processedErrors);
    const userFriendlyMessages = this.generateUserFriendlyMessages(processedErrors);

    return {
      success: false,
      errorId,
      context,
      errors: processedErrors,
      suggestions,
      userFriendlyMessages,
      canRetry: true,
      retryRecommendations: this.generateRetryRecommendations(processedErrors),
      timestamp
    };
  }

  /**
   * Process validation errors to provide detailed information
   */
  processValidationErrors(errors) {
    return errors.map(error => {
      const field = this.extractFieldFromError(error);
      const errorType = this.determineErrorType(error, field);
      
      return {
        field,
        errorType,
        originalMessage: error,
        severity: this.determineSeverity(field, errorType),
        fixable: this.isFixable(field, errorType),
        priority: this.determinePriority(field)
      };
    });
  }

  /**
   * Extract field name from error message
   */
  extractFieldFromError(error) {
    const fieldPatterns = {
      title: /title/i,
      description: /description/i,
      therapeutic_goals: /therapeutic.?goals?|goals/i,
      difficulty_level: /difficulty/i,
      age_range: /age.?range|age/i,
      image_url: /image.?url|image/i,
      image_attribution: /attribution|photographer|license|source/i,
      evidence_base: /evidence|citation|reference/i
    };

    for (const [field, pattern] of Object.entries(fieldPatterns)) {
      if (pattern.test(error)) {
        return field;
      }
    }

    return 'unknown';
  }

  /**
   * Determine the type of validation error
   */
  determineErrorType(error, field) {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('required') || errorLower.includes('missing')) {
      return 'required';
    }
    if (errorLower.includes('too short') || errorLower.includes('minimum')) {
      return 'tooShort';
    }
    if (errorLower.includes('too long') || errorLower.includes('maximum')) {
      return 'tooLong';
    }
    if (errorLower.includes('invalid') || errorLower.includes('format')) {
      return 'invalid';
    }
    if (errorLower.includes('range') || errorLower.includes('between')) {
      return 'range';
    }
    
    return 'general';
  }

  /**
   * Determine error severity
   */
  determineSeverity(field, errorType) {
    const criticalFields = ['title', 'description', 'therapeutic_goals', 'age_range'];
    const criticalErrors = ['required'];
    
    if (criticalFields.includes(field) && criticalErrors.includes(errorType)) {
      return 'critical';
    }
    if (criticalFields.includes(field)) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Check if error is fixable by user
   */
  isFixable(field, errorType) {
    const unfixableErrors = ['system', 'database', 'network'];
    return !unfixableErrors.includes(errorType);
  }

  /**
   * Determine error priority for fixing order
   */
  determinePriority(field) {
    const priorities = {
      title: 1,
      description: 2,
      therapeutic_goals: 3,
      difficulty_level: 4,
      age_range: 5,
      image_url: 6,
      image_attribution: 7,
      evidence_base: 8
    };
    
    return priorities[field] || 9;
  }

  /**
   * Generate suggestions for fixing validation errors
   */
  generateSuggestions(metadata, processedErrors) {
    const suggestions = [];

    processedErrors.forEach(error => {
      const suggestion = this.generateFieldSuggestion(error.field, error.errorType, metadata);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    return suggestions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate field-specific suggestion
   */
  generateFieldSuggestion(field, errorType, metadata) {
    const suggestions = {
      title: {
        required: 'Add a descriptive title for your game (e.g., "Memory Matching Game")',
        tooShort: 'Make the title more descriptive',
        tooLong: 'Shorten the title to under 100 characters',
        invalid: 'Remove special characters from the title'
      },
      description: {
        required: 'Add a description explaining what the game does and its benefits',
        tooShort: 'Expand the description to at least 10 characters',
        tooLong: 'Shorten the description to under 500 characters'
      },
      therapeutic_goals: {
        required: 'Select at least one therapeutic goal from the dropdown',
        tooMany: 'Select no more than 5 therapeutic goals',
        invalid: 'Choose goals from the provided list only'
      },
      difficulty_level: {
        required: 'Select Easy, Medium, or Hard difficulty',
        invalid: 'Choose from: Easy, Medium, or Hard'
      },
      age_range: {
        required: 'Specify the minimum and maximum age (3-12 years)',
        range: 'Ensure minimum age ≤ maximum age, both between 3-12'
      },
      image_url: {
        required: 'Upload or provide a URL for the game image',
        invalid: 'Ensure the URL starts with http:// or https://',
        wrongFormat: 'Use JPG, PNG, or WebP image format'
      },
      evidence_base: {
        required: 'Add at least one research reference supporting this game',
        invalid: 'Check the citation format and publication year'
      }
    };

    const fieldSuggestions = suggestions[field];
    if (!fieldSuggestions) return null;

    const suggestion = fieldSuggestions[errorType] || fieldSuggestions.general;
    if (!suggestion) return null;

    return {
      field,
      errorType,
      suggestion,
      priority: this.determinePriority(field),
      actionable: true
    };
  }

  /**
   * Generate user-friendly error messages
   */
  generateUserFriendlyMessages(processedErrors) {
    return processedErrors.map(error => {
      const messages = this.childFriendlyMessages[error.field];
      if (!messages) {
        return {
          field: error.field,
          message: 'Please check this field and try again',
          severity: error.severity
        };
      }

      const message = messages[error.errorType] || messages.general || 'Please check this field';
      
      return {
        field: error.field,
        message,
        severity: error.severity,
        fixable: error.fixable
      };
    });
  }

  /**
   * Generate retry recommendations
   */
  generateRetryRecommendations(processedErrors) {
    const recommendations = [];
    
    // Group errors by priority
    const criticalErrors = processedErrors.filter(e => e.severity === 'critical');
    const highErrors = processedErrors.filter(e => e.severity === 'high');
    const mediumErrors = processedErrors.filter(e => e.severity === 'medium');

    if (criticalErrors.length > 0) {
      recommendations.push({
        priority: 'critical',
        message: 'Fix required fields first',
        fields: criticalErrors.map(e => e.field),
        order: 1
      });
    }

    if (highErrors.length > 0) {
      recommendations.push({
        priority: 'high',
        message: 'Complete important information',
        fields: highErrors.map(e => e.field),
        order: 2
      });
    }

    if (mediumErrors.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: 'Review and correct remaining fields',
        fields: mediumErrors.map(e => e.field),
        order: 3
      });
    }

    return recommendations;
  }

  /**
   * Validate specific field and provide immediate feedback
   */
  validateField(fieldName, value, metadata = {}) {
    const validator = this.fieldValidators[fieldName];
    if (!validator) {
      return { valid: true, message: null };
    }

    const errors = [];

    // Required check
    if (validator.required && (!value || (Array.isArray(value) && value.length === 0))) {
      errors.push(this.childFriendlyMessages[fieldName]?.required || 'This field is required');
    }

    // Length checks
    if (value && typeof value === 'string') {
      if (validator.minLength && value.length < validator.minLength) {
        errors.push(this.childFriendlyMessages[fieldName]?.tooShort || 'Value is too short');
      }
      if (validator.maxLength && value.length > validator.maxLength) {
        errors.push(this.childFriendlyMessages[fieldName]?.tooLong || 'Value is too long');
      }
    }

    // Array checks
    if (Array.isArray(value)) {
      if (validator.minItems && value.length < validator.minItems) {
        errors.push(this.childFriendlyMessages[fieldName]?.required || 'Not enough items selected');
      }
      if (validator.maxItems && value.length > validator.maxItems) {
        errors.push(this.childFriendlyMessages[fieldName]?.tooMany || 'Too many items selected');
      }
    }

    // Pattern checks
    if (value && validator.pattern && !validator.pattern.test(value)) {
      errors.push(this.childFriendlyMessages[fieldName]?.invalid || 'Invalid format');
    }

    // Valid values check
    if (value && validator.validValues) {
      if (Array.isArray(value)) {
        const invalidValues = value.filter(v => !validator.validValues.includes(v));
        if (invalidValues.length > 0) {
          errors.push(this.childFriendlyMessages[fieldName]?.invalid || 'Invalid selection');
        }
      } else if (!validator.validValues.includes(value)) {
        errors.push(this.childFriendlyMessages[fieldName]?.invalid || 'Invalid value');
      }
    }

    // Special validation for age_range
    if (fieldName === 'age_range' && value && typeof value === 'object') {
      if (value.min_age < validator.minAge) {
        errors.push(this.childFriendlyMessages.age_range.minTooLow);
      }
      if (value.max_age > validator.maxAge) {
        errors.push(this.childFriendlyMessages.age_range.maxTooHigh);
      }
      if (value.min_age > value.max_age) {
        errors.push(this.childFriendlyMessages.age_range.invalidRange);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestions: errors.length > 0 ? this.generateFieldSuggestion(fieldName, 'general', metadata) : null
    };
  }

  /**
   * Generate error ID
   */
  generateErrorId() {
    return `meta_val_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Log validation error
   */
  logValidationError(errorData) {
    this.validationLog.push({
      ...errorData,
      id: this.generateErrorId()
    });

    // Keep log size manageable
    if (this.validationLog.length > 500) {
      this.validationLog = this.validationLog.slice(-250);
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStatistics() {
    const stats = {
      totalValidations: this.validationLog.length,
      byField: {},
      byErrorType: {},
      bySeverity: {}
    };

    this.validationLog.forEach(entry => {
      if (entry.validationResult?.errors) {
        entry.validationResult.errors.forEach(error => {
          const field = this.extractFieldFromError(error);
          const errorType = this.determineErrorType(error, field);
          const severity = this.determineSeverity(field, errorType);

          stats.byField[field] = (stats.byField[field] || 0) + 1;
          stats.byErrorType[errorType] = (stats.byErrorType[errorType] || 0) + 1;
          stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
        });
      }
    });

    return stats;
  }

  /**
   * Clear validation log
   */
  clearLog() {
    this.validationLog = [];
  }

  /**
   * Get recent validation errors
   */
  getRecentErrors(minutes = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.validationLog.filter(entry => 
      new Date(entry.timestamp) > cutoff
    );
  }
}

// Export singleton instance
export default new MetadataValidationHandler();