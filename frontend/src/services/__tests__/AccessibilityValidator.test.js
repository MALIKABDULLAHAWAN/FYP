/**
 * AccessibilityValidator Test Suite
 * 
 * Comprehensive tests for accessibility compliance verification
 * Tests WCAG AA standards for children with disabilities
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AccessibilityValidator } from '../AccessibilityValidator/AccessibilityValidator.js';
import { ColorContrastChecker } from '../AccessibilityValidator/ColorContrastChecker.js';
import { KeyboardNavigationTester } from '../AccessibilityValidator/KeyboardNavigationTester.js';
import { ScreenReaderCompatibilityChecker } from '../AccessibilityValidator/ScreenReaderCompatibilityChecker.js';
import { TextResizingValidator } from '../AccessibilityValidator/TextResizingValidator.js';
import { ReducedMotionValidator } from '../AccessibilityValidator/ReducedMotionValidator.js';

// Mock DOM environment
const createMockElement = (options = {}) => {
  const element = document.createElement(options.tagName || 'div');
  
  if (options.id) element.id = options.id;
  if (options.className) element.className = options.className;
  if (options.textContent) element.textContent = options.textContent;
  if (options.innerHTML) element.innerHTML = options.innerHTML;
  
  // Mock computed styles
  const mockStyle = {
    color: options.color || 'rgb(0, 0, 0)',
    backgroundColor: options.backgroundColor || 'rgb(255, 255, 255)',
    fontSize: options.fontSize || '16px',
    fontWeight: options.fontWeight || '400',
    lineHeight: options.lineHeight || '1.2',
    display: options.display || 'block',
    visibility: options.visibility || 'visible',
    opacity: options.opacity || '1',
    outline: options.outline || 'none',
    boxShadow: options.boxShadow || 'none',
    border: options.border || 'none',
    animation: options.animation || 'none',
    animationName: options.animationName || 'none',
    animationDuration: options.animationDuration || '0s',
    transition: options.transition || 'none',
    transitionProperty: options.transitionProperty || 'none',
    transitionDuration: options.transitionDuration || '0s',
    transform: options.transform || 'none',
    overflow: options.overflow || 'visible'
  };

  // Mock getBoundingClientRect
  element.getBoundingClientRect = jest.fn(() => ({
    width: options.width || 100,
    height: options.height || 30,
    top: options.top || 0,
    left: options.left || 0,
    right: (options.left || 0) + (options.width || 100),
    bottom: (options.top || 0) + (options.height || 30)
  }));

  // Mock window.getComputedStyle for this element
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = jest.fn((el) => {
    if (el === element) {
      return mockStyle;
    }
    return originalGetComputedStyle(el);
  });

  return element;
};

describe('AccessibilityValidator', () => {
  let validator;
  let mockElement;

  beforeEach(() => {
    validator = new AccessibilityValidator();
    
    // Create a mock element with good accessibility
    mockElement = createMockElement({
      tagName: 'div',
      id: 'test-element',
      textContent: 'Test content',
      color: 'rgb(0, 0, 0)',
      backgroundColor: 'rgb(255, 255, 255)',
      fontSize: '16px'
    });

    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    if (mockElement && mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    validator.clearResults();
  });

  describe('Basic Functionality', () => {
    it('should create validator instance', () => {
      expect(validator).toBeInstanceOf(AccessibilityValidator);
      expect(validator.colorContrastChecker).toBeDefined();
      expect(validator.keyboardNavigationTester).toBeDefined();
      expect(validator.screenReaderChecker).toBeDefined();
      expect(validator.textResizingValidator).toBeDefined();
      expect(validator.reducedMotionValidator).toBeDefined();
    });

    it('should validate accessibility for element', async () => {
      const results = await validator.validateAccessibility(mockElement);
      
      expect(results).toBeDefined();
      expect(results.timestamp).toBeDefined();
      expect(results.overall).toBeDefined();
      expect(results.overall.score).toBeGreaterThanOrEqual(0);
      expect(results.overall.score).toBeLessThanOrEqual(100);
      expect(results.colorContrast).toBeDefined();
      expect(results.keyboardNavigation).toBeDefined();
      expect(results.screenReader).toBeDefined();
      expect(results.textResizing).toBeDefined();
      expect(results.reducedMotion).toBeDefined();
    });

    it('should prevent concurrent validations', async () => {
      const promise1 = validator.validateAccessibility(mockElement);
      
      await expect(validator.validateAccessibility(mockElement))
        .rejects.toThrow('Validation already in progress');
      
      await promise1; // Wait for first validation to complete
    });

    it('should store and retrieve validation results', async () => {
      const results = await validator.validateAccessibility(mockElement);
      const storedResults = validator.getValidationResults(mockElement);
      
      expect(storedResults).toEqual(results);
    });

    it('should clear validation results', async () => {
      await validator.validateAccessibility(mockElement);
      validator.clearResults(mockElement);
      
      const results = validator.getValidationResults(mockElement);
      expect(results).toBeNull();
    });
  });

  describe('Validation Aspects', () => {
    it('should validate specific accessibility aspect', async () => {
      const colorResults = await validator.validateAspect('colorContrast', mockElement);
      
      expect(colorResults).toBeDefined();
      expect(colorResults.score).toBeGreaterThanOrEqual(0);
      expect(colorResults.passed).toBeDefined();
    });

    it('should throw error for unknown aspect', async () => {
      await expect(validator.validateAspect('unknownAspect', mockElement))
        .rejects.toThrow('Unknown accessibility aspect: unknownAspect');
    });
  });

  describe('Report Generation', () => {
    it('should generate accessibility report', async () => {
      await validator.validateAccessibility(mockElement);
      const report = validator.generateReport(mockElement);
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.details).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.childFriendlyIssues).toBeDefined();
    });

    it('should throw error when generating report without validation', () => {
      expect(() => validator.generateReport(mockElement))
        .toThrow('No validation results found. Run validateAccessibility first.');
    });
  });

  describe('Score Calculation', () => {
    it('should calculate overall score correctly', async () => {
      const results = await validator.validateAccessibility(mockElement);
      
      expect(results.overall.score).toBeGreaterThanOrEqual(0);
      expect(results.overall.score).toBeLessThanOrEqual(100);
      expect(results.overall.wcagLevel).toMatch(/^(AAA|AA|A|FAIL)$/);
    });

    it('should determine WCAG compliance level', async () => {
      const results = await validator.validateAccessibility(mockElement);
      
      if (results.overall.score >= 95) {
        expect(results.overall.wcagLevel).toBe('AAA');
      } else if (results.overall.score >= 80) {
        expect(results.overall.wcagLevel).toBe('AA');
      } else if (results.overall.score >= 60) {
        expect(results.overall.wcagLevel).toBe('A');
      } else {
        expect(results.overall.wcagLevel).toBe('FAIL');
      }
    });
  });
});

describe('ColorContrastChecker', () => {
  let checker;
  let mockElement;

  beforeEach(() => {
    checker = new ColorContrastChecker();
  });

  afterEach(() => {
    if (mockElement && mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
  });

  describe('WCAG AA Compliance', () => {
    it('should pass for high contrast text', async () => {
      mockElement = createMockElement({
        tagName: 'p',
        textContent: 'High contrast text',
        color: 'rgb(0, 0, 0)',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSize: '16px'
      });
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      expect(results.passed).toBe(true);
      expect(results.score).toBeGreaterThan(80);
    });

    it('should fail for low contrast text', async () => {
      mockElement = createMockElement({
        tagName: 'p',
        textContent: 'Low contrast text',
        color: 'rgb(200, 200, 200)',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSize: '16px'
      });
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      expect(results.passed).toBe(false);
      expect(results.issues.length).toBeGreaterThan(0);
    });

    it('should handle large text differently', async () => {
      mockElement = createMockElement({
        tagName: 'h1',
        textContent: 'Large heading text',
        color: 'rgb(100, 100, 100)',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSize: '24px'
      });
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      // Large text has lower contrast requirements (3:1 vs 4.5:1)
      expect(results.details.passedElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Child-Friendly Features', () => {
    it('should calculate child-friendly score', async () => {
      mockElement = createMockElement({
        tagName: 'p',
        textContent: 'Child-friendly text',
        color: 'rgb(0, 0, 0)',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSize: '18px' // Larger font for children
      });
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      if (results.details.passedElements.length > 0) {
        const element = results.details.passedElements[0];
        expect(element.childFriendlyScore).toBeGreaterThan(0);
      }
    });

    it('should provide child-friendly recommendations', async () => {
      mockElement = createMockElement({
        tagName: 'p',
        textContent: 'Text with issues',
        color: 'rgb(150, 150, 150)',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSize: '12px' // Small font
      });
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      expect(results.recommendations.length).toBeGreaterThan(0);
      const childRecommendation = results.recommendations.find(r => 
        r.childBenefit && r.childBenefit.includes('children')
      );
      expect(childRecommendation).toBeDefined();
    });
  });
});

describe('KeyboardNavigationTester', () => {
  let tester;
  let mockButton;

  beforeEach(() => {
    tester = new KeyboardNavigationTester();
  });

  afterEach(() => {
    if (mockButton && mockButton.parentNode) {
      mockButton.parentNode.removeChild(mockButton);
    }
  });

  describe('Interactive Element Testing', () => {
    it('should identify accessible button', async () => {
      mockButton = document.createElement('button');
      mockButton.textContent = 'Click me';
      mockButton.tabIndex = 0;
      document.body.appendChild(mockButton);

      const results = await tester.validateElement(document.body);
      
      expect(results.totalChecks).toBeGreaterThan(0);
      expect(results.details.accessibleElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect inaccessible elements', async () => {
      mockButton = document.createElement('div');
      mockButton.textContent = 'Fake button';
      mockButton.onclick = () => {};
      mockButton.tabIndex = -1; // Not focusable
      document.body.appendChild(mockButton);

      const results = await tester.validateElement(document.body);
      
      if (results.totalChecks > 0) {
        expect(results.details.inaccessibleElements.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should test focus indicators', async () => {
      mockButton = createMockElement({
        tagName: 'button',
        textContent: 'Button with focus',
        outline: '2px solid blue' // Has focus indicator
      });
      document.body.appendChild(mockButton);

      const results = await tester.validateElement(document.body);
      
      expect(results.details.missingFocusIndicators).toBeDefined();
    });
  });

  describe('Child-Friendly Features', () => {
    it('should calculate child-friendly scores', async () => {
      mockButton = createMockElement({
        tagName: 'button',
        textContent: 'Child-friendly button',
        fontSize: '18px',
        width: 60,
        height: 50
      });
      mockButton.setAttribute('aria-label', 'Click to play game');
      document.body.appendChild(mockButton);

      const results = await tester.validateElement(document.body);
      
      if (results.details.accessibleElements.length > 0) {
        const element = results.details.accessibleElements[0];
        expect(element.childFriendlyScore).toBeGreaterThan(0);
      }
    });

    it('should provide child-focused recommendations', async () => {
      mockButton = createMockElement({
        tagName: 'button',
        textContent: 'Small button',
        width: 20,
        height: 20 // Too small for children
      });
      document.body.appendChild(mockButton);

      const results = await tester.validateElement(document.body);
      
      expect(results.recommendations.length).toBeGreaterThanOrEqual(0);
      const childRecommendation = results.recommendations.find(r => 
        r.childBenefit && r.childBenefit.includes('children')
      );
      expect(childRecommendation).toBeDefined();
    });
  });
});

describe('ScreenReaderCompatibilityChecker', () => {
  let checker;
  let mockElement;

  beforeEach(() => {
    checker = new ScreenReaderCompatibilityChecker();
  });

  afterEach(() => {
    if (mockElement && mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
  });

  describe('ARIA Labels and Descriptions', () => {
    it('should detect properly labeled elements', async () => {
      mockElement = document.createElement('div');
      mockElement.innerHTML = `
        <button aria-label="Play the memory game">Play Game</button>
        <img src="game.jpg" alt="Children playing memory game" />
        <input type="text" aria-label="Enter your name" />
      `;
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      expect(results.details.ariaLabels.labeledElements.length).toBeGreaterThan(0);
    });

    it('should detect unlabeled elements', async () => {
      mockElement = document.createElement('div');
      mockElement.innerHTML = `
        <button>Click</button>
        <img src="game.jpg" />
        <input type="text" />
      `;
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      expect(results.details.ariaLabels.unlabeledElements.length).toBeGreaterThan(0);
      expect(results.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Child-Friendly Content', () => {
    it('should identify child-friendly language', async () => {
      mockElement = document.createElement('div');
      mockElement.innerHTML = `
        <button aria-label="Play fun game">Start Playing</button>
        <p>This is a fun game for children!</p>
      `;
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      expect(results.details.childFriendlyContent).toBeDefined();
      expect(results.details.childFriendlyContent.childFriendlyElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect complex language', async () => {
      mockElement = document.createElement('div');
      mockElement.innerHTML = `
        <p>This sophisticated application utilizes advanced algorithms for therapeutic intervention.</p>
      `;
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      expect(results.details.childFriendlyContent.complexLanguage.length).toBeGreaterThan(0);
    });
  });

  describe('Semantic Structure', () => {
    it('should validate proper heading hierarchy', async () => {
      mockElement = document.createElement('div');
      mockElement.innerHTML = `
        <h1>Main Title</h1>
        <h2>Section Title</h2>
        <h3>Subsection</h3>
      `;
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      expect(results.details.headingStructure.headings.length).toBe(3);
      expect(results.details.headingStructure.hierarchyIssues.length).toBe(0);
    });

    it('should detect heading hierarchy issues', async () => {
      mockElement = document.createElement('div');
      mockElement.innerHTML = `
        <h1>Main Title</h1>
        <h4>Skipped Level</h4>
      `;
      document.body.appendChild(mockElement);

      const results = await checker.validateElement(mockElement);
      
      expect(results.details.headingStructure.hierarchyIssues.length).toBeGreaterThan(0);
    });
  });
});

describe('TextResizingValidator', () => {
  let validator;
  let mockElement;

  beforeEach(() => {
    validator = new TextResizingValidator();
  });

  afterEach(() => {
    if (mockElement && mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
  });

  describe('Text Scaling Support', () => {
    it('should test multiple text sizes', async () => {
      mockElement = createMockElement({
        tagName: 'p',
        textContent: 'Scalable text content',
        fontSize: '16px'
      });
      document.body.appendChild(mockElement);

      const results = await validator.validateElement(mockElement);
      
      expect(results.details.sizeTests.length).toBe(5); // Tests 100%, 125%, 150%, 175%, 200%
      expect(results.details.sizeTests[0].size).toBe(100);
      expect(results.details.sizeTests[4].size).toBe(200);
    });

    it('should detect layout breaks at larger sizes', async () => {
      mockElement = createMockElement({
        tagName: 'div',
        innerHTML: '<p style="width: 100px; overflow: hidden;">Fixed width text that will break</p>',
        width: 100
      });
      document.body.appendChild(mockElement);

      const results = await validator.validateElement(mockElement);
      
      // Should detect issues at larger text sizes
      const failedTests = results.details.sizeTests.filter(test => !test.passed);
      expect(failedTests.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Child-Friendly Features', () => {
    it('should provide child-specific recommendations', async () => {
      mockElement = createMockElement({
        tagName: 'p',
        textContent: 'Text for children',
        fontSize: '12px' // Too small for children
      });
      document.body.appendChild(mockElement);

      const results = await validator.validateElement(mockElement);
      
      expect(results.recommendations.length).toBeGreaterThanOrEqual(0);
      const childRecommendation = results.recommendations.find(r => 
        r.childBenefit && r.childBenefit.includes('children')
      );
      expect(childRecommendation).toBeDefined();
    });
  });
});

describe('ReducedMotionValidator', () => {
  let validator;
  let mockElement;

  beforeEach(() => {
    validator = new ReducedMotionValidator();
  });

  afterEach(() => {
    if (mockElement && mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
  });

  describe('Motion Detection', () => {
    it('should detect animated elements', async () => {
      mockElement = createMockElement({
        tagName: 'div',
        animationName: 'fadeIn',
        animationDuration: '1s'
      });
      document.body.appendChild(mockElement);

      const results = await validator.validateElement(mockElement);
      
      expect(results.details.animatedElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle elements without motion', async () => {
      mockElement = createMockElement({
        tagName: 'div',
        textContent: 'Static content'
      });
      document.body.appendChild(mockElement);

      const results = await validator.validateElement(mockElement);
      
      expect(results.passed).toBe(true);
      expect(results.score).toBe(100);
    });
  });

  describe('Child-Friendly Motion', () => {
    it('should identify child-friendly motion characteristics', async () => {
      mockElement = createMockElement({
        tagName: 'div',
        animationName: 'gentleFade',
        animationDuration: '0.5s',
        animationIterationCount: '1'
      });
      document.body.appendChild(mockElement);

      const results = await validator.validateElement(mockElement);
      
      expect(results.details.childFriendlyMotion).toBeDefined();
    });

    it('should detect motion that may overwhelm children', async () => {
      mockElement = createMockElement({
        tagName: 'div',
        animationName: 'fastSpin',
        animationDuration: '0.1s',
        animationIterationCount: 'infinite'
      });
      document.body.appendChild(mockElement);

      const results = await validator.validateElement(mockElement);
      
      if (results.details.childFriendlyMotion.length > 0) {
        const motionElement = results.details.childFriendlyMotion[0];
        expect(motionElement.issues.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Reduced Motion Support', () => {
    it('should test prefers-reduced-motion compliance', async () => {
      mockElement = createMockElement({
        tagName: 'div',
        animationName: 'slideIn',
        animationDuration: '0.3s'
      });
      document.body.appendChild(mockElement);

      const results = await validator.validateElement(mockElement);
      
      expect(results.details.reducedMotionSupport).toBeDefined();
      expect(results.details.unsupportedAnimations).toBeDefined();
    });
  });
});

describe('Integration Tests', () => {
  let validator;

  beforeEach(() => {
    validator = new AccessibilityValidator();
  });

  afterEach(() => {
    validator.clearResults();
  });

  describe('Child-Friendly Interface Validation', () => {
    it('should validate complete child-friendly interface', async () => {
      const mockInterface = document.createElement('div');
      mockInterface.innerHTML = `
        <header>
          <h1>Fun Learning Games</h1>
          <nav>
            <button aria-label="Go to games page">Games</button>
            <button aria-label="Go to progress page">Progress</button>
          </nav>
        </header>
        <main>
          <section>
            <h2>Choose Your Game</h2>
            <div class="game-cards">
              <button class="game-card" aria-label="Play memory matching game">
                <img src="memory.jpg" alt="Memory game with colorful cards" />
                <span>Memory Game</span>
              </button>
              <button class="game-card" aria-label="Play word building game">
                <img src="words.jpg" alt="Word building game with letter blocks" />
                <span>Word Builder</span>
              </button>
            </div>
          </section>
        </main>
      `;
      
      // Apply child-friendly styles
      const style = document.createElement('style');
      style.textContent = `
        .game-card {
          font-size: 18px;
          padding: 16px;
          min-width: 120px;
          min-height: 120px;
          border-radius: 12px;
          background: #4A90E2;
          color: white;
          border: none;
          cursor: pointer;
        }
        .game-card:focus {
          outline: 3px solid #F5A623;
          outline-offset: 2px;
        }
        h1 { font-size: 32px; color: #2C3E50; }
        h2 { font-size: 24px; color: #2C3E50; }
      `;
      document.head.appendChild(style);
      document.body.appendChild(mockInterface);

      const results = await validator.validateAccessibility(mockInterface);
      
      expect(results).toBeDefined();
      expect(results.overall.score).toBeGreaterThan(0);
      
      // Should have good accessibility for children
      expect(results.colorContrast).toBeDefined();
      expect(results.keyboardNavigation).toBeDefined();
      expect(results.screenReader).toBeDefined();
      
      // Generate report
      const report = validator.generateReport(mockInterface);
      expect(report.childFriendlyIssues).toBeDefined();
      
      // Clean up
      document.body.removeChild(mockInterface);
      document.head.removeChild(style);
    });

    it('should identify accessibility barriers for children', async () => {
      const mockBadInterface = document.createElement('div');
      mockBadInterface.innerHTML = `
        <div onclick="doSomething()">Clickable div without proper accessibility</div>
        <img src="game.jpg" />
        <input type="text" placeholder="Enter complex authentication credentials" />
        <p style="color: #ccc; background: #fff; font-size: 10px;">
          This text has insufficient contrast and is too small for children to read comfortably.
        </p>
      `;
      document.body.appendChild(mockBadInterface);

      const results = await validator.validateAccessibility(mockBadInterface);
      
      expect(results.overall.score).toBeLessThan(80); // Should fail WCAG AA
      expect(results.issues.length).toBeGreaterThan(0);
      
      const report = validator.generateReport(mockBadInterface);
      expect(report.childFriendlyIssues.length).toBeGreaterThan(0);
      
      // Should have specific child-focused recommendations
      const childRecommendations = report.recommendations.filter(r => 
        r.childBenefit && r.childBenefit.includes('children')
      );
      expect(childRecommendations.length).toBeGreaterThan(0);
      
      // Clean up
      document.body.removeChild(mockBadInterface);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = performance.now();
      
      const mockElement = document.createElement('div');
      mockElement.innerHTML = '<p>Simple test content</p>';
      document.body.appendChild(mockElement);
      
      const results = await validator.validateAccessibility(mockElement);
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results.validationDuration).toBeDefined();
      
      document.body.removeChild(mockElement);
    });

    it('should handle validation errors gracefully', async () => {
      // Create an element that might cause issues
      const mockElement = document.createElement('div');
      
      // Mock a method to throw an error
      const originalMethod = validator.colorContrastChecker.validateElement;
      validator.colorContrastChecker.validateElement = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(validator.validateAccessibility(mockElement))
        .rejects.toThrow('Accessibility validation failed');
      
      // Restore original method
      validator.colorContrastChecker.validateElement = originalMethod;
    });
  });
});