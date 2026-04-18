/**
 * Layout Sticker Integration Tests
 * Tests that StickerLayer is properly integrated into Layout component
 */

const fs = require('fs');
const path = require('path');

describe('Layout Sticker Integration', () => {
  test('Layout component includes StickerLayer', () => {
    // Check that Layout imports StickerLayer
    const layoutCode = fs.readFileSync(
      path.join(__dirname, '../Layout.jsx'),
      'utf8'
    );
    
    expect(layoutCode).toContain('import { StickerLayer }');
    expect(layoutCode).toContain('<StickerLayer');
    expect(layoutCode).toContain('pageType="layout"');
    expect(layoutCode).toContain('sessionCount={0}');
    expect(layoutCode).toContain('visible={true}');
  });

  test('StickerLayer is positioned correctly in Layout', () => {
    const layoutCode = fs.readFileSync(
      path.join(__dirname, '../Layout.jsx'),
      'utf8'
    );
    
    // Verify StickerLayer appears before main content
    const stickerLayerIndex = layoutCode.indexOf('<StickerLayer');
    const mainContentIndex = layoutCode.indexOf('<main className="main-content">');
    
    expect(stickerLayerIndex).toBeGreaterThan(-1);
    expect(mainContentIndex).toBeGreaterThan(-1);
    expect(stickerLayerIndex).toBeLessThan(mainContentIndex);
  });

  test('Layout has correct CSS structure for stickers', () => {
    const layoutCss = fs.readFileSync(
      path.join(__dirname, '../Layout.css'),
      'utf8'
    );
    
    // Verify app-layout has position: relative for sticker positioning
    expect(layoutCss).toContain('.app-layout');
    expect(layoutCss).toContain('position: relative');
  });

  test('StickerLayer CSS has correct z-index configuration', () => {
    const stickerCss = fs.readFileSync(
      path.join(__dirname, '../StickerLayer.css'),
      'utf8'
    );
    
    // Verify sticker layer has correct positioning and z-index
    expect(stickerCss).toContain('.sticker-layer');
    expect(stickerCss).toContain('position: absolute');
    expect(stickerCss).toContain('z-index: var(--z-index-sticker)');
    expect(stickerCss).toContain('pointer-events: none');
  });

  test('Design tokens include sticker z-index', () => {
    const designTokens = require('../../theme/designTokens');
    
    expect(designTokens.designTokens.zIndex).toHaveProperty('sticker');
    expect(designTokens.designTokens.zIndex.sticker).toBe(-1);
    expect(designTokens.designTokens.zIndex.base).toBe(0);
    
    // Verify sticker z-index is lower than base content
    expect(designTokens.designTokens.zIndex.sticker).toBeLessThan(designTokens.designTokens.zIndex.base);
  });
});