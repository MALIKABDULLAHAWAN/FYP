/**
 * EmojiReplacer - Core emoji detection and replacement engine
 * Systematically identifies and replaces emoji instances with therapeutic photographs
 */

import AssetManager from './AssetManager.js';
import EmojiClassifier from './EmojiClassifier.js';
import ValidationService from './ValidationService.js';

/**
 * @typedef {import('./types.js').EmojiMapping} EmojiMapping
 * @typedef {import('./types.js').ImageAsset} ImageAsset
 * @typedef {import('./types.js').EnhancedComponent} EnhancedComponent
 */

class EmojiReplacer {
  constructor() {
    this.assetManager = new AssetManager();
    this.emojiClassifier = new EmojiClassifier();
    this.validationService = new ValidationService();
    this.emojiPatterns = this.initializeEmojiPatterns();
    this.contextMappings = this.initializeContextMappings();
    this.replacementStrategies = this.initializeReplacementStrategies();
  }

  /**
   * Initialize comprehensive emoji detection patterns
   * @returns {Object}
   */
  initializeEmojiPatterns() {
    return {
      // Comprehensive Unicode emoji ranges
      general: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      
      // Specific therapeutic context patterns
      medical: /👨‍⚕️|👩‍⚕️|🏥|⚕️|🩺|💊|🏥/g,
      
      interface: /📊|📈|📉|📋|📝|📧|📱|💻|🖥️|⚡|🔔|🔍|🔧|⚙️|🛠️/g,
      
      actions: /➕|➖|✏️|🗑️|📤|📥|✅|❌|⚠️|🚨|🔴|🟢|🟡/g,
      
      children: /👶|👧|👦|🧒|👨‍👩‍👧‍👦|👪/g,
      
      speech: /🗣️|🎙️|🔊|🔇|🔈|🎧|📢|📣/g,
      
      learning: /🖼️|📖|🧠|❓|💭|🎓|📚|✏️|📝/g,
      
      games: /🎮|🎯|🏆|🌟|👍|💪|🎲|🃏|🎪/g,
      
      activities: /🍎|🍌|🐱|🐶|🏠|🚗|⚽|📚|🎨|🧩|🎭/g,
      
      personal: /🎂|⚧|♂️|♀️|👤|👥|📅|🕐/g,
      
      media: /▶️|⏸️|⏹️|⏪|⏩|🔁|🔄|⏯️|⏭️|⏮️/g,
      
      celebration: /🎉|🎊|✨|💫|🌈|🎈|🎁|🍰|🥳/g,
      
      // Complex emoji patterns (multi-codepoint)
      complex: /👨‍⚕️|👩‍⚕️|👨‍👩‍👧‍👦|👨‍💻|👩‍💻|👨‍🏫|👩‍🏫/g
    };
  }

  /**
   * Initialize context-to-asset mappings
   * @returns {Object}
   */
  initializeContextMappings() {
    return {
      // Header contexts
      'header-therapist': { category: 'therapist', subcategory: 'medical-professional' },
      'header-speech': { category: 'activity', subcategory: 'speech-therapy' },
      
      // Stat card contexts
      'stat-children': { category: 'activity', subcategory: 'patient-care' },
      'stat-sessions': { category: 'medical', subcategory: 'session-management' },
      'stat-completed': { category: 'medical', subcategory: 'success-indicator' },
      'stat-accuracy': { category: 'medical', subcategory: 'performance-metric' },
      
      // Navigation contexts
      'nav-overview': { category: 'ui', subcategory: 'analytics-chart' },
      'nav-children': { category: 'activity', subcategory: 'patient-care' },
      'nav-sessions': { category: 'medical', subcategory: 'session-management' },
      'nav-analytics': { category: 'ui', subcategory: 'analytics-chart' },
      
      // Form contexts
      'form-email': { category: 'ui', subcategory: 'contact-info' },
      'form-name': { category: 'ui', subcategory: 'personal-info' },
      'form-birth': { category: 'ui', subcategory: 'personal-info' },
      'form-gender': { category: 'ui', subcategory: 'personal-info' },
      'form-notes': { category: 'ui', subcategory: 'clinical-notes' },
      
      // Action contexts
      'action-add': { category: 'ui', subcategory: 'add-button' },
      'action-edit': { category: 'ui', subcategory: 'edit-button' },
      'action-delete': { category: 'ui', subcategory: 'delete-button' },
      'action-warning': { category: 'ui', subcategory: 'warning-alert' },
      
      // Speech therapy contexts
      'speech-repetition': { category: 'activity', subcategory: 'repetition' },
      'speech-picture': { category: 'activity', subcategory: 'picture_naming' },
      'speech-questions': { category: 'activity', subcategory: 'questions' },
      'speech-story': { category: 'activity', subcategory: 'story_retell' },
      'speech-category': { category: 'activity', subcategory: 'category_naming' },
      'speech-microphone': { category: 'ui', subcategory: 'professional-microphone' },
      
      // Audio contexts
      'audio-on': { category: 'ui', subcategory: 'audio-enabled' },
      'audio-off': { category: 'ui', subcategory: 'audio-disabled' },
      'audio-speaking': { category: 'ui', subcategory: 'audio-active' },
      
      // Feedback contexts
      'feedback-success': { category: 'medical', subcategory: 'success-indicator' },
      'feedback-partial': { category: 'medical', subcategory: 'partial-success' },
      'feedback-fail': { category: 'medical', subcategory: 'needs-improvement' },
      'feedback-celebration': { category: 'medical', subcategory: 'achievement' }
    };
  }

  /**
   * Scan component for emoji instances with enhanced detection
   * @param {string} componentCode - React component code as string
   * @returns {EmojiMapping[]}
   */
  scanForEmojis(componentCode) {
    const emojiInstances = [];
    const processedPositions = new Set(); // Avoid duplicate detections
    
    // First pass: Use general pattern to find all emojis
    const generalMatches = [...componentCode.matchAll(this.emojiPatterns.general)];
    
    for (const match of generalMatches) {
      const emoji = match[0];
      const position = match.index;
      
      if (processedPositions.has(position)) continue;
      
      const context = this.determineContext(emoji, position, componentCode);
      const category = this.contextMappings[context]?.category || 'ui';
      const subcategory = this.contextMappings[context]?.subcategory || 'generic';
      
      emojiInstances.push({
        emoji,
        context,
        position,
        category,
        subcategory,
        detectionMethod: 'general-pattern'
      });
      
      processedPositions.add(position);
    }
    
    // Second pass: Use specific patterns for better context detection
    const specificPatterns = [
      { name: 'medical', pattern: this.emojiPatterns.medical },
      { name: 'interface', pattern: this.emojiPatterns.interface },
      { name: 'actions', pattern: this.emojiPatterns.actions },
      { name: 'children', pattern: this.emojiPatterns.children },
      { name: 'speech', pattern: this.emojiPatterns.speech },
      { name: 'learning', pattern: this.emojiPatterns.learning },
      { name: 'games', pattern: this.emojiPatterns.games },
      { name: 'activities', pattern: this.emojiPatterns.activities },
      { name: 'personal', pattern: this.emojiPatterns.personal },
      { name: 'media', pattern: this.emojiPatterns.media },
      { name: 'celebration', pattern: this.emojiPatterns.celebration },
      { name: 'complex', pattern: this.emojiPatterns.complex }
    ];
    
    for (const { name, pattern } of specificPatterns) {
      const matches = [...componentCode.matchAll(pattern)];
      
      for (const match of matches) {
        const position = match.index;
        
        if (processedPositions.has(position)) {
          // Update existing instance with more specific context
          const existingInstance = emojiInstances.find(instance => instance.position === position);
          if (existingInstance) {
            existingInstance.specificCategory = name;
            existingInstance.detectionMethod = 'specific-pattern';
          }
        }
      }
    }
    
    // Sort by position for consistent processing order
    return emojiInstances.sort((a, b) => a.position - b.position);
  }

  /**
   * Determine therapeutic context for emoji
   * @param {string} emoji - Emoji character
   * @param {number} position - Position in code
   * @param {string} code - Full component code
   * @returns {string}
   */
  determineContext(emoji, position, code) {
    const surroundingCode = code.substring(Math.max(0, position - 100), position + 100);
    
    // Header contexts
    if (surroundingCode.includes('className="h1"') || surroundingCode.includes('<h1')) {
      if (emoji === '👨‍⚕️' || emoji === '👩‍⚕️') return 'header-therapist';
      if (emoji === '🗣️') return 'header-speech';
    }
    
    // Stat card contexts
    if (surroundingCode.includes('StatCard') || surroundingCode.includes('stat-')) {
      if (emoji === '👶') return 'stat-children';
      if (emoji === '📋') return 'stat-sessions';
      if (emoji === '✅') return 'stat-completed';
      if (emoji === '🎯') return 'stat-accuracy';
    }
    
    // Navigation contexts
    if (surroundingCode.includes('tab') || surroundingCode.includes('nav')) {
      if (emoji === '📊') return 'nav-overview';
      if (emoji === '👶') return 'nav-children';
      if (emoji === '📋') return 'nav-sessions';
      if (emoji === '📈') return 'nav-analytics';
    }
    
    // Form contexts
    if (surroundingCode.includes('form-label') || surroundingCode.includes('input')) {
      if (emoji === '📧') return 'form-email';
      if (emoji === '👤') return 'form-name';
      if (emoji === '🎂') return 'form-birth';
      if (emoji === '⚧' || emoji === '♂️' || emoji === '♀️') return 'form-gender';
      if (emoji === '📝') return 'form-notes';
    }
    
    // Action contexts
    if (surroundingCode.includes('btn') || surroundingCode.includes('button')) {
      if (emoji === '➕') return 'action-add';
      if (emoji === '✏️') return 'action-edit';
      if (emoji === '🗑️') return 'action-delete';
      if (emoji === '⚠️') return 'action-warning';
    }
    
    // Speech therapy contexts
    if (surroundingCode.includes('CATEGORY_ICONS') || surroundingCode.includes('activity')) {
      if (emoji === '🗣️') return 'speech-repetition';
      if (emoji === '🖼️') return 'speech-picture';
      if (emoji === '❓') return 'speech-questions';
      if (emoji === '📖') return 'speech-story';
      if (emoji === '🧠') return 'speech-category';
    }
    
    // Audio contexts
    if (surroundingCode.includes('tts') || surroundingCode.includes('audio') || surroundingCode.includes('voice')) {
      if (emoji === '🔊') return 'audio-on';
      if (emoji === '🔇') return 'audio-off';
      if (emoji === '🎙️') return 'speech-microphone';
    }
    
    // Feedback contexts
    if (surroundingCode.includes('score') || surroundingCode.includes('feedback') || surroundingCode.includes('celebration')) {
      if (emoji === '✅') return 'feedback-success';
      if (emoji === '⚡') return 'feedback-partial';
      if (emoji === '❌') return 'feedback-fail';
      if (emoji === '🏆' || emoji === '🌟' || emoji === '👍' || emoji === '💪') return 'feedback-celebration';
    }
    
    // Default context
    return 'ui-generic';
  }

  /**
   * Replace emoji with therapeutic photograph using advanced strategies
   * @param {string} componentCode - Original component code
   * @param {EmojiMapping} emojiMapping - Emoji to replace
   * @param {ImageAsset} photoAsset - Replacement photo asset
   * @returns {string}
   */
  replaceEmojiWithPhoto(componentCode, emojiMapping, photoAsset) {
    const { emoji, context, position } = emojiMapping;
    
    // Determine replacement strategy based on context
    const strategy = this.selectReplacementStrategy(context, emojiMapping);
    
    // Generate replacement HTML using selected strategy
    const replacementHTML = this.generateReplacementHTML(photoAsset, emoji, strategy);
    
    // Apply replacement with structure preservation
    return this.applyReplacementWithPreservation(componentCode, emoji, replacementHTML, position, strategy);
  }

  /**
   * Select appropriate replacement strategy based on context
   * @param {string} context - Therapeutic context
   * @param {EmojiMapping} emojiMapping - Emoji mapping data
   * @returns {Object}
   */
  selectReplacementStrategy(context, emojiMapping) {
    // Header contexts need prominent replacement
    if (context.includes('header') || context.includes('h1')) {
      return this.replacementStrategies.header;
    }
    
    // Navigation and button contexts need icon-sized replacement
    if (context.includes('nav') || context.includes('btn') || context.includes('button')) {
      return this.replacementStrategies.icon;
    }
    
    // Form contexts need inline replacement
    if (context.includes('form') || context.includes('label')) {
      return this.replacementStrategies.inline;
    }
    
    // Stat cards and analytics need block replacement
    if (context.includes('stat') || context.includes('analytics')) {
      return this.replacementStrategies.block;
    }
    
    // Default to inline replacement
    return this.replacementStrategies.inline;
  }

  /**
   * Generate replacement HTML using strategy template
   * @param {ImageAsset} photoAsset - Photo asset
   * @param {string} emoji - Original emoji
   * @param {Object} strategy - Replacement strategy
   * @returns {string}
   */
  generateReplacementHTML(photoAsset, emoji, strategy) {
    try {
      return strategy.template(photoAsset, emoji);
    } catch (error) {
      console.error('Failed to generate replacement HTML:', error);
      // Fallback to simple replacement
      return `<img src="${photoAsset.url}" alt="${photoAsset.altText}" className="therapeutic-image-fallback" data-original-emoji="${emoji}" />`;
    }
  }

  /**
   * Apply replacement while preserving component structure
   * @param {string} componentCode - Original code
   * @param {string} emoji - Emoji to replace
   * @param {string} replacementHTML - Replacement HTML
   * @param {number} position - Emoji position
   * @param {Object} strategy - Replacement strategy
   * @returns {string}
   */
  applyReplacementWithPreservation(componentCode, emoji, replacementHTML, position, strategy) {
    // For complex replacements, we need to be more careful about structure
    if (strategy.preserveSpacing) {
      // Simple replacement maintaining spacing
      return componentCode.replace(emoji, replacementHTML);
    } else {
      // More complex replacement that might need structural adjustments
      const beforeEmoji = componentCode.substring(0, position);
      const afterEmoji = componentCode.substring(position + emoji.length);
      
      // Check if we need to add spacing or structural elements
      const needsSpacing = this.needsSpacingAdjustment(beforeEmoji, afterEmoji);
      
      if (needsSpacing) {
        return beforeEmoji + ' ' + replacementHTML + ' ' + afterEmoji;
      } else {
        return beforeEmoji + replacementHTML + afterEmoji;
      }
    }
  }

  /**
   * Determine if spacing adjustment is needed
   * @param {string} beforeEmoji - Code before emoji
   * @param {string} afterEmoji - Code after emoji
   * @returns {boolean}
   */
  needsSpacingAdjustment(beforeEmoji, afterEmoji) {
    // Check if emoji is between text elements that need spacing
    const beforeEndsWithText = /[a-zA-Z0-9]$/.test(beforeEmoji.trim());
    const afterStartsWithText = /^[a-zA-Z0-9]/.test(afterEmoji.trim());
    
    return beforeEndsWithText && afterStartsWithText;
  }

  /**
   * Initialize replacement strategies for different contexts
   * @returns {Object}
   */
  initializeReplacementStrategies() {
    return {
      // Inline replacement - replace emoji with img tag
      inline: {
        template: (asset, emoji) => `<img 
          src="${asset.url}" 
          alt="${asset.altText}"
          width="${asset.width}"
          height="${asset.height}"
          style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            objectFit: 'cover',
            borderRadius: '4px',
            margin: '0 2px'
          }}
          className="therapeutic-image therapeutic-inline"
          data-therapeutic-goals="${asset.therapeuticContext.therapeuticGoals.join(',')}"
          data-original-emoji="${emoji}"
          data-replacement-type="inline"
        />`,
        preserveSpacing: true
      },

      // Block replacement - replace emoji with styled container
      block: {
        template: (asset, emoji) => `<div className="therapeutic-image-container">
          <img 
            src="${asset.url}" 
            alt="${asset.altText}"
            width="${asset.width}"
            height="${asset.height}"
            className="therapeutic-image therapeutic-block"
            data-therapeutic-goals="${asset.therapeuticContext.therapeuticGoals.join(',')}"
            data-original-emoji="${emoji}"
            data-replacement-type="block"
          />
        </div>`,
        preserveSpacing: false
      },

      // Icon replacement - small icon-sized replacement
      icon: {
        template: (asset, emoji) => `<img 
          src="${asset.url}" 
          alt="${asset.altText}"
          width="16"
          height="16"
          style={{
            display: 'inline-block',
            verticalAlign: 'text-bottom',
            objectFit: 'cover'
          }}
          className="therapeutic-image therapeutic-icon"
          data-therapeutic-goals="${asset.therapeuticContext.therapeuticGoals.join(',')}"
          data-original-emoji="${emoji}"
          data-replacement-type="icon"
        />`,
        preserveSpacing: true
      },

      // Header replacement - larger, prominent replacement
      header: {
        template: (asset, emoji) => `<img 
          src="${asset.url}" 
          alt="${asset.altText}"
          width="32"
          height="32"
          style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            objectFit: 'cover',
            borderRadius: '6px',
            marginRight: '8px'
          }}
          className="therapeutic-image therapeutic-header"
          data-therapeutic-goals="${asset.therapeuticContext.therapeuticGoals.join(',')}"
          data-original-emoji="${emoji}"
          data-replacement-type="header"
        />`,
        preserveSpacing: false
      }
    };
  }

  /**
   * Process complete emoji replacement for component with enhanced classification
   * @param {string} componentCode - React component code
   * @returns {Promise<EnhancedComponent>}
   */
  async processEmojiReplacement(componentCode) {
    const startTime = Date.now();
    
    // Step 1: Scan for emoji instances
    const emojiInstances = this.scanForEmojis(componentCode);
    
    if (emojiInstances.length === 0) {
      return {
        component: componentCode,
        replacements: [],
        validation: {
          suitable: true,
          errors: [],
          warnings: [],
          validatedAt: new Date().toISOString()
        },
        enhancedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };
    }
    
    // Step 2: Classify emojis for better replacement decisions
    const classifiedEmojis = emojiInstances.map(instance => {
      const surroundingCode = componentCode.substring(
        Math.max(0, instance.position - 150), 
        instance.position + 150
      );
      
      const classification = this.emojiClassifier.classifyEmoji(instance.emoji, surroundingCode);
      
      return {
        ...instance,
        classification,
        therapeuticPriority: classification.therapeuticPriority,
        confidence: classification.confidence
      };
    });
    
    // Step 3: Sort by therapeutic priority and confidence
    const prioritizedEmojis = classifiedEmojis.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, standard: 1, low: 0 };
      const priorityDiff = priorityOrder[b.therapeuticPriority] - priorityOrder[a.therapeuticPriority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence; // Higher confidence first
    });
    
    // Step 4: Replace emojis with photographs
    let enhancedCode = componentCode;
    const appliedReplacements = [];
    const failedReplacements = [];
    
    // Process in reverse order to maintain position accuracy
    const reversedEmojis = [...prioritizedEmojis].reverse();
    
    for (const emojiMapping of reversedEmojis) {
      try {
        // Get appropriate photo asset using enhanced classification
        const photoAsset = await this.getReplacementPhotoEnhanced(emojiMapping);
        
        // Validate therapeutic suitability
        const validation = this.validationService.validateTherapeuticSuitability(photoAsset);
        
        if (validation.suitable) {
          enhancedCode = this.replaceEmojiWithPhoto(enhancedCode, emojiMapping, photoAsset);
          appliedReplacements.push({
            ...emojiMapping,
            replacedWith: photoAsset.url,
            validationResult: validation,
            replacementStrategy: this.selectReplacementStrategy(emojiMapping.context, emojiMapping).constructor.name,
            validatedAt: new Date().toISOString()
          });
        } else {
          // Use fallback photo
          const fallbackAsset = this.assetManager.getFallbackPhoto(emojiMapping.emoji);
          enhancedCode = this.replaceEmojiWithPhoto(enhancedCode, emojiMapping, fallbackAsset);
          appliedReplacements.push({
            ...emojiMapping,
            replacedWith: fallbackAsset.url,
            usedFallback: true,
            validationResult: validation,
            validatedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Failed to replace emoji ${emojiMapping.emoji}:`, error);
        failedReplacements.push({
          ...emojiMapping,
          error: error.message,
          failedAt: new Date().toISOString()
        });
      }
    }
    
    // Step 5: Validate final component
    const finalValidation = this.validationService.validateEnhancedComponent(enhancedCode, appliedReplacements);
    
    // Step 6: Validate functionality preservation
    const functionalityValidation = this.validationService.validateFunctionalityPreservation(componentCode, enhancedCode);
    
    const processingTime = Date.now() - startTime;
    
    return {
      component: enhancedCode,
      replacements: appliedReplacements,
      failedReplacements,
      validation: finalValidation,
      functionalityValidation,
      classificationStats: this.emojiClassifier.exportClassificationStats(classifiedEmojis.map(e => e.classification)),
      enhancedAt: new Date().toISOString(),
      processingTime,
      performance: {
        totalEmojis: emojiInstances.length,
        successfulReplacements: appliedReplacements.length,
        failedReplacements: failedReplacements.length,
        averageConfidence: classifiedEmojis.reduce((sum, e) => sum + e.confidence, 0) / classifiedEmojis.length,
        processingTimePerEmoji: processingTime / emojiInstances.length
      }
    };
  }

  /**
   * Get replacement photo using enhanced classification
   * @param {Object} emojiMapping - Enhanced emoji mapping with classification
   * @returns {Promise<ImageAsset>}
   */
  async getReplacementPhotoEnhanced(emojiMapping) {
    const { classification, category, subcategory } = emojiMapping;
    
    // Use classification recommendations if available
    if (classification && classification.recommendedReplacement) {
      const recommendations = this.emojiClassifier.getReplacementRecommendations(
        classification.category,
        classification.subcategory,
        classification.detectedContexts
      );
      
      // Try primary recommendation first
      if (recommendations.primary) {
        try {
          return await this.getAssetByRecommendation(recommendations.primary);
        } catch (error) {
          console.warn(`Primary recommendation failed: ${recommendations.primary}`, error);
        }
      }
      
      // Try alternatives
      for (const alternative of recommendations.alternatives) {
        try {
          return await this.getAssetByRecommendation(alternative);
        } catch (error) {
          console.warn(`Alternative recommendation failed: ${alternative}`, error);
        }
      }
    }
    
    // Fallback to original method
    return await this.getReplacementPhoto(emojiMapping);
  }

  /**
   * Get asset by recommendation string
   * @param {string} recommendation - Recommendation identifier
   * @returns {Promise<ImageAsset>}
   */
  async getAssetByRecommendation(recommendation) {
    // Map recommendation strings to asset manager methods
    const recommendationMappings = {
      'professional-therapist-portrait': () => this.assetManager.getTherapistIcon('medical-professional'),
      'clinical-setting-photo': () => this.assetManager.getMedicalIcon('clinical-environment'),
      'speech-therapy-equipment': () => this.assetManager.getUIIcon('professional-microphone'),
      'educational-materials-photo': () => this.assetManager.getChildActivityIcon('learning-materials'),
      'therapeutic-fallback-photo': () => this.assetManager.getFallbackPhoto('generic')
    };
    
    const getAssetMethod = recommendationMappings[recommendation];
    if (getAssetMethod) {
      return await getAssetMethod();
    }
    
    // Default fallback
    return await this.assetManager.getFallbackPhoto('unknown');
  }

  /**
   * Get replacement photo for emoji mapping (legacy method)
   * @param {EmojiMapping} emojiMapping - Emoji mapping data
   * @returns {Promise<ImageAsset>}
   */
  async getReplacementPhoto(emojiMapping) {
    const { category, subcategory } = emojiMapping;
    
    switch (category) {
      case 'therapist':
        return await this.assetManager.getTherapistIcon(subcategory);
      case 'activity':
        return await this.assetManager.getChildActivityIcon(subcategory);
      case 'medical':
        return await this.assetManager.getMedicalIcon(subcategory);
      case 'ui':
      default:
        return await this.assetManager.getUIIcon(subcategory);
    }
  }

  /**
   * Export processing statistics and analytics
   * @returns {Object}
   */
  exportProcessingStats() {
    return {
      totalProcessed: this.processedComponents || 0,
      averageProcessingTime: this.averageProcessingTime || 0,
      successRate: this.successRate || 0,
      commonReplacements: this.commonReplacements || {},
      therapeuticCompliance: this.therapeuticCompliance || 0,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Clear processing cache and reset statistics
   */
  clearCache() {
    this.assetManager.clearCache();
    this.validationService.clearValidationHistory();
    this.processedComponents = 0;
    this.averageProcessingTime = 0;
    this.successRate = 0;
    this.commonReplacements = {};
    this.therapeuticCompliance = 0;
  }
}

export default EmojiReplacer;