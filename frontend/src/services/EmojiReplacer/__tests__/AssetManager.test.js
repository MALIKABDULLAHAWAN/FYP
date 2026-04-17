import AssetManager from '../AssetManager.js';

describe('AssetManager (smoke)', () => {
  let assetManager;

  beforeEach(() => {
    assetManager = new AssetManager();
  });

  test('returns a therapist asset with therapeutic metadata', async () => {
    const asset = await assetManager.getTherapistIcon('medical-professional');
    expect(asset).toBeDefined();
    expect(asset.url).toBeDefined();
    expect(asset.therapeuticContext.ageAppropriate).toBe(true);
  });

  test('provides backward-compatible helper methods', async () => {
    await expect(assetManager.preloadAssets()).resolves.toBeDefined();
    expect(assetManager.getFallbackPhoto()).toBeDefined();
    expect(assetManager.getEmergencyFallback()).toBeDefined();
    expect(assetManager.clearClinicalErrorLog()).toBe(true);
  });

  test('caches assets and can clear cache', async () => {
    await assetManager.getUIIcon('home');
    expect(assetManager.assetCache.size).toBeGreaterThan(0);
    assetManager.clearCache();
    expect(assetManager.assetCache.size).toBe(0);
  });
});
