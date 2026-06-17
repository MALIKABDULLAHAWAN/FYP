/**
 * Property-based tests for AssetManager Error Handling
 * Tests error handling and fallback system properties across all failure scenarios
 */

import fc from 'fast-check';
import AssetManager from '../AssetManager.js';

describe('AssetManager Error Handling Property Tests', () => {
  let assetManager;

  beforeEach(() => {
    assetManager = new AssetManager();
  });

  afterEach(() => {
    assetManager.clearCache();
    assetManager.clearClinicalErrorLog();
  });

  /**
   * **Validates: Requirements 2.4, 10.1, 10.3, 10.5**
   * 
   * Property: For any asset failure, the system should provide appropriate fallbacks
   * while maintaining therapeutic functionality and never disrupting sessions
   */
  test('property: asset failures should always provide therapeutic fallbacks', () => {
    const errorScenarioArbitrary = fc.record({
      operation: fc.constantFrom('getTherapistIcon', 'getChildActivityIcon', 'getMedicalIcon', 'preload'),
      assetType: fc.string({ minLength: 1, maxLength: 50 }),
      errorMessage: fc.string({ minLength: 1, maxLength: 200 }),
      context: fc.record({
        role: fc.option(fc.string()),
        activity: fc.option(fc.string()),
        category: fc.option(fc.string()),
        therapeuticContext: fc.option(fc.constantFrom('speech-therapy', 'clinical-assessment', 'patient-care')),
        userRole: fc.option(fc.constantFrom('therapist', 'admin', 'patient'))
      })
    });

    fc.assert(fc.property(errorScenarioArbitrary, (scenario) => {
      const mockError = new Error(scenario.errorMessage);
      
      const fallbackAsset = assetManager.handleAssetFailure(
        scenario.operation,
        scenario.assetType,
        mockError,
        scenario.context
      );
      
      // Property assertions - fallback should always be therapeutic
      expect(fallbackAsset).toBeDefined();
      expect(fallbackAsset.url).toBeDefined();
      expect(fallbackAsset.altText).toBeDefined();
      expect(fallbackAsset.altText.length).toBeGreaterThanOrEqual(10);
      expect(fallbackAsset.accessibility).toBeDefined();
      expect(fallbackAsset.accessibility.colorContrast).toBeGreaterThanOrEqual(4.5);
      expect(fallbackAsset.therapeuticContext).toBeDefined();
      expect(fallbackAsset.therapeuticContext.ageAppropriate).toBe(true);
      expect(fallbackAsset.therapeuticContext.license).toBe('therapeutic-use-approved');
      
      // Error should be logged for clinical review
      const errorLog = assetManager.getClinicalErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
      
      const lastError = errorLog[errorLog.length - 1];
      expect(lastError.operation).toBe(scenario.operation);
      expect(lastError.assetType).toBe(scenario.assetType);
      expect(lastError.error.message).toBe(scenario.errorMessage);
      expect(lastError.fallbackUsed).toBe(true);
      expect(lastError.severity).toMatch(/^(high|medium|low)$/);
      expect(lastError.clinicalImpact).toBeDefined();
    }), { numRuns: 100 });
  });

  /**
   * **Validates: Requirements 10.4, 9.4**
   * 
   * Property: Error severity should be correctly determined based on asset type and operation
   */
  test('property: error severity should be correctly classified', () => {
    const severityTestArbitrary = fc.record({
      operation: fc.constantFrom('getTherapistIcon', 'getChildActivityIcon', 'getMedicalIcon', 'preload', 'validate'),
      assetType: fc.constantFrom(
        'therapist-medical-professional',
        'therapist-speech-therapist', 
        'medical-session-management',
        'medical-performance-metric',
        'activity-repetition',
        'activity-picture_naming',
        'ui-generic'
      )
    });

    fc.assert(fc.property(severityTestArbitrary, (testCase) => {
      const severity = assetManager.determineErrorSeverity(testCase.operation, testCase.assetType);
      
      // Property assertions
      expect(severity).toMatch(/^(high|medium|low)$/);
      
      // Preload is medium; therapist/medical assets are high otherwise
      if (testCase.operation === 'preload') {
        expect(severity).toBe('medium');
      } else if (testCase.assetType.includes('therapist') || testCase.assetType.includes('medical')) {
        expect(severity).toBe('high');
      }
      
      // Severity should be consistent for same inputs
      const severity2 = assetManager.determineErrorSeverity(testCase.operation, testCase.assetType);
      expect(severity).toBe(severity2);
    }), { numRuns: 50 });
  });

  /**
   * **Validates: Requirements 10.1, 10.2**
   * 
   * Property: Clinical impact assessment should provide meaningful descriptions
   */
  test('property: clinical impact assessment should be meaningful and consistent', () => {
    const assetTypeArbitrary = fc.constantFrom(
      'therapist-professional',
      'medical-interface',
      'activity-engagement',
      'speech-therapy',
      'ui-element',
      'unknown-type'
    );

    fc.assert(fc.property(assetTypeArbitrary, (assetType) => {
      const impact = assetManager.assessClinicalImpact(assetType);
      
      // Property assertions
      expect(impact).toBeDefined();
      expect(typeof impact).toBe('string');
      expect(impact.length).toBeGreaterThan(10); // Meaningful description
      
      // Impact should be consistent for same asset type
      const impact2 = assetManager.assessClinicalImpact(assetType);
      expect(impact).toBe(impact2);
      
      // Specific impact patterns
      if (assetType.includes('therapist')) {
        expect(impact).toContain('professional trust');
      }
      
      if (assetType.includes('medical')) {
        expect(impact).toContain('clinical');
      }
      
      if (assetType.includes('activity')) {
        expect(impact).toContain('engagement');
      }
    }), { numRuns: 30 });
  });

  /**
   * **Validates: Requirements 2.4, 10.1**
   * 
   * Property: Fallback asset selection should be context-aware and appropriate
   */
  test('property: fallback selection should be context-aware', () => {
    const fallbackTestArbitrary = fc.record({
      assetType: fc.constantFrom(
        'therapist-medical',
        'therapist-speech',
        'activity-repetition',
        'activity-naming',
        'medical-assessment',
        'ui-button',
        'unknown-asset'
      ),
      context: fc.record({
        therapeuticContext: fc.option(fc.constantFrom('speech-therapy', 'clinical-assessment', 'patient-care')),
        userRole: fc.option(fc.constantFrom('therapist', 'admin', 'patient')),
        sessionType: fc.option(fc.constantFrom('individual', 'group', 'assessment'))
      })
    });

    fc.assert(fc.property(fallbackTestArbitrary, (testCase) => {
      const fallbackAsset = assetManager.selectFallbackAsset(testCase.assetType, testCase.context);
      
      // Property assertions
      expect(fallbackAsset).toBeDefined();
      expect(fallbackAsset.url).toBeDefined();
      expect(fallbackAsset.therapeuticContext.ageAppropriate).toBe(true);
      expect(fallbackAsset.therapeuticContext.license).toBe('therapeutic-use-approved');
      
      // Priority: speech-therapy context → activity; else role; else asset type
      const { assetType, context } = testCase;
      if (context.therapeuticContext === 'speech-therapy') {
        expect(fallbackAsset).toBe(assetManager.fallbackAssets.activity);
      } else if (context.userRole === 'therapist') {
        expect(fallbackAsset).toBe(assetManager.fallbackAssets.therapist);
      } else if (assetType.includes('therapist')) {
        expect(fallbackAsset).toBe(assetManager.fallbackAssets.therapist);
      } else if (assetType.includes('activity') || assetType.includes('speech')) {
        expect(fallbackAsset).toBe(assetManager.fallbackAssets.activity);
      }
    }), { numRuns: 50 });
  });

  /**
   * **Validates: Requirements 10.1, 10.3**
   * 
   * Property: Fallback asset validation should be comprehensive and reliable
   */
  test('property: fallback validation should be comprehensive', () => {
    const assetArbitrary = fc.record({
      url: fc.option(fc.webUrl()),
      altText: fc.option(fc.string({ maxLength: 200 })),
      width: fc.option(fc.integer({ min: 1, max: 1000 })),
      height: fc.option(fc.integer({ min: 1, max: 1000 })),
      accessibility: fc.option(fc.record({
        colorContrast: fc.option(fc.float({ min: 1.0, max: 21.0 })),
        screenReaderCompatible: fc.option(fc.boolean()),
        focusIndicator: fc.option(fc.string())
      })),
      therapeuticContext: fc.option(fc.record({
        ageAppropriate: fc.option(fc.boolean()),
        culturallySensitive: fc.option(fc.boolean()),
        license: fc.option(fc.string()),
        therapeuticGoals: fc.option(fc.array(fc.string()))
      }))
    });

    fc.assert(fc.property(assetArbitrary, (asset) => {
      const isValid = assetManager.validateFallbackAsset(asset);
      
      // Property assertions - validation should be consistent
      const isValid2 = assetManager.validateFallbackAsset(asset);
      expect(isValid).toBe(isValid2);
      
      // If asset is valid, it should meet all criteria
      if (isValid) {
        expect(asset.url).toBeDefined();
        expect(asset.altText).toBeDefined();
        expect(asset.altText.length).toBeGreaterThanOrEqual(10);
        expect(asset.accessibility).toBeDefined();
        expect(asset.accessibility.colorContrast).toBeGreaterThanOrEqual(4.5);
        expect(asset.therapeuticContext).toBeDefined();
        expect(asset.therapeuticContext.ageAppropriate).toBe(true);
      }
      
      // If asset is invalid, at least one criterion should fail
      if (!isValid) {
        const hasValidUrl = asset && asset.url;
        const hasValidAltText = asset && asset.altText && asset.altText.length >= 10;
        const hasValidContrast = asset && asset.accessibility && asset.accessibility.colorContrast >= 4.5;
        const hasValidTherapeutic = asset && asset.therapeuticContext && asset.therapeuticContext.ageAppropriate;
        
        expect(
          Boolean(hasValidUrl && hasValidAltText && hasValidContrast && hasValidTherapeutic)
        ).toBe(false);
      }
    }), { numRuns: 100 });
  });

  /**
   * **Validates: Requirements 10.4, 9.4**
   * 
   * Property: Clinical error logging should be comprehensive and bounded
   */
  test('property: clinical error logging should be comprehensive and memory-safe', () => {
    const errorBatchArbitrary = fc.array(
      fc.record({
        operation: fc.string({ minLength: 1, maxLength: 20 }),
        assetType: fc.string({ minLength: 1, maxLength: 30 }),
        errorMessage: fc.string({ minLength: 1, maxLength: 100 })
      }),
      { minLength: 1, maxLength: 50 }
    );

    fc.assert(fc.property(errorBatchArbitrary, (errorBatch) => {
      // Clear log before test
      assetManager.clearClinicalErrorLog();
      
      // Generate multiple errors
      errorBatch.forEach(errorData => {
        const mockError = new Error(errorData.errorMessage);
        assetManager.handleAssetFailure(errorData.operation, errorData.assetType, mockError);
      });
      
      const errorLog = assetManager.getClinicalErrorLog();
      
      // Property assertions
      expect(errorLog.length).toBe(errorBatch.length);
      expect(errorLog.length).toBeLessThanOrEqual(1000); // Memory safety
      
      // Each error should be properly logged
      errorLog.forEach((logEntry, index) => {
        expect(logEntry.timestamp).toBeDefined();
        expect(logEntry.operation).toBe(errorBatch[index].operation);
        expect(logEntry.assetType).toBe(errorBatch[index].assetType);
        expect(logEntry.error.message).toBe(errorBatch[index].errorMessage);
        expect(logEntry.severity).toMatch(/^(high|medium|low)$/);
        expect(logEntry.clinicalImpact).toBeDefined();
        expect(logEntry.fallbackUsed).toBe(true);
      });
      
      // Severity filtering should work
      const highSeverityErrors = assetManager.getClinicalErrorLog('high');
      expect(highSeverityErrors.every(log => log.severity === 'high')).toBe(true);
    }), { numRuns: 20 });
  });

  /**
   * **Validates: Requirements 10.4**
   * 
   * Property: Clinical error reports should provide actionable insights
   */
  test('property: clinical error reports should be comprehensive and actionable', () => {
    const reportTestArbitrary = fc.array(
      fc.record({
        operation: fc.constantFrom('getTherapistIcon', 'getMedicalIcon', 'preload'),
        assetType: fc.constantFrom('therapist-medical', 'medical-session', 'activity-speech'),
        severity: fc.constantFrom('high', 'medium', 'low')
      }),
      { minLength: 0, maxLength: 20 }
    );

    fc.assert(fc.property(reportTestArbitrary, (errorData) => {
      // Clear and populate error log
      assetManager.clearClinicalErrorLog();
      
      errorData.forEach(data => {
        const mockError = new Error(`Test error for ${data.assetType}`);
        assetManager.handleAssetFailure(data.operation, data.assetType, mockError);
      });
      
      const report = assetManager.exportClinicalErrorReport();
      
      // Property assertions
      expect(report.generatedAt).toBeDefined();
      expect(report.totalErrors).toBe(errorData.length);
      expect(report.severityBreakdown).toBeDefined();
      expect(report.assetTypeBreakdown).toBeDefined();
      expect(report.clinicalImpactSummary).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      
      // Severity breakdown should be accurate
      const expectedHigh = errorData.filter(d => d.severity === 'high').length;
      const expectedMedium = errorData.filter(d => d.severity === 'medium').length;
      const expectedLow = errorData.filter(d => d.severity === 'low').length;
      
      // Note: Actual severity is determined by the system, not the test data
      expect(report.severityBreakdown.high + report.severityBreakdown.medium + report.severityBreakdown.low)
        .toBe(errorData.length);
      
      // Recent errors should be limited
      expect(report.recentErrors.length).toBeLessThanOrEqual(10);
      
      // Recommendations should be meaningful
      if (errorData.length === 0) {
        expect(report.recommendations).toContain('System operating normally - no clinical interventions required');
      }
    }), { numRuns: 30 });
  });

  /**
   * **Validates: Requirements 10.5**
   * 
   * Property: Emergency fallback should never fail and always be therapeutic
   */
  test('property: emergency fallback should be infallible and therapeutic', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      const emergencyAsset = assetManager.getEmergencyFallback();
      
      // Property assertions - emergency fallback must always work
      expect(emergencyAsset).toBeDefined();
      expect(emergencyAsset.url).toBeDefined();
      expect(emergencyAsset.altText).toBeDefined();
      expect(emergencyAsset.altText.length).toBeGreaterThanOrEqual(10);
      expect(emergencyAsset.width).toBeGreaterThan(0);
      expect(emergencyAsset.height).toBeGreaterThan(0);
      expect(emergencyAsset.accessibility.colorContrast).toBeGreaterThanOrEqual(4.5);
      expect(emergencyAsset.accessibility.screenReaderCompatible).toBe(true);
      expect(emergencyAsset.therapeuticContext.ageAppropriate).toBe(true);
      expect(emergencyAsset.therapeuticContext.culturallySensitive).toBe(true);
      expect(emergencyAsset.therapeuticContext.license).toBe('therapeutic-use-approved');
      
      // Should pass fallback validation
      expect(assetManager.validateFallbackAsset(emergencyAsset)).toBe(true);
      
      // Should be consistent across calls
      const emergencyAsset2 = assetManager.getEmergencyFallback();
      expect(emergencyAsset).toEqual(emergencyAsset2);
    }), { numRuns: 10 });
  });
});