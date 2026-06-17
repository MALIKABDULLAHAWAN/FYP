import React, { memo, useMemo, useCallback, useEffect, useState } from 'react';
import ProgressiveLoader from './ProgressiveLoader';
import cacheManager from '../services/AggressiveCacheManager';
import './StickerLayer.css';

/**
 * OptimizedStickerLayer - Performance-optimized sticker background component
 * Uses React.memo, caching, and efficient rendering strategies
 */
const OptimizedStickerLayer = memo(({
  pageType = 'default',
  sessionCount = 0,
  maxStickers = 4,
  opacity = 0.75,
  animationEnabled = true,
  className = '',
  ...props
}) => {
  const [stickers, setStickers] = useState([]);
  const [stickerPositions, setStickerPositions] = useState([]);

  // Memoize sticker selection based on page type and session
  const stickerCacheKey = useMemo(() => 
    `stickers-${pageType}-${Math.floor(sessionCount / 5)}`, 
    [pageType, sessionCount]
  );

  // Memoize container classes
  const containerClasses = useMemo(() => {
    return [
      'sticker-layer',
      'optimized-sticker-layer',
      `page-type-${pageType}`,
      animationEnabled ? 'animations-enabled' : 'animations-disabled',
      className
    ].filter(Boolean).join(' ');
  }, [pageType, animationEnabled, className]);

  // Load stickers with caching
  const loadStickers = useCallback(async () => {
    try {
      const cachedStickers = await cacheManager.get(
        stickerCacheKey,
        async () => {
          // Fallback: generate sticker selection
          return await generateStickerSelection(pageType, sessionCount, maxStickers);
        },
        { ttl: 10 * 60 * 1000, priority: 'low' } // 10 minutes TTL, low priority
      );

      setStickers(cachedStickers || []);
    } catch (error) {
      console.error('Failed to load stickers:', error);
      setStickers([]);
    }
  }, [stickerCacheKey, pageType, sessionCount, maxStickers]);

  // Generate sticker positions
  const generatePositions = useCallback(() => {
    if (stickers.length === 0) return [];

    const positions = [];
    const zones = [
      { x: 5, y: 10 },   // top-left
      { x: 85, y: 15 },  // top-right
      { x: 10, y: 75 },  // bottom-left
      { x: 80, y: 80 }   // bottom-right
    ];

    stickers.forEach((sticker, index) => {
      const zone = zones[index % zones.length];
      const randomOffset = 10;
      
      positions.push({
        id: sticker.id,
        x: zone.x + (Math.random() - 0.5) * randomOffset,
        y: zone.y + (Math.random() - 0.5) * randomOffset,
        rotation: (Math.random() - 0.5) * 30, // -15 to +15 degrees
        scale: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
        opacity: opacity * (0.8 + Math.random() * 0.2) // Slight opacity variation
      });
    });

    return positions;
  }, [stickers, opacity]);

  // Update positions when stickers change
  useEffect(() => {
    setStickerPositions(generatePositions());
  }, [generatePositions]);

  // Load stickers on mount and when dependencies change
  useEffect(() => {
    loadStickers();
  }, [loadStickers]);

  // Memoize individual sticker components
  const stickerComponents = useMemo(() => {
    return stickerPositions.map((position, index) => {
      const sticker = stickers[index];
      if (!sticker) return null;

      const stickerStyle = {
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
        opacity: position.opacity,
        zIndex: -1,
        pointerEvents: 'none',
        transition: animationEnabled ? 'all 0.3s ease-in-out' : 'none'
      };

      return (
        <div
          key={`sticker-${position.id}-${index}`}
          className="sticker-item"
          style={stickerStyle}
          aria-hidden="true"
        >
          <img
            src={sticker.url}
            alt=""
            className="sticker-image"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Hide broken stickers
              e.target.style.display = 'none';
            }}
          />
        </div>
      );
    });
  }, [stickerPositions, stickers, animationEnabled]);

  // Don't render if no stickers or reduced motion preference
  if (stickers.length === 0) {
    return null;
  }

  return (
    <ProgressiveLoader
      priority="low"
      className="sticker-layer-loader"
      skeleton={false}
    >
      <div
        className={containerClasses}
        role="presentation"
        aria-hidden="true"
        {...props}
      >
        {stickerComponents}
      </div>
    </ProgressiveLoader>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.pageType === nextProps.pageType &&
    prevProps.sessionCount === nextProps.sessionCount &&
    prevProps.maxStickers === nextProps.maxStickers &&
    prevProps.opacity === nextProps.opacity &&
    prevProps.animationEnabled === nextProps.animationEnabled &&
    prevProps.className === nextProps.className
  );
});

/**
 * Generate sticker selection based on page type and session
 */
async function generateStickerSelection(pageType, sessionCount, maxStickers) {
  const stickerCategories = {
    dashboard: ['animals', 'nature', 'toys'],
    game: ['encouragement', 'celebration', 'nature'],
    therapist: ['professional', 'medical', 'educational'],
    default: ['animals', 'nature', 'toys', 'encouragement']
  };

  const categories = stickerCategories[pageType] || stickerCategories.default;
  const selectedCategory = categories[sessionCount % categories.length];

  // Mock sticker data - in real implementation, this would come from assets
  const stickerDatabase = {
    animals: [
      { id: 'butterfly-1', url: '/assets/stickers/animals/butterfly.svg', category: 'animals' },
      { id: 'bird-1', url: '/assets/stickers/animals/bird.svg', category: 'animals' },
      { id: 'cat-1', url: '/assets/stickers/animals/cat.svg', category: 'animals' }
    ],
    nature: [
      { id: 'flower-1', url: '/assets/stickers/nature/flower.svg', category: 'nature' },
      { id: 'tree-1', url: '/assets/stickers/nature/tree.svg', category: 'nature' },
      { id: 'sun-1', url: '/assets/stickers/nature/sun.svg', category: 'nature' }
    ],
    toys: [
      { id: 'ball-1', url: '/assets/stickers/toys/ball.svg', category: 'toys' },
      { id: 'blocks-1', url: '/assets/stickers/toys/blocks.svg', category: 'toys' }
    ],
    encouragement: [
      { id: 'star-1', url: '/assets/stickers/encouragement/star.svg', category: 'encouragement' },
      { id: 'heart-1', url: '/assets/stickers/encouragement/heart.svg', category: 'encouragement' }
    ],
    professional: [
      { id: 'clipboard-1', url: '/assets/stickers/professional/clipboard.svg', category: 'professional' }
    ],
    medical: [
      { id: 'stethoscope-1', url: '/assets/stickers/medical/stethoscope.svg', category: 'medical' }
    ],
    educational: [
      { id: 'book-1', url: '/assets/stickers/educational/book.svg', category: 'educational' }
    ]
  };

  const availableStickers = stickerDatabase[selectedCategory] || stickerDatabase.animals;
  
  // Shuffle and select stickers
  const shuffled = [...availableStickers].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(maxStickers, shuffled.length));
}

OptimizedStickerLayer.displayName = 'OptimizedStickerLayer';

export default OptimizedStickerLayer;