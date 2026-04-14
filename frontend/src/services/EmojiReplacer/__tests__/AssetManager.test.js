/**
 * Unit tests for AssetManager
 * Tests therapeutic asset management and retrieval functionality
 */

import AssetManager from '../AssetManager.js';
import { assertTherapeuticCompliance } from './setup.js';

describe('AssetManager', () => {
  let assetManager;

  beforeEach(() => {
    assetManager = new AssetManager();
  });

  afterEach(() => {
    assetManager.clearCache();
  });

  describe('getTherapistIcon', () => {
    test('should return valid therapist icon', async () => {
      const asset = await assetManager.getTherapistIcon('medical-professional');

      expect(asset).toBeDefined();
      expect(asset.url).toBe('/images/therapist-professional.jpg');
      expect(asset.altText).toBe('Professional therapist in clinical setting');
      expect(asset.width).toBe(48);
      expect(asset.height).toBe(48);
      assertTherapeuticCompliance(asset);
    });

    test('should cache therapist icons', async () => {
      const asset1 = await assetManager.getTherapistIcon('medical-professional');
      const asset2 = await assetManager.getTherapistIcon('medical-professional');

      expect(asset1).toBe(asset2); // Same object reference due to caching
    });

    test('should handle different therapist roles', async () => {
      const medicalProfessional = await assetManager.getTherapistIcon('medical-professional');
      const clinicalSupervisor = await assetManager.getTherapistIcon('clinical-supervisor');

      expect(medicalProfessional).toBeDefined();
      expect(clinicalSupervisor).toBeDefined();
      // Both should use the same image but be cached separately
      expect(medicalProfessional.url).toBe(clinicalSupervisor.url);
    });
  });

  describe('getChildActivityIcon', () => {
    test('should return valid activity icons for all supported activities', async () => {
      const activities = [
        'patient-care',
        'speech-therapy', 
        'repetition',
        'picture_naming',
        'questions',
        'story_retell',
        'category_naming'
      ];

      for (const activity of activities) {
        const asset = await assetManager.getChildActivityIcon(activity);
        
        expect(asset).toBeDefined();
        expect(asset.url).toMatch(/^\/images\/.+\.jpg$/);
        expect(asset.altText.length).toBeGreaterThanOrEqual(10);
        expect(asset.width).toBe(32);
        expect(asset.height).toBe(32);
        assertTherapeuticCompliance(asset);
      }
    });

    test('should return appropriate therapeutic goals for activities', async () => {
      const repetitionAsset = await assetManager.getChildActivityIcon('repetition');
      const pictureAsset = await assetManager.getChildActivityIcon('picture_naming');

      expect(repetitionAsset.therapeuticContext.therapeuticGoals).toContain('articulation');
      expect(pictureAsset.therapeuticContext.therapeuticGoals).toContain('vocabulary');
    });

    test('should fallback to patient-care for unknown activities', async () => {
      const unknownAsset = await assetManager.getChildActivityIcon('unknown-activity');
      const patientCareAsset = await assetManager.getChildActivityIcon('patient-care');

      expect(unknownAsset.url).toBe(patientCareAsset.url);
      expect(unknownAsset.therapeuticContext.therapeuticGoals).toEqual(patientCareAsset.therapeuticContext.therapeuticGoals);
    });
  });

  describe('getMedicalIcon', () => {
    test('should return valid medical icons', async () => {
      const categories = ['session-management', 'performance-metric', 'success-indicator'];

      for (const category of categories) {
        const asset = await assetManager.getMedicalIcon(category);
        
        expect(asset).toBeDefined();
        expect(asset.url).toMatch(/^\/images\/.+\.jpg$/);
        expect(asset.width).toBe(24);
        expect(asset.height).toBe(24);
        assertTherapeuticCompliance(asset);
      }
    });

    test('should provide appropriate therapeutic context for medical icons', async () => {
      const sessionAsset = await assetManager.getMedicalIcon('session-management');
      const performanceAsset = await assetManager.getMedicalIcon('performance-metric');

      expect(sessionAsset.therapeuticContext.therapeuticGoals).toContain('data-collection');
      expect(performanceAsset.therapeuticContext.therapeuticGoals).toContain('outcome-measurement');
    });

    test('should fallback to session-management for unknown categories', async () => {
      const unknownAsset = await assetManager.getMedicalIcon('unknown-category');
      const sessionAsset = await assetManager.getMedicalIcon('session-management');

      expect(unknownAsset.url).toBe(sessionAsset.url);
    });
  });

  describe('getUIIcon', () => {
    test('should return valid UI icons', async () => {
      const types = [
        'professional-microphone',
        'add-button',
        'analytics-chart',
        'warning-alert'
      ];

      for (const type of types) {
        const asset = await assetManager.getUIIcon(type);
        
        expect(asset).toBeDefined();
        expect(asset.url).toMatch(/^\/images\/.+\.jpg$/);
        expect(asset.width).toBe(20);
        expect(asset.height).toBe(20);
        assertTherapeuticCompliance(asset);
      }
    });

    test('should provide appropriate alt text for UI elements', async () => {
      const microphoneAsset = await assetManager.getUIIcon('professional-microphone');
      const addButtonAsset = await assetManager.getUIIcon('add-button');

      expect(microphoneAsset.altText).toContain('microphone');
      expect(addButtonAsset.altText).toContain('patient');
    });

    test('should fallback to generic UI element for unknown types', async () => {
      const unknownAsset = await assetManager.getUIIcon('unknown-type');

      expect(unknownAsset.url).toBe('/images/generic-ui-element.jpg');
      expect(unknownAsset.altText).toBe('Therapeutic interface element');
    });
  });

  describe('preloadAssets', () => {
    test('should preload TherapistConsole assets', async () => {
      await assetManager.preloadAssets(['TherapistConsole']);

      expect(assetManager.preloadedAssets.has('TherapistConsole')).toBe(true);
      
      // Verify assets are cached
      expect(assetManager.assetCache.size).toBeGreaterThan(0);
    });

    test('should preload SpeechTherapy assets', async () => {
      await assetManager.preloadAssets(['SpeechTherapy']);

      expect(assetManager.preloadedAssets.has('SpeechTherapy')).toBe(true);
      
      // Should cache multiple speech therapy related assets
      expect(assetManager.assetCache.size).toBeGreaterThanOrEqual(6); // At least 6 speech activities
    });

    test('should preload multiple component assets', async () => {
      await assetManager.preloadAssets(['TherapistConsole', 'SpeechTherapy']);

      expect(assetManager.preloadedAssets.has('TherapistConsole')).toBe(true);
      expect(assetManager.preloadedAssets.has('SpeechTherapy')).toBe(true);
    });

    test('should handle empty component list', async () => {
      await assetManager.preloadAssets([]);

      expect(assetManager.preloadedAssets.size).toBe(0);
      expect(assetManager.assetCache.size).toBe(0);
    });
  });

  describe('getFallbackPhoto', () => {
    test('should return valid fallback photo', () => {
      const fallback = assetManager.getFallbackPhoto('👶');

      expect(fallback).toBeDefined();
      expect(fallback.url).toBe('/images/therapeutic-fallback.jpg');
      expect(fallback.altText).toBe('Therapeutic interface element');
      assertTherapeuticCompliance(fallback);
    });

    test('should return same fallback for any emoji type', () => {
      const fallback1 = assetManager.getFallbackPhoto('👶');
      const fallback2 = assetManager.getFallbackPhoto('📋');

      expect(fallback1.url).toBe(fallback2.url);
      expect(fallback1.altText).toBe(fallback2.altText);
    });
  });

  describe('cache management', () => {
    test('should cache assets after retrieval', async () => {
      expect(assetManager.assetCache.size).toBe(0);

      await assetManager.getTherapistIcon('medical-professional');
      expect(assetManager.assetCache.size).toBe(1);

      await assetManager.getChildActivityIcon('speech-therapy');
      expect(assetManager.assetCache.size).toBe(2);
    });

    test('should clear cache properly', async () => {
      await assetManager.getTherapistIcon('medical-professional');
      await assetManager.preloadAssets(['TherapistConsole']);
      
      expect(assetManager.assetCache.size).toBeGreaterThan(0);
      expect(assetManager.preloadedAssets.size).toBeGreaterThan(0);

      assetManager.clearCache();

      expect(assetManager.assetCache.size).toBe(0);
      expect(assetManager.preloadedAssets.size).toBe(0);
    });

    test('should use cached assets for repeated requests', async () => {
      const startTime = Date.now();
      await assetManager.getTherapistIcon('medical-professional');
      const firstCallTime = Date.now() - startTime;

      const cachedStartTime = Date.now();
      await assetManager.getTherapistIcon('medical-professional');
      const cachedCallTime = Date.now() - cachedStartTime;

      // Cached call should be significantly faster (though this is a simple test)
      expect(cachedCallTime).toBeLessThanOrEqual(firstCallTime);
    });
  });

  describe('therapeutic compliance', () => {
    test('should ensure all assets meet therapeutic criteria', async () => {
      const assetTypes = [
        () => assetManager.getTherapistIcon('medical-professional'),
        () => assetManager.getChildActivityIcon('speech-therapy'),
        () => assetManager.getMedicalIcon('session-management'),
        () => assetManager.getUIIcon('professional-microphone')
      ];

      for (const getAsset of assetTypes) {
        const asset = await getAsset();
        assertTherapeuticCompliance(asset);
      }
    });

    test('should provide meaningful therapeutic goals for all assets', async () => {
      const therapistAsset = await assetManager.getTherapistIcon('medical-professional');
      const activityAsset = await assetManager.getChildActivityIcon('repetition');
      const medicalAsset = await assetManager.getMedicalIcon('performance-metric');
      const uiAsset = await assetManager.getUIIcon('add-button');

      expect(therapistAsset.therapeuticContext.therapeuticGoals).toContain('professional-trust');
      expect(activityAsset.therapeuticContext.therapeuticGoals).toContain('articulation');
      expect(medicalAsset.therapeuticContext.therapeuticGoals).toContain('outcome-measurement');
      expect(uiAsset.therapeuticContext.therapeuticGoals).toContain('patient-management');
    });

    test('should maintain consistent accessibility standards', async () => {
      const assets = await Promise.all([
        assetManager.getTherapistIcon('medical-professional'),
        assetManager.getChildActivityIcon('speech-therapy'),
        assetManager.getMedicalIcon('session-management'),
        assetManager.getUIIcon('professional-microphone')
      ]);

      assets.forEach(asset => {
        expect(asset.accessibility.colorContrast).toBeGreaterThanOrEqual(4.5);
        expect(asset.accessibility.screenReaderCompatible).toBe(true);
        expect(asset.accessibility.focusIndicator).toContain('outline');
      });
    });
  });
});