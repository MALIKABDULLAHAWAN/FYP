/**
 * Tests for EmojiClassifier
 * Tests emoji classification and therapeutic context analysis
 */

import EmojiClassifier from '../EmojiClassifier.js';

describe('EmojiClassifier', () => {
  let emojiClassifier;

  beforeEach(() => {
    emojiClassifier = new EmojiClassifier();
  });

  describe('Emoji Classification', () => {
    test('should classify known medical emojis correctly', () => {
      const classification = emojiClassifier.classifyEmoji('👨‍⚕️', '<div className="h1">👨‍⚕️ Doctor</div>');

      expect(classification.category).toBe('medical');
      expect(classification.subcategory).toBe('professional');
      expect(classification.therapeuticValue).toBe('high');
      expect(classification.context).toContain('header');
      expect(classification.confidence).toBeGreaterThan(0.5);
    });

    test('should classify speech therapy emojis correctly', () => {
      const classification = emojiClassifier.classifyEmoji('🗣️', '<div className="speech-activity">🗣️ Speaking</div>');

      expect(classification.category).toBe('speech');
      expect(classification.subcategory).toBe('speaking');
      expect(classification.therapeuticValue).toBe('high');
      expect(classification.detectedContexts).toContain('speech');
    });

    test('should classify interface emojis correctly', () => {
      const classification = emojiClassifier.classifyEmoji('📊', '<div className="analytics">📊 Charts</div>');

      expect(classification.category).toBe('interface');
      expect(classification.subcategory).toBe('analytics');
      expect(classification.therapeuticValue).toBe('high');
      expect(classification.detectedContexts).toContain('analytics');
    });

    test('should handle unknown emojis gracefully', () => {
      const classification = emojiClassifier.classifyEmoji('🦄', '<div>🦄 Unicorn</div>');

      expect(classification.category).toBe('unknown');
      expect(classification.subcategory).toBe('unclassified');
      expect(classification.therapeuticValue).toBe('low');
      expect(classification.confidence).toBeLessThan(0.5);
      expect(classification.recommendedReplacement).toBe('generic-fallback');
    });
  });

  describe('Context Analysis', () => {
    test('should detect header context', () => {
      const contexts = emojiClassifier.analyzeCodeContext('<h1>Title</h1>');
      expect(contexts).toContain('header');
    });

    test('should detect form context', () => {
      const contexts = emojiClassifier.analyzeCodeContext('<input type="text" />');
      expect(contexts).toContain('form');
    });

    test('should detect navigation context', () => {
      const contexts = emojiClassifier.analyzeCodeContext('<nav className="menu">Menu</nav>');
      expect(contexts).toContain('navigation');
    });

    test('should detect multiple contexts', () => {
      const contexts = emojiClassifier.analyzeCodeContext('<form><nav>Form Navigation</nav></form>');
      expect(contexts).toContain('form');
      expect(contexts).toContain('navigation');
    });

    test('should handle empty context', () => {
      const contexts = emojiClassifier.analyzeCodeContext('');
      expect(contexts).toHaveLength(0);
    });
  });

  describe('Confidence Calculation', () => {
    test('should give high confidence for perfect context match', () => {
      const emojiData = {
        category: 'medical',
        therapeuticValue: 'high',
        context: ['header', 'professional']
      };
      const detectedContexts = ['header'];
      
      const confidence = emojiClassifier.calculateConfidence(emojiData, detectedContexts);
      expect(confidence).toBeGreaterThan(0.6);
    });

    test('should give lower confidence for no context match', () => {
      const emojiData = {
        category: 'medical',
        therapeuticValue: 'high',
        context: ['header', 'professional']
      };
      const detectedContexts = ['form'];
      
      const confidence = emojiClassifier.calculateConfidence(emojiData, detectedContexts);
      expect(confidence).toBeLessThan(0.8);
    });

    test('should give base confidence for no detected contexts', () => {
      const emojiData = {
        category: 'medical',
        therapeuticValue: 'high',
        context: ['header']
      };
      const detectedContexts = [];
      
      const confidence = emojiClassifier.calculateConfidence(emojiData, detectedContexts);
      expect(confidence).toBe(0.5);
    });
  });

  describe('Therapeutic Priority', () => {
    test('should assign high priority for header contexts', () => {
      const emojiData = { therapeuticValue: 'medium' };
      const detectedContexts = ['header'];
      
      const priority = emojiClassifier.determineTherapeuticPriority(emojiData, detectedContexts);
      expect(priority).toBe('high');
    });

    test('should assign medium priority for navigation contexts', () => {
      const emojiData = { therapeuticValue: 'medium' };
      const detectedContexts = ['navigation'];
      
      const priority = emojiClassifier.determineTherapeuticPriority(emojiData, detectedContexts);
      expect(priority).toBe('medium');
    });

    test('should downgrade high therapeutic value without matching context', () => {
      const emojiData = { therapeuticValue: 'high' };
      const detectedContexts = ['unknown'];
      
      const priority = emojiClassifier.determineTherapeuticPriority(emojiData, detectedContexts);
      expect(priority).toBe('medium');
    });
  });

  describe('Replacement Recommendations', () => {
    test('should recommend professional photo for medical header context', () => {
      const emojiData = { category: 'medical' };
      const detectedContexts = ['header'];
      const therapeuticPriority = 'high';
      
      const recommendation = emojiClassifier.recommendReplacement(emojiData, detectedContexts, therapeuticPriority);
      expect(recommendation).toBe('professional-therapist-photo');
    });

    test('should recommend speech therapy photo for speech context', () => {
      const emojiData = { category: 'speech' };
      const detectedContexts = ['speech'];
      const therapeuticPriority = 'high';
      
      const recommendation = emojiClassifier.recommendReplacement(emojiData, detectedContexts, therapeuticPriority);
      expect(recommendation).toBe('speech-therapy-session-photo');
    });

    test('should provide category-based fallback', () => {
      const emojiData = { category: 'learning' };
      const detectedContexts = ['unknown'];
      const therapeuticPriority = 'standard';
      
      const recommendation = emojiClassifier.recommendReplacement(emojiData, detectedContexts, therapeuticPriority);
      expect(recommendation).toBe('educational-material-photo');
    });

    test('should provide generic fallback for unknown category', () => {
      const emojiData = { category: 'unknown' };
      const detectedContexts = [];
      const therapeuticPriority = 'low';
      
      const recommendation = emojiClassifier.recommendReplacement(emojiData, detectedContexts, therapeuticPriority);
      expect(recommendation).toBe('therapeutic-fallback-photo');
    });
  });

  describe('Batch Classification', () => {
    test('should classify multiple emojis correctly', () => {
      const emojiList = [
        { emoji: '👨‍⚕️', context: '<h1>👨‍⚕️ Doctor</h1>' },
        { emoji: '📊', context: '<div class="analytics">📊 Chart</div>' },
        { emoji: '👶', context: '<span>👶 Child</span>' }
      ];
      
      const classifications = emojiClassifier.batchClassify(emojiList);
      
      expect(classifications).toHaveLength(3);
      expect(classifications[0].category).toBe('medical');
      expect(classifications[1].category).toBe('interface');
      expect(classifications[2].category).toBe('demographic');
    });

    test('should handle empty batch', () => {
      const classifications = emojiClassifier.batchClassify([]);
      expect(classifications).toHaveLength(0);
    });
  });

  describe('Replacement Recommendations System', () => {
    test('should provide comprehensive recommendations for medical category', () => {
      const recommendations = emojiClassifier.getReplacementRecommendations('medical', 'professional', ['header']);
      
      expect(recommendations.primary).toBe('professional-therapist-portrait');
      expect(recommendations.alternatives).toContain('clinical-setting-photo');
      expect(recommendations.fallback).toBe('therapeutic-generic-photo');
    });

    test('should provide speech therapy recommendations', () => {
      const recommendations = emojiClassifier.getReplacementRecommendations('speech', 'equipment', ['audio']);
      
      expect(recommendations.primary).toBe('speech-therapy-equipment');
      expect(recommendations.alternatives).toContain('microphone-professional');
    });

    test('should provide learning recommendations', () => {
      const recommendations = emojiClassifier.getReplacementRecommendations('learning', 'visual', ['education']);
      
      expect(recommendations.primary).toBe('educational-materials-photo');
      expect(recommendations.alternatives).toContain('learning-activity-photo');
    });
  });

  describe('Classification Statistics', () => {
    test('should export meaningful statistics', () => {
      const classifications = [
        { category: 'medical', therapeuticValue: 'high', confidence: 0.8 },
        { category: 'medical', therapeuticValue: 'high', confidence: 0.9 },
        { category: 'speech', therapeuticValue: 'medium', confidence: 0.6 },
        { category: 'interface', therapeuticValue: 'low', confidence: 0.3 }
      ];
      
      const stats = emojiClassifier.exportClassificationStats(classifications);
      
      expect(stats.total).toBe(4);
      expect(stats.byCategory.medical).toBe(2);
      expect(stats.byCategory.speech).toBe(1);
      expect(stats.byTherapeuticValue.high).toBe(2);
      expect(stats.byTherapeuticValue.medium).toBe(1);
      expect(stats.byConfidence.high).toBe(2); // >= 0.7
      expect(stats.byConfidence.medium).toBe(1); // >= 0.4
      expect(stats.byConfidence.low).toBe(1); // < 0.4
      expect(stats.averageConfidence).toBeCloseTo(0.65);
    });

    test('should handle empty classification list', () => {
      const stats = emojiClassifier.exportClassificationStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.averageConfidence).toBeNaN();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null emoji gracefully', () => {
      const classification = emojiClassifier.classifyEmoji(null, '');
      
      expect(classification.category).toBe('unknown');
      expect(classification.confidence).toBeLessThan(0.5);
    });

    test('should handle undefined context gracefully', () => {
      const classification = emojiClassifier.classifyEmoji('👶', undefined);
      
      expect(classification).toBeDefined();
      expect(classification.detectedContexts).toHaveLength(0);
    });

    test('should handle very long context strings', () => {
      const longContext = 'A'.repeat(10000) + '<h1>Header</h1>' + 'B'.repeat(10000);
      const classification = emojiClassifier.classifyEmoji('👨‍⚕️', longContext);
      
      expect(classification).toBeDefined();
      expect(classification.detectedContexts).toContain('header');
    });

    test('should handle malformed HTML in context', () => {
      const malformedContext = '<div><span>👶</div>';
      const classification = emojiClassifier.classifyEmoji('👶', malformedContext);
      
      expect(classification).toBeDefined();
      expect(classification.category).toBe('demographic');
    });
  });

  describe('Performance and Optimization', () => {
    test('should classify emojis efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        emojiClassifier.classifyEmoji('👶', '<div>Child</div>');
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete 100 classifications in reasonable time (< 1 second)
      expect(totalTime).toBeLessThan(1000);
    });

    test('should handle batch classification efficiently', () => {
      const largeBatch = Array(100).fill().map((_, i) => ({
        emoji: '👶',
        context: `<div>Child ${i}</div>`
      }));
      
      const startTime = Date.now();
      const classifications = emojiClassifier.batchClassify(largeBatch);
      const endTime = Date.now();
      
      expect(classifications).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});