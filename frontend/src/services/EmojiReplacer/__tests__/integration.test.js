import {
  initializeEmojiReplacer,
  processComponent,
  getTherapeuticAsset,
  emojiReplacer,
  assetManager
} from '../index.js';

describe('EmojiReplacer integration (smoke)', () => {
  beforeAll(async () => {
    await initializeEmojiReplacer();
  });

  test('exports singleton integration handles', () => {
    expect(emojiReplacer).toBeDefined();
    expect(assetManager).toBeDefined();
  });

  test('processes a component and returns a structured response', async () => {
    const result = await processComponent('<div>👶 Hello 📋</div>', 'SmokeComponent');
    expect(result).toBeDefined();
    expect(result.component).toBeDefined();
    expect(Array.isArray(result.replacements)).toBe(true);
    expect(result.validation).toBeDefined();
  });

  test('retrieves therapeutic asset object', async () => {
    const asset = await getTherapeuticAsset('therapist', 'medical-professional');
    expect(asset).toBeDefined();
    expect(asset.url).toBeDefined();
  });
});
