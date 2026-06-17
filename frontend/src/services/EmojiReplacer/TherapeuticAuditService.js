/**
 * TherapeuticAuditService - Comprehensive therapeutic validation and audit trail system
 * Implements validation framework, audit logging, and clinical compliance review
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

/**
 * @typedef {import('./types.js').ImageAsset} ImageAsset
 * @typedef {import('./types.js').ValidationResult} ValidationResult
 */

class TherapeuticAuditService {
  constructor() {
    this.therapeuticSuitabilityCriteria = {
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
      therapeuticAppropriate: {
        clinicallyValidated: true,
        evidenceBased: true,
        professionalStandards: true
      },
      contentSafety: {
        childSafe: true,
        noDistressingContent: true,
        positiveReinforcement: true
      },
      visualClarity: {
        minimumResolution: 72, // DPI
        clearSubject: true,
        minimalDistraction: true
      }
    };
    
    this.validationAuditTrail = [];
    this.criteriaUpdateHistory = [];
    this.alternativeAssetSelections = [];
  }

  /**
   * Validate therapeutic suitability using comprehensive criteria
   * @param {ImageAsset} asset - Asset to validate
   * @param {string} context - Therapeutic context
   * @returns {ValidationResult}
   */
  validateTherapeuticSuitability(asset, context = 'general') {
    const startTime = Date.now();
    const errors = [];
    const warnings = [];
    const suitabilityFactors = {};
    
    // Age appropriateness validation
    const ageValidation = this.validateAgeAppropriateness(asset);
    suitabilityFactors.ageAppropriate = ageValidation.suitable;
    if (!ageValidation.suitable) {
      errors.push(...ageValidation.errors);
    }
    warnings.push(...ageValidation.warnings);
    
    // Cultural sensitivity validation
    const culturalValidation = this.validateCulturalSensitivity(asset);
    suitabilityFactors.culturallySensitive = culturalValidation.suitable;
    if (!culturalValidation.suitable) {
      errors.push(...culturalValidation.errors);
    }
    warnings.push(...culturalValidation.warnings);
    
    // Therapeutic appropriateness validation
    const therapeuticValidation = this.validateTherapeuticAppropriateness(asset, context);
    suitabilityFactors.therapeuticallyAppropriate = therapeuticValidation.suitable;
    if (!therapeuticValidation.suitable) {
      errors.push(...therapeuticValidation.errors);
    }
    warnings.push(...therapeuticValidation.warnings);
    
    // Content safety validation
    const safetyValidation = this.validateContentSafety(asset);
    suitabilityFactors.contentSafe = safetyValidation.suitable;
    if (!safetyValidation.suitable) {
      errors.push(...safetyValidation.errors);
    }
    warnings.push(...safetyValidation.warnings);
    
    // Visual clarity validation
    const clarityValidation = this.validateVisualClarity(asset);
    suitabilityFactors.visuallyAppropriate = clarityValidation.suitable;
    if (!clarityValidation.suitable) {
      warnings.push(...clarityValidation.errors); // Clarity issues are warnings, not blockers
    }
    warnings.push(...clarityValidation.warnings);
    
    const result = {
      suitable: errors.length === 0,
      errors,
      warnings,
      suitabilityFactors,
      validatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      context,
      assetUrl: asset.url,
      criteria: this.therapeuticSuitabilityCriteria
    };
    
    // Log validation event for audit trail
    this.logValidationEvent(asset, result, context);
    
    return result;
  }

  /**
   * Validate age appropriateness for target ASD population
   * @param {ImageAsset} asset - Asset to validate
   * @returns {ValidationResult}
   */
  validateAgeAppropriateness(asset) {
    const errors = [];
    const warnings = [];
    
    if (!asset.therapeuticContext || typeof asset.therapeuticContext.ageAppropriate === 'undefined') {
      errors.push('Age appropriateness not specified for asset');
      return { suitable: false, errors, warnings };
    }
    
    if (!asset.therapeuticContext.ageAppropriate) {
      errors.push(`Asset not age-appropriate for target population (ages ${this.therapeuticSuitabilityCriteria.ageRange.minimum}-${this.therapeuticSuitabilityCriteria.ageRange.maximum})`);
    }
    
    // Check for age-specific metadata if available
    if (asset.therapeuticContext.targetAgeRange) {
      const { min, max } = asset.therapeuticContext.targetAgeRange;
      const criteriaMin = this.therapeuticSuitabilityCriteria.ageRange.minimum;
      const criteriaMax = this.therapeuticSuitabilityCriteria.ageRange.maximum;
      
      if (max < criteriaMin || min > criteriaMax) {
        errors.push(`Asset age range (${min}-${max}) does not overlap with target range (${criteriaMin}-${criteriaMax})`);
      } else if (min > criteriaMin || max < criteriaMax) {
        warnings.push(`Asset age range (${min}-${max}) only partially covers target range (${criteriaMin}-${criteriaMax})`);
      }
    }
    
    return {
      suitable: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate cultural sensitivity and inclusivity
   * @param {ImageAsset} asset - Asset to validate
   * @returns {ValidationResult}
   */
  validateCulturalSensitivity(asset) {
    const errors = [];
    const warnings = [];
    
    if (!asset.therapeuticContext || typeof asset.therapeuticContext.culturallySensitive === 'undefined') {
      errors.push('Cultural sensitivity not specified for asset');
      return { suitable: false, errors, warnings };
    }
    
    if (!asset.therapeuticContext.culturallySensitive) {
      errors.push('Asset does not meet cultural sensitivity requirements');
    }
    
    // Check for diversity representation if metadata available
    if (asset.therapeuticContext.diversityRepresentation === false) {
      warnings.push('Asset may lack diversity representation - consider alternatives for inclusive therapy');
    }
    
    // Check for culturally neutral content
    if (asset.therapeuticContext.culturallySpecific === true) {
      warnings.push('Asset contains culturally specific content - ensure appropriateness for diverse patient population');
    }
    
    return {
      suitable: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate therapeutic appropriateness for clinical context
   * @param {ImageAsset} asset - Asset to validate
   * @param {string} context - Therapeutic context
   * @returns {ValidationResult}
   */
  validateTherapeuticAppropriateness(asset, context) {
    const errors = [];
    const warnings = [];
    
    // Check for therapeutic goals
    if (!asset.therapeuticContext.therapeuticGoals || asset.therapeuticContext.therapeuticGoals.length === 0) {
      errors.push('No therapeutic goals specified for asset');
    }
    
    // Validate evidence-based usage
    if (this.therapeuticSuitabilityCriteria.therapeuticAppropriate.evidenceBased) {
      if (!asset.therapeuticContext.evidenceBased) {
        warnings.push('Asset usage not explicitly marked as evidence-based');
      }
    }
    
    // Check for clinical validation
    if (this.therapeuticSuitabilityCriteria.therapeuticAppropriate.clinicallyValidated) {
      if (!asset.therapeuticContext.clinicallyValidated) {
        warnings.push('Asset has not been clinically validated for therapeutic use');
      }
    }
    
    // Context-specific validation
    if (context.includes('medical') || context.includes('therapist')) {
      if (!asset.therapeuticContext.professionalAppearance) {
        warnings.push('Asset may lack professional appearance for medical/therapist context');
      }
    }
    
    if (context.includes('activity') || context.includes('speech')) {
      if (!asset.therapeuticContext.engagingForChildren) {
        warnings.push('Asset may not be sufficiently engaging for child-focused activities');
      }
    }
    
    return {
      suitable: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate content safety for child population
   * @param {ImageAsset} asset - Asset to validate
   * @returns {ValidationResult}
   */
  validateContentSafety(asset) {
    const errors = [];
    const warnings = [];
    
    if (!asset.therapeuticContext.childSafe) {
      errors.push('Asset not marked as child-safe');
    }
    
    if (asset.therapeuticContext.distressingContent === true) {
      errors.push('Asset contains potentially distressing content - not suitable for ASD therapy');
    }
    
    if (asset.therapeuticContext.positiveReinforcement === false) {
      warnings.push('Asset may not support positive reinforcement therapeutic approach');
    }
    
    // Check for sensory considerations (important for ASD population)
    if (asset.therapeuticContext.highSensoryStimulation === true) {
      warnings.push('Asset has high sensory stimulation - may not be suitable for sensory-sensitive children');
    }
    
    return {
      suitable: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate visual clarity and quality
   * @param {ImageAsset} asset - Asset to validate
   * @returns {ValidationResult}
   */
  validateVisualClarity(asset) {
    const errors = [];
    const warnings = [];
    
    // Check resolution if available
    if (asset.resolution && asset.resolution < this.therapeuticSuitabilityCriteria.visualClarity.minimumResolution) {
      errors.push(`Image resolution too low: ${asset.resolution} DPI (minimum ${this.therapeuticSuitabilityCriteria.visualClarity.minimumResolution} DPI required)`);
    }
    
    // Check for clear subject
    if (asset.therapeuticContext.clearSubject === false) {
      warnings.push('Image subject may not be clearly identifiable - could reduce therapeutic effectiveness');
    }
    
    // Check for minimal distraction
    if (asset.therapeuticContext.backgroundDistraction === true) {
      warnings.push('Image contains distracting background elements - may reduce focus for ASD children');
    }
    
    return {
      suitable: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Select alternative asset when validation fails
   * @param {ImageAsset} failedAsset - Asset that failed validation
   * @param {ValidationResult} validationResult - Validation result
   * @param {string} context - Therapeutic context
   * @returns {Object}
   */
  selectAlternativeAsset(failedAsset, validationResult, context) {
    const alternativeSelection = {
      originalAsset: failedAsset.url,
      failureReasons: validationResult.errors,
      context,
      alternativeRecommendations: [],
      selectedAt: new Date().toISOString()
    };
    
    // Generate recommendations based on failure reasons
    if (validationResult.errors.some(e => e.includes('age-appropriate'))) {
      alternativeSelection.alternativeRecommendations.push({
        criterion: 'age-appropriateness',
        recommendation: 'Select asset with validated age range 3-12 years',
        priority: 'high'
      });
    }
    
    if (validationResult.errors.some(e => e.includes('cultural sensitivity'))) {
      alternativeSelection.alternativeRecommendations.push({
        criterion: 'cultural-sensitivity',
        recommendation: 'Select culturally neutral or diverse representation asset',
        priority: 'high'
      });
    }
    
    if (validationResult.errors.some(e => e.includes('therapeutic goals'))) {
      alternativeSelection.alternativeRecommendations.push({
        criterion: 'therapeutic-goals',
        recommendation: 'Select asset with defined therapeutic objectives',
        priority: 'medium'
      });
    }
    
    if (validationResult.errors.some(e => e.includes('child-safe'))) {
      alternativeSelection.alternativeRecommendations.push({
        criterion: 'content-safety',
        recommendation: 'Select asset with verified child-safe content',
        priority: 'critical'
      });
    }
    
    // Log alternative selection
    this.alternativeAssetSelections.push(alternativeSelection);
    
    return alternativeSelection;
  }

  /**
   * Log validation event for audit trail
   * @param {ImageAsset} asset - Validated asset
   * @param {ValidationResult} result - Validation result
   * @param {string} context - Therapeutic context
   */
  logValidationEvent(asset, result, context) {
    this.validationAuditTrail.push({
      assetUrl: asset.url,
      context,
      suitable: result.suitable,
      suitabilityFactors: result.suitabilityFactors,
      errors: result.errors,
      warnings: result.warnings,
      validatedAt: result.validatedAt,
      processingTime: result.processingTime,
      criteriaVersion: this.getCriteriaVersion()
    });
  }

  /**
   * Get validation audit trail for clinical compliance review
   * @param {Object} filters - Optional filters
   * @returns {Object[]}
   */
  getValidationAuditTrail(filters = {}) {
    let trail = [...this.validationAuditTrail];
    
    if (typeof filters.suitable === 'boolean') {
      trail = trail.filter(entry => entry.suitable === filters.suitable);
    }
    
    if (filters.context) {
      trail = trail.filter(entry => entry.context === filters.context);
    }
    
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      trail = trail.filter(entry => {
        const entryDate = new Date(entry.validatedAt);
        return entryDate >= new Date(start) && entryDate <= new Date(end);
      });
    }
    
    if (filters.criteriaVersion) {
      trail = trail.filter(entry => entry.criteriaVersion === filters.criteriaVersion);
    }
    
    return trail;
  }

  /**
   * Build clinical compliance review interface data
   * @returns {Object}
   */
  buildComplianceReviewInterface() {
    const totalValidations = this.validationAuditTrail.length;
    const passedValidations = this.validationAuditTrail.filter(v => v.suitable).length;
    const failedValidations = totalValidations - passedValidations;
    
    // Analyze failure patterns
    const failuresByFactor = {};
    this.validationAuditTrail.filter(v => !v.suitable).forEach(validation => {
      Object.entries(validation.suitabilityFactors).forEach(([factor, passed]) => {
        if (!passed) {
          failuresByFactor[factor] = (failuresByFactor[factor] || 0) + 1;
        }
      });
    });
    
    // Analyze context-specific compliance
    const complianceByContext = {};
    this.validationAuditTrail.forEach(validation => {
      if (!complianceByContext[validation.context]) {
        complianceByContext[validation.context] = { total: 0, passed: 0 };
      }
      complianceByContext[validation.context].total++;
      if (validation.suitable) {
        complianceByContext[validation.context].passed++;
      }
    });
    
    // Calculate compliance rates by context
    Object.keys(complianceByContext).forEach(context => {
      const data = complianceByContext[context];
      data.complianceRate = ((data.passed / data.total) * 100).toFixed(2) + '%';
    });
    
    return {
      summary: {
        totalValidations,
        passedValidations,
        failedValidations,
        overallComplianceRate: totalValidations > 0 
          ? ((passedValidations / totalValidations) * 100).toFixed(2) + '%' 
          : '0%'
      },
      failureAnalysis: {
        byFactor: Object.entries(failuresByFactor)
          .sort(([,a], [,b]) => b - a)
          .map(([factor, count]) => ({ factor, count, percentage: ((count / failedValidations) * 100).toFixed(2) + '%' }))
      },
      complianceByContext,
      alternativeSelectionsCount: this.alternativeAssetSelections.length,
      criteriaUpdatesCount: this.criteriaUpdateHistory.length,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Update therapeutic criteria and log change
   * @param {Object} newCriteria - Updated criteria
   * @param {string} reason - Reason for update
   * @param {string} updatedBy - Who updated the criteria
   */
  updateTherapeuticCriteria(newCriteria, reason, updatedBy = 'system') {
    const previousCriteria = JSON.parse(JSON.stringify(this.therapeuticSuitabilityCriteria));
    
    // Update criteria
    this.therapeuticSuitabilityCriteria = {
      ...this.therapeuticSuitabilityCriteria,
      ...newCriteria
    };
    
    // Log criteria update
    this.criteriaUpdateHistory.push({
      previousCriteria,
      newCriteria: this.therapeuticSuitabilityCriteria,
      reason,
      updatedBy,
      updatedAt: new Date().toISOString(),
      version: this.getCriteriaVersion()
    });
  }

  /**
   * Re-validate existing assets against new criteria
   * @param {ImageAsset[]} assets - Assets to re-validate
   * @returns {Object}
   */
  revalidateAssetsAgainstNewCriteria(assets) {
    const revalidationResults = {
      totalAssets: assets.length,
      revalidated: 0,
      statusChanged: 0,
      newFailures: [],
      newPasses: [],
      startedAt: new Date().toISOString()
    };
    
    assets.forEach(asset => {
      // Find previous validation
      const previousValidation = this.validationAuditTrail
        .filter(v => v.assetUrl === asset.url)
        .sort((a, b) => new Date(b.validatedAt) - new Date(a.validatedAt))[0];
      
      // Re-validate with new criteria
      const newValidation = this.validateTherapeuticSuitability(asset, previousValidation?.context || 'general');
      
      revalidationResults.revalidated++;
      
      // Check if status changed
      if (previousValidation && previousValidation.suitable !== newValidation.suitable) {
        revalidationResults.statusChanged++;
        
        if (newValidation.suitable) {
          revalidationResults.newPasses.push({
            assetUrl: asset.url,
            previousErrors: previousValidation.errors,
            context: previousValidation.context
          });
        } else {
          revalidationResults.newFailures.push({
            assetUrl: asset.url,
            newErrors: newValidation.errors,
            context: newValidation.context
          });
        }
      }
    });
    
    revalidationResults.completedAt = new Date().toISOString();
    
    return revalidationResults;
  }

  /**
   * Get current criteria version
   * @returns {string}
   */
  getCriteriaVersion() {
    return `v${this.criteriaUpdateHistory.length + 1}`;
  }

  /**
   * Export comprehensive audit report
   * @returns {Object}
   */
  exportAuditReport() {
    return {
      complianceReview: this.buildComplianceReviewInterface(),
      validationAuditTrail: this.validationAuditTrail,
      alternativeAssetSelections: this.alternativeAssetSelections,
      criteriaUpdateHistory: this.criteriaUpdateHistory,
      currentCriteria: this.therapeuticSuitabilityCriteria,
      currentCriteriaVersion: this.getCriteriaVersion(),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Clear audit trail (use with caution - for testing/reset only)
   */
  clearAuditTrail() {
    this.validationAuditTrail = [];
    this.alternativeAssetSelections = [];
  }
}

export default TherapeuticAuditService;
