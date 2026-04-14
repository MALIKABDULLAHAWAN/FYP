/**
 * Unit tests for ValidationService
 * Tests therapeutic validation functionality and edge cases
 */

import ValidationService from '../ValidationService.js';
import { 
  createMockImageAsset, 
  createMockValidationResult,
  assertTherapeuticCompliance 
} from './setup.js';

describe('ValidationService', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  afterEach(() => {
    validationService.clearValidationHistory();
  });

  describe('validateTherapeuticSuitability', () => {
    test('should validate compliant therapeutic asset', () => {
      const asset = createMockImageAsset();
      const result = validationService.validateTherapeuticSuitability(asset);

      expect(result.suitable).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedAt).toBeDefined();
      expect(result.validationId).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    test('should reject asset with insufficient alt text', () => {
      const asset = createMockImageAsset({
        altText: 'Short' // Less than 10 characters
      });
      
      const result = validationService.validateTherapeuticSuitability(asset);

      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Insufficient alt text description')
      )).toBe(true);
    });

    test('should reject asset with low color contrast', () => {
      const asset = createMockImageAsset({
        accessibility: {
          colorContrast: 3.0, // Below 4.5 threshold
          screenReaderCompatible: true,
          focusIndicator: 'outline: 2px solid var(--primary);'
        }
      });
      
      const result = validationService.validateTherapeuticSuitability(asset);

      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Insufficient color contrast')
      )).toBe(true);
    });

    test('should reject asset not age appropriate', () => {
      const asset = createMockImageAsset({
        therapeuticContext: {
          ageAppropriate: false,
          culturallySensitive: true,
          license: 'therapeutic-use-approved',
          therapeuticGoals: ['test-goal']
        }
      });
      
      const result = validationService.validateTherapeuticSuitability(asset);

      expect(result.suitable).toBe(false);
      expect(result.errors).toContain('Image not age-appropriate for target ASD population');
    });

    test('should warn about cultural sensitivity issues', () => {
      const asset = createMockImageAsset({
        therapeuticContext: {
          ageAppropriate: true,
          culturallySensitive: false,
          license: 'therapeutic-use-approved',
          therapeuticGoals: ['test-goal']
        }
      });
      
      const result = validationService.validateTherapeuticSuitability(asset);

      expect(result.suitable).toBe(true); // Warnings don't fail validation
      expect(result.warnings).toContain('Image may not be culturally sensitive');
    });

    test('should reject asset with invalid dimensions', () => {
      const asset = createMockImageAsset({
        width: 10, // Below minimum of 20
        height: 10
      });
      
      const result = validationService.validateTherapeuticSuitability(asset);

      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Image dimensions below therapeutic minimum')
      )).toBe(true);
    });

    test('should reject asset with invalid license', () => {
      const asset = createMockImageAsset({
        therapeuticContext: {
          ageAppropriate: true,
          culturallySensitive: true,
          license: 'invalid-license',
          therapeuticGoals: ['test-goal']
        }
      });
      
      const result = validationService.validateTherapeuticSuitability(asset);

      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Invalid or missing usage license')
      )).toBe(true);
    });

    test('should warn about missing therapeutic goals', () => {
      const asset = createMockImageAsset({
        therapeuticContext: {
          ageAppropriate: true,
          culturallySensitive: true,
          license: 'therapeutic-use-approved',
          therapeuticGoals: []
        }
      });
      
      const result = validationService.validateTherapeuticSuitability(asset);

      expect(result.suitable).toBe(true);
      expect(result.warnings).toContain('No therapeutic goals specified for asset');
    });
  });

  describe('validateEnhancedComponent', () => {
    test('should validate clean enhanced component', () => {
      const enhancedCode = `
        <div className="container">
          <img src="/test.jpg" alt="Test therapeutic image" className="therapeutic-image" data-therapeutic-goals="test-goal" />
        </div>
      `;
      const replacements = [{ emoji: '👶', replacedWith: '/test.jpg' }];
      
      const result = validationService.validateEnhancedComponent(enhancedCode, replacements);

      expect(result.suitable).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.statistics.totalImages).toBe(1);
      expect(result.statistics.expectedReplacements).toBe(1);
      expect(result.statistics.remainingEmojis).toBe(0);
    });

    test('should detect remaining emojis', () => {
      const enhancedCode = `
        <div className="container">
          <span>👶</span>
          <img src="/test.jpg" alt="Test image" />
        </div>
      `;
      const replacements = [];
      
      const result = validationService.validateEnhancedComponent(enhancedCode, replacements);

      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('emoji instances remain unprocessed')
      )).toBe(true);
      expect(result.statistics.remainingEmojis).toBe(1);
    });

    test('should detect images without alt text', () => {
      const enhancedCode = `
        <div className="container">
          <img src="/test.jpg" />
        </div>
      `;
      const replacements = [{ emoji: '👶', replacedWith: '/test.jpg' }];
      
      const result = validationService.validateEnhancedComponent(enhancedCode, replacements);

      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('images missing alt text attributes')
      )).toBe(true);
    });

    test('should warn about replacement count mismatch', () => {
      const enhancedCode = `
        <div className="container">
          <img src="/test1.jpg" alt="Test image 1" />
          <img src="/test2.jpg" alt="Test image 2" />
        </div>
      `;
      const replacements = [{ emoji: '👶', replacedWith: '/test1.jpg' }]; // Only 1 replacement for 2 images
      
      const result = validationService.validateEnhancedComponent(enhancedCode, replacements);

      expect(result.suitable).toBe(true); // Warnings don't fail validation
      expect(result.warnings.some(warning => 
        warning.includes('Mismatch between expected')
      )).toBe(true);
    });
  });

  describe('validateFunctionalityPreservation', () => {
    test('should validate preserved event handlers', () => {
      const originalCode = `
        <button onClick={handleClick}>Click me</button>
        <input onChange={handleChange} />
      `;
      const enhancedCode = `
        <button onClick={handleClick}>
          <img src="/icon.jpg" alt="Click icon" />
          Click me
        </button>
        <input onChange={handleChange} />
      `;
      
      const result = validationService.validateFunctionalityPreservation(originalCode, enhancedCode);

      expect(result.suitable).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.statistics.originalEventHandlers).toBe(2);
      expect(result.statistics.enhancedEventHandlers).toBe(2);
    });

    test('should detect lost event handlers', () => {
      const originalCode = `
        <button onClick={handleClick}>Click me</button>
        <input onChange={handleChange} />
      `;
      const enhancedCode = `
        <button>Click me</button>
        <input onChange={handleChange} />
      `;
      
      const result = validationService.validateFunctionalityPreservation(originalCode, enhancedCode);

      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Event handler count mismatch')
      )).toBe(true);
    });
  });

  describe('validation history and reporting', () => {
    test('should store validation history', () => {
      const asset1 = createMockImageAsset();
      const asset2 = createMockImageAsset({ altText: 'Short' });
      
      const result1 = validationService.validateTherapeuticSuitability(asset1);
      const result2 = validationService.validateTherapeuticSuitability(asset2);

      const history = validationService.getValidationHistory();
      expect(history).toHaveLength(2);
      
      const specificValidation = validationService.getValidationHistory(result1.validationId);
      expect(specificValidation).toEqual(result1);
    });

    test('should generate validation report', () => {
      const asset1 = createMockImageAsset();
      const asset2 = createMockImageAsset({ altText: 'Short' });
      
      validationService.validateTherapeuticSuitability(asset1);
      validationService.validateTherapeuticSuitability(asset2);

      const report = validationService.exportValidationReport();
      
      expect(report.summary.totalValidations).toBe(2);
      expect(report.summary.successfulValidations).toBe(1);
      expect(report.summary.failedValidations).toBe(1);
      expect(report.summary.successRate).toBe('50.00%');
      expect(report.commonErrors).toBeDefined();
      expect(report.criteria).toBeDefined();
    });

    test('should update therapeutic criteria', () => {
      const newCriteria = {
        minimumContrast: 7.0,
        minimumAltTextLength: 15
      };
      
      validationService.updateTherapeuticCriteria(newCriteria);
      
      const asset = createMockImageAsset({
        altText: 'Medium length text', // 18 characters, should pass new minimum
        accessibility: {
          colorContrast: 6.0, // Below new minimum of 7.0
          screenReaderCompatible: true,
          focusIndicator: 'outline: 2px solid var(--primary);'
        }
      });
      
      const result = validationService.validateTherapeuticSuitability(asset);
      
      expect(result.suitable).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Insufficient color contrast for therapeutic use (minimum 7 required')
      )).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle null asset gracefully', () => {
      expect(() => {
        validationService.validateTherapeuticSuitability(null);
      }).toThrow();
    });

    test('should handle empty enhanced code', () => {
      const result = validationService.validateEnhancedComponent('', []);
      
      expect(result.suitable).toBe(true);
      expect(result.statistics.totalImages).toBe(0);
      expect(result.statistics.remainingEmojis).toBe(0);
    });

    test('should generate unique validation IDs', () => {
      const asset = createMockImageAsset();
      
      const result1 = validationService.validateTherapeuticSuitability(asset);
      const result2 = validationService.validateTherapeuticSuitability(asset);
      
      expect(result1.validationId).not.toBe(result2.validationId);
    });

    test('should clear validation history', () => {
      const asset = createMockImageAsset();
      validationService.validateTherapeuticSuitability(asset);
      
      expect(validationService.getValidationHistory()).toHaveLength(1);
      
      validationService.clearValidationHistory();
      
      expect(validationService.getValidationHistory()).toHaveLength(0);
    });
  });
});