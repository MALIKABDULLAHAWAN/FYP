/**
 * Sticker System Verification Tests
 * Comprehensive tests to verify task 4.2 requirements are met
 */

const fs = require('fs');
const path = require('path');
const StickerManager = require('../../services/StickerManager').default;

describe('Task 4.2: Sticker System Integration Verification', () => {
  beforeEach(async () => {
    await StickerManager.initialize();
    StickerManager.clearCache();
    StickerManager.resetSessionCount();
  });

  describe('Requirement: Add StickerLayer to Layout component', () => {
    test('StickerLayer is imported and used in Layout', () => {
      const layoutCode = fs.readFileSync(
        path.join(__dirname, '../Layout.jsx'),
        'utf8'
      );
      
      expect(layoutCode).toContain('import { StickerLayer }');
      expect(layoutCode).toContain('<StickerLayer');
    });

    test('StickerLayer is positioned as background layer', () => {
      const layoutCode = fs.readFileSync(
        path.join(__dirname, '../Layout.jsx'),
        'utf8'
      );
      
      // Verify StickerLayer appears before main content
      const stickerLayerIndex = layoutCode.indexOf('<StickerLayer');
      const mainContentIndex = layoutCode.indexOf('<main className="main-content">');
      
      expect(stickerLayerIndex).toBeGreaterThan(-1);
      expect(stickerLayerIndex).toBeLessThan(mainContentIndex);
    });

    test('StickerLayer has correct z-index configuration', () => {
      const designTokens = require('../../theme/designTokens');
      const stickerCss = fs.readFileSync(
        path.join(__dirname, '../StickerLayer.css'),
        'utf8'
      );
      
      // Verify z-index is lower than main content
      expect(designTokens.designTokens.zIndex.sticker).toBe(-1);
      expect(designTokens.designTokens.zIndex.base).toBe(0);
      expect(designTokens.designTokens.zIndex.sticker).toBeLessThan(designTokens.designTokens.zIndex.base);
      
      // Verify CSS uses the z-index variable
      expect(stickerCss).toContain('z-index: var(--z-index-sticker)');
    });
  });

  describe('Requirement: Verify stickers display correctly on all pages', () => {
    test('StickerLayer is configured to be visible', () => {
      const layoutCode = fs.readFileSync(
        path.join(__dirname, '../Layout.jsx'),
        'utf8'
      );
      
      expect(layoutCode).toContain('visible={true}');
    });

    test('Stickers are selected for different page types', () => {
      const dashboardStickers = StickerManager.selectStickers('dashboard', 0);
      const therapistStickers = StickerManager.selectStickers('therapist', 0);
      const gamesStickers = StickerManager.selectStickers('games', 0);
      
      expect(dashboardStickers.length).toBeGreaterThan(0);
      expect(therapistStickers.length).toBeGreaterThan(0);
      expect(gamesStickers.length).toBeGreaterThan(0);
      
      // Each page should have 3-4 stickers
      expect(dashboardStickers.length).toBeGreaterThanOrEqual(3);
      expect(dashboardStickers.length).toBeLessThanOrEqual(4);
    });

    test('Stickers have proper accessibility attributes', () => {
      const stickerLayerCode = fs.readFileSync(
        path.join(__dirname, '../StickerLayer.jsx'),
        'utf8'
      );
      
      expect(stickerLayerCode).toContain('aria-hidden="true"');
      expect(stickerLayerCode).toContain('role="presentation"');
    });
  });

  describe('Requirement: Test sticker variety and rotation', () => {
    test('Sticker selection varies with session count', () => {
      const stickers1 = StickerManager.selectStickers('dashboard', 0);
      const stickers2 = StickerManager.selectStickers('dashboard', 10);
      const stickers3 = StickerManager.selectStickers('dashboard', 20);
      
      // Should have variety across different session counts
      expect(stickers1).not.toEqual(stickers2);
      expect(stickers2).not.toEqual(stickers3);
    });

    test('Sticker rotation is within expected range', () => {
      const stickers = StickerManager.selectStickers('dashboard', 0);
      const positions = StickerManager.calculatePositions(stickers, 1000, 800);
      
      positions.forEach(position => {
        expect(position.rotation).toBeGreaterThanOrEqual(-7.5);
        expect(position.rotation).toBeLessThanOrEqual(7.5);
      });
    });

    test('Sticker opacity is within therapeutic range', () => {
      const stickers = StickerManager.selectStickers('dashboard', 0);
      const positions = StickerManager.calculatePositions(stickers, 1000, 800);
      
      positions.forEach(position => {
        expect(position.opacity).toBeGreaterThanOrEqual(0.7);
        expect(position.opacity).toBeLessThanOrEqual(0.85);
      });
    });

    test('Multiple sticker categories are available', () => {
      expect(StickerManager.stickerCategories).toHaveProperty('animals');
      expect(StickerManager.stickerCategories).toHaveProperty('nature');
      expect(StickerManager.stickerCategories).toHaveProperty('objects');
      
      expect(StickerManager.stickerCategories.animals.length).toBeGreaterThan(0);
      expect(StickerManager.stickerCategories.nature.length).toBeGreaterThan(0);
      expect(StickerManager.stickerCategories.objects.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement: Ensure stickers don\'t interfere with page functionality', () => {
    test('Stickers have pointer-events disabled', () => {
      const stickerCss = fs.readFileSync(
        path.join(__dirname, '../StickerLayer.css'),
        'utf8'
      );
      
      expect(stickerCss).toContain('pointer-events: none');
      expect(stickerCss).toContain('user-select: none');
    });

    test('Stickers are positioned in corner zones', () => {
      const stickers = StickerManager.selectStickers('dashboard', 0);
      const positions = StickerManager.calculatePositions(stickers, 1000, 800);
      
      positions.forEach(position => {
        // Check if position is in one of the expected corner zones
        const isInTopLeft = position.x <= 300 && position.y <= 300;
        const isInTopRight = position.x >= 700 && position.y <= 300;
        const isInBottomLeft = position.x <= 300 && position.y >= 500;
        const isInBottomRight = position.x >= 700 && position.y >= 500;
        
        expect(isInTopLeft || isInTopRight || isInBottomLeft || isInBottomRight).toBe(true);
      });
    });

    test('StickerLayer is positioned absolutely to avoid layout interference', () => {
      const stickerCss = fs.readFileSync(
        path.join(__dirname, '../StickerLayer.css'),
        'utf8'
      );
      
      expect(stickerCss).toContain('position: absolute');
      expect(stickerCss).toContain('top: 0');
      expect(stickerCss).toContain('left: 0');
      expect(stickerCss).toContain('width: 100%');
      expect(stickerCss).toContain('height: 100%');
    });
  });

  describe('Requirement: Verify sticker responsiveness on all viewports', () => {
    test('Mobile viewport sizing (50-80px)', () => {
      const mobileSize = StickerManager.getResponsiveSize(480);
      expect(mobileSize).toBeGreaterThanOrEqual(50);
      expect(mobileSize).toBeLessThanOrEqual(80);
    });

    test('Tablet viewport sizing (80-100px)', () => {
      const tabletSize = StickerManager.getResponsiveSize(768);
      expect(tabletSize).toBeGreaterThanOrEqual(80);
      expect(tabletSize).toBeLessThanOrEqual(100);
    });

    test('Desktop viewport sizing (100-120px)', () => {
      const desktopSize = StickerManager.getResponsiveSize(1200);
      expect(desktopSize).toBeGreaterThanOrEqual(100);
      expect(desktopSize).toBeLessThanOrEqual(120);
    });

    test('Responsive CSS rules are defined', () => {
      const stickerCss = fs.readFileSync(
        path.join(__dirname, '../StickerLayer.css'),
        'utf8'
      );
      
      expect(stickerCss).toContain('@media (max-width: 640px)');
      expect(stickerCss).toContain('@media (min-width: 641px) and (max-width: 1024px)');
      expect(stickerCss).toContain('@media (min-width: 1025px)');
    });

    test('StickerLayer handles resize events', () => {
      const stickerLayerCode = fs.readFileSync(
        path.join(__dirname, '../StickerLayer.jsx'),
        'utf8'
      );
      
      expect(stickerLayerCode).toContain('ResizeObserver');
      expect(stickerLayerCode).toContain('window.addEventListener(\'resize\'');
    });
  });

  describe('Requirement: Accessibility and reduced motion support', () => {
    test('Reduced motion preference is respected', () => {
      const stickerLayerCode = fs.readFileSync(
        path.join(__dirname, '../StickerLayer.jsx'),
        'utf8'
      );
      const stickerCss = fs.readFileSync(
        path.join(__dirname, '../StickerLayer.css'),
        'utf8'
      );
      
      expect(stickerLayerCode).toContain('reducedMotion');
      expect(stickerCss).toContain('.reduced-motion');
      expect(stickerCss).toContain('animation: none !important');
    });

    test('Stickers are properly labeled for accessibility', () => {
      const stickers = StickerManager.selectStickers('dashboard', 0);
      
      stickers.forEach(sticker => {
        expect(sticker).toHaveProperty('name');
        expect(typeof sticker.name).toBe('string');
        expect(sticker.name.length).toBeGreaterThan(0);
      });
    });

    test('High contrast mode support', () => {
      const stickerCss = fs.readFileSync(
        path.join(__dirname, '../StickerLayer.css'),
        'utf8'
      );
      
      expect(stickerCss).toContain('.high-contrast-mode');
    });
  });

  describe('Integration with Design System', () => {
    test('StickerLayer uses design system accessibility preferences', () => {
      const stickerLayerCode = fs.readFileSync(
        path.join(__dirname, '../StickerLayer.jsx'),
        'utf8'
      );
      
      expect(stickerLayerCode).toContain('useDesignSystem');
      expect(stickerLayerCode).toContain('accessibilityPreferences');
    });

    test('Sticker assets are properly managed', () => {
      const stickers = StickerManager.selectStickers('dashboard', 0);
      
      stickers.forEach(sticker => {
        const asset = StickerManager.getStickerAsset(sticker);
        expect(asset).toHaveProperty('type');
        expect(asset).toHaveProperty('content');
        expect(asset).toHaveProperty('alt');
      });
    });
  });

  describe('Performance and Caching', () => {
    test('Sticker selection is cached for performance', () => {
      const stickers1 = StickerManager.selectStickers('dashboard', 0);
      const stickers2 = StickerManager.selectStickers('dashboard', 0);
      
      // Should return the same cached instance
      expect(stickers1).toBe(stickers2);
    });

    test('Cache can be cleared', () => {
      StickerManager.selectStickers('dashboard', 0);
      StickerManager.clearCache();
      
      // After clearing cache, should work normally
      const stickers = StickerManager.selectStickers('dashboard', 0);
      expect(stickers.length).toBeGreaterThan(0);
    });
  });
});