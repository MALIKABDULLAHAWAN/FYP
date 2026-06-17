/**
 * Performance Optimization Services Index
 * Central export point for all performance optimization services and components
 */

// Core performance services
export { default as AggressiveCacheManager } from './AggressiveCacheManager';
export { default as PerformanceMonitor } from './PerformanceMonitor';
export { default as ResourcePreloader } from './ResourcePreloader';
export { default as PerformanceOptimizer } from './PerformanceOptimizer';

// Performance-optimized components
export { default as LazyImageLoader } from '../components/LazyImageLoader';
export { default as ProgressiveLoader } from '../components/ProgressiveLoader';
export { default as OptimizedGameCard } from '../components/OptimizedGameCard';
export { default as OptimizedStickerLayer } from '../components/OptimizedStickerLayer';

// Lazy loading utilities
export { default as LazyComponents } from '../components/LazyComponents';

// Performance optimization utilities
export const initializePerformanceOptimization = async () => {
  // Initialize all performance services
  const AggressiveCacheManager = (await import('./AggressiveCacheManager.js')).default;
  const PerformanceMonitor = (await import('./PerformanceMonitor.js')).default;
  const ResourcePreloader = (await import('./ResourcePreloader.js')).default;
  const PerformanceOptimizer = (await import('./PerformanceOptimizer.js')).default;

  const services = {
    cacheManager: AggressiveCacheManager,
    performanceMonitor: PerformanceMonitor,
    resourcePreloader: ResourcePreloader,
    performanceOptimizer: PerformanceOptimizer
  };

  console.log('Performance optimization services initialized');
  return services;
};

// Performance monitoring utilities
export const getPerformanceReport = async () => {
  const PerformanceOptimizer = (await import('./PerformanceOptimizer.js')).default;
  return PerformanceOptimizer.getPerformanceReport();
};

// Cache management utilities
export const clearAllCaches = async () => {
  const AggressiveCacheManager = (await import('./AggressiveCacheManager.js')).default;
  await AggressiveCacheManager.clear();
  console.log('All caches cleared');
};

// Resource preloading utilities
export const preloadCriticalResources = async () => {
  const ResourcePreloader = (await import('./ResourcePreloader.js')).default;
  await ResourcePreloader.preloadCriticalResources();
  console.log('Critical resources preloaded');
};

// Performance optimization levels
export const setOptimizationLevel = async (level) => {
  const PerformanceOptimizer = (await import('./PerformanceOptimizer.js')).default;
  PerformanceOptimizer.setOptimizationLevel(level);
  console.log(`Optimization level set to: ${level}`);
};

// Performance recommendations
export const getPerformanceRecommendations = async () => {
  const PerformanceOptimizer = (await import('./PerformanceOptimizer.js')).default;
  return PerformanceOptimizer.getRecommendations();
};