/**
 * EmojiClassifier - Advanced emoji classification and context analysis
 * Provides sophisticated emoji categorization for therapeutic contexts
 */

class EmojiClassifier {
  constructor() {
    this.emojiDatabase = this.initializeEmojiDatabase();
    this.contextPatterns = this.initializeContextPatterns();
    this.therapeuticMappings = this.initializeTherapeuticMappings();
  }

  /**
   * Initialize comprehensive emoji database with therapeutic classifications
   * @returns {Object}
   */
  initializeEmojiDatabase() {
    return {
      // Medical and Professional
      '👨‍⚕️': { category: 'medical', subcategory: 'professional', therapeuticValue: 'high', context: ['header', 'professional'] },
      '👩‍⚕️': { category: 'medical', subcategory: 'professional', therapeuticValue: 'high', context: ['header', 'professional'] },
      '⚕️': { category: 'medical', subcategory: 'symbol', therapeuticValue: 'medium', context: ['medical', 'clinical'] },
      '🏥': { category: 'medical', subcategory: 'facility', therapeuticValue: 'medium', context: ['medical', 'clinical'] },
      '🩺': { category: 'medical', subcategory: 'equipment', therapeuticValue: 'high', context: ['medical', 'assessment'] },

      // Interface and Analytics
      '📊': { category: 'interface', subcategory: 'analytics', therapeuticValue: 'high', context: ['dashboard', 'progress'] },
      '📈': { category: 'interface', subcategory: 'analytics', therapeuticValue: 'high', context: ['progress', 'improvement'] },
      '📉': { category: 'interface', subcategory: 'analytics', therapeuticValue: 'medium', context: ['decline', 'analysis'] },
      '📋': { category: 'interface', subcategory: 'documentation', therapeuticValue: 'high', context: ['sessions', 'records'] },
      '📝': { category: 'interface', subcategory: 'documentation', therapeuticValue: 'high', context: ['notes', 'forms'] },
      '📧': { category: 'interface', subcategory: 'communication', therapeuticValue: 'medium', context: ['contact', 'forms'] },

      // Actions and Controls
      '➕': { category: 'action', subcategory: 'add', therapeuticValue: 'high', context: ['create', 'new'] },
      '✏️': { category: 'action', subcategory: 'edit', therapeuticValue: 'high', context: ['modify', 'update'] },
      '🗑️': { category: 'action', subcategory: 'delete', therapeuticValue: 'medium', context: ['remove', 'delete'] },
      '✅': { category: 'status', subcategory: 'success', therapeuticValue: 'high', context: ['completed', 'correct'] },
      '❌': { category: 'status', subcategory: 'failure', therapeuticValue: 'medium', context: ['incorrect', 'failed'] },
      '⚠️': { category: 'status', subcategory: 'warning', therapeuticValue: 'high', context: ['attention', 'caution'] },

      // Children and Demographics
      '👶': { category: 'demographic', subcategory: 'child', therapeuticValue: 'high', context: ['patient', 'child'] },
      '👧': { category: 'demographic', subcategory: 'child', therapeuticValue: 'high', context: ['patient', 'female'] },
      '👦': { category: 'demographic', subcategory: 'child', therapeuticValue: 'high', context: ['patient', 'male'] },
      '🧒': { category: 'demographic', subcategory: 'child', therapeuticValue: 'high', context: ['patient', 'neutral'] },
      '👤': { category: 'demographic', subcategory: 'person', therapeuticValue: 'medium', context: ['individual', 'profile'] },

      // Speech and Communication
      '🗣️': { category: 'speech', subcategory: 'speaking', therapeuticValue: 'high', context: ['speech', 'communication'] },
      '🎙️': { category: 'speech', subcategory: 'recording', therapeuticValue: 'high', context: ['recording', 'microphone'] },
      '🔊': { category: 'audio', subcategory: 'volume', therapeuticValue: 'high', context: ['audio', 'loud'] },
      '🔇': { category: 'audio', subcategory: 'mute', therapeuticValue: 'high', context: ['audio', 'muted'] },
      '🔈': { category: 'audio', subcategory: 'volume', therapeuticValue: 'medium', context: ['audio', 'quiet'] },
      '🎧': { category: 'audio', subcategory: 'equipment', therapeuticValue: 'medium', context: ['listening', 'headphones'] },

      // Learning and Cognition
      '🖼️': { category: 'learning', subcategory: 'visual', therapeuticValue: 'high', context: ['picture', 'visual'] },
      '📖': { category: 'learning', subcategory: 'reading', therapeuticValue: 'high', context: ['story', 'book'] },
      '🧠': { category: 'learning', subcategory: 'cognition', therapeuticValue: 'high', context: ['thinking', 'brain'] },
      '❓': { category: 'learning', subcategory: 'question', therapeuticValue: 'high', context: ['question', 'inquiry'] },
      '💭': { category: 'learning', subcategory: 'thought', therapeuticValue: 'medium', context: ['thinking', 'idea'] },

      // Games and Activities
      '🎮': { category: 'activity', subcategory: 'game', therapeuticValue: 'high', context: ['gaming', 'play'] },
      '🎯': { category: 'activity', subcategory: 'target', therapeuticValue: 'high', context: ['goal', 'accuracy'] },
      '🏆': { category: 'achievement', subcategory: 'trophy', therapeuticValue: 'high', context: ['success', 'winner'] },
      '🌟': { category: 'achievement', subcategory: 'star', therapeuticValue: 'high', context: ['excellent', 'great'] },
      '👍': { category: 'achievement', subcategory: 'approval', therapeuticValue: 'high', context: ['good', 'positive'] },
      '💪': { category: 'achievement', subcategory: 'strength', therapeuticValue: 'medium', context: ['effort', 'strong'] },

      // Media Controls
      '▶️': { category: 'media', subcategory: 'play', therapeuticValue: 'high', context: ['start', 'play'] },
      '⏸️': { category: 'media', subcategory: 'pause', therapeuticValue: 'medium', context: ['pause', 'stop'] },
      '⏹️': { category: 'media', subcategory: 'stop', therapeuticValue: 'medium', context: ['stop', 'end'] },
      '🔁': { category: 'media', subcategory: 'repeat', therapeuticValue: 'medium', context: ['repeat', 'again'] },

      // Personal Information
      '🎂': { category: 'personal', subcategory: 'birthday', therapeuticValue: 'medium', context: ['birth', 'age'] },
      '⚧': { category: 'personal', subcategory: 'gender', therapeuticValue: 'medium', context: ['gender', 'identity'] },
      '♂️': { category: 'personal', subcategory: 'male', therapeuticValue: 'medium', context: ['male', 'gender'] },
      '♀️': { category: 'personal', subcategory: 'female', therapeuticValue: 'medium', context: ['female', 'gender'] },

      // Celebration and Feedback
      '🎉': { category: 'celebration', subcategory: 'party', therapeuticValue: 'high', context: ['celebration', 'success'] },
      '🎊': { category: 'celebration', subcategory: 'confetti', therapeuticValue: 'high', context: ['celebration', 'achievement'] },
      '✨': { category: 'celebration', subcategory: 'sparkle', therapeuticValue: 'medium', context: ['special', 'magic'] },
      '🌈': { category: 'celebration', subcategory: 'rainbow', therapeuticValue: 'medium', context: ['colorful', 'positive'] },

      // Quick Actions
      '⚡': { category: 'action', subcategory: 'quick', therapeuticValue: 'medium', context: ['fast', 'energy'] },
      '🔔': { category: 'notification', subcategory: 'alert', therapeuticValue: 'medium', context: ['notification', 'alert'] },
      '📤': { category: 'action', subcategory: 'upload', therapeuticValue: 'medium', context: ['send', 'upload'] },
      '📥': { category: 'action', subcategory: 'download', therapeuticValue: 'medium', context: ['receive', 'download'] }
    };
  }

  /**
   * Initialize context detection patterns
   * @returns {Object}
   */
  initializeContextPatterns() {
    return {
      header: /className\s*=\s*["'].*h1.*["']|<h1|<h2|<h3/i,
      statCard: /StatCard|stat-card|stats-grid/i,
      navigation: /nav|tab|menu/i,
      form: /form|input|label|textarea|select/i,
      button: /button|btn/i,
      modal: /modal|dialog|popup/i,
      alert: /alert|warning|error|success/i,
      dashboard: /dashboard|console|overview/i,
      analytics: /analytics|chart|graph|metrics/i,
      session: /session|therapy|treatment/i,
      child: /child|patient|kid/i,
      speech: /speech|audio|voice|sound/i,
      game: /game|activity|play|exercise/i,
      celebration: /celebration|success|achievement|complete/i
    };
  }

  /**
   * Initialize therapeutic context mappings
   * @returns {Object}
   */
  initializeTherapeuticMappings() {
    return {
      // High therapeutic value contexts
      'medical-professional': { priority: 'high', replacement: 'therapist-photo' },
      'child-patient': { priority: 'high', replacement: 'child-therapy-photo' },
      'speech-therapy': { priority: 'high', replacement: 'speech-session-photo' },
      'progress-tracking': { priority: 'high', replacement: 'progress-chart-photo' },
      'session-management': { priority: 'high', replacement: 'clinical-notes-photo' },

      // Medium therapeutic value contexts
      'interface-navigation': { priority: 'medium', replacement: 'ui-element-photo' },
      'form-input': { priority: 'medium', replacement: 'form-field-photo' },
      'media-control': { priority: 'medium', replacement: 'media-button-photo' },

      // Standard therapeutic contexts
      'general-ui': { priority: 'standard', replacement: 'generic-ui-photo' },
      'decoration': { priority: 'low', replacement: 'minimal-graphic' }
    };
  }

  /**
   * Classify emoji with comprehensive analysis
   * @param {string} emoji - Emoji character
   * @param {string} surroundingCode - Code context around emoji
   * @returns {Object}
   */
  classifyEmoji(emoji, surroundingCode = '') {
    const emojiData = this.emojiDatabase[emoji];
    
    if (!emojiData) {
      return {
        emoji,
        category: 'unknown',
        subcategory: 'unclassified',
        therapeuticValue: 'low',
        context: ['unknown'],
        confidence: 0.1,
        recommendedReplacement: 'generic-fallback'
      };
    }

    // Analyze surrounding code context
    const detectedContexts = this.analyzeCodeContext(surroundingCode);
    
    // Calculate confidence based on context match
    const confidence = this.calculateConfidence(emojiData, detectedContexts);
    
    // Determine therapeutic priority
    const therapeuticPriority = this.determineTherapeuticPriority(emojiData, detectedContexts);
    
    // Recommend replacement strategy
    const recommendedReplacement = this.recommendReplacement(emojiData, detectedContexts, therapeuticPriority);

    return {
      emoji,
      category: emojiData.category,
      subcategory: emojiData.subcategory,
      therapeuticValue: emojiData.therapeuticValue,
      context: emojiData.context,
      detectedContexts,
      confidence,
      therapeuticPriority,
      recommendedReplacement,
      metadata: {
        codeContext: surroundingCode.substring(0, 100), // First 100 chars for debugging
        analysisTimestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Analyze code context around emoji
   * @param {string} code - Surrounding code
   * @returns {string[]}
   */
  analyzeCodeContext(code) {
    const contexts = [];
    
    for (const [contextName, pattern] of Object.entries(this.contextPatterns)) {
      if (pattern.test(code)) {
        contexts.push(contextName);
      }
    }
    
    return contexts;
  }

  /**
   * Calculate classification confidence
   * @param {Object} emojiData - Emoji database entry
   * @param {string[]} detectedContexts - Detected code contexts
   * @returns {number}
   */
  calculateConfidence(emojiData, detectedContexts) {
    if (detectedContexts.length === 0) return 0.5; // Base confidence
    
    // Check for context matches
    const contextMatches = emojiData.context.filter(ctx => 
      detectedContexts.some(detected => 
        detected.includes(ctx) || ctx.includes(detected)
      )
    );
    
    const matchRatio = contextMatches.length / emojiData.context.length;
    const detectionRatio = detectedContexts.length > 0 ? 1 : 0.5;
    
    return Math.min(0.9, 0.3 + (matchRatio * 0.4) + (detectionRatio * 0.3));
  }

  /**
   * Determine therapeutic priority
   * @param {Object} emojiData - Emoji database entry
   * @param {string[]} detectedContexts - Detected code contexts
   * @returns {string}
   */
  determineTherapeuticPriority(emojiData, detectedContexts) {
    // High priority contexts
    const highPriorityContexts = ['header', 'statCard', 'session', 'speech', 'child'];
    const mediumPriorityContexts = ['navigation', 'form', 'analytics'];
    
    if (detectedContexts.some(ctx => highPriorityContexts.includes(ctx))) {
      return 'high';
    }
    
    if (detectedContexts.some(ctx => mediumPriorityContexts.includes(ctx))) {
      return 'medium';
    }
    
    if (emojiData.therapeuticValue === 'high') {
      return 'medium'; // Downgrade if context doesn't match
    }
    
    return 'standard';
  }

  /**
   * Recommend replacement strategy
   * @param {Object} emojiData - Emoji database entry
   * @param {string[]} detectedContexts - Detected code contexts
   * @param {string} therapeuticPriority - Therapeutic priority level
   * @returns {string}
   */
  recommendReplacement(emojiData, detectedContexts, therapeuticPriority) {
    // Context-specific replacements
    if (detectedContexts.includes('header') && emojiData.category === 'medical') {
      return 'professional-therapist-photo';
    }
    
    if (detectedContexts.includes('speech') && emojiData.category === 'speech') {
      return 'speech-adventure-photo';
    }
    
    if (detectedContexts.includes('child') && emojiData.category === 'demographic') {
      return 'child-therapy-photo';
    }
    
    if (detectedContexts.includes('statCard') || detectedContexts.includes('analytics')) {
      return 'clinical-metrics-photo';
    }
    
    // Category-based fallbacks
    const categoryMappings = {
      'medical': 'medical-professional-photo',
      'speech': 'speech-equipment-photo',
      'learning': 'educational-material-photo',
      'activity': 'therapy-activity-photo',
      'achievement': 'success-celebration-photo',
      'interface': 'ui-element-photo',
      'action': 'action-button-photo',
      'status': 'status-indicator-photo'
    };
    
    return categoryMappings[emojiData.category] || 'therapeutic-fallback-photo';
  }

  /**
   * Batch classify multiple emojis
   * @param {Array} emojiList - List of {emoji, context} objects
   * @returns {Array}
   */
  batchClassify(emojiList) {
    return emojiList.map(({ emoji, context }) => 
      this.classifyEmoji(emoji, context)
    );
  }

  /**
   * Get therapeutic replacement recommendations
   * @param {string} category - Emoji category
   * @param {string} subcategory - Emoji subcategory
   * @param {string[]} contexts - Detected contexts
   * @returns {Object}
   */
  getReplacementRecommendations(category, subcategory, contexts = []) {
    const recommendations = {
      primary: null,
      alternatives: [],
      fallback: 'therapeutic-generic-photo'
    };

    // Build recommendation based on category and context
    if (category === 'medical' && contexts.includes('header')) {
      recommendations.primary = 'professional-therapist-portrait';
      recommendations.alternatives = ['clinical-setting-photo', 'medical-professional-photo'];
    } else if (category === 'speech') {
      recommendations.primary = 'speech-therapy-equipment';
      recommendations.alternatives = ['microphone-professional', 'audio-equipment-photo'];
    } else if (category === 'learning') {
      recommendations.primary = 'educational-materials-photo';
      recommendations.alternatives = ['learning-activity-photo', 'therapeutic-tools-photo'];
    }

    return recommendations;
  }

  /**
   * Export classification statistics
   * @param {Array} classifications - Array of classification results
   * @returns {Object}
   */
  exportClassificationStats(classifications) {
    const stats = {
      total: classifications.length,
      byCategory: {},
      byTherapeuticValue: {},
      byConfidence: { high: 0, medium: 0, low: 0 },
      averageConfidence: 0
    };

    classifications.forEach(classification => {
      // Category stats
      stats.byCategory[classification.category] = (stats.byCategory[classification.category] || 0) + 1;
      
      // Therapeutic value stats
      stats.byTherapeuticValue[classification.therapeuticValue] = (stats.byTherapeuticValue[classification.therapeuticValue] || 0) + 1;
      
      // Confidence stats
      if (classification.confidence >= 0.7) stats.byConfidence.high++;
      else if (classification.confidence >= 0.4) stats.byConfidence.medium++;
      else stats.byConfidence.low++;
    });

    stats.averageConfidence = classifications.reduce((sum, c) => sum + c.confidence, 0) / classifications.length;

    return stats;
  }
}

export default EmojiClassifier;