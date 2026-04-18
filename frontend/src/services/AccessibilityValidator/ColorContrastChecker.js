/**
 * ColorContrastChecker
 * 
 * Validates color contrast ratios to ensure WCAG AA compliance (4.5:1 for normal text)
 * Specifically designed for child-friendly interfaces with enhanced readability requirements
 */

class ColorContrastChecker {
  constructor() {
    this.wcagAANormalRatio = 4.5;
    this.wcagAALargeRatio = 3.0;
    this.wcagAAANormalRatio = 7.0;
    this.wcagAAALargeRatio = 4.5;
    this.largeFontSizeThreshold = 18; // 18px or larger is considered large text
    this.largeFontWeightThreshold = 14; // 14px bold is considered large text
  }

  /**
   * Validate color contrast for an element and its children
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
          failedElements: [],
          passedElements: [],
          warnings: []
        }
      };

      // Get all text elements
      const textElements = this._getTextElements(element);
      results.totalChecks = textElements.length;

      if (textElements.length === 0) {
        results.passed = true;
        results.score = 100;
        return results;
      }

      // Check each text element
      for (const textElement of textElements) {
        const contrastResult = await this._checkElementContrast(textElement, options);
        
        if (contrastResult.passed) {
          results.passedChecks++;
          results.details.passedElements.push(contrastResult);
        } else if (contrastResult.isWarning) {
          results.warnings++;
          results.details.warnings.push(contrastResult);
        } else {
          results.failedChecks++;
          results.details.failedElements.push(contrastResult);
          results.issues.push(this._createIssue(contrastResult));
        }
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
      console.error('Color contrast validation failed:', error);
      throw new Error(`Color contrast validation failed: ${error.message}`);
    }
  }

  /**
   * Check contrast ratio for a specific element
   * @private
   */
  async _checkElementContrast(element, options = {}) {
    const computedStyle = window.getComputedStyle(element);
    const textColor = computedStyle.color;
    const backgroundColor = this._getEffectiveBackgroundColor(element);
    
    // Skip if we can't determine colors
    if (!textColor || !backgroundColor || backgroundColor === 'transparent') {
      return {
        element: this._getElementInfo(element),
        passed: false,
        isWarning: true,
        reason: 'Unable to determine background color',
        textColor,
        backgroundColor: backgroundColor || 'unknown'
      };
    }

    const textRgb = this._parseColor(textColor);
    const backgroundRgb = this._parseColor(backgroundColor);
    
    if (!textRgb || !backgroundRgb) {
      return {
        element: this._getElementInfo(element),
        passed: false,
        isWarning: true,
        reason: 'Unable to parse colors',
        textColor,
        backgroundColor
      };
    }

    const contrastRatio = this._calculateContrastRatio(textRgb, backgroundRgb);
    const fontSize = parseFloat(computedStyle.fontSize);
    const fontWeight = computedStyle.fontWeight;
    const isLargeText = this._isLargeText(fontSize, fontWeight);

    // Determine required ratio
    const requiredRatio = isLargeText ? this.wcagAALargeRatio : this.wcagAANormalRatio;
    const aaaRatio = isLargeText ? this.wcagAAALargeRatio : this.wcagAAANormalRatio;
    
    const passed = contrastRatio >= requiredRatio;
    const aaaPassed = contrastRatio >= aaaRatio;

    return {
      element: this._getElementInfo(element),
      passed,
      contrastRatio: Math.round(contrastRatio * 100) / 100,
      requiredRatio,
      aaaRatio,
      aaaPassed,
      isLargeText,
      fontSize,
      fontWeight,
      textColor,
      backgroundColor,
      wcagLevel: aaaPassed ? 'AAA' : (passed ? 'AA' : 'FAIL'),
      childFriendlyScore: this._calculateChildFriendlyScore(contrastRatio, fontSize, isLargeText)
    };
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
          // Skip hidden elements
          const style = window.getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return NodeFilter.FILTER_REJECT;
          }

          // Check if element has text content
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
   * Get effective background color by traversing up the DOM
   * @private
   */
  _getEffectiveBackgroundColor(element) {
    let currentElement = element;
    
    while (currentElement && currentElement !== document.body) {
      const style = window.getComputedStyle(currentElement);
      const bgColor = style.backgroundColor;
      
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        return bgColor;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    // Default to white background
    return 'rgb(255, 255, 255)';
  }

  /**
   * Parse color string to RGB values
   * @private
   */
  _parseColor(colorString) {
    // Handle rgb() and rgba() formats
    const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }

    // Handle hex colors
    const hexMatch = colorString.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16)
      };
    }

    // Handle named colors (basic set)
    const namedColors = {
      black: { r: 0, g: 0, b: 0 },
      white: { r: 255, g: 255, b: 255 },
      red: { r: 255, g: 0, b: 0 },
      green: { r: 0, g: 128, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      gray: { r: 128, g: 128, b: 128 },
      grey: { r: 128, g: 128, b: 128 }
    };

    return namedColors[colorString.toLowerCase()] || null;
  }

  /**
   * Calculate contrast ratio between two colors
   * @private
   */
  _calculateContrastRatio(color1, color2) {
    const luminance1 = this._calculateLuminance(color1);
    const luminance2 = this._calculateLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate relative luminance of a color
   * @private
   */
  _calculateLuminance(rgb) {
    const { r, g, b } = rgb;
    
    // Convert to sRGB
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    // Apply gamma correction
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    // Calculate luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Determine if text is considered large
   * @private
   */
  _isLargeText(fontSize, fontWeight) {
    const weight = parseInt(fontWeight) || 400;
    
    // 18px or larger is large text
    if (fontSize >= this.largeFontSizeThreshold) {
      return true;
    }
    
    // 14px bold is considered large text
    if (fontSize >= this.largeFontWeightThreshold && weight >= 700) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate child-friendly readability score
   * @private
   */
  _calculateChildFriendlyScore(contrastRatio, fontSize, isLargeText) {
    let score = 0;
    
    // Base score from contrast ratio
    if (contrastRatio >= 7.0) {
      score += 40; // Excellent contrast
    } else if (contrastRatio >= 4.5) {
      score += 30; // Good contrast
    } else if (contrastRatio >= 3.0) {
      score += 20; // Acceptable for large text
    } else {
      score += 10; // Poor contrast
    }
    
    // Bonus for larger text (easier for children to read)
    if (fontSize >= 20) {
      score += 30;
    } else if (fontSize >= 16) {
      score += 20;
    } else if (fontSize >= 14) {
      score += 10;
    }
    
    // Bonus for very high contrast (better for children with visual difficulties)
    if (contrastRatio >= 10.0) {
      score += 20;
    } else if (contrastRatio >= 7.0) {
      score += 10;
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
      textContent: element.textContent.trim().substring(0, 50) + (element.textContent.length > 50 ? '...' : ''),
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
   * Create issue object for failed contrast check
   * @private
   */
  _createIssue(contrastResult) {
    const { element, contrastRatio, requiredRatio, isLargeText } = contrastResult;
    
    return {
      type: 'color-contrast',
      severity: contrastRatio < 3.0 ? 'high' : 'medium',
      element: element.selector,
      description: `Text contrast ratio ${contrastRatio}:1 is below WCAG AA requirement of ${requiredRatio}:1`,
      currentRatio: contrastRatio,
      requiredRatio,
      isLargeText,
      childImpact: contrastRatio < 3.0 ? 
        'Children may have significant difficulty reading this text' :
        'Children may have some difficulty reading this text',
      suggestedFix: this._getSuggestedFix(contrastResult)
    };
  }

  /**
   * Get suggested fix for contrast issue
   * @private
   */
  _getSuggestedFix(contrastResult) {
    const { contrastRatio, requiredRatio, textColor, backgroundColor } = contrastResult;
    const improvement = requiredRatio / contrastRatio;
    
    if (improvement > 2) {
      return 'Consider using a much darker text color or much lighter background color';
    } else if (improvement > 1.5) {
      return 'Consider using a darker text color or lighter background color';
    } else {
      return 'Slightly adjust text or background color to improve contrast';
    }
  }

  /**
   * Generate recommendations based on results
   * @private
   */
  _generateRecommendations(results) {
    const recommendations = [];
    
    if (results.failedChecks > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Color Contrast',
        description: `${results.failedChecks} text elements do not meet WCAG AA contrast requirements`,
        action: 'Increase contrast ratios to at least 4.5:1 for normal text and 3:1 for large text',
        childBenefit: 'Better contrast helps children read more easily and reduces eye strain'
      });
    }
    
    if (results.warnings > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Review Unclear Contrast Cases',
        description: `${results.warnings} elements could not be properly evaluated for contrast`,
        action: 'Ensure all text has clearly defined background colors',
        childBenefit: 'Clear backgrounds help children focus on reading content'
      });
    }
    
    // Child-specific recommendations
    const lowChildFriendlyElements = results.details.passedElements.filter(
      el => el.childFriendlyScore < 70
    );
    
    if (lowChildFriendlyElements.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Enhance Child Readability',
        description: `${lowChildFriendlyElements.length} elements could be more child-friendly`,
        action: 'Consider using larger fonts (18px+) and higher contrast ratios (7:1+) for better readability',
        childBenefit: 'Larger, higher-contrast text is easier for children to read and understand'
      });
    }
    
    return recommendations;
  }
}

export { ColorContrastChecker };