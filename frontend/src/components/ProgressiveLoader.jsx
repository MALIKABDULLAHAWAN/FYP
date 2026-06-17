import React, { useState, useEffect, useRef } from 'react';
import './ProgressiveLoader.css';

/**
 * ProgressiveLoader - Progressive loading for non-critical content
 * Implements priority-based loading to improve perceived performance
 * 
 * Features:
 * - Priority-based loading (critical, high, medium, low)
 * - Intersection Observer for viewport-based loading
 * - Skeleton loading states
 * - Error handling and retry logic
 * - Performance monitoring
 */
const ProgressiveLoader = ({
  children,
  priority = 'medium', // critical, high, medium, low
  delay = 0,
  placeholder = null,
  skeleton = true,
  className = '',
  onLoad,
  onError,
  retryCount = 3,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retries, setRetries] = useState(0);
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Priority delays for progressive loading
  const priorityDelays = {
    critical: 0,
    high: 100,
    medium: 300,
    low: 500
  };

  // Initialize progressive loading
  useEffect(() => {
    if (priority === 'critical') {
      // Load critical content immediately
      loadContent();
    } else {
      // Set up intersection observer for non-critical content
      setupIntersectionObserver();
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [priority]);

  const setupIntersectionObserver = () => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadContent();
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.1
      }
    );

    observerRef.current.observe(containerRef.current);
  };

  const loadContent = async () => {
    if (isLoading || isLoaded) return;

    setIsLoading(true);
    setHasError(false);

    try {
      // Apply priority-based delay
      const loadDelay = priorityDelays[priority] + delay;
      
      if (loadDelay > 0) {
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, loadDelay);
        });
      }

      // Simulate content loading (replace with actual loading logic)
      await simulateContentLoad();
      
      setIsLoaded(true);
      setIsLoading(false);
      onLoad?.();
      
      // Performance monitoring
      recordLoadTime();
      
    } catch (error) {
      console.error('ProgressiveLoader error:', error);
      handleLoadError();
    }
  };

  const simulateContentLoad = () => {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      const loadTime = Math.random() * 500 + 100;
      
      setTimeout(() => {
        // Simulate occasional failures for testing
        if (Math.random() < 0.05 && retries < retryCount) {
          reject(new Error('Simulated load failure'));
        } else {
          resolve();
        }
      }, loadTime);
    });
  };

  const handleLoadError = () => {
    setIsLoading(false);
    
    if (retries < retryCount) {
      // Retry with exponential backoff
      const retryDelay = Math.pow(2, retries) * 1000;
      
      setTimeout(() => {
        setRetries(prev => prev + 1);
        loadContent();
      }, retryDelay);
    } else {
      setHasError(true);
      onError?.();
    }
  };

  const recordLoadTime = () => {
    // Record performance metrics
    if (window.performance && window.performance.mark) {
      const markName = `progressive-loader-${priority}-${Date.now()}`;
      window.performance.mark(markName);
      
      // Send to analytics if available
      if (window.gtag) {
        window.gtag('event', 'progressive_load', {
          priority,
          load_time: Date.now(),
          retries
        });
      }
    }
  };

  const renderSkeleton = () => {
    if (!skeleton) return null;
    
    return (
      <div className="progressive-loader-skeleton">
        <div className="skeleton-line skeleton-line-1" />
        <div className="skeleton-line skeleton-line-2" />
        <div className="skeleton-line skeleton-line-3" />
      </div>
    );
  };

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }
    
    if (skeleton) {
      return renderSkeleton();
    }
    
    return (
      <div className="progressive-loader-placeholder">
        <div className="progressive-loader-spinner" />
        <span className="progressive-loader-text">Loading...</span>
      </div>
    );
  };

  const renderError = () => (
    <div className="progressive-loader-error">
      <span className="progressive-loader-error-text">
        Content unavailable
      </span>
      <button 
        className="progressive-loader-retry"
        onClick={() => {
          setRetries(0);
          setHasError(false);
          loadContent();
        }}
      >
        Retry
      </button>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`progressive-loader ${className} priority-${priority}`}
      data-priority={priority}
      data-loaded={isLoaded}
      data-loading={isLoading}
      data-error={hasError}
      {...props}
    >
      {hasError ? renderError() : (
        isLoaded ? children : renderPlaceholder()
      )}
    </div>
  );
};

export default ProgressiveLoader;