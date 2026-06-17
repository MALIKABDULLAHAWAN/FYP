/**
 * TextResizingValidator
 * 
 * Validates text resizing support up to 200% without loss of functionality
 * Ensures scalability for children who need larger fonts
 */

class TextResizingValidator {
  constructor() {
    this.testSizes = [100, 125, 150, 175, 200]; // Percentage sizes to test
    this.originalStyles = new Map();
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    };
  }

  /**
   * Validate text resizing support for an element and its children
   * @param {HTMLElement} element - Element to validate
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation results
   */
  async validateElement(element, options = {}) {
    const startTime = performance.now();
    
    try {
      const results = {
        passed: false,
        score: 0,
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warnings: 0,
        issues: [],
        recommendations: [],
        details: {
          sizeTests: [],
          layoutIssues: [],
          overflowIssues: [],
          readabilityIssues: [],
          interactionIssues: []
        }
      };

      // Store original state
      await this._storeOriginalState(element);

      // Test each size level
      for (const size of this.testSizes) {
        const sizeResult = await this._testTextSize(element, size, options);
        results.details.sizeTests.push(sizeResult);
        results.totalChecks++;

        if (sizeResult.passed) {
          results.passedChecks++;
        } else {
          results.failedChecks++;
          results.issues.push(...sizeResult.issues);
        }
      }

      // Restore original state
      await this._restoreOriginalState(element);

      // Calculate score
      results.score = results.totalChecks > 0 ? 
        Math.round((results.passedChecks / results.totalChecks) * 100) : 100;
      results.passed = results.score >= 80;

      // Compile detailed issues
      this._compileDetailedIssues(results);

      // Generate recommendations
      results.recommendations = this._generateRecommendations(results);

      const duration = performance.now() - startTime;
      results.validationDuration = Math.round(duration);

      return results;

    } catch (error) {
      console.error('Text resizing validation failed:', error);
      throw new Error(`Text resizing validation failed: ${error.message}`);
    }
  }

  /**
   * Store original styles before testing
   * @private
   */
  async _storeOriginalState(element) {
    this.originalStyles.clear();
    
    // Store document font size
    this.originalStyles.set('document', {
      fontSize: document.documentElement.style.fontSize || '16px'
    });

    // Store styles for all text elements
    const textElements = this._getTextElements(element);
    textElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      this.originalStyles.set(el, {
        fontSize: computedStyle.fontSize,
        lineHeight: computedStyle.lineHeight,
        width: computedStyle.width,
        height: computedStyle.height,
        overflow: computedStyle.overflow,
        position: el.getBoundingClientRect()
      });
    });
  }

  /**
   * Restore original styles after testing
   * @private
   */
  async _restoreOriginalState(element) {
    // Restore document font size
    const docStyles = this.originalStyles.get('document');
    if (docStyles) {
      document.documentElement.style.fontSize = docStyles.fontSize;
    }

    // Allow time for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Test text at specific size
   * @private
   */
  async _testTextSize(element, sizePercentage, options = {}) {
    const result = {
      size: sizePercentage,
      passed: true,
      issues: [],
      details: {
        layoutBreaks: [],
        overflows: [],
        readabilityIssues: [],
        interactionIssues: []
      }
    };

    try {
      // Apply text size
      await this._applyTextSize(sizePercentage);

      // Test layout integrity
      const layoutResult = await this._testLayoutIntegrity(element, sizePercentage);
      if (!layoutResult.passed) {
        result.passed = false;
        result.issues.push(...layoutResult.issues);
        result.details.layoutBreaks = layoutResult.breaks;
      }

      // Test for overflow issues
      const overflowResult = await this._testOverflowIssues(element, sizePercentage);
      if (!overflowResult.passed) {
        result.passed = false;
        result.issues.push(...overflowResult.issues);
        result.details.overflows = overflowResult.overflows;
      }

      // Test readability
      const readabilityResult = await this._testReadability(element, sizePercentage);
      if (!readabilityResult.passed) {
        result.passed = false;
        result.issues.push(...readabilityResult.issues);
        result.details.readabilityIssues = readabilityResult.issues;
      }

      // Test interactive elements
      const interactionResult = await this._testInteractiveElements(element, sizePercentage);
      if (!interactionResult.passed) {
        result.passed = false;
        result.issues.push(...interactionResult.issues);
        result.details.interactionIssues = interactionResult.issues;
      }

    } catch (error) {
      result.passed = false;
      result.issues.push({
        type: 'test-error',
        severity: 'high',
        description: `Failed to test size ${sizePercentage}%: ${error.message}`
      });
    }

    return result;
  }

  /**
   * Apply text size to document
   * @private
   */
  async _applyTextSize(sizePercentage) {
    const baseFontSize = 16; // Default browser font size
    const newFontSize = (baseFontSize * sizePercentage) / 100;
    
    document.documentElement.style.fontSize = `${newFontSize}px`;
    
    // Allow time for styles to apply and layout to update
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Test layout integrity at different text sizes
   * @private
   */
  async _testLayoutIntegrity(element, sizePercentage) {
    const result = {
      passed: true,
      issues: [],
      breaks: []
    };

    const textElements = this._getTextElements(element);
    
    for (const textEl of textElements) {
      const originalData = this.originalStyles.get(textEl);
      if (!originalData) continue;

      const currentRect = textEl.getBoundingClientRect();
      const originalRect = originalData.position;

      // Check for significant layout shifts
      const widthChange = Math.abs(currentRect.width - originalRect.width) / originalRect.width;
      const heightChange = Math.abs(currentRect.height - originalRect.height) / originalRect.height;

      if (widthChange > 0.5) { // More than 50% width change
        const issue = {
          type: 'layout-break',
          severity: 'high',
          description: `Element width changed significantly at ${sizePercentage}%`,
          element: this._getElementSelector(textEl),
          originalWidth: Math.round(originalRect.width),
          newWidth: Math.round(currentRect.width),
          changePercentage: Math.round(widthChange * 100)
        };
        result.issues.push(issue);
        result.breaks.push(issue);
        result.passed = false;
      }

      // Check if element is pushed off screen
      if (currentRect.right > window.innerWidth || currentRect.bottom > window.innerHeight) {
        const issue = {
          type: 'off-screen',
          severity: 'high',
          description: `Element pushed off screen at ${sizePercentage}%`,
          element: this._getElementSelector(textEl),
          position: {
            right: Math.round(currentRect.right),
            bottom: Math.round(currentRect.bottom)
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        };
        result.issues.push(issue);
        result.breaks.push(issue);
        result.passed = false;
      }
    }

    return result;
  }

  /**
   * Test for overflow issues
   * @private
   */
  async _testOverflowIssues(element, sizePercentage) {
    const result = {
      passed: true,
      issues: [],
      overflows: []
    };

    const containers = Array.from(element.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.overflow === 'hidden' || 
             style.overflowX === 'hidden' || 
             style.overflowY === 'hidden';
    });

    for (const container of containers) {
      const containerRect = container.getBoundingClientRect();
      const children = Array.from(container.children);

      for (const child of children) {
        const childRect = child.getBoundingClientRect();
        
        // Check if child overflows container
        if (childRect.right > containerRect.right + 5 || // 5px tolerance
            childRect.bottom > containerRect.bottom + 5) {
          
          const issue = {
            type: 'overflow',
            severity: 'medium',
            description: `Content overflows container at ${sizePercentage}%`,
            container: this._getElementSelector(container),
            overflowingElement: this._getElementSelector(child),
            overflow: {
              horizontal: Math.max(0, childRect.right - containerRect.right),
              vertical: Math.max(0, childRect.bottom - containerRect.bottom)
            }
          };
          
          result.issues.push(issue);
          result.overflows.push(issue);
          result.passed = false;
        }
      }
    }

    return result;
  }

  /**
   * Test readability at different sizes
   * @private
   */
  async _testReadability(element, sizePercentage) {
    const result = {
      passed: true,
      issues: []
    };

    const textElements = this._getTextElements(element);
    
    for (const textEl of textElements) {
      const computedStyle = window.getComputedStyle(textEl);
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2;
      
      // Check minimum readable size for children
      const minChildFontSize = 12; // Minimum readable size for children
      if (fontSize < minChildFontSize) {
        result.issues.push({
          type: 'readability',
          severity: 'medium',
          description: `Text too small for children at ${sizePercentage}%`,
          element: this._getElementSelector(textEl),
          fontSize: Math.round(fontSize),
          minRecommended: minChildFontSize,
          childImpact: 'Children may have difficulty reading this text'
        });
        result.passed = false;
      }

      // Check line height for readability
      const lineHeightRatio = lineHeight / fontSize;
      if (lineHeightRatio < 1.2) {
        result.issues.push({
          type: 'line-height',
          severity: 'low',
          description: `Line height too tight at ${sizePercentage}%`,
          element: this._getElementSelector(textEl),
          lineHeightRatio: Math.round(lineHeightRatio * 100) / 100,
          minRecommended: 1.2,
          childImpact: 'Tight line spacing makes text harder for children to read'
        });
        result.passed = false;
      }

      // Check for text overlapping
      const textRect = textEl.getBoundingClientRect();
      const siblings = Array.from(textEl.parentElement?.children || [])
        .filter(el => el !== textEl && el.textContent?.trim());

      for (const sibling of siblings) {
        const siblingRect = sibling.getBoundingClientRect();
        if (this._rectsOverlap(textRect, siblingRect)) {
          result.issues.push({
            type: 'text-overlap',
            severity: 'high',
            description: `Text elements overlap at ${sizePercentage}%`,
            elements: [
              this._getElementSelector(textEl),
              this._getElementSelector(sibling)
            ],
            childImpact: 'Overlapping text is confusing and hard for children to read'
          });
          result.passed = false;
          break; // Only report once per element
        }
      }
    }

    return result;
  }

  /**
   * Test interactive elements at different sizes
   * @private
   */
  async _testInteractiveElements(element, sizePercentage) {
    const result = {
      passed: true,
      issues: []
    };

    const interactiveElements = Array.from(element.querySelectorAll(
      'button, a[href], input, select, textarea, [role="button"], [onclick]'
    ));

    for (const interactive of interactiveElements) {
      const rect = interactive.getBoundingClientRect();
      const minTouchTarget = 44; // WCAG minimum touch target size

      // Check touch target size
      if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
        result.issues.push({
          type: 'touch-target',
          severity: 'high',
          description: `Interactive element too small at ${sizePercentage}%`,
          element: this._getElementSelector(interactive),
          currentSize: {
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          minRequired: minTouchTarget,
          childImpact: 'Small buttons are difficult for children to tap accurately'
        });
        result.passed = false;
      }

      // Check if element is still clickable (not covered by other elements)
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const elementAtPoint = document.elementFromPoint(centerX, centerY);
      
      if (elementAtPoint && !interactive.contains(elementAtPoint) && elementAtPoint !== interactive) {
        result.issues.push({
          type: 'interaction-blocked',
          severity: 'high',
          description: `Interactive element covered by other content at ${sizePercentage}%`,
          element: this._getElementSelector(interactive),
          coveringElement: this._getElementSelector(elementAtPoint),
          childImpact: 'Children cannot click buttons that are covered by other elements'
        });
        result.passed = false;
      }
    }

    return result;
  }

  /**
   * Get all text-containing elements
   * @private
   */
  _getTextElements(element) {
    const textElements = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const style = window.getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }

          const hasText = node.textContent && node.textContent.trim().length > 0;
          const hasDirectText = Array.from(node.childNodes).some(child => 
            child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0
          );

          return (hasText && hasDirectText) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textElements.push(node);
    }

    return textElements;
  }

  /**
   * Check if two rectangles overlap
   * @private
   */
  _rectsOverlap(rect1, rect2) {
    return !(rect1.right <= rect2.left || 
             rect2.right <= rect1.left || 
             rect1.bottom <= rect2.top || 
             rect2.bottom <= rect1.top);
  }

  /**
   * Get CSS selector for element
   * @private
   */
  _getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) return `${element.tagName.toLowerCase()}.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Compile detailed issues from all size tests
   * @private
   */
  _compileDetailedIssues(results) {
    const allLayoutIssues = [];
    const allOverflowIssues = [];
    const allReadabilityIssues = [];
    const allInteractionIssues = [];

    results.details.sizeTests.forEach(test => {
      allLayoutIssues.push(...test.details.layoutBreaks);
      allOverflowIssues.push(...test.details.overflows);
      allReadabilityIssues.push(...test.details.readabilityIssues);
      allInteractionIssues.push(...test.details.interactionIssues);
    });

    results.details.layoutIssues = allLayoutIssues;
    results.details.overflowIssues = allOverflowIssues;
    results.details.readabilityIssues = allReadabilityIssues;
    results.details.interactionIssues = allInteractionIssues;
  }

  /**
   * Generate recommendations based on results
   * @private
   */
  _generateRecommendations(results) {
    const recommendations = [];

    if (results.details.layoutIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Fix Layout Breaks',
        description: `${results.details.layoutIssues.length} elements break layout when text is enlarged`,
        action: 'Use flexible layouts with relative units (em, rem, %) instead of fixed pixel values',
        childBenefit: 'Children who need larger text can still use all features without layout problems'
      });
    }

    if (results.details.overflowIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Prevent Content Overflow',
        description: `${results.details.overflowIssues.length} elements overflow their containers when text is enlarged`,
        action: 'Use overflow: auto or overflow: scroll instead of overflow: hidden, or increase container sizes',
        childBenefit: 'All content remains visible and accessible when children use larger text'
      });
    }

    if (results.details.interactionIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Maintain Interactive Elements',
        description: `${results.details.interactionIssues.length} buttons or links become unusable when text is enlarged`,
        action: 'Ensure interactive elements maintain minimum 44px touch targets and remain clickable',
        childBenefit: 'Children can still tap buttons and links even with larger text'
      });
    }

    if (results.details.readabilityIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Improve Text Readability',
        description: `${results.details.readabilityIssues.length} text elements have readability issues when enlarged`,
        action: 'Increase line height to at least 1.2 and ensure minimum font sizes for children',
        childBenefit: 'Text remains comfortable and easy to read at all sizes'
      });
    }

    // Child-specific recommendations
    const criticalSizes = results.details.sizeTests.filter(test => 
      test.size >= 150 && !test.passed
    );

    if (criticalSizes.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Support 150%+ Text Scaling',
        description: 'Layout fails at text sizes commonly needed by children with visual difficulties',
        action: 'Test and fix layout at 150%, 175%, and 200% text sizes',
        childBenefit: 'Children with visual impairments can use the application with their preferred text size'
      });
    }

    return recommendations;
  }
}

export { TextResizingValidator };