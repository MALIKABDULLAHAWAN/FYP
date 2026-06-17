import React, { lazy, Suspense } from 'react';
import ProgressiveLoader from './ProgressiveLoader';

/**
 * LazyComponents - Code splitting implementation for large components
 * Uses React.lazy for dynamic imports and progressive loading
 */

// Lazy load large components with code splitting
const LazyGameInterface = lazy(() => 
  import('./GameInterface').then(module => ({
    default: module.default
  }))
);

const LazyTherapistConsole = lazy(() => 
  import('../pages/TherapistConsole').then(module => ({
    default: module.default
  }))
);

const LazyGameSelector = lazy(() => 
  import('./GameSelector').then(module => ({
    default: module.default
  }))
);

const LazyGameMetadataDisplay = lazy(() => 
  import('./GameMetadataDisplay').then(module => ({
    default: module.default
  }))
);

const LazyErrorNotificationCenter = lazy(() => 
  import('./ErrorNotificationCenter').then(module => ({
    default: module.default
  }))
);

const LazyConfetti = lazy(() => 
  import('./Confetti').then(module => ({
    default: module.default
  }))
);

const LazyMagicalEffects = lazy(() => 
  import('./MagicalEffects').then(module => ({
    default: module.default
  }))
);

// Enhanced loading fallback component
const LoadingFallback = ({ 
  componentName = 'Component',
  priority = 'medium',
  skeleton = true,
  minHeight = '200px'
}) => (
  <ProgressiveLoader
    priority={priority}
    skeleton={skeleton}
    className="lazy-component-fallback"
    style={{ minHeight }}
  >
    <div className="lazy-loading-content">
      <div className="lazy-loading-spinner" />
      <span className="lazy-loading-text">
        Loading {componentName}...
      </span>
    </div>
  </ProgressiveLoader>
);

// Error boundary for lazy components
class LazyComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component error:', error, errorInfo);
    
    // Report to error tracking service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: `Lazy component error: ${error.message}`,
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="lazy-component-error">
          <h3>Component failed to load</h3>
          <p>Please refresh the page to try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for lazy loading with enhanced features
const LazyWrapper = ({ 
  component: Component, 
  fallback, 
  componentName,
  priority = 'medium',
  preload = false,
  ...props 
}) => {
  // Preload component if requested
  React.useEffect(() => {
    if (preload) {
      Component.preload?.();
    }
  }, [preload, Component]);

  return (
    <LazyComponentErrorBoundary>
      <Suspense 
        fallback={
          fallback || (
            <LoadingFallback 
              componentName={componentName}
              priority={priority}
            />
          )
        }
      >
        <Component {...props} />
      </Suspense>
    </LazyComponentErrorBoundary>
  );
};

// Exported lazy components with enhanced loading
export const GameInterface = (props) => (
  <LazyWrapper
    component={LazyGameInterface}
    componentName="Game Interface"
    priority="high"
    preload={props.preload}
    {...props}
  />
);

export const TherapistConsole = (props) => (
  <LazyWrapper
    component={LazyTherapistConsole}
    componentName="Therapist Console"
    priority="high"
    preload={props.preload}
    {...props}
  />
);

export const GameSelector = (props) => (
  <LazyWrapper
    component={LazyGameSelector}
    componentName="Game Selector"
    priority="medium"
    preload={props.preload}
    {...props}
  />
);

export const GameMetadataDisplay = (props) => (
  <LazyWrapper
    component={LazyGameMetadataDisplay}
    componentName="Game Metadata"
    priority="medium"
    preload={props.preload}
    {...props}
  />
);

export const ErrorNotificationCenter = (props) => (
  <LazyWrapper
    component={LazyErrorNotificationCenter}
    componentName="Notifications"
    priority="low"
    preload={props.preload}
    {...props}
  />
);

export const Confetti = (props) => (
  <LazyWrapper
    component={LazyConfetti}
    componentName="Celebration Effects"
    priority="low"
    preload={false}
    {...props}
  />
);

export const MagicalEffects = (props) => (
  <LazyWrapper
    component={LazyMagicalEffects}
    componentName="Magical Effects"
    priority="low"
    preload={false}
    {...props}
  />
);

// Preloading utilities
export const preloadComponents = {
  gameInterface: () => LazyGameInterface.preload?.(),
  therapistConsole: () => LazyTherapistConsole.preload?.(),
  gameSelector: () => LazyGameSelector.preload?.(),
  gameMetadata: () => LazyGameMetadataDisplay.preload?.(),
  notifications: () => LazyErrorNotificationCenter.preload?.(),
  effects: () => {
    LazyConfetti.preload?.();
    LazyMagicalEffects.preload?.();
  }
};

// Route-based preloading
export const preloadForRoute = (routeName) => {
  const routePreloads = {
    dashboard: ['notifications'],
    game: ['gameInterface', 'effects'],
    therapist: ['therapistConsole', 'gameSelector', 'gameMetadata'],
    profile: ['notifications']
  };

  const componentsToPreload = routePreloads[routeName] || [];
  componentsToPreload.forEach(componentName => {
    preloadComponents[componentName]?.();
  });
};

// Performance monitoring for lazy components
export const trackLazyComponentLoad = (componentName, loadTime) => {
  if (window.performance && window.performance.mark) {
    window.performance.mark(`lazy-${componentName}-loaded`);
  }

  if (window.gtag) {
    window.gtag('event', 'lazy_component_load', {
      component_name: componentName,
      load_time: loadTime,
      custom_parameter: 'performance_optimization'
    });
  }
};

export default {
  GameInterface,
  TherapistConsole,
  GameSelector,
  GameMetadataDisplay,
  ErrorNotificationCenter,
  Confetti,
  MagicalEffects,
  preloadComponents,
  preloadForRoute,
  trackLazyComponentLoad
};