/**
 * Comprehensive tests for EmojiReplacer core functionality
 * Tests emoji detection, classification, and replacement algorithms
 */

import EmojiReplacer from '../EmojiReplacer.js';
import { 
  sampleComponentWithEmojis, 
  sampleComponentWithoutEmojis,
  assertNoEmojisRemain,
  assertValidImageTags,
  generateComponentWithRandomEmojis
} from './setup.js';

describe('EmojiReplacer Core Algorithms', () => {
  let emojiReplacer;

  beforeEach(() => {
    emojiReplacer = new EmojiReplacer();
  });

  afterEach(() => {
    emojiReplacer.clearCache();
  });

  describe('Emoji Detection', () => {
    test('should detect all emojis in sample component', () => {
      const emojiInstances = emojiReplacer.scanForEmojis(sampleComponentWithEmojis);

      expect(emojiInstances.length).toBeGreaterThan(0);
      
      // Should detect specific emojis from sample
      const detectedEmojis = emojiInstances.map(instance => instance.emoji);
      expect(detectedEmojis).toContain('👨‍⚕️');
      expect(detectedEmojis).toContain('➕');
      expect(detectedEmojis).toContain('👶');
      expect(detectedEmojis).toContain('📋');
      expect(detectedEmojis).toContain('✅');
      expect(detectedEmojis).toContain('📊');
    });

    test('should return empty array for component without emojis', () => {
      const emojiInstances = emojiReplacer.scanForEmojis(sampleComponentWithoutEmojis);
      expect(emojiInstances).toHaveLength(0);
    });

    test('should detect emojis with correct positions', () => {
      const testCode = 'Hello 👶 World 📋 Test';
      const emojiInstances = emojiReplacer.scanForEmojis(testCode);

      expect(emojiInstances).toHaveLength(2);
      expect(emojiInstances[0].emoji).toBe('👶');
      expect(emojiInstances[0].position).toBe(6);
      expect(emojiInstances[1].emoji).toBe('📋');
      expect(emojiInstances[1].position).toBe(14);
    });

    test('should handle complex multi-codepoint emojis', () => {
      const testCode = 'Doctor 👨‍⚕️ and 👩‍⚕️ nurse';
      const emojiInstances = emojiReplacer.scanForEmojis(testCode);

      expect(emojiInstances.length).toBeGreaterThanOrEqual(2);
      expect(emojiInstances.some(instance => instance.emoji === '👨‍⚕️')).toBe(true);
      expect(emojiInstances.some(instance => instance.emoji === '👩‍⚕️')).toBe(true);
    });

    test('should classify emojis by category', () => {
      const emojiInstances = emojiReplacer.scanForEmojis(sampleComponentWithEmojis);

      emojiInstances.forEach(instance => {
        expect(instance.category).toBeDefined();
        expect(instance.subcategory).toBeDefined();
        expect(['therapist', 'activity', 'medical', 'ui', 'demographic', 'interface', 'action', 'status']).toContain(instance.category);
      });
    });
  });

  describe('Context Determination', () => {
    test('should identify header context correctly', () => {
      const headerCode = '<div className="h1">👨‍⚕️ Therapist Console</div>';
      const emojiInstances = emojiReplacer.scanForEmojis(headerCode);

      expect(emojiInstances[0].context).toContain('header');
    });

    test('should identify stat card context correctly', () => {
      const statCode = '<StatCard icon="👶" label="Children" value={5} />';
      const emojiInstances = emojiReplacer.scanForEmojis(statCode);

      expect(emojiInstances[0].context).toContain('stat');
    });

    test('should identify navigation context correctly', () => {
      const navCode = '<button className="tab">📊 Overview</button>';
      const emojiInstances = emojiReplacer.scanForEmojis(navCode);

      expect(emojiInstances[0].context).toContain('nav');
    });

    test('should identify form context correctly', () => {
      const formCode = '<label className="form-label"><span>📧</span> Email</label>';
      const emojiInstances = emojiReplacer.scanForEmojis(formCode);

      expect(emojiInstances[0].context).toContain('form');
    });
  });

  describe('Replacement Strategy Selection', () => {
    test('should select header strategy for header context', () => {
      const emojiMapping = { context: 'header-therapist', emoji: '👨‍⚕️' };
      const strategy = emojiReplacer.selectReplacementStrategy(emojiMapping.context, emojiMapping);

      expect(strategy).toBe(emojiReplacer.replacementStrategies.header);
    });

    test('should select icon strategy for navigation context', () => {
      const emojiMapping = { context: 'nav-overview', emoji: '📊' };
      const strategy = emojiReplacer.selectReplacementStrategy(emojiMapping.context, emojiMapping);

      expect(strategy).toBe(emojiReplacer.replacementStrategies.icon);
    });

    test('should select inline strategy as default', () => {
      const emojiMapping = { context: 'unknown-context', emoji: '😀' };
      const strategy = emojiReplacer.selectReplacementStrategy(emojiMapping.context, emojiMapping);

      expect(strategy).toBe(emojiReplacer.replacementStrategies.inline);
    });
  });

  describe('Asset Retrieval', () => {
    test('should retrieve appropriate assets for different categories', async () => {
      const therapistMapping = { category: 'therapist', subcategory: 'medical-professional' };
      const activityMapping = { category: 'activity', subcategory: 'speech-therapy' };
      const medicalMapping = { category: 'medical', subcategory: 'session-management' };
      const uiMapping = { category: 'ui', subcategory: 'professional-microphone' };

      const therapistAsset = await emojiReplacer.getReplacementPhoto(therapistMapping);
      const activityAsset = await emojiReplacer.getReplacementPhoto(activityMapping);
      const medicalAsset = await emojiReplacer.getReplacementPhoto(medicalMapping);
      const uiAsset = await emojiReplacer.getReplacementPhoto(uiMapping);

      expect(therapistAsset.url).toContain('therapist');
      expect(activityAsset.url).toContain('therapy');
      expect(medicalAsset.url).toContain('clinical');
      expect(uiAsset.url).toContain('microphone');
    });

    test('should handle fallback for unknown categories', async () => {
      const unknownMapping = { category: 'unknown', subcategory: 'unknown' };
      const asset = await emojiReplacer.getReplacementPhoto(unknownMapping);

      expect(asset).toBeDefined();
      expect(asset.url).toBeDefined();
      expect(asset.altText).toBeDefined();
    });
  });

  describe('Complete Emoji Replacement Process', () => {
    test('should successfully replace all emojis in sample component', async () => {
      const result = await emojiReplacer.processEmojiReplacement(sampleComponentWithEmojis);

      expect(result.component).toBeDefined();
      expect(result.replacements.length).toBeGreaterThan(0);
      expect(result.validation.suitable).toBe(true);
      expect(result.enhancedAt).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);

      // Verify no emojis remain
      assertNoEmojisRemain(result.component);
      
      // Verify valid image tags
      assertValidImageTags(result.component);
    });

    test('should handle component without emojis gracefully', async () => {
      const result = await emojiReplacer.processEmojiReplacement(sampleComponentWithoutEmojis);

      expect(result.component).toBe(sampleComponentWithoutEmojis);
      expect(result.replacements).toHaveLength(0);
      expect(result.validation.suitable).toBe(true);
    });

    test('should maintain component structure during replacement', async () => {
      const originalStructure = sampleComponentWithEmojis.match(/<[^>]+>/g) || [];
      const result = await emojiReplacer.processEmojiReplacement(sampleComponentWithEmojis);
      const newStructure = result.component.match(/<[^>]+>/g) || [];

      // Should have more elements due to added img tags, but original structure preserved
      expect(newStructure.length).toBeGreaterThanOrEqual(originalStructure.length);
      
      // Check that original non-emoji elements are preserved
      const originalNonEmojiElements = originalStructure.filter(tag => !tag.includes('img'));
      originalNonEmojiElements.forEach(element => {
        expect(result.component).toContain(element);
      });
    });

    test('should provide detailed replacement information', async () => {
      const result = await emojiReplacer.processEmojiReplacement(sampleComponentWithEmojis);

      expect(result.replacements.length).toBeGreaterThan(0);
      
      result.replacements.forEach(replacement => {
        expect(replacement.emoji).toBeDefined();
        expect(replacement.context).toBeDefined();
        expect(replacement.category).toBeDefined();
        expect(replacement.subcategory).toBeDefined();
        expect(replacement.replacedWith).toBeDefined();
        expect(replacement.validatedAt).toBeDefined();
      });
    });

    test('should handle validation failures gracefully', async () => {
      // Mock validation service to return failure
      const originalValidate = emojiReplacer.validationService.validateTherapeuticSuitability;
      emojiReplacer.validationService.validateTherapeuticSuitability = jest.fn().mockReturnValue({
        suitable: false,
        errors: ['Mock validation failure'],
        warnings: [],
        validatedAt: new Date().toISOString()
      });

      const result = await emojiReplacer.processEmojiReplacement(sampleComponentWithEmojis);

      expect(result.replacements.length).toBeGreaterThan(0);
      expect(result.replacements.every(r => r.usedFallback)).toBe(true);

      // Restore original method
      emojiReplacer.validationService.validateTherapeuticSuitability = originalValidate;
    });

    test('should provide performance metrics', async () => {
      const result = await emojiReplacer.processEmojiReplacement(sampleComponentWithEmojis);

      expect(result.performance).toBeDefined();
      expect(result.performance.totalEmojis).toBeGreaterThan(0);
      expect(result.performance.successfulReplacements).toBeGreaterThan(0);
      expect(result.performance.processingTimePerEmoji).toBeGreaterThan(0);
      expect(result.performance.averageConfidence).toBeGreaterThan(0);
    });
  });

  describe('Property-Based Testing', () => {
    test('should handle random emoji combinations', async () => {
      for (let i = 0; i < 10; i++) {
        const randomComponent = generateComponentWithRandomEmojis(Math.floor(Math.random() * 10) + 1);
        const result = await emojiReplacer.processEmojiReplacement(randomComponent);

        expect(result.component).toBeDefined();
        expect(result.validation.suitable).toBe(true);
        assertNoEmojisRemain(result.component);
      }
    });

    test('should maintain therapeutic compliance across all replacements', async () => {
      const result = await emojiReplacer.processEmojiReplacement(sampleComponentWithEmojis);

      result.replacements.forEach(replacement => {
        expect(replacement.validationResult || replacement.validatedAt).toBeDefined();
      });
    });

    test('should preserve functionality across different component structures', async () => {
      const testComponents = [
        '<div onClick={handler}>👶 Click me</div>',
        '<button className="btn">➕ Add</button>',
        '<span style={{color: "red"}}>⚠️ Warning</span>',
        '<h1>👨‍⚕️ Medical Professional</h1>'
      ];

      for (const component of testComponents) {
        const result = await emojiReplacer.processEmojiReplacement(component);
        
        expect(result.validation.suitable).toBe(true);
        assertNoEmojisRemain(result.component);
        
        // Check that original attributes are preserved
        if (component.includes('onClick')) {
          expect(result.component).toContain('onClick');
        }
        if (component.includes('className')) {
          expect(result.component).toContain('className');
        }
        if (component.includes('style')) {
          expect(result.component).toContain('style');
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty string input', async () => {
      const result = await emojiReplacer.processEmojiReplacement('');

      expect(result.component).toBe('');
      expect(result.replacements).toHaveLength(0);
      expect(result.validation.suitable).toBe(true);
    });

    test('should handle malformed HTML gracefully', async () => {
      const malformedHTML = '<div>👶 <span>📋 </div>';
      const result = await emojiReplacer.processEmojiReplacement(malformedHTML);

      expect(result.component).toBeDefined();
      assertNoEmojisRemain(result.component);
    });

    test('should handle very long components', async () => {
      const longComponent = 'A'.repeat(10000) + '👶' + 'B'.repeat(10000);
      const result = await emojiReplacer.processEmojiReplacement(longComponent);

      expect(result.component).toBeDefined();
      expect(result.replacements).toHaveLength(1);
      assertNoEmojisRemain(result.component);
    });

    test('should handle components with many emojis', async () => {
      const manyEmojis = '👶'.repeat(100);
      const result = await emojiReplacer.processEmojiReplacement(manyEmojis);

      expect(result.replacements).toHaveLength(100);
      assertNoEmojisRemain(result.component);
    });
  });

  describe('Caching and Performance', () => {
    test('should cache assets for better performance', async () => {
      const startTime = Date.now();
      await emojiReplacer.processEmojiReplacement(sampleComponentWithEmojis);
      const firstRunTime = Date.now() - startTime;

      const cachedStartTime = Date.now();
      await emojiReplacer.processEmojiReplacement(sampleComponentWithEmojis);
      const cachedRunTime = Date.now() - cachedStartTime;

      // Second run should be faster due to caching
      expect(cachedRunTime).toBeLessThanOrEqual(firstRunTime * 1.5); // Allow some variance
    });

    test('should clear cache properly', async () => {
      await emojiReplacer.processEmojiReplacement(sampleComponentWithEmojis);
      expect(emojiReplacer.assetManager.assetCache.size).toBeGreaterThan(0);

      emojiReplacer.clearCache();
      expect(emojiReplacer.assetManager.assetCache.size).toBe(0);
    });
  });
});