import React, { useEffect, useState, useRef } from 'react';
import { useDesignSystem } from '../theme/DesignSystemProvider';
import StickerManager from '../services/StickerManager';
import './StickerLayer.css';

/**
 * StickerLayer Component
 * 
 * Renders decorative therapeutic stickers in the background with:
 * - Calculated positions and rotations
 * - Responsive sizing
 * - Accessibility support (aria-hidden)
 * - Reduced motion preference respect
 * - Animations with motion preferences
 */
export function StickerLayer({
  pageType = 'default',
  sessionCount = 0,
  visible = true,
  className = '',
}) {
  const { accessibilityPreferences } = useDesignSystem();
  const [stickers, setStickers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [sizes, setSizes] = useState([]);
  const containerRef = useRef(null);

  // Initialize stickers on mount
  useEffect(() => {
    const initializeStickers = async () => {
      // Initialize StickerManager if not already done
      if (!StickerManager.allStickers) {
        await StickerManager.initialize();
      }

      // Select stickers for this page
      const selected = await StickerManager.selectStickers(pageType, sessionCount);
      setStickers(selected || []);
    };

    initializeStickers();
  }, [pageType, sessionCount]);

  // Calculate positions and sizes when container size changes
  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current || stickers.length === 0) return;

      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Calculate positions
      const newPositions = StickerManager.calculatePositions(
        stickers,
        width,
        height
      );
      setPositions(newPositions);

      // Calculate responsive sizes
      const newSizes = stickers.map(() =>
        StickerManager.getResponsiveSize(window.innerWidth)
      );
      setSizes(newSizes);
    };

    updatePositions();

    // Update on window resize
    const resizeObserver = new ResizeObserver(updatePositions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const handleWindowResize = updatePositions;
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [stickers]);

  if (!visible || stickers.length === 0) {
    return null;
  }

  const shouldReduceMotion = accessibilityPreferences.reducedMotion;

  return (
    <div
      ref={containerRef}
      className={`sticker-layer ${shouldReduceMotion ? 'reduced-motion' : ''} ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      {positions.map((position, index) => (
        <Sticker
          key={`${pageType}-${index}`}
          sticker={position.sticker}
          x={position.x}
          y={position.y}
          rotation={position.rotation}
          opacity={position.opacity}
          size={sizes[index] || 80}
          reducedMotion={shouldReduceMotion}
        />
      ))}
    </div>
  );
}

/**
 * Individual Sticker Component
 */
function Sticker({
  sticker,
  x,
  y,
  rotation,
  opacity,
  size,
  reducedMotion,
}) {
  const asset = StickerManager.getStickerAsset(sticker);

  const style = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    opacity: opacity,
    pointerEvents: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

  if (reducedMotion) {
    style.animation = 'none';
  } else {
    style.animation = 'sticker-float 3s ease-in-out infinite';
    style.animationDelay = `${Math.random() * 2}s`;
  }

  return (
    <div
      className="sticker"
      style={style}
      title={sticker.name}
    >
      {asset.type === 'svg' ? (
        <img
          src={asset.url}
          alt={asset.alt}
          className="sticker-image"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => {
            // Fallback to UiIcon if SVG fails to load
            e.target.style.display = 'none';
            const fallbackDiv = document.createElement('div');
            fallbackDiv.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(128, 90, 213, 0.1); border-radius: 50%; color: var(--primary);">
              <span style="font-size: ${size * 0.6}px;">*</span>
            </div>`;
            e.target.parentNode.appendChild(fallbackDiv);
          }}
        />
      ) : (
        <div
          className="sticker-fallback"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(128, 90, 213, 0.1)',
            borderRadius: '50%',
            color: 'var(--primary)',
            fontSize: `${size * 0.6}px`
          }}
        >
          *
        </div>
      )}
    </div>
  );
}

export default StickerLayer;
