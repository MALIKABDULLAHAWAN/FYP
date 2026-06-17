/**
 * AccessibilityValidator Service
 * 
 * Main service for automated accessibility compliance checking
 * Coordinates all accessibility validation components to ensure WCAG AA compliance
 * for children with disabilities (ages 3-12)
 */

import { ColorContrastChecker } from './ColorContrastChecker.js';
import { KeyboardNavigationTester } from './KeyboardNavigationTester.js';
import { ScreenReaderCompatibilityChecker } from './ScreenReaderCompatibilityChecker.js';
import { TextResizingValidator } from './TextResizingValidator.js';
import { ReducedMotionValidator } from './ReducedMotionValidator.js';

class AccessibilityValidator {
  constructor() {
    this.colorContrastChecker = new ColorContrastChecker();
    this.keyboardNavigationTester = new KeyboardNavigationTester();
    this.screenReaderChecker = new ScreenReaderCompatibilityChecker();
    this.textResizingValidator = new TextResizingValidator();
    this.reducedMotionValidator = new ReducedMotionValidator();
    
    this.validationResults = new Map();
    this.isValidating = false;
  }

  /**
   * Perform comprehensive accessibility validation
   * @param {HTMLElement} element - Element to validate (defaults to document.body)
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation results
   */
  async validateAccessibility(element = document.body, options = {}) {
    if (this.isValidating) {
      throw new Error('Validation already in progress');
    }

    this.isValidating = true;
    const startTime = performance.now();

    try {
      const results = {
        timestamp: new Date().toISOString(),
        element: this._getElementSelector(element),
        overall: {
          passed: false,
          score: 0,
          wcagLevel: 'FAIL'
        },
        colorContrast: null,
        keyboardNavigation: null,
        screenReader: null,
        textResizing: null,
        reducedMotion: null,
        summary: {
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0,
          warnings: 0
        }
      };

      // Run all validation checks
      const validationPromises = [
        this.colorContrastChecker.validateElement(element, options.colorContrast),
        this.keyboardNavigationTester.validateElement(element, options.keyboard),
        this.screenReaderChecker.validateElement(element, options.screenReader),
        this.textResizingValidator.validateElement(element, options.textResizing),
        this.reducedMotionValidator.validateElement(element, options.reducedMotion)
      ];

      const [
        colorResults,
        keyboardResults,
        screenReaderResults,
        textResizingResults,
        reducedMotionResults
      ] = await Promise.all(validationPromises);

      // Compile results
      results.colorContrast = colorResults;
      results.keyboardNavigation = keyboardResults;
      results.screenReader = screenReaderResults;
      results.textResizing = textResizingResults;
      results.reducedMotion = reducedMotionResults;

      // Calculate overall score and compliance
      this._calculateOverallScore(results);

      // Store results
      const elementId = this._getElementId(element);
      this.validationResults.set(elementId, results);

      const duration = performance.now() - startTime;
      results.validationDuration = Math.round(duration);

      return results;

    } catch (error) {
      console.error('Accessibility validation failed:', error);
      throw new Error(`Accessibility validation failed: ${error.message}`);
    } finally {
      this.isValidating = false;
    }
  }

  /**
   * Validate specific accessibility aspect
   * @param {string} aspect - Aspect to validate (colorContrast, keyboard, etc.)
   * @param {HTMLElement} element - Element to validate
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation results for specific aspect
   */
  async validateAspect(aspect, element = document.body, options = {}) {
    const validators = {
      colorContrast: this.colorContrastChecker,
      keyboard: this.keyboardNavigationTester,
      screenReader: this.screenReaderChecker,
      textResizing: this.textResizingValidator,
      reducedMotion: this.reducedMotionValidator
    };

    const validator = validators[aspect];
    if (!validator) {
      throw new Error(`Unknown accessibility aspect: ${aspect}`);
    }

    return await validator.validateElement(element, options);
  }

  /**
   * Get validation results for element
   * @param {HTMLElement} element - Element to get results for
   * @returns {Object|null} Validation results or null if not found
   */
  getValidationResults(element) {
    const elementId = this._getElementId(element);
    return this.validationResults.get(elementId) || null;
  }

  /**
   * Clear validation results
   * @param {HTMLElement} element - Specific element or null for all
   */
  clearResults(element = null) {
    if (element) {
      const elementId = this._getElementId(element);
      this.validationResults.delete(elementId);
    } else {
      this.validationResults.clear();
    }
  }

  /**
   * Generate accessibility report
   * @param {HTMLElement} element - Element to generate report for
   * @returns {Object} Detailed accessibility report
   */
  generateReport(element = document.body) {
    const results = this.getValidationResults(element);
    if (!results) {
      throw new Error('No validation results found. Run validateAccessibility first.');
    }

    return {
      summary: {
        overallScore: results.overall.score,
        wcagCompliance: results.overall.wcagLevel,
        timestamp: results.timestamp,
        validationDuration: results.validationDuration
      },
      details: {
        colorContrast: this._formatAspectReport(results.colorContrast),
        keyboardNavigation: this._formatAspectReport(results.keyboardNavigation),
        screenReader: this._formatAspectReport(results.screenReader),
        textResizing: this._formatAspectReport(results.textResizing),
        reducedMotion: this._formatAspectReport(results.reducedMotion)
      },
      recommendations: this._generateRecommendations(results),
      childFriendlyIssues: this._identifyChildFriendlyIssues(results)
    };
  }

  /**
   * Calculate overall accessibility score
   * @private
   */
  _calculateOverallScore(results) {
    const aspects = [
      results.colorContrast,
      results.keyboardNavigation,
      results.screenReader,
      results.textResizing,
      results.reducedMotion
    ];

    let totalScore = 0;
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    let warnings = 0;

    aspects.forEach(aspect => {
      if (aspect && aspect.score !== undefined) {
        totalScore += aspect.score;
        totalChecks += aspect.totalChecks || 0;
        passedChecks += aspect.passedChecks || 0;
        failedChecks += aspect.failedChecks || 0;
        warnings += aspect.warnings || 0;
      }
    });

    const averageScore = aspects.length > 0 ? totalScore / aspects.length : 0;
    
    results.overall.score = Math.round(averageScore);
    results.overall.passed = averageScore >= 80; // 80% threshold for passing
    
    // Determine WCAG compliance level
    if (averageScore >= 95) {
      results.overall.wcagLevel = 'AAA';
    } else if (averageScore >= 80) {
      results.overall.wcagLevel = 'AA';
    } else if (averageScore >= 60) {
      results.overall.wcagLevel = 'A';
    } else {
      results.overall.wcagLevel = 'FAIL';
    }

    results.summary = {
      totalChecks,
      passedChecks,
      failedChecks,
      warnings
    };
  }

  /**
   * Format aspect report for readability
   * @private
   */
  _formatAspectReport(aspectResult) {
    if (!aspectResult) return null;

    return {
      score: aspectResult.score,
      passed: aspectResult.passed,
      issues: aspectResult.issues || [],
      recommendations: aspectResult.recommendations || [],
      details: aspectResult.details || {}
    };
  }

  /**
   * Generate accessibility recommendations
   * @private
   */
  _generateRecommendations(results) {
    const recommendations = [];

    // Color contrast recommendations
    if (results.colorContrast && results.colorContrast.score < 80) {
      recommendations.push({
        priority: 'high',
        category: 'Color Contrast',
        issue: 'Some text elements do not meet WCAG AA contrast requirements',
        solution: 'Increase contrast ratios to at least 4.5:1 for normal text and 3:1 for large text',
        childFriendly: 'Use darker text colors or lighter backgrounds to help children read more easily'
      });
    }

    // Keyboard navigation recommendations
    if (results.keyboardNavigation && results.keyboardNavigation.score < 80) {
      recommendations.push({
        priority: 'high',
        category: 'Keyboard Navigation',
        issue: 'Some interactive elements are not keyboard accessible',
        solution: 'Ensure all interactive elements have proper tabindex and focus indicators',
        childFriendly: 'Make sure children can use the Tab key to navigate through all buttons and games'
      });
    }

    // Screen reader recommendations
    if (results.screenReader && results.screenReader.score < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'Screen Reader',
        issue: 'Missing or inadequate ARIA labels and descriptions',
        solution: 'Add descriptive ARIA labels and ensure proper semantic HTML structure',
        childFriendly: 'Add simple, clear descriptions that help children understand what each button does'
      });
    }

    // Text resizing recommendations
    if (results.textResizing && results.textResizing.score < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'Text Resizing',
        issue: 'Layout breaks or becomes unusable when text is enlarged',
        solution: 'Use responsive design and relative units to support text scaling up to 200%',
        childFriendly: 'Make sure text can be made bigger for children who need larger fonts'
      });
    }

    // Reduced motion recommendations
    if (results.reducedMotion && results.reducedMotion.score < 80) {
      recommendations.push({
        priority: 'low',
        category: 'Motion Sensitivity',
        issue: 'Animations do not respect prefers-reduced-motion preference',
        solution: 'Implement CSS media queries to disable or reduce animations when requested',
        childFriendly: 'Provide calm, non-moving alternatives for children sensitive to motion'
      });
    }

    return recommendations;
  }

  /**
   * Identify child-specific accessibility issues
   * @private
   */
  _identifyChildFriendlyIssues(results) {
    const childIssues = [];

    // Check for child-specific concerns
    if (results.colorContrast && results.colorContrast.details) {
      const lowContrastElements = results.colorContrast.details.failedElements || [];
      if (lowContrastElements.length > 0) {
        childIssues.push({
          type: 'readability',
          severity: 'high',
          description: 'Some text may be hard for children to read due to low contrast',
          affectedElements: lowContrastElements.length,
          impact: 'Children may struggle to read instructions or game content'
        });
      }
    }

    if (results.keyboardNavigation && results.keyboardNavigation.details) {
      const inaccessibleElements = results.keyboardNavigation.details.inaccessibleElements || [];
      if (inaccessibleElements.length > 0) {
        childIssues.push({
          type: 'navigation',
          severity: 'high',
          description: 'Some games or buttons cannot be reached using keyboard only',
          affectedElements: inaccessibleElements.length,
          impact: 'Children using assistive devices may not be able to play certain games'
        });
      }
    }

    return childIssues;
  }

  /**
   * Get element selector for identification
   * @private
   */
  _getElementSelector(element) {
    if (element === document.body) return 'body';
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Get unique element identifier
   * @private
   */
  _getElementId(element) {
    if (element === document.body) return 'body';
    if (element.id) return element.id;
    
    // Generate unique ID based on element position and attributes
    const rect = element.getBoundingClientRect();
    const signature = `${element.tagName}-${rect.top}-${rect.left}-${element.className}`;
    return btoa(signature).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }
}

export { AccessibilityValidator };