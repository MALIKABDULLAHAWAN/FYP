/**
 * ReducedMotionValidator
 * 
 * Validates that animations respect prefers-reduced-motion preference
 * Ensures motion-sensitive children have calm, non-distracting alternatives
 */

class ReducedMotionValidator {
  constructor() {
    this.animationProperties = [
      'animation', 'animation-name', 'animation-duration', 'animation-timing-function',
      'animation-delay', 'animation-iteration-count', 'animation-direction',
      'animation-fill-mode', 'animation-play-state'
    ];
    
    this.transitionProperties = [
      'transition', 'transition-property', 'transition-duration',
      'transition-timing-function', 'transition-delay'
    ];
    
    this.transformProperties = [
      'transform', 'transform-origin', 'transform-style'
    ];
    
    this.motionSensitiveProperties = [
      ...this.animationProperties,
      ...this.transitionProperties,
      ...this.transformProperties
    ];
  }

  /**
   * Validate reduced motion support for an element and its children
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
          animatedElements: [],
          reducedMotionSupport: [],
          unsupportedAnimations: [],
          childFriendlyMotion: [],
          motionIntensity: null
        }
      };

      // Test with reduced motion preference enabled
      const reducedMotionResults = await this._testWithReducedMotion(element, true);
      
      // Test with reduced motion preference disabled
      const normalMotionResults = await this._testWithReducedMotion(element, false);
      
      // Compare results to identify issues
      const comparisonResults = this._compareMotionStates(normalMotionResults, reducedMotionResults);
      
      // Compile results
      results.details.animatedElements = normalMotionResults.animatedElements;
      results.details.reducedMotionSupport = comparisonResults.supportedElements;
      results.details.unsupportedAnimations = comparisonResults.unsupportedElements;
      results.details.childFriendlyMotion = this._analyzeChildFriendlyMotion(normalMotionResults.animatedElements);
      results.details.motionIntensity = this._calculateMotionIntensity(normalMotionResults.animatedElements);

      // Calculate scores
      results.totalChecks = normalMotionResults.animatedElements.length;
      results.passedChecks = comparisonResults.supportedElements.length;
      results.failedChecks = comparisonResults.unsupportedElements.length;

      if (results.totalChecks === 0) {
        results.passed = true;
        results.score = 100;
      } else {
        results.score = Math.round((results.passedChecks / results.totalChecks) * 100);
        results.passed = results.score >= 80;
      }

      // Generate issues
      results.issues = this._generateIssues(results.details);

      // Generate recommendations
      results.recommendations = this._generateRecommendations(results);

      const duration = performance.now() - startTime;
      results.validationDuration = Math.round(duration);

      return results;

    } catch (error) {
      console.error('Reduced motion validation failed:', error);
      throw new Error(`Reduced motion validation failed: ${error.message}`);
    }
  }

  /**
   * Test motion behavior with specific prefers-reduced-motion setting
   * @private
   */
  async _testWithReducedMotion(element, reducedMotion) {
    // Temporarily set the media query preference
    const originalMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Create a mock media query for testing
    const mockMediaQuery = {
      matches: reducedMotion,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    // Override matchMedia temporarily
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return mockMediaQuery;
      }
      return originalMatchMedia(query);
    };

    try {
      // Allow time for CSS to update based on media query
      await new Promise(resolve => setTimeout(resolve, 100));

      // Analyze animated elements
      const animatedElements = this._findAnimatedElements(element);
      const result = {
        reducedMotion,
        animatedElements: []
      };

      for (const animatedEl of animatedElements) {
        const motionData = await this._analyzeElementMotion(animatedEl);
        result.animatedElements.push(motionData);
      }

      return result;

    } finally {
      // Restore original matchMedia
      window.matchMedia = originalMatchMedia;
    }
  }

  /**
   * Find all elements with animations or transitions
   * @private
   */
  _findAnimatedElements(element) {
    const animatedElements = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const style = window.getComputedStyle(node);
          
          // Skip hidden elements
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }

          // Check for animations or transitions
          const hasAnimation = this._hasMotionProperties(style);
          return hasAnimation ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      animatedElements.push(node);
    }

    return animatedElements;
  }

  /**
   * Check if element has motion-related CSS properties
   * @private
   */
  _hasMotionProperties(computedStyle) {
    // Check for animations
    if (computedStyle.animationName && computedStyle.animationName !== 'none') {
      return true;
    }

    // Check for transitions
    if (computedStyle.transitionProperty && computedStyle.transitionProperty !== 'none') {
      return true;
    }

    // Check for transforms that might be animated
    if (computedStyle.transform && computedStyle.transform !== 'none') {
      return true;
    }

    return false;
  }

  /**
   * Analyze motion properties of a specific element
   * @private
   */
  async _analyzeElementMotion(element) {
    const computedStyle = window.getComputedStyle(element);
    const motionData = {
      element: this._getElementInfo(element),
      animations: this._getAnimationInfo(computedStyle),
      transitions: this._getTransitionInfo(computedStyle),
      transforms: this._getTransformInfo(computedStyle),
      motionIntensity: 0,
      childFriendly: true,
      reducedMotionCompliant: false
    };

    // Calculate motion intensity
    motionData.motionIntensity = this._calculateElementMotionIntensity(motionData);

    // Check if motion is child-friendly
    motionData.childFriendly = this._isChildFriendlyMotion(motionData);

    // Check for reduced motion compliance
    motionData.reducedMotionCompliant = this._hasReducedMotionSupport(element);

    return motionData;
  }

  /**
   * Get animation information from computed styles
   * @private
   */
  _getAnimationInfo(computedStyle) {
    const animations = [];
    
    if (computedStyle.animationName && computedStyle.animationName !== 'none') {
      const names = computedStyle.animationName.split(', ');
      const durations = computedStyle.animationDuration.split(', ');
      const iterations = computedStyle.animationIterationCount.split(', ');
      const timingFunctions = computedStyle.animationTimingFunction.split(', ');

      names.forEach((name, index) => {
        animations.push({
          name: name.trim(),
          duration: durations[index] || durations[0] || '0s',
          iterations: iterations[index] || iterations[0] || '1',
          timingFunction: timingFunctions[index] || timingFunctions[0] || 'ease',
          isInfinite: (iterations[index] || iterations[0]) === 'infinite'
        });
      });
    }

    return animations;
  }

  /**
   * Get transition information from computed styles
   * @private
   */
  _getTransitionInfo(computedStyle) {
    const transitions = [];
    
    if (computedStyle.transitionProperty && computedStyle.transitionProperty !== 'none') {
      const properties = computedStyle.transitionProperty.split(', ');
      const durations = computedStyle.transitionDuration.split(', ');
      const timingFunctions = computedStyle.transitionTimingFunction.split(', ');

      properties.forEach((property, index) => {
        transitions.push({
          property: property.trim(),
          duration: durations[index] || durations[0] || '0s',
          timingFunction: timingFunctions[index] || timingFunctions[0] || 'ease'
        });
      });
    }

    return transitions;
  }

  /**
   * Get transform information from computed styles
   * @private
   */
  _getTransformInfo(computedStyle) {
    return {
      transform: computedStyle.transform,
      transformOrigin: computedStyle.transformOrigin,
      hasTransform: computedStyle.transform !== 'none'
    };
  }

  /**
   * Calculate motion intensity for an element
   * @private
   */
  _calculateElementMotionIntensity(motionData) {
    let intensity = 0;

    // Animation intensity
    motionData.animations.forEach(anim => {
      const duration = parseFloat(anim.duration);
      if (anim.isInfinite) {
        intensity += 50; // High intensity for infinite animations
      } else if (duration > 0) {
        intensity += Math.min(20, 10 / duration); // Faster = more intense
      }
    });

    // Transition intensity (generally lower than animations)
    motionData.transitions.forEach(trans => {
      const duration = parseFloat(trans.duration);
      if (duration > 0) {
        intensity += Math.min(10, 5 / duration);
      }
    });

    // Transform intensity
    if (motionData.transforms.hasTransform) {
      intensity += 5;
    }

    return Math.min(100, intensity);
  }

  /**
   * Check if motion is child-friendly
   * @private
   */
  _isChildFriendlyMotion(motionData) {
    // High intensity motion can be overwhelming for children
    if (motionData.motionIntensity > 70) {
      return false;
    }

    // Infinite animations can be distracting
    const hasInfiniteAnimation = motionData.animations.some(anim => anim.isInfinite);
    if (hasInfiniteAnimation) {
      return false;
    }

    // Very fast animations can be jarring
    const hasFastAnimation = motionData.animations.some(anim => {
      const duration = parseFloat(anim.duration);
      return duration > 0 && duration < 0.2; // Less than 200ms
    });
    if (hasFastAnimation) {
      return false;
    }

    return true;
  }

  /**
   * Check if element has reduced motion support
   * @private
   */
  _hasReducedMotionSupport(element) {
    // Check if element or its styles include prefers-reduced-motion media query
    const stylesheets = Array.from(document.styleSheets);
    
    for (const stylesheet of stylesheets) {
      try {
        const rules = Array.from(stylesheet.cssRules || []);
        for (const rule of rules) {
          if (rule.type === CSSRule.MEDIA_RULE && 
              rule.conditionText && 
              rule.conditionText.includes('prefers-reduced-motion')) {
            
            // Check if this rule affects our element
            const mediaRules = Array.from(rule.cssRules || []);
            for (const mediaRule of mediaRules) {
              if (mediaRule.selectorText && element.matches(mediaRule.selectorText)) {
                return true;
              }
            }
          }
        }
      } catch (e) {
        // Skip stylesheets we can't access (CORS)
        continue;
      }
    }

    return false;
  }

  /**
   * Compare motion states to identify support
   * @private
   */
  _compareMotionStates(normalMotion, reducedMotion) {
    const supportedElements = [];
    const unsupportedElements = [];

    normalMotion.animatedElements.forEach((normalElement, index) => {
      const reducedElement = reducedMotion.animatedElements[index];
      
      if (!reducedElement) {
        unsupportedElements.push({
          element: normalElement.element,
          issue: 'Element not found in reduced motion test',
          normalMotion: normalElement,
          reducedMotion: null
        });
        return;
      }

      // Compare motion intensity
      const motionReduced = reducedElement.motionIntensity < normalElement.motionIntensity;
      const hasReducedMotionCSS = normalElement.reducedMotionCompliant;

      if (motionReduced || hasReducedMotionCSS) {
        supportedElements.push({
          element: normalElement.element,
          normalIntensity: normalElement.motionIntensity,
          reducedIntensity: reducedElement.motionIntensity,
          hasCSS: hasReducedMotionCSS,
          reductionPercentage: Math.round(
            ((normalElement.motionIntensity - reducedElement.motionIntensity) / 
             normalElement.motionIntensity) * 100
          )
        });
      } else {
        unsupportedElements.push({
          element: normalElement.element,
          issue: 'Motion not reduced when prefers-reduced-motion is enabled',
          normalMotion: normalElement,
          reducedMotion: reducedElement
        });
      }
    });

    return { supportedElements, unsupportedElements };
  }

  /**
   * Analyze child-friendly motion characteristics
   * @private
   */
  _analyzeChildFriendlyMotion(animatedElements) {
    return animatedElements.map(element => ({
      element: element.element,
      childFriendly: element.childFriendly,
      motionIntensity: element.motionIntensity,
      issues: this._identifyChildMotionIssues(element),
      recommendations: this._getChildMotionRecommendations(element)
    }));
  }

  /**
   * Identify child-specific motion issues
   * @private
   */
  _identifyChildMotionIssues(motionData) {
    const issues = [];

    if (motionData.motionIntensity > 70) {
      issues.push('High intensity motion may overwhelm children');
    }

    if (motionData.animations.some(anim => anim.isInfinite)) {
      issues.push('Infinite animations can be distracting for children');
    }

    if (motionData.animations.some(anim => parseFloat(anim.duration) < 0.2)) {
      issues.push('Very fast animations may be jarring for children');
    }

    if (!motionData.reducedMotionCompliant) {
      issues.push('No reduced motion alternative for motion-sensitive children');
    }

    return issues;
  }

  /**
   * Get child-specific motion recommendations
   * @private
   */
  _getChildMotionRecommendations(motionData) {
    const recommendations = [];

    if (motionData.motionIntensity > 70) {
      recommendations.push('Reduce animation speed or complexity');
    }

    if (motionData.animations.some(anim => anim.isInfinite)) {
      recommendations.push('Limit infinite animations or provide pause controls');
    }

    if (!motionData.reducedMotionCompliant) {
      recommendations.push('Add @media (prefers-reduced-motion: reduce) CSS rules');
    }

    return recommendations;
  }

  /**
   * Calculate overall motion intensity
   * @private
   */
  _calculateMotionIntensity(animatedElements) {
    if (animatedElements.length === 0) {
      return {
        average: 0,
        maximum: 0,
        distribution: { low: 0, medium: 0, high: 0 }
      };
    }

    const intensities = animatedElements.map(el => el.motionIntensity);
    const average = intensities.reduce((sum, intensity) => sum + intensity, 0) / intensities.length;
    const maximum = Math.max(...intensities);

    const distribution = {
      low: intensities.filter(i => i < 30).length,
      medium: intensities.filter(i => i >= 30 && i < 70).length,
      high: intensities.filter(i => i >= 70).length
    };

    return { average: Math.round(average), maximum, distribution };
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
   * Generate issues based on validation results
   * @private
   */
  _generateIssues(details) {
    const issues = [];

    // Issues for unsupported animations
    details.unsupportedAnimations.forEach(unsupported => {
      issues.push({
        type: 'reduced-motion',
        severity: 'medium',
        description: `Animation does not respect prefers-reduced-motion: ${unsupported.element.selector}`,
        element: unsupported.element.selector,
        issue: unsupported.issue,
        childImpact: 'Motion-sensitive children may experience discomfort or distraction',
        suggestedFix: 'Add CSS media query to disable or reduce animation when prefers-reduced-motion is enabled'
      });
    });

    // Issues for child-unfriendly motion
    details.childFriendlyMotion.forEach(motion => {
      if (!motion.childFriendly) {
        issues.push({
          type: 'child-motion',
          severity: 'low',
          description: `Animation may not be suitable for children: ${motion.element.selector}`,
          element: motion.element.selector,
          motionIntensity: motion.motionIntensity,
          issues: motion.issues,
          childImpact: 'High-intensity or distracting animations may overwhelm children',
          suggestedFix: motion.recommendations.join('; ')
        });
      }
    });

    // Issues for high overall motion intensity
    if (details.motionIntensity && details.motionIntensity.average > 50) {
      issues.push({
        type: 'motion-intensity',
        severity: 'medium',
        description: 'Overall page motion intensity is high',
        averageIntensity: details.motionIntensity.average,
        highIntensityElements: details.motionIntensity.distribution.high,
        childImpact: 'High motion intensity can be overwhelming for children with sensory sensitivities',
        suggestedFix: 'Reduce animation speeds, limit simultaneous animations, or provide motion controls'
      });
    }

    return issues;
  }

  /**
   * Generate recommendations based on results
   * @private
   */
  _generateRecommendations(results) {
    const recommendations = [];

    if (results.details.unsupportedAnimations.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Add Reduced Motion Support',
        description: `${results.details.unsupportedAnimations.length} animations do not respect prefers-reduced-motion`,
        action: 'Add CSS media queries to disable or reduce animations when users prefer reduced motion',
        childBenefit: 'Children sensitive to motion can use the application without discomfort'
      });
    }

    const nonChildFriendlyMotion = results.details.childFriendlyMotion.filter(m => !m.childFriendly);
    if (nonChildFriendlyMotion.length > 0) {
      recommendations.push({
        priority: 'low',
        title: 'Make Animations More Child-Friendly',
        description: `${nonChildFriendlyMotion.length} animations may be too intense or distracting for children`,
        action: 'Reduce animation speed, limit infinite animations, and avoid jarring motion effects',
        childBenefit: 'Calmer animations help children focus on learning and therapeutic activities'
      });
    }

    if (results.details.motionIntensity && results.details.motionIntensity.distribution.high > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Reduce Motion Intensity',
        description: `${results.details.motionIntensity.distribution.high} elements have high motion intensity`,
        action: 'Consider reducing animation speeds or providing user controls to pause animations',
        childBenefit: 'Lower intensity motion is less overwhelming for children with sensory sensitivities'
      });
    }

    // General child-friendly recommendations
    if (results.details.animatedElements.length > 0) {
      recommendations.push({
        priority: 'low',
        title: 'Consider Motion Preferences',
        description: 'Provide options for children to control animation preferences',
        action: 'Add settings to allow children or therapists to adjust motion levels',
        childBenefit: 'Children can customize the interface to their comfort level and therapeutic needs'
      });
    }

    return recommendations;
  }
}

export { ReducedMotionValidator };