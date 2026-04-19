/**
 * AccessibilityValidator Service Index
 * 
 * Exports all accessibility validation components for easy importing
 */

export { AccessibilityValidator } from './AccessibilityValidator.js';
export { ColorContrastChecker } from './ColorContrastChecker.js';
export { KeyboardNavigationTester } from './KeyboardNavigationTester.js';
export { ScreenReaderCompatibilityChecker } from './ScreenReaderCompatibilityChecker.js';
export { TextResizingValidator } from './TextResizingValidator.js';
export { ReducedMotionValidator } from './ReducedMotionValidator.js';

// Convenience function to create and use validator
export const createAccessibilityValidator = () => {
  return new AccessibilityValidator();
};

// Quick validation function for common use cases
export const validatePageAccessibility = async (element = document.body, options = {}) => {
  const validator = new AccessibilityValidator();
  return await validator.validateAccessibility(element, options);
};

// Child-friendly validation with enhanced checks
export const validateChildFriendlyAccessibility = async (element = document.body) => {
  const validator = new AccessibilityValidator();
  
  const options = {
    colorContrast: {
      enhancedChildChecks: true,
      minimumContrastRatio: 4.5 // WCAG AA standard
    },
    keyboard: {
      childFriendlyFocus: true,
      minimumTouchTarget: 44 // Larger for children
    },
    screenReader: {
      childFriendlyLanguage: true,
      requireSimpleDescriptions: true
    },
    textResizing: {
      testSizes: [100, 125, 150, 175, 200], // Up to 200% as required
      childReadabilityChecks: true
    },
    reducedMotion: {
      childMotionSensitivity: true,
      maxMotionIntensity: 50 // Lower threshold for children
    }
  };
  
  return await validator.validateAccessibility(element, options);
};