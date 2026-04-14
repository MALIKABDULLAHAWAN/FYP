/**
 * Integration tests for the complete Emoji Replacement System
 * Tests end-to-end functionality and system integration
 */

import { 
  initializeEmojiReplacer, 
  processComponent, 
  getTherapeuticAsset,
  emojiReplacer,
  assetManager 
} from '../index.js';
import { sampleComponentWithEmojis } from './setup.js';

describe('Emoji Replacement System Integration', () => {
  beforeAll(async () => {
    // Initialize the system
    await initializeEmojiReplacer(['TherapistConsole', 'SpeechTherapy']);
  });

  afterEach(() => {
    assetManager.clearCache();
  });

  describe('System Initialization', () => {
    test('should initialize successfully', async () => {
      expect(emojiReplacer).toBeDefined();
      expect(assetManager).toBeDefined();
      expect(assetManager.preloadedAssets.has('TherapistConsole')).toBe(true);
      expect(assetManager.preloadedAssets.has('SpeechTherapy')).toBe(true);
    });

    test('should preload assets during initialization', () => {
      expect(assetManager.assetCache.size).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Component Processing', () => {
    test('should process TherapistConsole-style component successfully', async () => {
      const therapistConsoleCode = `
        import React from 'react';
        
        export default function TherapistConsole() {
          return (
            <div className="container">
              <div className="header">
                <div className="h1">👨‍⚕️ Therapist Console</div>
                <button className="btn btnPrimary">➕ Add Child</button>
              </div>
              
              <div className="stats-grid">
                <StatCard icon="👶" label="Total Children" value={5} />
                <StatCard icon="📋" label="Total Sessions" value={10} />
                <StatCard icon="✅" label="Completed" value={8} />
                <StatCard icon="🎯" label="Weekly Accuracy" value="85%" />
              </div>
              
              <div className="tabs">
                <button>📊 Overview</button>
                <button>👶 Children</button>
                <button>📋 Sessions</button>
                <button>📈 Analytics</button>
              </div>
            </div>
          );
        }
      `;

      const result = await processComponent(therapistConsoleCode);

      expect(result.component).toBeDefined();
      expect(result.replacements.length).toBeGreaterThan(0);
      expect(result.validation.suitable).toBe(true);
      
      // Verify specific replacements
      expect(result.component).toContain('therapeutic-image');
      expect(result.component).toContain('data-therapeutic-goals');
      expect(result.component).not.toMatch(/[👨‍⚕️➕👶📋✅🎯📊📈]/);
    });

    test('should process SpeechTherapy-style component successfully', async () => {
      const speechTherapyCode = `
        export default function SpeechTherapy() {
          return (
            <div className="container">
              <div className="header">
                <div className="h1">🗣️ Speech Therapy</div>
                <button className="btn">{tts.enabled ? "🔊 Voice On" : "🔇 Voice Off"}</button>
              </div>
              
              <div className="activities">
                <div className="activity">🗣️ Repeat</div>
                <div className="activity">🖼️ Picture</div>
                <div className="activity">❓ Q&A</div>
                <div className="activity">📖 Story</div>
                <div className="activity">🧠 Category</div>
              </div>
              
              <div className="recording">
                <button>🎙️ Start Recording</button>
                <button>⏹️ Stop Recording</button>
              </div>
              
              <div className="feedback">
                <button>✅ Success</button>
                <button>⚡ Partial</button>
                <button>❌ Fail</button>
              </div>
            </div>
          );
        }
      `;

      const result = await processComponent(speechTherapyCode);

      expect(result.component).toBeDefined();
      expect(result.replacements.length).toBeGreaterThan(0);
      expect(result.validation.suitable).toBe(true);
      
      // Verify no speech/audio emojis remain
      expect(result.component).not.toMatch(/[🗣️🔊🔇🖼️❓📖🧠🎙️⏹️✅⚡❌]/);
    });
  });

  describe('Asset Retrieval Integration', () => {
    test('should retrieve therapist assets correctly', async () => {
      const asset = await getTherapeuticAsset('therapist', 'medical-professional');
      
      expect(asset).toBeDefined();
      expect(asset.url).toContain('therapist');
      expect(asset.altText).toContain('therapist');
      expect(asset.therapeuticContext.ageAppropriate).toBe(true);
      expect(asset.therapeuticContext.culturallySensitive).toBe(true);
    });

    test('should retrieve activity assets correctly', async () => {
      const asset = await getTherapeuticAsset('activity', 'speech-therapy');
      
      expect(asset).toBeDefined();
      expect(asset.url).toContain('therapy');
      expect(asset.therapeuticContext.therapeuticGoals).toContain('communication');
    });

    test('should retrieve medical assets correctly', async () => {
      const asset = await getTherapeuticAsset('medical', 'session-management');
      
      expect(asset).toBeDefined();
      expect(asset.therapeuticContext.therapeuticGoals).toContain('data-collection');
    });

    test('should retrieve UI assets correctly', async () => {
      const asset = await getTherapeuticAsset('ui', 'professional-microphone');
      
      expect(asset).toBeDefined();
      expect(asset.altText).toContain('microphone');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large components efficiently', async () => {
      const largeComponent = `
        export default function LargeComponent() {
          return (
            <div>
              ${Array(50).fill().map((_, i) => `<div key="${i}">👶 Child ${i}</div>`).join('\n')}
            </div>
          );
        }
      `;

      const startTime = Date.now();
      const result = await processComponent(largeComponent);
      const processingTime = Date.now() - startTime;

      expect(result.replacements).toHaveLength(50);
      expect(result.validation.suitable).toBe(true);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should maintain performance with cached assets', async () => {
      const testComponent = '<div>👶 📋 ✅</div>';
      
      // First run
      const startTime1 = Date.now();
      await processComponent(testComponent);
      const firstRunTime = Date.now() - startTime1;

      // Second run (should use cached assets)
      const startTime2 = Date.now();
      await processComponent(testComponent);
      const secondRunTime = Date.now() - startTime2;

      expect(secondRunTime).toBeLessThanOrEqual(firstRunTime * 1.5); // Allow some variance
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle malformed components gracefully', async () => {
      const malformedComponent = '<div>👶 <span>📋 </div>'; // Missing closing span tag
      
      const result = await processComponent(malformedComponent);
      
      expect(result.component).toBeDefined();
      expect(result.validation.suitable).toBe(true);
      expect(result.component).not.toMatch(/[👶📋]/);
    });

    test('should handle components with mixed content', async () => {
      const mixedComponent = `
        <div>
          Regular text 👶 more text
          <span>Some HTML 📋 content</span>
          {/* Comment with emoji 🎯 */}
          "String with emoji ✅"
        </div>
      `;

      const result = await processComponent(mixedComponent);
      
      expect(result.component).toBeDefined();
      expect(result.replacements.length).toBeGreaterThan(0);
      expect(result.validation.suitable).toBe(true);
    });

    test('should maintain system stability under stress', async () => {
      const stressTestPromises = [];
      
      // Run multiple concurrent processing operations
      for (let i = 0; i < 10; i++) {
        const component = `<div>Test ${i}: 👶 📋 ✅ 🎯</div>`;
        stressTestPromises.push(processComponent(component));
      }

      const results = await Promise.all(stressTestPromises);
      
      results.forEach((result, index) => {
        expect(result.component).toBeDefined();
        expect(result.validation.suitable).toBe(true);
        expect(result.replacements).toHaveLength(4);
      });
    });
  });

  describe('Therapeutic Compliance Verification', () => {
    test('should ensure all replacements meet therapeutic standards', async () => {
      const result = await processComponent(sampleComponentWithEmojis);
      
      result.replacements.forEach(replacement => {
        expect(replacement.validationResult || replacement.validatedAt).toBeDefined();
        
        // If validation result is available, check compliance
        if (replacement.validationResult) {
          expect(replacement.validationResult.suitable).toBe(true);
        }
      });
    });

    test('should provide therapeutic goals for all assets', async () => {
      const categories = ['therapist', 'activity', 'medical', 'ui'];
      
      for (const category of categories) {
        const asset = await getTherapeuticAsset(category, 'test-subcategory');
        
        expect(asset.therapeuticContext.therapeuticGoals).toBeDefined();
        expect(asset.therapeuticContext.therapeuticGoals.length).toBeGreaterThan(0);
      }
    });

    test('should maintain accessibility standards', async () => {
      const result = await processComponent(sampleComponentWithEmojis);
      
      // Check that all img tags have proper alt text
      const imgTags = result.component.match(/<img[^>]*>/g) || [];
      
      imgTags.forEach(imgTag => {
        expect(imgTag).toMatch(/alt="[^"]{10,}"/); // At least 10 characters
        expect(imgTag).toMatch(/src="[^"]+"/); // Valid src
        expect(imgTag).toMatch(/class[^=]*="[^"]*therapeutic-image[^"]*"/); // Therapeutic class
      });
    });
  });

  describe('System Integration Validation', () => {
    test('should integrate all components seamlessly', async () => {
      // Test that all major components work together
      expect(emojiReplacer.assetManager).toBeDefined();
      expect(emojiReplacer.emojiClassifier).toBeDefined();
      expect(emojiReplacer.validationService).toBeDefined();
      
      // Test that they can communicate
      const asset = await emojiReplacer.assetManager.getTherapistIcon('medical-professional');
      const validation = emojiReplacer.validationService.validateTherapeuticSuitability(asset);
      const classification = emojiReplacer.emojiClassifier.classifyEmoji('👨‍⚕️', '<h1>Doctor</h1>');
      
      expect(asset).toBeDefined();
      expect(validation.suitable).toBe(true);
      expect(classification.category).toBe('medical');
    });

    test('should export comprehensive processing statistics', async () => {
      await processComponent(sampleComponentWithEmojis);
      
      const stats = emojiReplacer.exportProcessingStats();
      
      expect(stats).toBeDefined();
      expect(stats.generatedAt).toBeDefined();
    });
  });
});