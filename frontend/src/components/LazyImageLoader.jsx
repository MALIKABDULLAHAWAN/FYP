import React, { useState, useRef, useEffect } from 'react';
import './LazyImageLoader.css';

/**
 * LazyImageLoader - Optimized image loading with intersection observer
 * Implements lazy loading for performance optimization
 * 
 * Features:
 * - Intersection Observer API for viewport detection
 * - Progressive loading with placeholder
 * - Error handling with fallback images
 * - WebP format support with JPEG fallback
 * - Responsive image sizing
 */
const LazyImageLoader = ({
  src,
  alt,
  className = '',
  placeholder = '/assets/placeholder.svg',
  fallback = '/assets/fallback.svg',
  sizes = '(max-width: 640px) 320px, (max-width: 1024px) 640px, 1024px',
  loading = 'lazy',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer setup
  useEffect(() => {
    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Load image when in view
  useEffect(() => {
    if (!isInView || hasError) return;

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      setCurrentSrc(fallback);
      onError?.();
    };

    // Check if browser supports WebP
    const supportsWebP = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };

    // Use WebP if supported and available
    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const finalSrc = supportsWebP() && webpSrc !== src ? webpSrc : src;
    
    img.src = finalSrc;
  }, [isInView, src, fallback, onLoad, onError, hasError]);

  // Generate srcSet for responsive images
  const generateSrcSet = (baseSrc) => {
    if (hasError) return '';
    
    const extension = baseSrc.split('.').pop();
    const baseName = baseSrc.replace(`.${extension}`, '');
    
    return [
      `${baseName}-320w.${extension} 320w`,
      `${baseName}-640w.${extension} 640w`,
      `${baseName}-1024w.${extension} 1024w`
    ].join(', ');
  };

  return (
    <div className={`lazy-image-container ${className}`} {...props}>
      <img
        ref={imgRef}
        src={currentSrc}
        srcSet={isLoaded && !hasError ? generateSrcSet(currentSrc) : ''}
        sizes={sizes}
        alt={alt}
        className={`lazy-image ${isLoaded ? 'loaded' : 'loading'} ${hasError ? 'error' : ''}`}
        loading={loading}
        decoding="async"
      />
      
      {!isLoaded && !hasError && (
        <div className="lazy-image-placeholder">
          <div className="lazy-image-spinner" />
        </div>
      )}
      
      {hasError && (
        <div className="lazy-image-error">
          <span className="lazy-image-error-text">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export default LazyImageLoader;