/**
 * ScreenReaderCompatibilityChecker
 * 
 * Validates screen reader compatibility and assistive technology support
 * Ensures child-friendly descriptions and proper semantic structure
 */

class ScreenReaderCompatibilityChecker {
  constructor() {
    this.semanticElements = [
      'header', 'nav', 'main', 'section', 'article', 'aside', 'footer',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ];
    
    this.interactiveElements = [
      'button', 'a', 'input', 'select', 'textarea'
    ];
    
    this.requiredAriaAttributes = {
      'button': ['aria-label', 'aria-labelledby', 'textContent'],
      'link': ['aria-label', 'aria-labelledby', 'textContent'],
      'input': ['aria-label', 'aria-labelledby', 'labels'],
      'img': ['alt', 'aria-label', 'aria-labelledby'],
      'form': ['aria-label', 'aria-labelledby'],
      'dialog': ['aria-label', 'aria-labelledby'],
      'region': ['aria-label', 'aria-labelledby']
    };
  }

  /**
   * Validate screen reader compatibility for an element and its children
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
          semanticStructure: null,
          ariaLabels: null,
          headingStructure: null,
          imageAlternatives: null,
          formLabels: null,
          landmarks: null,
          childFriendlyContent: null
        }
      };

      // Run all screen reader compatibility checks
      const checks = await Promise.all([
        this._checkSemanticStructure(element),
        this._checkAriaLabels(element),
        this._checkHeadingStructure(element),
        this._checkImageAlternatives(element),
        this._checkFormLabels(element),
        this._checkLandmarks(element),
        this._checkChildFriendlyContent(element)
      ]);

      const [
        semanticResult,
        ariaResult,
        headingResult,
        imageResult,
        formResult,
        landmarkResult,
        childFriendlyResult
      ] = checks;

      // Compile results
      results.details.semanticStructure = semanticResult;
      results.details.ariaLabels = ariaResult;
      results.details.headingStructure = headingResult;
      results.details.imageAlternatives = imageResult;
      results.details.formLabels = formResult;
      results.details.landmarks = landmarkResult;
      results.details.childFriendlyContent = childFriendlyResult;

      // Calculate overall score
      this._calculateOverallScore(results, checks);

      // Generate issues and recommendations
      results.issues = this._compileIssues(checks);
      results.recommendations = this._generateRecommendations(results);

      const duration = performance.now() - startTime;
      results.validationDuration = Math.round(duration);

      return results;

    } catch (error) {
      console.error('Screen reader compatibility validation failed:', error);
      throw new Error(`Screen reader compatibility validation failed: ${error.message}`);
    }
  }

  /**
   * Check semantic HTML structure
   * @private
   */
  async _checkSemanticStructure(element) {
    const result = {
      passed: true,
      score: 100,
      issues: [],
      details: {
        semanticElements: [],
        nonSemanticElements: [],
        divSpanRatio: 0
      }
    };

    // Find all elements
    const allElements = Array.from(element.querySelectorAll('*'));
    const semanticElements = allElements.filter(el => 
      this.semanticElements.includes(el.tagName.toLowerCase())
    );
    const divSpanElements = allElements.filter(el => 
      ['div', 'span'].includes(el.tagName.toLowerCase())
    );

    result.details.semanticElements = semanticElements.map(el => ({
      tagName: el.tagName.toLowerCase(),
      id: el.id || null,
      className: el.className || null
    }));

    result.details.nonSemanticElements = divSpanElements.length;
    result.details.divSpanRatio = allElements.length > 0 ? 
      divSpanElements.length / allElements.length : 0;

    // Check for overuse of non-semantic elements
    if (result.details.divSpanRatio > 0.7) {
      result.issues.push({
        type: 'semantic-structure',
        severity: 'medium',
        description: 'High ratio of non-semantic elements (div/span)',
        recommendation: 'Use semantic HTML elements like header, nav, main, section'
      });
      result.score -= 20;
      result.passed = false;
    }

    // Check for missing main landmark
    const hasMain = element.querySelector('main') || 
                   element.querySelector('[role="main"]');
    if (!hasMain && element === document.body) {
      result.issues.push({
        type: 'semantic-structure',
        severity: 'high',
        description: 'Missing main landmark',
        recommendation: 'Add <main> element or role="main" to identify main content'
      });
      result.score -= 30;
      result.passed = false;
    }

    return result;
  }

  /**
   * Check ARIA labels and descriptions
   * @private
   */
  async _checkAriaLabels(element) {
    const result = {
      passed: true,
      score: 100,
      issues: [],
      details: {
        labeledElements: [],
        unlabeledElements: [],
        childFriendlyLabels: []
      }
    };

    // Get all interactive elements
    const interactiveElements = Array.from(element.querySelectorAll(
      'button, a[href], input, select, textarea, [role="button"], [role="link"], [onclick]'
    ));

    for (const el of interactiveElements) {
      const labelInfo = this._getElementLabelInfo(el);
      
      if (labelInfo.hasLabel) {
        result.details.labeledElements.push(labelInfo);
        
        // Check if label is child-friendly
        if (this._isChildFriendlyLabel(labelInfo.labelText)) {
          result.details.childFriendlyLabels.push(labelInfo);
        }
      } else {
        result.details.unlabeledElements.push(labelInfo);
        result.issues.push({
          type: 'aria-label',
          severity: 'high',
          description: `Interactive element lacks accessible label: ${labelInfo.selector}`,
          element: labelInfo.selector,
          recommendation: 'Add aria-label, aria-labelledby, or visible text content'
        });
        result.score -= 15;
        result.passed = false;
      }
    }

    // Check images
    const images = Array.from(element.querySelectorAll('img'));
    for (const img of images) {
      if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('role') === 'presentation') {
        result.details.unlabeledElements.push({
          element: img,
          selector: this._getElementSelector(img),
          type: 'image',
          hasLabel: false
        });
        result.issues.push({
          type: 'image-alt',
          severity: 'high',
          description: `Image lacks alternative text: ${this._getElementSelector(img)}`,
          recommendation: 'Add descriptive alt attribute or aria-label'
        });
        result.score -= 10;
        result.passed = false;
      }
    }

    return result;
  }

  /**
   * Check heading structure and hierarchy
   * @private
   */
  async _checkHeadingStructure(element) {
    const result = {
      passed: true,
      score: 100,
      issues: [],
      details: {
        headings: [],
        hierarchyIssues: [],
        missingH1: false
      }
    };

    // Get all headings
    const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    
    result.details.headings = headings.map(h => ({
      level: parseInt(h.tagName.charAt(1)),
      text: h.textContent.trim(),
      selector: this._getElementSelector(h),
      childFriendly: this._isChildFriendlyText(h.textContent)
    }));

    // Check for missing H1
    const hasH1 = headings.some(h => h.tagName === 'H1');
    if (!hasH1 && element === document.body) {
      result.details.missingH1 = true;
      result.issues.push({
        type: 'heading-structure',
        severity: 'high',
        description: 'Missing H1 heading',
        recommendation: 'Add H1 heading to identify main page content'
      });
      result.score -= 25;
      result.passed = false;
    }

    // Check heading hierarchy
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = parseInt(headings[i].tagName.charAt(1));
      const previousLevel = parseInt(headings[i - 1].tagName.charAt(1));
      
      if (currentLevel > previousLevel + 1) {
        const issue = {
          type: 'heading-hierarchy',
          severity: 'medium',
          description: `Heading level skipped: ${headings[i - 1].tagName} to ${headings[i].tagName}`,
          elements: [
            this._getElementSelector(headings[i - 1]),
            this._getElementSelector(headings[i])
          ]
        };
        result.details.hierarchyIssues.push(issue);
        result.issues.push(issue);
        result.score -= 10;
        result.passed = false;
      }
    }

    return result;
  }

  /**
   * Check image alternative text
   * @private
   */
  async _checkImageAlternatives(element) {
    const result = {
      passed: true,
      score: 100,
      issues: [],
      details: {
        imagesWithAlt: [],
        imagesWithoutAlt: [],
        decorativeImages: [],
        childFriendlyDescriptions: []
      }
    };

    const images = Array.from(element.querySelectorAll('img'));
    
    for (const img of images) {
      const imageInfo = {
        src: img.src,
        alt: img.alt,
        ariaLabel: img.getAttribute('aria-label'),
        role: img.getAttribute('role'),
        selector: this._getElementSelector(img)
      };

      if (img.getAttribute('role') === 'presentation' || img.alt === '') {
        result.details.decorativeImages.push(imageInfo);
      } else if (img.alt || img.getAttribute('aria-label')) {
        result.details.imagesWithAlt.push(imageInfo);
        
        // Check if description is child-friendly
        const description = img.alt || img.getAttribute('aria-label');
        if (this._isChildFriendlyText(description)) {
          result.details.childFriendlyDescriptions.push(imageInfo);
        }
      } else {
        result.details.imagesWithoutAlt.push(imageInfo);
        result.issues.push({
          type: 'image-alt',
          severity: 'high',
          description: `Image missing alternative text: ${imageInfo.selector}`,
          recommendation: 'Add descriptive alt attribute explaining what children see in the image'
        });
        result.score -= 15;
        result.passed = false;
      }
    }

    return result;
  }

  /**
   * Check form labels and associations
   * @private
   */
  async _checkFormLabels(element) {
    const result = {
      passed: true,
      score: 100,
      issues: [],
      details: {
        labeledInputs: [],
        unlabeledInputs: [],
        childFriendlyLabels: []
      }
    };

    const formControls = Array.from(element.querySelectorAll(
      'input:not([type="hidden"]), select, textarea'
    ));

    for (const control of formControls) {
      const labelInfo = this._getFormControlLabelInfo(control);
      
      if (labelInfo.hasLabel) {
        result.details.labeledInputs.push(labelInfo);
        
        if (this._isChildFriendlyText(labelInfo.labelText)) {
          result.details.childFriendlyLabels.push(labelInfo);
        }
      } else {
        result.details.unlabeledInputs.push(labelInfo);
        result.issues.push({
          type: 'form-label',
          severity: 'high',
          description: `Form control lacks label: ${labelInfo.selector}`,
          recommendation: 'Add <label> element or aria-label with child-friendly text'
        });
        result.score -= 20;
        result.passed = false;
      }
    }

    return result;
  }

  /**
   * Check landmark regions
   * @private
   */
  async _checkLandmarks(element) {
    const result = {
      passed: true,
      score: 100,
      issues: [],
      details: {
        landmarks: [],
        missingLandmarks: []
      }
    };

    // Check for common landmarks
    const landmarkSelectors = {
      'banner': 'header, [role="banner"]',
      'navigation': 'nav, [role="navigation"]',
      'main': 'main, [role="main"]',
      'contentinfo': 'footer, [role="contentinfo"]',
      'complementary': 'aside, [role="complementary"]'
    };

    for (const [landmarkType, selector] of Object.entries(landmarkSelectors)) {
      const landmarks = Array.from(element.querySelectorAll(selector));
      
      if (landmarks.length > 0) {
        result.details.landmarks.push({
          type: landmarkType,
          count: landmarks.length,
          elements: landmarks.map(el => this._getElementSelector(el))
        });
      } else if (element === document.body && ['main', 'navigation'].includes(landmarkType)) {
        result.details.missingLandmarks.push(landmarkType);
        result.issues.push({
          type: 'landmark',
          severity: 'medium',
          description: `Missing ${landmarkType} landmark`,
          recommendation: `Add ${selector.split(',')[0]} element to improve navigation`
        });
        result.score -= 15;
        result.passed = false;
      }
    }

    return result;
  }

  /**
   * Check child-friendly content and language
   * @private
   */
  async _checkChildFriendlyContent(element) {
    const result = {
      passed: true,
      score: 100,
      issues: [],
      details: {
        childFriendlyElements: [],
        complexLanguage: [],
        missingDescriptions: []
      }
    };

    // Check all text content for child-friendliness
    const textElements = Array.from(element.querySelectorAll('*')).filter(el => {
      return el.textContent && el.textContent.trim().length > 0 &&
             el.children.length === 0; // Only leaf text nodes
    });

    for (const textEl of textElements) {
      const text = textEl.textContent.trim();
      const isChildFriendly = this._isChildFriendlyText(text);
      
      if (isChildFriendly) {
        result.details.childFriendlyElements.push({
          element: this._getElementSelector(textEl),
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          score: this._calculateChildFriendlyScore(text)
        });
      } else {
        result.details.complexLanguage.push({
          element: this._getElementSelector(textEl),
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          issues: this._identifyLanguageIssues(text)
        });
        result.score -= 5;
      }
    }

    // Check for missing descriptions on complex interactive elements
    const complexElements = Array.from(element.querySelectorAll(
      '[role="dialog"], [role="tabpanel"], [role="menu"]'
    ));

    for (const complexEl of complexElements) {
      if (!complexEl.getAttribute('aria-describedby') && 
          !complexEl.getAttribute('aria-description')) {
        result.details.missingDescriptions.push({
          element: this._getElementSelector(complexEl),
          role: complexEl.getAttribute('role')
        });
        result.issues.push({
          type: 'missing-description',
          severity: 'medium',
          description: `Complex element lacks description: ${this._getElementSelector(complexEl)}`,
          recommendation: 'Add aria-describedby or aria-description with child-friendly explanation'
        });
        result.score -= 10;
        result.passed = false;
      }
    }

    return result;
  }

  /**
   * Get element label information
   * @private
   */
  _getElementLabelInfo(element) {
    const info = {
      element: element,
      selector: this._getElementSelector(element),
      hasLabel: false,
      labelText: '',
      labelSource: null
    };

    // Check aria-label
    if (element.getAttribute('aria-label')) {
      info.hasLabel = true;
      info.labelText = element.getAttribute('aria-label');
      info.labelSource = 'aria-label';
    }
    // Check aria-labelledby
    else if (element.getAttribute('aria-labelledby')) {
      const labelId = element.getAttribute('aria-labelledby');
      const labelElement = document.getElementById(labelId);
      if (labelElement) {
        info.hasLabel = true;
        info.labelText = labelElement.textContent.trim();
        info.labelSource = 'aria-labelledby';
      }
    }
    // Check text content
    else if (element.textContent && element.textContent.trim()) {
      info.hasLabel = true;
      info.labelText = element.textContent.trim();
      info.labelSource = 'textContent';
    }
    // Check associated labels (for form controls)
    else if (element.labels && element.labels.length > 0) {
      info.hasLabel = true;
      info.labelText = element.labels[0].textContent.trim();
      info.labelSource = 'label';
    }

    return info;
  }

  /**
   * Get form control label information
   * @private
   */
  _getFormControlLabelInfo(control) {
    const info = {
      element: control,
      selector: this._getElementSelector(control),
      hasLabel: false,
      labelText: '',
      labelSource: null
    };

    // Check for associated label
    if (control.labels && control.labels.length > 0) {
      info.hasLabel = true;
      info.labelText = control.labels[0].textContent.trim();
      info.labelSource = 'label';
    }
    // Check aria-label
    else if (control.getAttribute('aria-label')) {
      info.hasLabel = true;
      info.labelText = control.getAttribute('aria-label');
      info.labelSource = 'aria-label';
    }
    // Check aria-labelledby
    else if (control.getAttribute('aria-labelledby')) {
      const labelId = control.getAttribute('aria-labelledby');
      const labelElement = document.getElementById(labelId);
      if (labelElement) {
        info.hasLabel = true;
        info.labelText = labelElement.textContent.trim();
        info.labelSource = 'aria-labelledby';
      }
    }
    // Check placeholder (not ideal but better than nothing)
    else if (control.placeholder) {
      info.hasLabel = true;
      info.labelText = control.placeholder;
      info.labelSource = 'placeholder';
    }

    return info;
  }

  /**
   * Check if label text is child-friendly
   * @private
   */
  _isChildFriendlyLabel(text) {
    if (!text || text.length === 0) return false;
    
    // Child-friendly characteristics
    const isShort = text.length <= 50;
    const hasSimpleWords = !this._hasComplexWords(text);
    const isPositive = !this._hasNegativeLanguage(text);
    
    return isShort && hasSimpleWords && isPositive;
  }

  /**
   * Check if text is child-friendly
   * @private
   */
  _isChildFriendlyText(text) {
    if (!text || text.length === 0) return false;
    
    const issues = this._identifyLanguageIssues(text);
    return issues.length === 0;
  }

  /**
   * Identify language issues in text
   * @private
   */
  _identifyLanguageIssues(text) {
    const issues = [];
    
    // Check for complex words
    if (this._hasComplexWords(text)) {
      issues.push('Contains complex words that may be difficult for children');
    }
    
    // Check for negative language
    if (this._hasNegativeLanguage(text)) {
      issues.push('Contains negative or scary language');
    }
    
    // Check for technical jargon
    if (this._hasTechnicalJargon(text)) {
      issues.push('Contains technical terms that children may not understand');
    }
    
    // Check sentence length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.split(' ').length > 15);
    if (longSentences.length > 0) {
      issues.push('Contains sentences that may be too long for children');
    }
    
    return issues;
  }

  /**
   * Check for complex words
   * @private
   */
  _hasComplexWords(text) {
    const complexWords = [
      'authentication', 'configuration', 'implementation', 'administration',
      'sophisticated', 'comprehensive', 'functionality', 'accessibility'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    return words.some(word => 
      complexWords.includes(word) || 
      word.length > 12 ||
      (word.length > 8 && word.includes('tion'))
    );
  }

  /**
   * Check for negative language
   * @private
   */
  _hasNegativeLanguage(text) {
    const negativeWords = [
      'error', 'fail', 'wrong', 'bad', 'scary', 'dangerous', 'warning',
      'problem', 'issue', 'broken', 'invalid', 'forbidden'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    return words.some(word => negativeWords.includes(word));
  }

  /**
   * Check for technical jargon
   * @private
   */
  _hasTechnicalJargon(text) {
    const technicalTerms = [
      'API', 'URL', 'HTTP', 'JSON', 'XML', 'CSS', 'HTML', 'JavaScript',
      'database', 'server', 'client', 'protocol', 'algorithm', 'framework'
    ];
    
    const words = text.split(/\s+/);
    return words.some(word => technicalTerms.includes(word));
  }

  /**
   * Calculate child-friendly score for text
   * @private
   */
  _calculateChildFriendlyScore(text) {
    let score = 100;
    
    const issues = this._identifyLanguageIssues(text);
    score -= issues.length * 20;
    
    // Bonus for positive, encouraging language
    const positiveWords = ['fun', 'play', 'great', 'awesome', 'good', 'nice', 'happy'];
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    score += Math.min(positiveCount * 5, 20);
    
    return Math.max(0, Math.min(100, score));
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
   * Calculate overall score from all checks
   * @private
   */
  _calculateOverallScore(results, checks) {
    let totalScore = 0;
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;

    checks.forEach(check => {
      if (check && check.score !== undefined) {
        totalScore += check.score;
        totalChecks++;
        if (check.passed) {
          passedChecks++;
        } else {
          failedChecks++;
        }
      }
    });

    results.score = totalChecks > 0 ? Math.round(totalScore / totalChecks) : 100;
    results.totalChecks = totalChecks;
    results.passedChecks = passedChecks;
    results.failedChecks = failedChecks;
    results.passed = results.score >= 80 && failedChecks === 0;
  }

  /**
   * Compile issues from all checks
   * @private
   */
  _compileIssues(checks) {
    const allIssues = [];
    
    checks.forEach(check => {
      if (check && check.issues) {
        allIssues.push(...check.issues);
      }
    });
    
    return allIssues;
  }

  /**
   * Generate recommendations based on results
   * @private
   */
  _generateRecommendations(results) {
    const recommendations = [];
    
    // Semantic structure recommendations
    if (results.details.semanticStructure && !results.details.semanticStructure.passed) {
      recommendations.push({
        priority: 'medium',
        title: 'Improve Semantic Structure',
        description: 'Use more semantic HTML elements for better screen reader navigation',
        action: 'Replace generic div/span elements with semantic alternatives like header, nav, main, section',
        childBenefit: 'Screen readers can better explain page structure to children'
      });
    }
    
    // ARIA labels recommendations
    if (results.details.ariaLabels && results.details.ariaLabels.issues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Add Missing Labels',
        description: `${results.details.ariaLabels.issues.length} elements lack accessible labels`,
        action: 'Add aria-label or aria-labelledby attributes with child-friendly descriptions',
        childBenefit: 'Screen readers can tell children what each button and element does'
      });
    }
    
    // Heading structure recommendations
    if (results.details.headingStructure && !results.details.headingStructure.passed) {
      recommendations.push({
        priority: 'medium',
        title: 'Fix Heading Structure',
        description: 'Heading hierarchy has gaps or missing H1',
        action: 'Ensure proper heading order (H1, H2, H3) without skipping levels',
        childBenefit: 'Screen readers can help children navigate content by headings'
      });
    }
    
    // Child-friendly content recommendations
    if (results.details.childFriendlyContent && results.details.childFriendlyContent.issues.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Simplify Language',
        description: 'Some content uses complex language not suitable for children',
        action: 'Use simple, positive words and shorter sentences appropriate for ages 3-12',
        childBenefit: 'Children can better understand instructions and content'
      });
    }
    
    return recommendations;
  }
}

export { ScreenReaderCompatibilityChecker };