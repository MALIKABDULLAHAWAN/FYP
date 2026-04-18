/**
 * AgeValidationErrorHandler - Handles age appropriateness validation errors
 * 
 * Provides comprehensive error handling for:
 * - Age appropriateness validation failures
 * - Child-friendly error messages for age restrictions
 * - Alternative game suggestions
 * - Therapist override handling
 * 
 * Requirements: 7.2
 */

class AgeValidationErrorHandler {
  constructor() {
    this.validationLog = [];
    this.overrideRequests = [];
    this.alternativeSuggestions = new Map();
  }

  /**
   * Handle age appropriateness validation failure
   * 
   * @param {number} childAge - Child's age
   * @param {Object} game - Game object that failed validation
   * @param {Object} validationResult - Result from age validation
   * @param {string} context - Context of validation attempt
   * @returns {Object} Error handling result with alternatives
   */
  handleAgeValidationFailure(childAge, game, validationResult, context = 'game-selection') {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();

    // Log the validation failure
    this.logValidationError({
      errorId,
      childAge,
      gameId: game.game_id,
      gameName: game.title,
      gameAgeRange: game.age_range,
      validationResult,
      context,
      timestamp,
      severity: this.determineSeverity(validationResult)
    });

    // Generate child-friendly error message
    const userMessage = this.generateChildFriendlyMessage(childAge, game, validationResult);

    // Get alternative game suggestions
    const alternatives = this.getAgeAppropriateAlternatives(childAge, game);

    // Determine if therapist override is available
    const overrideOptions = this.getTherapistOverrideOptions(childAge, game, validationResult);

    return {
      success: false,
      errorId,
      blocked: true,
      reason: validationResult.reason,
      userMessage,
      childFriendlyExplanation: this.generateChildExplanation(childAge, game),
      alternatives: {
        available: alternatives.length > 0,
        games: alternatives,
        message: this.generateAlternativesMessage(alternatives.length)
      },
      therapistOverride: overrideOptions,
      canRetry: false, // Age validation failures cannot be retried without override
      timestamp
    };
  }

  /**
   * Generate child-friendly error message
   */
  generateChildFriendlyMessage(childAge, game, validationResult) {
    const ageRange = game.age_range;
    
    if (childAge < ageRange.min_age) {
      // Child is too young
      const yearsToWait = ageRange.min_age - childAge;
      if (yearsToWait === 1) {
        return `This game is for children who are ${ageRange.min_age} years old or older. You can play this game when you turn ${ageRange.min_age}!`;
      } else {
        return `This game is for children who are ${ageRange.min_age} years old or older. You can play this game in ${yearsToWait} years!`;
      }
    } else if (childAge > ageRange.max_age) {
      // Child is too old
      return `This game is designed for younger children (ages ${ageRange.min_age}-${ageRange.max_age}). Let's find a more challenging game for you!`;
    } else {
      // Other validation issue (developmental stage, etc.)
      return `This game might not be the best fit right now. Let's find a better game for you!`;
    }
  }

  /**
   * Generate child-friendly explanation
   */
  generateChildExplanation(childAge, game) {
    const ageRange = game.age_range;
    
    if (childAge < ageRange.min_age) {
      return {
        icon: '🎂',
        title: 'This game is for older children',
        message: `Games are made for different ages to make sure they're fun and not too hard or too easy. This game "${game.title}" is perfect for children who are ${ageRange.min_age} years old or older.`,
        encouragement: 'Don\'t worry! We have lots of great games that are perfect for you right now!'
      };
    } else if (childAge > ageRange.max_age) {
      return {
        icon: '🌟',
        title: 'You\'re ready for more challenging games!',
        message: `You've grown so much! This game "${game.title}" is designed for younger children (ages ${ageRange.min_age}-${ageRange.max_age}). You're ready for more exciting challenges!`,
        encouragement: 'Let\'s find some games that will be more fun and challenging for you!'
      };
    } else {
      return {
        icon: '🎯',
        title: 'Let\'s find the perfect game for you',
        message: `We want to make sure you have the most fun possible! This game might not be the best match right now.`,
        encouragement: 'We have other games that will be perfect for you!'
      };
    }
  }

  /**
   * Get age-appropriate alternative games
   */
  getAgeAppropriateAlternatives(childAge, originalGame) {
    const originalGoals = Array.isArray(originalGame.therapeutic_goals)
      ? originalGame.therapeutic_goals
      : [];

    // This would typically call GameMetadataService.getAgeAppropriateAlternatives
    // For now, we'll return a mock structure
    const cacheKey = `${childAge}-${originalGame.game_id}`;
    
    if (this.alternativeSuggestions.has(cacheKey)) {
      return this.alternativeSuggestions.get(cacheKey);
    }

    // Mock alternatives - in real implementation, this would query the game database
    const alternatives = [
      {
        game_id: 'alt-1',
        title: 'Age-Appropriate Memory Game',
        description: 'A fun memory game perfect for your age!',
        age_range: { min_age: Math.max(3, childAge - 1), max_age: Math.min(12, childAge + 1) },
        difficulty_level: this.recommendDifficulty(childAge),
        therapeutic_goals: originalGoals.slice(0, 2), // Share some goals
        similarity_score: 0.8,
        reason_suggested: 'Similar therapeutic goals, age-appropriate'
      },
      {
        game_id: 'alt-2',
        title: 'Perfect Challenge Game',
        description: 'Just the right level of challenge for you!',
        age_range: { min_age: childAge, max_age: childAge + 2 },
        difficulty_level: this.recommendDifficulty(childAge),
        therapeutic_goals: originalGoals,
        similarity_score: 0.9,
        reason_suggested: 'Exact age match, same therapeutic goals'
      }
    ];

    // Cache the alternatives
    this.alternativeSuggestions.set(cacheKey, alternatives);
    
    return alternatives;
  }

  /**
   * Recommend difficulty based on age
   */
  recommendDifficulty(age) {
    if (age <= 5) return 'Easy';
    if (age <= 8) return 'Medium';
    return 'Hard';
  }

  /**
   * Generate message about alternatives
   */
  generateAlternativesMessage(count) {
    if (count === 0) {
      return 'We\'re looking for perfect games for you! Please check back soon.';
    } else if (count === 1) {
      return 'We found a great game that\'s perfect for you!';
    } else {
      return `We found ${count} great games that are perfect for you!`;
    }
  }

  /**
   * Get therapist override options
   */
  getTherapistOverrideOptions(childAge, game, validationResult) {
    const ageRange = game.age_range;
    const ageDifference = Math.abs(childAge - ((ageRange.min_age + ageRange.max_age) / 2));
    
    // Only allow override if age difference is not too extreme
    const allowOverride = ageDifference <= 2;
    
    if (!allowOverride) {
      return {
        available: false,
        reason: 'Age difference too significant for safe override',
        message: 'This game is not suitable for override due to significant age difference'
      };
    }

    return {
      available: true,
      requiresConfirmation: true,
      warningLevel: ageDifference > 1 ? 'high' : 'medium',
      confirmationMessage: this.generateOverrideConfirmationMessage(childAge, game, ageDifference),
      requiredFields: [
        'therapist_id',
        'override_reason',
        'clinical_justification',
        'parent_consent'
      ],
      riskAssessment: this.generateRiskAssessment(childAge, game, ageDifference)
    };
  }

  /**
   * Generate override confirmation message
   */
  generateOverrideConfirmationMessage(childAge, game, ageDifference) {
    const ageRange = game.age_range;
    
    return {
      title: 'Therapist Override Required',
      message: `This game is designed for ages ${ageRange.min_age}-${ageRange.max_age}, but the child is ${childAge} years old. Are you sure you want to proceed?`,
      warnings: [
        ageDifference > 1 ? 'Significant age difference detected' : 'Minor age difference',
        'Game may be too easy or too difficult',
        'Therapeutic effectiveness may be reduced',
        'Child engagement may be lower than optimal'
      ],
      requirements: [
        'Clinical justification required',
        'Parent/guardian consent recommended',
        'Session monitoring recommended',
        'Alternative games should be considered first'
      ]
    };
  }

  /**
   * Generate risk assessment for override
   */
  generateRiskAssessment(childAge, game, ageDifference) {
    const risks = [];
    const mitigations = [];
    
    if (ageDifference > 1) {
      risks.push('High risk of inappropriate difficulty level');
      mitigations.push('Monitor child closely for frustration or boredom');
    }
    
    if (childAge < game.age_range.min_age) {
      risks.push('Game may be too advanced cognitively');
      risks.push('Child may experience frustration');
      mitigations.push('Provide additional support and guidance');
      mitigations.push('Be ready to switch to age-appropriate alternative');
    } else if (childAge > game.age_range.max_age) {
      risks.push('Game may be too simple');
      risks.push('Child may lose interest quickly');
      mitigations.push('Consider increasing difficulty if possible');
      mitigations.push('Use as warm-up before more challenging activities');
    }

    return {
      riskLevel: ageDifference > 1 ? 'high' : 'medium',
      risks,
      mitigations,
      recommendedDuration: ageDifference > 1 ? 'shortened' : 'normal',
      monitoringRequired: true
    };
  }

  /**
   * Handle therapist override request
   */
  handleTherapistOverrideRequest(overrideData) {
    const overrideId = this.generateOverrideId();
    const timestamp = new Date().toISOString();

    // Validate override data
    const validation = this.validateOverrideRequest(overrideData);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        message: 'Override request validation failed'
      };
    }

    // Log the override request
    const overrideRequest = {
      overrideId,
      ...overrideData,
      timestamp,
      status: 'pending',
      requiresApproval: overrideData.riskLevel === 'high'
    };

    this.overrideRequests.push(overrideRequest);

    // Log for audit trail
    this.logValidationError({
      errorId: this.generateErrorId(),
      type: 'therapist-override-request',
      overrideId,
      childAge: overrideData.childAge,
      gameId: overrideData.gameId,
      therapistId: overrideData.therapistId,
      reason: overrideData.override_reason,
      timestamp,
      severity: 'high'
    });

    return {
      success: true,
      overrideId,
      status: overrideRequest.status,
      requiresApproval: overrideRequest.requiresApproval,
      message: overrideRequest.requiresApproval 
        ? 'Override request submitted for approval'
        : 'Override approved - game access granted',
      estimatedApprovalTime: overrideRequest.requiresApproval ? '5-10 minutes' : 'immediate'
    };
  }

  /**
   * Validate override request
   */
  validateOverrideRequest(overrideData) {
    const errors = [];
    const required = ['therapistId', 'childAge', 'gameId', 'override_reason', 'clinical_justification'];

    required.forEach(field => {
      if (!overrideData[field]) {
        errors.push(`${field} is required for override request`);
      }
    });

    if (overrideData.override_reason && overrideData.override_reason.length < 10) {
      errors.push('Override reason must be at least 10 characters');
    }

    if (overrideData.clinical_justification && overrideData.clinical_justification.length < 20) {
      errors.push('Clinical justification must be at least 20 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Determine error severity
   */
  determineSeverity(validationResult) {
    if (!validationResult.isAppropriate) {
      if (validationResult.reason.includes('too young') || validationResult.reason.includes('too old')) {
        return 'high';
      }
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate error ID
   */
  generateErrorId() {
    return `age_val_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Generate override ID
   */
  generateOverrideId() {
    return `override_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * Log validation error
   */
  logValidationError(errorData) {
    this.validationLog.push({
      ...errorData,
      id: errorData.errorId || this.generateErrorId()
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
      failedValidations: 0,
      overrideRequests: this.overrideRequests.length,
      byAgeGroup: {
        '3-5': 0,
        '6-8': 0,
        '9-12': 0
      },
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0
      }
    };

    this.validationLog.forEach(entry => {
      if (entry.validationResult && !entry.validationResult.isAppropriate) {
        stats.failedValidations++;
      }

      if (entry.childAge) {
        if (entry.childAge <= 5) stats.byAgeGroup['3-5']++;
        else if (entry.childAge <= 8) stats.byAgeGroup['6-8']++;
        else stats.byAgeGroup['9-12']++;
      }

      if (entry.severity) {
        stats.bySeverity[entry.severity]++;
      }
    });

    return stats;
  }

  /**
   * Clear logs and cache
   */
  clearLogs() {
    this.validationLog = [];
    this.overrideRequests = [];
    this.alternativeSuggestions.clear();
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

  /**
   * Get pending override requests
   */
  getPendingOverrideRequests() {
    return this.overrideRequests.filter(request => request.status === 'pending');
  }
}

// Export singleton instance
export default new AgeValidationErrorHandler();