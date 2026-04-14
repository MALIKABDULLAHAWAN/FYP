/**
 * Performance Services Test Suite
 * Tests for AggressiveCacheManager, PerformanceMonitor, ResourcePreloader, and PerformanceOptimizer
 */

// Mock Canvas API for Node.js environment
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    textBaseline: '',
    font: '',
    fillText: jest.fn(),
    toDataURL: jest.fn(() => 'data:image/webp;base64,mock-webp-data')
  }));
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/webp;base64,mock-webp-data');
} else {
  // Define HTMLCanvasElement for Node.js environment
  global.HTMLCanvasElement = class HTMLCanvasElement {
    constructor() {
      this.width = 1;
      this.height = 1;
    }
    
    getContext() {
      return {
        textBaseline: '',
        font: '',
        fillText: jest.fn(),
        toDataURL: jest.fn(() => 'data:image/webp;base64,mock-webp-data')
      };
    }
    
    toDataURL() {
      return 'data:image/webp;base64,mock-webp-data';
    }
  };
}

import AggressiveCacheManager from '../AggressiveCacheManager';
import PerformanceMonitor from '../PerformanceMonitor';
import ResourcePreloader from '../ResourcePreloader';
import PerformanceOptimizer from '../PerformanceOptimizer';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(() => ({
    result: {
      objectStoreNames: { contains: () => false },
      createObjectStore: jest.fn(() => ({
        createIndex: jest.fn()
      }))
    },
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null
  })),
  deleteDatabase: jest.fn()
};

global.indexedDB = mockIndexedDB;

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  }
});

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({})
  })
);

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: jest.fn()
  }
});

describe('AggressiveCacheManager', () => {
  let cacheManager;

  beforeEach(() => {
    cacheManager = new AggressiveCacheManager({
      maxMemorySize: 1024 * 1024, // 1MB for testing
      maxMemoryItems: 100,
      defaultTTL: 60000 // 1 minute
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    cacheManager.cleanup();
  });

  test('initializes with correct options', () => {
    expect(cacheManager.options.maxMemorySize).toBe(1024 * 1024);
    expect(cacheManager.options.maxMemoryItems).toBe(100);
    expect(cacheManager.options.defaultTTL).toBe(60000);
  });

  test('stores and retrieves data from memory cache', async () => {
    const testData = { test: 'data', number: 123 };
    
    await cacheManager.set('test-key', testData);
    const retrieved = await cacheManager.get('test-key');
    
    expect(retrieved).toEqual(testData);
  });

  test('handles cache miss with fallback function', async () => {
    const fallbackData = { fallback: true };
    const fallbackFn = jest.fn().mockResolvedValue(fallbackData);
    
    const result = await cacheManager.get('missing-key', fallbackFn);
    
    expect(fallbackFn).toHaveBeenCalled();
    expect(result).toEqual(fallbackData);
  });

  test('respects TTL expiration', async () => {
    const testData = { expires: true };
    
    await cacheManager.set('expiring-key', testData, { ttl: 100 }); // 100ms TTL
    
    // Should be available immediately
    let retrieved = await cacheManager.get('expiring-key');
    expect(retrieved).toEqual(testData);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should be expired
    retrieved = await cacheManager.get('expiring-key');
    expect(retrieved).toBeNull();
  });

  test('implements LRU eviction', async () => {
    // Fill cache to capacity
    for (let i = 0; i < 105; i++) {
      await cacheManager.set(`key-${i}`, { data: i });
    }
    
    // First items should be evicted
    const firstItem = await cacheManager.get('key-0');
    expect(firstItem).toBeNull();
    
    // Recent items should still be available
    const recentItem = await cacheManager.get('key-104');
    expect(recentItem).toEqual({ data: 104 });
  });

  test('tracks analytics correctly', async () => {
    await cacheManager.set('analytics-test', { data: 'test' });
    await cacheManager.get('analytics-test'); // Hit
    await cacheManager.get('missing-key'); // Miss
    
    const stats = cacheManager.getStats();
    expect(stats.hits).toBeGreaterThan(0);
    expect(stats.misses).toBeGreaterThan(0);
    expect(stats.sets).toBeGreaterThan(0);
  });

  test('handles errors gracefully', async () => {
    // Test with invalid data
    await expect(cacheManager.set('error-test', undefined)).resolves.not.toThrow();
    
    // Test with circular reference
    const circular = { self: null };
    circular.self = circular;
    await expect(cacheManager.set('circular-test', circular)).resolves.not.toThrow();
  });
});

describe('PerformanceMonitor', () => {
  let performanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor({
      enableCoreWebVitals: true,
      enableCustomMetrics: true,
      reportingInterval: 1000, // 1 second for testing
      performanceBudgets: {
        LCP: 2000,
        FID: 100,
        CLS: 0.1
      }
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    performanceMonitor.cleanup();
  });

  test('initializes with correct options', () => {
    expect(performanceMonitor.options.enableCoreWebVitals).toBe(true);
    expect(performanceMonitor.options.enableCustomMetrics).toBe(true);
    expect(performanceMonitor.options.reportingInterval).toBe(1000);
  });

  test('records custom metrics', () => {
    performanceMonitor.recordMetric('test_metric', 123, { context: 'test' });
    
    expect(performanceMonitor.metrics.size).toBeGreaterThan(0);
    expect(performanceMonitor.reportingQueue.length).toBeGreaterThan(0);
  });

  test('checks performance budgets', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Exceed LCP budget
    performanceMonitor.recordMetric('LCP', 3000); // Budget is 2000
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Performance budget exceeded for LCP')
    );
    
    consoleSpy.mockRestore();
  });

  test('provides performance summary', () => {
    performanceMonitor.recordMetric('LCP', 1500);
    performanceMonitor.recordMetric('FID', 80);
    performanceMonitor.recordMetric('CLS', 0.05);
    
    const summary = performanceMonitor.getPerformanceSummary();
    
    expect(summary.coreWebVitals.LCP).toBeDefined();
    expect(summary.coreWebVitals.FID).toBeDefined();
    expect(summary.coreWebVitals.CLS).toBeDefined();
    expect(summary.budgetStatus).toBeDefined();
  });

  test('handles timing operations', () => {
    const timer = performanceMonitor.startTiming('test_operation');
    
    // Simulate some work
    setTimeout(() => {
      const duration = timer.end({ operation: 'test' });
      expect(duration).toBeGreaterThan(0);
    }, 10);
  });

  test('handles marks and measures', () => {
    performanceMonitor.mark('test_start');
    performanceMonitor.mark('test_end');
    performanceMonitor.measure('test_duration', 'test_start', 'test_end');
    
    expect(window.performance.mark).toHaveBeenCalledWith('test_start');
    expect(window.performance.mark).toHaveBeenCalledWith('test_end');
  });
});

describe('ResourcePreloader', () => {
  let resourcePreloader;

  beforeEach(() => {
    resourcePreloader = new ResourcePreloader({
      maxConcurrentPreloads: 3,
      preloadTimeout: 1000,
      enableIntelligentPrefetch: true
    });
    jest.clearAllMocks();
  });

  test('initializes with correct options', () => {
    expect(resourcePreloader.options.maxConcurrentPreloads).toBe(3);
    expect(resourcePreloader.options.preloadTimeout).toBe(1000);
    expect(resourcePreloader.options.enableIntelligentPrefetch).toBe(true);
  });

  test('preloads images successfully', async () => {
    // Mock successful image load
    const mockImage = {
      onload: null,
      onerror: null,
      src: ''
    };
    
    global.Image = jest.fn(() => mockImage);
    
    const preloadPromise = resourcePreloader.preloadResource('/test-image.jpg', {
      type: 'image',
      priority: 'high'
    });
    
    // Simulate successful load
    setTimeout(() => {
      if (mockImage.onload) mockImage.onload();
    }, 10);
    
    await expect(preloadPromise).resolves.not.toThrow();
  });

  test('handles preload failures gracefully', async () => {
    const mockImage = {
      onload: null,
      onerror: null,
      src: ''
    };
    
    global.Image = jest.fn(() => mockImage);
    
    const preloadPromise = resourcePreloader.preloadResource('/invalid-image.jpg', {
      type: 'image',
      priority: 'medium'
    });
    
    // Simulate error
    setTimeout(() => {
      if (mockImage.onerror) mockImage.onerror();
    }, 10);
    
    await expect(preloadPromise).resolves.not.toThrow();
  });

  test('respects concurrent preload limits', async () => {
    const preloadPromises = [];
    
    // Start more preloads than the limit
    for (let i = 0; i < 5; i++) {
      preloadPromises.push(
        resourcePreloader.preloadResource(`/test-${i}.jpg`, {
          type: 'image',
          priority: 'medium'
        })
      );
    }
    
    // Should queue excess preloads
    expect(resourcePreloader.preloadQueue.length).toBeGreaterThan(0);
  });

  test('adapts to network conditions', () => {
    // Simulate slow connection
    navigator.connection.effectiveType = '2g';
    navigator.connection.saveData = true;
    
    resourcePreloader.updatePreloadingStrategy();
    
    expect(resourcePreloader.options.maxConcurrentPreloads).toBeLessThanOrEqual(2);
    expect(resourcePreloader.options.criticalResourcesOnly).toBe(true);
  });

  test('tracks user behavior', () => {
    resourcePreloader.trackPageVisit();
    resourcePreloader.recordGameSelection('test-game-1');
    
    const stats = resourcePreloader.getStats();
    expect(stats.userBehaviorData).toBeDefined();
  });
});

describe('PerformanceOptimizer', () => {
  let performanceOptimizer;

  beforeEach(() => {
    performanceOptimizer = new PerformanceOptimizer({
      enableAdaptiveOptimization: true,
      enablePerformanceBudgets: true,
      optimizationLevel: 'balanced',
      targetMetrics: {
        LCP: 2000,
        FID: 100,
        CLS: 0.1
      }
    });
    jest.clearAllMocks();
  });

  test('initializes with correct optimization level', () => {
    expect(performanceOptimizer.options.optimizationLevel).toBe('balanced');
    expect(performanceOptimizer.currentStrategy).toBeDefined();
  });

  test('changes optimization level', () => {
    performanceOptimizer.setOptimizationLevel('aggressive');
    expect(performanceOptimizer.options.optimizationLevel).toBe('aggressive');
  });

  test('throws error for invalid optimization level', () => {
    expect(() => {
      performanceOptimizer.setOptimizationLevel('invalid');
    }).toThrow('Invalid optimization level');
  });

  test('generates performance recommendations', () => {
    const mockPerformance = {
      coreWebVitals: {
        LCP: { current: 2500 }, // Exceeds target
        FID: { current: 150 },  // Exceeds target
        CLS: { current: 0.05 }  // Within target
      }
    };
    
    performanceOptimizer.generateRecommendations(mockPerformance);
    
    const recommendations = performanceOptimizer.getRecommendations();
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some(r => r.type === 'lcp_improvement')).toBe(true);
    expect(recommendations.some(r => r.type === 'fid_improvement')).toBe(true);
  });

  test('handles budget violations', () => {
    const violation = {
      metric: 'LCP',
      value: 3000,
      budget: 2000
    };
    
    performanceOptimizer.handleBudgetViolation(violation);
    
    const recommendations = performanceOptimizer.getRecommendations();
    expect(recommendations.some(r => r.type === 'budget_violation')).toBe(true);
  });

  test('provides comprehensive performance report', () => {
    const report = performanceOptimizer.getPerformanceReport();
    
    expect(report.currentStrategy).toBe('balanced');
    expect(report.performanceMetrics).toBeDefined();
    expect(report.cacheStats).toBeDefined();
    expect(report.preloaderStats).toBeDefined();
    expect(report.recommendations).toBeDefined();
    expect(report.budgetStatus).toBeDefined();
  });

  test('analyzes performance trends', () => {
    const mockPerformance = {
      coreWebVitals: {
        LCP: { current: 2500 },
        FID: { current: 150 },
        CLS: { current: 0.15 }
      }
    };
    
    const adaptations = performanceOptimizer.analyzePerformanceTrends(mockPerformance);
    
    expect(adaptations.length).toBeGreaterThan(0);
    expect(adaptations.some(a => a.type === 'lcp_optimization')).toBe(true);
    expect(adaptations.some(a => a.type === 'fid_optimization')).toBe(true);
    expect(adaptations.some(a => a.type === 'cls_optimization')).toBe(true);
  });
});

describe('Service Integration', () => {
  test('services work together without conflicts', () => {
    expect(() => {
      const cacheManager = new AggressiveCacheManager();
      const performanceMonitor = new PerformanceMonitor();
      const resourcePreloader = new ResourcePreloader();
      const performanceOptimizer = new PerformanceOptimizer();
      
      // Services should initialize without throwing
      expect(cacheManager).toBeDefined();
      expect(performanceMonitor).toBeDefined();
      expect(resourcePreloader).toBeDefined();
      expect(performanceOptimizer).toBeDefined();
    }).not.toThrow();
  });

  test('performance optimizer coordinates other services', async () => {
    const performanceOptimizer = new PerformanceOptimizer();
    
    // Should be able to get reports from all services
    const report = performanceOptimizer.getPerformanceReport();
    
    expect(report.cacheStats).toBeDefined();
    expect(report.preloaderStats).toBeDefined();
    expect(report.performanceMetrics).toBeDefined();
  });

  test('services handle missing dependencies gracefully', () => {
    // Test without IndexedDB
    delete global.indexedDB;
    
    expect(() => {
      new AggressiveCacheManager();
    }).not.toThrow();
    
    // Test without PerformanceObserver
    delete global.PerformanceObserver;
    
    expect(() => {
      new PerformanceMonitor();
    }).not.toThrow();
    
    // Test without IntersectionObserver
    delete global.IntersectionObserver;
    
    expect(() => {
      new ResourcePreloader();
    }).not.toThrow();
  });
});

describe('Error Handling and Edge Cases', () => {
  test('handles quota exceeded errors in cache', async () => {
    const cacheManager = new AggressiveCacheManager();
    
    // Mock quota exceeded error
    const originalSet = cacheManager.setInDB;
    cacheManager.setInDB = jest.fn().mockRejectedValue(new Error('QuotaExceededError'));
    
    await expect(cacheManager.set('test', { data: 'test' })).resolves.not.toThrow();
    
    cacheManager.setInDB = originalSet;
  });

  test('handles network errors in resource preloader', async () => {
    const resourcePreloader = new ResourcePreloader();
    
    // Mock fetch failure
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(
      resourcePreloader.preloadResource('/test-resource', { type: 'fetch' })
    ).resolves.not.toThrow();
  });

  test('handles performance API unavailability', () => {
    const originalPerformance = window.performance;
    delete window.performance;
    
    expect(() => {
      new PerformanceMonitor();
    }).not.toThrow();
    
    window.performance = originalPerformance;
  });

  test('handles invalid configuration gracefully', () => {
    expect(() => {
      new AggressiveCacheManager({
        maxMemorySize: -1,
        maxMemoryItems: 'invalid',
        defaultTTL: null
      });
    }).not.toThrow();
    
    expect(() => {
      new PerformanceMonitor({
        reportingInterval: 'invalid',
        performanceBudgets: null
      });
    }).not.toThrow();
  });
});