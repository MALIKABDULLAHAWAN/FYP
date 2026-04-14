/**
 * KeyboardNavigationTester
 * 
 * Tests comprehensive keyboard accessibility for all interactive elements
 * Ensures children can navigate the interface using keyboard only
 */

class KeyboardNavigationTester {
  constructor() {
    this.interactiveSelectors = [
      'button',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[onclick]'
    ];
    
    this.requiredKeys = ['Tab', 'Enter', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'];
    this.focusHistory = [];
  }

  /**
   * Validate keyboard navigation for an element and its children
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
          accessibleElements: [],
          inaccessibleElements: [],
          focusOrder: [],
          keyboardTraps: [],
          missingFocusIndicators: []
        }
      };

      // Get all interactive elements
      const interactiveElements = this._getInteractiveElements(element);
      results.totalChecks = interactiveElements.length;

      if (interactiveElements.length === 0) {
        results.passed = true;
        results.score = 100;
        return results;
      }

      // Test each interactive element
      for (const interactiveElement of interactiveElements) {
        const elementResult = await this._testElementKeyboardAccess(interactiveElement, options);
        
        if (elementResult.accessible) {
          results.passedChecks++;
          results.details.accessibleElements.push(elementResult);
        } else {
          results.failedChecks++;
          results.details.inaccessibleElements.push(elementResult);
          results.issues.push(this._createAccessibilityIssue(elementResult));
        }
      }

      // Test focus order and navigation flow
      const focusOrderResult = await this._testFocusOrder(interactiveElements);
      results.details.focusOrder = focusOrderResult.focusOrder;
      
      if (focusOrderResult.issues.length > 0) {
        results.issues.push(...focusOrderResult.issues);
        results.failedChecks += focusOrderResult.issues.length;
      }

      // Test for keyboard traps
      const trapResult = await this._testKeyboardTraps(interactiveElements);
      results.details.keyboardTraps = trapResult.traps;
      
      if (trapResult.traps.length > 0) {
        results.issues.push(...trapResult.issues);
        results.failedChecks += trapResult.traps.length;
      }

      // Test focus indicators
      const focusIndicatorResult = await this._testFocusIndicators(interactiveElements);
      results.details.missingFocusIndicators = focusIndicatorResult.missing;
      
      if (focusIndicatorResult.missing.length > 0) {
        results.issues.push(...focusIndicatorResult.issues);
        results.failedChecks += focusIndicatorResult.missing.length;
      }

      // Calculate score
      const totalValidChecks = results.passedChecks + results.failedChecks;
      results.score = totalValidChecks > 0 ? Math.round((results.passedChecks / totalValidChecks) * 100) : 100;
      results.passed = results.score >= 80 && results.failedChecks === 0;

      // Generate recommendations
      results.recommendations = this._generateRecommendations(results);

      const duration = performance.now() - startTime;
      results.validationDuration = Math.round(duration);

      return results;

    } catch (error) {
      console.error('Keyboard navigation validation failed:', error);
      throw new Error(`Keyboard navigation validation failed: ${error.message}`);
    }
  }

  /**
   * Get all interactive elements within the given element
   * @private
   */
  _getInteractiveElements(element) {
    const selector = this.interactiveSelectors.join(', ');
    const elements = Array.from(element.querySelectorAll(selector));
    
    // Filter out hidden elements
    return elements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0' &&
             !el.hasAttribute('disabled');
    });
  }

  /**
   * Test keyboard accessibility for a single element
   * @private
   */
  async _testElementKeyboardAccess(element, options = {}) {
    const elementInfo = this._getElementInfo(element);
    const result = {
      element: elementInfo,
      accessible: true,
      issues: [],
      tabIndex: element.tabIndex,
      canReceiveFocus: false,
      hasKeyboardHandlers: false,
      hasAriaLabel: false,
      childFriendlyScore: 0
    };

    // Test if element can receive focus
    try {
      const originalActiveElement = document.activeElement;
      element.focus();
      result.canReceiveFocus = document.activeElement === element;
      
      // Restore original focus
      if (originalActiveElement && originalActiveElement.focus) {
        originalActiveElement.focus();
      }
    } catch (error) {
      result.canReceiveFocus = false;
      result.issues.push('Element cannot receive focus');
    }

    // Check for keyboard event handlers
    result.hasKeyboardHandlers = this._hasKeyboardHandlers(element);

    // Check for ARIA labels (important for screen readers)
    result.hasAriaLabel = this._hasAriaLabel(element);

    // Check tabindex appropriateness
    if (element.tabIndex < 0 && !this._isNaturallyFocusable(element)) {
      result.issues.push('Element has negative tabindex but is not naturally focusable');
      result.accessible = false;
    }

    // Check if interactive element is keyboard accessible
    if (this._isInteractiveElement(element) && !result.canReceiveFocus) {
      result.issues.push('Interactive element cannot receive keyboard focus');
      result.accessible = false;
    }

    // Test specific keyboard interactions
    const keyboardTestResult = await this._testKeyboardInteractions(element);
    if (!keyboardTestResult.passed) {
      result.issues.push(...keyboardTestResult.issues);
      result.accessible = false;
    }

    // Calculate child-friendly score
    result.childFriendlyScore = this._calculateChildFriendlyScore(result, element);

    return result;
  }

  /**
   * Test keyboard interactions for an element
   * @private
   */
  async _testKeyboardInteractions(element) {
    const result = {
      passed: true,
      issues: []
    };

    // Test Enter key for buttons and links
    if (element.tagName === 'BUTTON' || element.tagName === 'A') {
      const enterSupported = await this._testKeyPress(element, 'Enter');
      if (!enterSupported) {
        result.passed = false;
        result.issues.push('Element does not respond to Enter key');
      }
    }

    // Test Space key for buttons
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
      const spaceSupported = await this._testKeyPress(element, 'Space');
      if (!spaceSupported) {
        result.passed = false;
        result.issues.push('Button does not respond to Space key');
      }
    }

    // Test arrow keys for select elements and custom controls
    if (element.tagName === 'SELECT' || element.getAttribute('role') === 'listbox') {
      const arrowSupported = await this._testArrowKeys(element);
      if (!arrowSupported) {
        result.passed = false;
        result.issues.push('Element does not respond to arrow keys');
      }
    }

    return result;
  }

  /**
   * Test key press on element
   * @private
   */
  async _testKeyPress(element, key) {
    return new Promise((resolve) => {
      let handled = false;
      
      const keyHandler = (event) => {
        if (event.key === key || event.code === key) {
          handled = true;
        }
      };

      element.addEventListener('keydown', keyHandler);
      element.addEventListener('keyup', keyHandler);
      
      // Simulate key press
      const keyEvent = new KeyboardEvent('keydown', {
        key: key,
        code: key,
        bubbles: true,
        cancelable: true
      });
      
      element.dispatchEvent(keyEvent);
      
      // Clean up and resolve
      setTimeout(() => {
        element.removeEventListener('keydown', keyHandler);
        element.removeEventListener('keyup', keyHandler);
        resolve(handled);
      }, 10);
    });
  }

  /**
   * Test arrow key support
   * @private
   */
  async _testArrowKeys(element) {
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    let supported = false;
    
    for (const key of arrowKeys) {
      const keySupported = await this._testKeyPress(element, key);
      if (keySupported) {
        supported = true;
        break;
      }
    }
    
    return supported;
  }

  /**
   * Test focus order and navigation flow
   * @private
   */
  async _testFocusOrder(elements) {
    const result = {
      focusOrder: [],
      issues: []
    };

    // Record current focus order
    const originalActiveElement = document.activeElement;
    
    try {
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        element.focus();
        
        if (document.activeElement === element) {
          result.focusOrder.push({
            index: i,
            element: this._getElementInfo(element),
            tabIndex: element.tabIndex
          });
        }
      }

      // Check for logical focus order
      const tabIndexOrder = result.focusOrder
        .filter(item => item.tabIndex >= 0)
        .sort((a, b) => a.tabIndex - b.tabIndex);

      // Detect focus order issues
      for (let i = 1; i < tabIndexOrder.length; i++) {
        const current = tabIndexOrder[i];
        const previous = tabIndexOrder[i - 1];
        
        if (current.tabIndex === previous.tabIndex && current.index < previous.index) {
          result.issues.push({
            type: 'focus-order',
            severity: 'medium',
            description: 'Focus order may not follow visual layout',
            elements: [previous.element.selector, current.element.selector]
          });
        }
      }

    } finally {
      // Restore original focus
      if (originalActiveElement && originalActiveElement.focus) {
        originalActiveElement.focus();
      }
    }

    return result;
  }

  /**
   * Test for keyboard traps
   * @private
   */
  async _testKeyboardTraps(elements) {
    const result = {
      traps: [],
      issues: []
    };

    // This is a simplified test - in a real implementation,
    // you would simulate Tab navigation through all elements
    // and check if focus can escape from any container

    for (const element of elements) {
      if (this._isPotentialTrap(element)) {
        result.traps.push({
          element: this._getElementInfo(element),
          reason: 'Element may create keyboard trap'
        });
        
        result.issues.push({
          type: 'keyboard-trap',
          severity: 'high',
          description: 'Potential keyboard trap detected',
          element: this._getElementInfo(element).selector,
          childImpact: 'Children may get stuck and unable to navigate away'
        });
      }
    }

    return result;
  }

  /**
   * Test focus indicators
   * @private
   */
  async _testFocusIndicators(elements) {
    const result = {
      missing: [],
      issues: []
    };

    const originalActiveElement = document.activeElement;

    try {
      for (const element of elements) {
        element.focus();
        
        if (document.activeElement === element) {
          const hasFocusIndicator = this._hasFocusIndicator(element);
          
          if (!hasFocusIndicator) {
            result.missing.push({
              element: this._getElementInfo(element),
              reason: 'No visible focus indicator'
            });
            
            result.issues.push({
              type: 'focus-indicator',
              severity: 'high',
              description: 'Interactive element lacks visible focus indicator',
              element: this._getElementInfo(element).selector,
              childImpact: 'Children using keyboard navigation cannot see which element is focused'
            });
          }
        }
      }
    } finally {
      // Restore original focus
      if (originalActiveElement && originalActiveElement.focus) {
        originalActiveElement.focus();
      }
    }

    return result;
  }

  /**
   * Check if element has keyboard event handlers
   * @private
   */
  _hasKeyboardHandlers(element) {
    // Check for common keyboard event attributes
    const keyboardAttributes = ['onkeydown', 'onkeyup', 'onkeypress'];
    
    for (const attr of keyboardAttributes) {
      if (element.hasAttribute(attr) || element[attr]) {
        return true;
      }
    }

    // Check for event listeners (this is limited in what we can detect)
    return false;
  }

  /**
   * Check if element has ARIA label
   * @private
   */
  _hasAriaLabel(element) {
    return element.hasAttribute('aria-label') ||
           element.hasAttribute('aria-labelledby') ||
           element.hasAttribute('aria-describedby') ||
           (element.tagName === 'INPUT' && element.labels && element.labels.length > 0);
  }

  /**
   * Check if element is naturally focusable
   * @private
   */
  _isNaturallyFocusable(element) {
    const naturallyFocusable = [
      'A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'
    ];
    
    return naturallyFocusable.includes(element.tagName) ||
           element.hasAttribute('href') ||
           element.hasAttribute('tabindex');
  }

  /**
   * Check if element is interactive
   * @private
   */
  _isInteractiveElement(element) {
    const interactiveElements = [
      'BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'
    ];
    
    const interactiveRoles = [
      'button', 'link', 'menuitem', 'tab', 'checkbox', 'radio'
    ];
    
    return interactiveElements.includes(element.tagName) ||
           interactiveRoles.includes(element.getAttribute('role')) ||
           element.hasAttribute('onclick') ||
           element.hasAttribute('href');
  }

  /**
   * Check if element might create a keyboard trap
   * @private
   */
  _isPotentialTrap(element) {
    // Check for modal dialogs or overlays
    const role = element.getAttribute('role');
    const ariaModal = element.getAttribute('aria-modal');
    
    return role === 'dialog' || 
           role === 'alertdialog' || 
           ariaModal === 'true' ||
           element.classList.contains('modal') ||
           element.classList.contains('overlay');
  }

  /**
   * Check if element has visible focus indicator
   * @private
   */
  _hasFocusIndicator(element) {
    const computedStyle = window.getComputedStyle(element, ':focus');
    
    // Check for outline
    if (computedStyle.outline && computedStyle.outline !== 'none' && computedStyle.outline !== '0px') {
      return true;
    }
    
    // Check for box-shadow (common focus indicator)
    if (computedStyle.boxShadow && computedStyle.boxShadow !== 'none') {
      return true;
    }
    
    // Check for border changes
    const normalStyle = window.getComputedStyle(element);
    if (computedStyle.border !== normalStyle.border) {
      return true;
    }
    
    // Check for background color changes
    if (computedStyle.backgroundColor !== normalStyle.backgroundColor) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate child-friendly keyboard accessibility score
   * @private
   */
  _calculateChildFriendlyScore(result, element) {
    let score = 0;
    
    // Base accessibility
    if (result.accessible) {
      score += 40;
    }
    
    // Focus capability
    if (result.canReceiveFocus) {
      score += 20;
    }
    
    // ARIA labels (helpful for screen readers)
    if (result.hasAriaLabel) {
      score += 15;
    }
    
    // Keyboard handlers
    if (result.hasKeyboardHandlers) {
      score += 10;
    }
    
    // Child-friendly bonuses
    const style = window.getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize);
    
    // Larger elements are easier for children to target
    if (fontSize >= 18) {
      score += 10;
    }
    
    // Clear focus indicators are important for children
    if (this._hasFocusIndicator(element)) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Get element information for reporting
   * @private
   */
  _getElementInfo(element) {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      role: element.getAttribute('role') || null,
      ariaLabel: element.getAttribute('aria-label') || null,
      textContent: element.textContent ? element.textContent.trim().substring(0, 30) : null,
      selector: this._getElementSelector(element)
    };
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
   * Create accessibility issue object
   * @private
   */
  _createAccessibilityIssue(elementResult) {
    const { element, issues } = elementResult;
    
    return {
      type: 'keyboard-accessibility',
      severity: 'high',
      element: element.selector,
      description: `Interactive element is not keyboard accessible: ${issues.join(', ')}`,
      issues: issues,
      childImpact: 'Children using keyboard navigation cannot interact with this element',
      suggestedFix: this._getSuggestedFix(elementResult)
    };
  }

  /**
   * Get suggested fix for accessibility issue
   * @private
   */
  _getSuggestedFix(elementResult) {
    const { issues } = elementResult;
    const fixes = [];
    
    if (issues.includes('Element cannot receive focus')) {
      fixes.push('Add tabindex="0" to make element focusable');
    }
    
    if (issues.includes('Element does not respond to Enter key')) {
      fixes.push('Add keydown event handler for Enter key');
    }
    
    if (issues.includes('Button does not respond to Space key')) {
      fixes.push('Add keydown event handler for Space key');
    }
    
    if (issues.includes('No visible focus indicator')) {
      fixes.push('Add CSS :focus styles with visible outline or background change');
    }
    
    return fixes.length > 0 ? fixes.join('; ') : 'Review element keyboard accessibility implementation';
  }

  /**
   * Generate recommendations based on results
   * @private
   */
  _generateRecommendations(results) {
    const recommendations = [];
    
    if (results.details.inaccessibleElements.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Fix Keyboard Accessibility',
        description: `${results.details.inaccessibleElements.length} interactive elements are not keyboard accessible`,
        action: 'Ensure all interactive elements can receive focus and respond to keyboard input',
        childBenefit: 'Children using keyboards or assistive devices can access all features'
      });
    }
    
    if (results.details.missingFocusIndicators.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Add Focus Indicators',
        description: `${results.details.missingFocusIndicators.length} elements lack visible focus indicators`,
        action: 'Add clear visual focus indicators using CSS :focus styles',
        childBenefit: 'Children can see which element they are currently focused on'
      });
    }
    
    if (results.details.keyboardTraps.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Remove Keyboard Traps',
        description: `${results.details.keyboardTraps.length} potential keyboard traps detected`,
        action: 'Ensure users can navigate away from all interactive elements',
        childBenefit: 'Children won\'t get stuck in any part of the interface'
      });
    }
    
    if (results.issues.some(issue => issue.type === 'focus-order')) {
      recommendations.push({
        priority: 'medium',
        title: 'Improve Focus Order',
        description: 'Focus order may not follow logical visual layout',
        action: 'Review and adjust tabindex values to match visual layout',
        childBenefit: 'Keyboard navigation follows a predictable, logical order'
      });
    }
    
    return recommendations;
  }
}

export { KeyboardNavigationTester };