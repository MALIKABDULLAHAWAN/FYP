/**
 * Property-based tests for ValidationService
 * Tests therapeutic validation properties across all valid inputs
 */

import fc from 'fast-check';
import ValidationService from '../ValidationService.js';

describe('ValidationService Property Tests', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  afterEach(() => {
    validationService.clearValidationHistory();
  });

  /**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 9.1, 9.2**
   * 
   * Property: For any valid ImageAsset that meets therapeutic criteria,
   * validateTherapeuticSuitability should return suitable=true with no errors
   */
  test('property: valid therapeutic assets should always pass validation', () => {
    const validAssetArbitrary = fc.record({
      url: fc.webUrl(),
      altText: fc.string({ minLength: 10, maxLength: 200 }),
      width: fc.integer({ min: 20, max: 1000 }),
      height: fc.integer({ min: 20, max: 1000 }),
      accessibility: fc.record({
        colorContrast: fc.float({ min: 4.5, max: 21.0 }),
        screenReaderCompatible: fc.constant(true),
        focusIndicator: fc.constant('outline: 2px solid #0066cc')
      }),
      therapeuticContext: fc.record({
        ageAppropriate: fc.constant(true),
        culturallySensitive: fc.constant(true),
        license: fc.constant('therapeutic-use-approved'),
        therapeuticGoals: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 })
      })
    });

    fc.assert(fc.property(validAssetArbitrary, (asset) => {
      const result = validationService.validateTherapeuticSuitability(asset);
      
      // Property assertions
      expect(result.suitable).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedAt).toBeDefined();
      expect(result.validationId).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      
      // Validation result should be stored in history
      const storedResult = validationService.getValidationHistory(result.validationId);
      expect(storedResult).toEqual(result);
    }), { numRuns: 100 });
  });

  /**
   * **Validates: Requirements 2.1, 4.1, 9.1**
   * 
   * Property: For any ImageAsset with insufficient alt text,
   * validation should fail with appropriate error message
   */
  test('property: assets with insufficient alt text should always fail validation', () => {
    const invalidAltTextAssetArbitrary = fc.record({
      url: fc.webUrl(),
      altText: fc.string({ maxLength: 9 }), // Below minimum of 10
      width: fc.integer({ min: 20, max: 1000 }),
      height: fc.integer({ min: 20, max: 1000 }),
      accessibility: fc.record({
        colorContrast: fc.float({ min: 4.5, max: 21.0 }),
        screenReaderCompatible: fc.boolean(),
        focusIndicator: fc.string()
      }),
      therapeuticContext: fc.record({
        ageAppropriate: fc.boolean(),
        culturallySensitive: fc.boolean(),
        license: fc.string(),
        therapeuticGoals: fc.array(fc.string())
      })
    });

    fc.assert(fc.property(invalidAltTextAssetArbitrary, (asset) => {
      const result = validationService.validateTherapeuticSuitability(asset);
      
      // Property assertions
      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Insufficient alt text description')
      )).toBe(true);
      expect(result.validatedAt).toBeDefined();
    }), { numRuns: 50 });
  });

  /**
   * **Validates: Requirements 4.2, 9.1**
   * 
   * Property: For any ImageAsset with low color contrast,
   * validation should fail with appropriate error message
   */
  test('property: assets with low color contrast should always fail validation', () => {
    const lowContrastAssetArbitrary = fc.record({
      url: fc.webUrl(),
      altText: fc.string({ minLength: 10, maxLength: 200 }),
      width: fc.integer({ min: 20, max: 1000 }),
      height: fc.integer({ min: 20, max: 1000 }),
      accessibility: fc.record({
        colorContrast: fc.float({ min: 1.0, max: Math.fround(4.49) }), // Below minimum of 4.5
        screenReaderCompatible: fc.boolean(),
        focusIndicator: fc.string()
      }),
      therapeuticContext: fc.record({
        ageAppropriate: fc.boolean(),
        culturallySensitive: fc.boolean(),
        license: fc.string(),
        therapeuticGoals: fc.array(fc.string())
      })
    });

    fc.assert(fc.property(lowContrastAssetArbitrary, (asset) => {
      const result = validationService.validateTherapeuticSuitability(asset);
      
      // Property assertions
      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Insufficient color contrast')
      )).toBe(true);
    }), { numRuns: 50 });
  });

  /**
   * **Validates: Requirements 2.2, 9.1**
   * 
   * Property: For any ImageAsset marked as not age appropriate,
   * validation should fail with appropriate error message
   */
  test('property: assets not age appropriate should always fail validation', () => {
    const notAgeAppropriateAssetArbitrary = fc.record({
      url: fc.webUrl(),
      altText: fc.string({ minLength: 10, maxLength: 200 }),
      width: fc.integer({ min: 20, max: 1000 }),
      height: fc.integer({ min: 20, max: 1000 }),
      accessibility: fc.record({
        colorContrast: fc.float({ min: 4.5, max: 21.0 }),
        screenReaderCompatible: fc.boolean(),
        focusIndicator: fc.string()
      }),
      therapeuticContext: fc.record({
        ageAppropriate: fc.constant(false), // Always false
        culturallySensitive: fc.boolean(),
        license: fc.string(),
        therapeuticGoals: fc.array(fc.string())
      })
    });

    fc.assert(fc.property(notAgeAppropriateAssetArbitrary, (asset) => {
      const result = validationService.validateTherapeuticSuitability(asset);
      
      // Property assertions
      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('not age-appropriate for target ASD population')
      )).toBe(true);
    }), { numRuns: 50 });
  });

  /**
   * **Validates: Requirements 2.5, 9.1**
   * 
   * Property: For any ImageAsset with invalid license,
   * validation should fail with appropriate error message
   */
  test('property: assets with invalid license should always fail validation', () => {
    const invalidLicenseAssetArbitrary = fc.record({
      url: fc.webUrl(),
      altText: fc.string({ minLength: 10, maxLength: 200 }),
      width: fc.integer({ min: 20, max: 1000 }),
      height: fc.integer({ min: 20, max: 1000 }),
      accessibility: fc.record({
        colorContrast: fc.float({ min: 4.5, max: 21.0 }),
        screenReaderCompatible: fc.boolean(),
        focusIndicator: fc.string()
      }),
      therapeuticContext: fc.record({
        ageAppropriate: fc.boolean(),
        culturallySensitive: fc.boolean(),
        license: fc.string().filter(s => s !== 'therapeutic-use-approved'), // Invalid license
        therapeuticGoals: fc.array(fc.string())
      })
    });

    fc.assert(fc.property(invalidLicenseAssetArbitrary, (asset) => {
      const result = validationService.validateTherapeuticSuitability(asset);
      
      // Property assertions
      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Invalid or missing usage license')
      )).toBe(true);
    }), { numRuns: 50 });
  });

  /**
   * **Validates: Requirements 9.4, 9.5**
   * 
   * Property: Validation results should be consistent for identical assets
   * (idempotency property)
   */
  test('property: validation should be idempotent for identical assets', () => {
    const assetArbitrary = fc.record({
      url: fc.webUrl(),
      altText: fc.string({ minLength: 5, maxLength: 200 }),
      width: fc.integer({ min: 10, max: 1000 }),
      height: fc.integer({ min: 10, max: 1000 }),
      accessibility: fc.record({
        colorContrast: fc.float({ min: 1.0, max: 21.0 }),
        screenReaderCompatible: fc.boolean(),
        focusIndicator: fc.string()
      }),
      therapeuticContext: fc.record({
        ageAppropriate: fc.boolean(),
        culturallySensitive: fc.boolean(),
        license: fc.string(),
        therapeuticGoals: fc.array(fc.string())
      })
    });

    fc.assert(fc.property(assetArbitrary, (asset) => {
      const result1 = validationService.validateTherapeuticSuitability(asset);
      const result2 = validationService.validateTherapeuticSuitability(asset);
      
      // Property assertions - results should be consistent
      expect(result1.suitable).toBe(result2.suitable);
      expect(result1.errors).toEqual(result2.errors);
      expect(result1.warnings).toEqual(result2.warnings);
      
      // Both results should have valid validation IDs (may be same for identical assets)
      expect(result1.validationId).toBeDefined();
      expect(result2.validationId).toBeDefined();
      expect(typeof result1.validationId).toBe('string');
      expect(typeof result2.validationId).toBe('string');
    }), { numRuns: 50 });
  });

  /**
   * **Validates: Requirements 5.4, 9.4**
   * 
   * Property: Validation processing time should be reasonable
   * and validation ID should always be generated
   */
  test('property: validation should complete efficiently with proper tracking', () => {
    const assetArbitrary = fc.record({
      url: fc.webUrl(),
      altText: fc.string({ minLength: 1, maxLength: 500 }),
      width: fc.integer({ min: 1, max: 2000 }),
      height: fc.integer({ min: 1, max: 2000 }),
      accessibility: fc.record({
        colorContrast: fc.float({ min: 1.0, max: 21.0 }),
        screenReaderCompatible: fc.boolean(),
        focusIndicator: fc.string()
      }),
      therapeuticContext: fc.record({
        ageAppropriate: fc.boolean(),
        culturallySensitive: fc.boolean(),
        license: fc.string(),
        therapeuticGoals: fc.array(fc.string(), { maxLength: 10 })
      })
    });

    fc.assert(fc.property(assetArbitrary, (asset) => {
      const startTime = Date.now();
      const result = validationService.validateTherapeuticSuitability(asset);
      const endTime = Date.now();
      
      // Property assertions
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.processingTime).toBeLessThan(1000); // Should complete within 1 second
      expect(endTime - startTime).toBeLessThan(1000); // Overall time check
      
      expect(result.validationId).toBeDefined();
      expect(typeof result.validationId).toBe('string');
      expect(result.validationId.length).toBeGreaterThan(0);
      
      expect(result.validatedAt).toBeDefined();
      expect(new Date(result.validatedAt)).toBeInstanceOf(Date);
    }), { numRuns: 100 });
  });

  /**
   * **Validates: Requirements 2.3, 9.2**
   * 
   * Property: Cultural sensitivity warnings should not fail validation
   * but should be properly recorded
   */
  test('property: cultural sensitivity issues should generate warnings not errors', () => {
    const culturallyInsensitiveAssetArbitrary = fc.record({
      url: fc.webUrl(),
      altText: fc.string({ minLength: 10, maxLength: 200 }),
      width: fc.integer({ min: 20, max: 1000 }),
      height: fc.integer({ min: 20, max: 1000 }),
      accessibility: fc.record({
        colorContrast: fc.float({ min: 4.5, max: 21.0 }),
        screenReaderCompatible: fc.constant(true),
        focusIndicator: fc.constant('outline: 2px solid #0066cc')
      }),
      therapeuticContext: fc.record({
        ageAppropriate: fc.constant(true),
        culturallySensitive: fc.constant(false), // Always false
        license: fc.constant('therapeutic-use-approved'),
        therapeuticGoals: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 })
      })
    });

    fc.assert(fc.property(culturallyInsensitiveAssetArbitrary, (asset) => {
      const result = validationService.validateTherapeuticSuitability(asset);
      
      // Property assertions
      expect(result.suitable).toBe(true); // Warnings don't fail validation
      expect(result.warnings.some(warning => 
        warning.includes('may not be culturally sensitive')
      )).toBe(true);
      expect(result.errors).toHaveLength(0);
    }), { numRuns: 50 });
  });
});