/**
 * PerformanceOptimizer - Central performance optimization coordinator
 * Integrates all performance optimization services and provides unified API
 * 
 * Features:
 * - Coordinates lazy loading, caching, preloading, and monitoring
 * - Provides performance optimization recommendations
 * - Manages performance budgets and alerts
 * - Implements adaptive optimization strategies
 */

import cacheManager from './AggressiveCacheManager';
import performanceMonitor from './PerformanceMonitor';
import resourcePreloader from './ResourcePreloader';

class PerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      enableAdaptiveOptimization: options.enableAdaptiveOptimization !== false,
      enablePerformanceBudgets: options.enablePerformanceBudgets !== false,
      enableRecommendations: options.enableRecommendations !== false,
      optimizationLevel: options.optimizationLevel || 'balanced', // conservative, balanced, aggressive
      targetMetrics: options.targetMetrics || {
        LCP: 2000,  // 2 seconds
        FID: 100,   // 100ms
        CLS: 0.1,   // 0.1
        FCP: 1500,  // 1.5 seconds
        TTI: 2000   // 2 seconds
      },
      ...options
    };

    this.optimizationStrategies = new Map();
    this.performanceHistory = [];
    this.recommendations = [];
    this.isOptimizing = false;

    this.init();
  }

  /**
   * Initialize performance optimizer
   */
  init() {
    // Setup optimization strategies
    this.setupOptimizationStrategies();

    // Monitor performance and adapt
    this.setupAdaptiveOptimization();

    // Setup performance budget monitoring
    this.setupBudgetMonitoring();

    // Initialize performance recommendations
    this.initializeRecommendations();

    console.log('PerformanceOptimizer initialized');
  }

  /**
   * Setup optimization strategies based on level
   */
  setupOptimizationStrategies() {
    const strategies = {
      conservative: {
        lazyLoadingThreshold: 200,
        cacheSize: 25 * 1024 * 1024, // 25MB
        preloadConcurrency: 2,
        imageQuality: 85,
        enableServiceWorker: false
      },
      balanced: {
        lazyLoadingThreshold: 100,
        cacheSize: 50 * 1024 * 1024, // 50MB
        preloadConcurrency: 4,
        imageQuality: 80,
        enableServiceWorker: true
      },
      aggressive: {
        lazyLoadingThreshold: 50,
        cacheSize: 100 * 1024 * 1024, // 100MB
        preloadConcurrency: 6,
        imageQuality: 75,
        enableServiceWorker: true
      }
    };

    this.currentStrategy = strategies[this.options.optimizationLevel];
    this.optimizationStrategies.set(this.options.optimizationLevel, this.currentStrategy);
  }

  /**
   * Setup adaptive optimization based on performance metrics
   */
  setupAdaptiveOptimization() {
    if (!this.options.enableAdaptiveOptimization) return;

    // Monitor performance every 30 seconds
    setInterval(() => {
      this.analyzePerformanceAndAdapt();
    }, 30000);

    // Listen for performance budget violations
    window.addEventListener('performance-budget-exceeded', (event) => {
      this.handleBudgetViolation(event.detail);
    });
  }

  /**
   * Setup performance budget monitoring
   */
  setupBudgetMonitoring() {
    if (!this.options.enablePerformanceBudgets) return;

    // Monitor performance budgets periodically
    setInterval(() => {
      this.checkPerformanceBudgets();
    }, 10000); // Check every 10 seconds

    console.log('Performance budget monitoring enabled');
  }

  /**
   * Check if performance budgets are being met
   */
  checkPerformanceBudgets() {
    const summary = performanceMonitor.getPerformanceSummary();
    const { coreWebVitals } = summary;

    // Check each metric against budget
    Object.keys(this.options.targetMetrics).forEach(metric => {
      const budget = this.options.targetMetrics[metric];
      const current = coreWebVitals[metric]?.current;

      if (current !== undefined && current > budget) {
        // Dispatch budget violation event
        window.dispatchEvent(new CustomEvent('performance-budget-exceeded', {
          detail: { metric, value: current, budget }
        }));
      }
    });
  }

  /**
   * Initialize performance recommendations system
   */
  initializeRecommendations() {
    if (!this.options.enableRecommendations) return;

    // Generate initial recommendations after a short delay
    setTimeout(() => {
      const currentPerformance = performanceMonitor.getPerformanceSummary();
      this.generateRecommendations(currentPerformance);
    }, 5000);

    console.log('Performance recommendations system initialized');
  }

  /**
   * Analyze current performance and adapt optimization strategy
   */
  async analyzePerformanceAndAdapt() {
    if (this.isOptimizing) return;

    try {
      this.isOptimizing = true;

      const currentPerformance = performanceMonitor.getPerformanceSummary();
      this.performanceHistory.push({
        timestamp: Date.now(),
        metrics: currentPerformance
      });

      // Keep only last 10 measurements
      if (this.performanceHistory.length > 10) {
        this.performanceHistory.shift();
      }

      // Analyze trends and adapt
      const adaptations = this.analyzePerformanceTrends(currentPerformance);
      
      if (adaptations.length > 0) {
        await this.applyAdaptations(adaptations);
      }

      // Generate recommendations
      this.generateRecommendations(currentPerformance);

    } catch (error) {
      console.error('Failed to analyze performance:', error);
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Analyze performance trends and suggest adaptations
   */
  analyzePerformanceTrends(currentPerformance) {
    const adaptations = [];
    const { coreWebVitals } = currentPerformance;

    // Check LCP (Largest Contentful Paint)
    if (coreWebVitals.LCP?.current > this.options.targetMetrics.LCP) {
      adaptations.push({
        type: 'lcp_optimization',
        severity: 'high',
        actions: [
          'increase_image_preloading',
          'optimize_critical_css',
          'reduce_render_blocking_resources'
        ]
      });
    }

    // Check FID (First Input Delay)
    if (coreWebVitals.FID?.current > this.options.targetMetrics.FID) {
      adaptations.push({
        type: 'fid_optimization',
        severity: 'medium',
        actions: [
          'defer_non_critical_js',
          'optimize_event_handlers',
          'reduce_main_thread_work'
        ]
      });
    }

    // Check CLS (Cumulative Layout Shift)
    if (coreWebVitals.CLS?.current > this.options.targetMetrics.CLS) {
      adaptations.push({
        type: 'cls_optimization',
        severity: 'medium',
        actions: [
          'add_image_dimensions',
          'reserve_space_for_ads',
          'avoid_dynamic_content_insertion'
        ]
      });
    }

    return adaptations;
  }

  /**
   * Apply performance adaptations
   */
  async applyAdaptations(adaptations) {
    for (const adaptation of adaptations) {
      try {
        await this.executeAdaptation(adaptation);
        console.log(`Applied adaptation: ${adaptation.type}`);
      } catch (error) {
        console.error(`Failed to apply adaptation ${adaptation.type}:`, error);
      }
    }
  }

  /**
   * Execute a specific adaptation
   */
  async executeAdaptation(adaptation) {
    switch (adaptation.type) {
      case 'lcp_optimization':
        await this.optimizeLCP(adaptation.actions);
        break;
      case 'fid_optimization':
        await this.optimizeFID(adaptation.actions);
        break;
      case 'cls_optimization':
        await this.optimizeCLS(adaptation.actions);
        break;
      default:
        console.warn(`Unknown adaptation type: ${adaptation.type}`);
    }
  }

  /**
   * Optimize Largest Contentful Paint
   */
  async optimizeLCP(actions) {
    for (const action of actions) {
      switch (action) {
        case 'increase_image_preloading':
          // Increase image preloading aggressiveness
          resourcePreloader.options.maxConcurrentPreloads = Math.min(
            resourcePreloader.options.maxConcurrentPreloads + 2,
            8
          );
          break;
        
        case 'optimize_critical_css':
          // Preload critical CSS
          await resourcePreloader.preloadResource('/assets/css/critical.css', {
            type: 'style',
            priority: 'critical'
          });
          break;
        
        case 'reduce_render_blocking_resources':
          // Defer non-critical resources
          this.deferNonCriticalResources();
          break;
      }
    }
  }

  /**
   * Optimize First Input Delay
   */
  async optimizeFID(actions) {
    for (const action of actions) {
      switch (action) {
        case 'defer_non_critical_js':
          this.deferNonCriticalJavaScript();
          break;
        
        case 'optimize_event_handlers':
          this.optimizeEventHandlers();
          break;
        
        case 'reduce_main_thread_work':
          this.scheduleNonCriticalWork();
          break;
      }
    }
  }

  /**
   * Optimize Cumulative Layout Shift
   */
  async optimizeCLS(actions) {
    for (const action of actions) {
      switch (action) {
        case 'add_image_dimensions':
          this.addImageDimensions();
          break;
        
        case 'reserve_space_for_ads':
          this.reserveSpaceForDynamicContent();
          break;
        
        case 'avoid_dynamic_content_insertion':
          this.optimizeDynamicContentInsertion();
          break;
      }
    }
  }

  /**
   * Defer non-critical resources
   */
  deferNonCriticalResources() {
    const nonCriticalScripts = document.querySelectorAll('script[data-defer]');
    nonCriticalScripts.forEach(script => {
      if (!script.hasAttribute('defer')) {
        script.setAttribute('defer', '');
      }
    });
  }

  /**
   * Defer non-critical JavaScript
   */
  deferNonCriticalJavaScript() {
    // Use requestIdleCallback to defer non-critical work
    if ('requestIdleCallback' in window) {
      const deferredTasks = [];
      
      // Move non-critical tasks to idle time
      window.requestIdleCallback((deadline) => {
        while (deadline.timeRemaining() > 0 && deferredTasks.length > 0) {
          const task = deferredTasks.shift();
          task();
        }
      });
    }
  }

  /**
   * Optimize event handlers
   */
  optimizeEventHandlers() {
    // Use passive event listeners where possible
    const events = ['scroll', 'touchstart', 'touchmove', 'wheel'];
    
    events.forEach(eventType => {
      const handlers = this.getEventHandlers(eventType);
      handlers.forEach(handler => {
        if (!handler.passive) {
          // Re-register as passive if possible
          handler.element.removeEventListener(eventType, handler.callback);
          handler.element.addEventListener(eventType, handler.callback, { passive: true });
        }
      });
    });
  }

  /**
   * Schedule non-critical work
   */
  scheduleNonCriticalWork() {
    // Use scheduler API if available
    if ('scheduler' in window && 'postTask' in window.scheduler) {
      // Schedule low-priority tasks
      window.scheduler.postTask(() => {
        this.performNonCriticalMaintenance();
      }, { priority: 'background' });
    } else if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        this.performNonCriticalMaintenance();
      });
    }
  }

  /**
   * Add dimensions to images to prevent layout shift
   */
  addImageDimensions() {
    const images = document.querySelectorAll('img:not([width]):not([height])');
    
    images.forEach(img => {
      if (img.naturalWidth && img.naturalHeight) {
        img.setAttribute('width', img.naturalWidth);
        img.setAttribute('height', img.naturalHeight);
      }
    });
  }

  /**
   * Reserve space for dynamic content
   */
  reserveSpaceForDynamicContent() {
    const dynamicContainers = document.querySelectorAll('[data-dynamic-content]');
    
    dynamicContainers.forEach(container => {
      if (!container.style.minHeight) {
        // Set minimum height based on expected content
        const expectedHeight = container.dataset.expectedHeight || '100px';
        container.style.minHeight = expectedHeight;
      }
    });
  }

  /**
   * Optimize dynamic content insertion
   */
  optimizeDynamicContentInsertion() {
    // Use CSS containment for dynamic content
    const dynamicElements = document.querySelectorAll('[data-dynamic]');
    
    dynamicElements.forEach(element => {
      if (!element.style.contain) {
        element.style.contain = 'layout style';
      }
    });
  }

  /**
   * Handle performance budget violations
   */
  handleBudgetViolation(violation) {
    const { metric, value, budget } = violation;
    
    console.warn(`Performance budget exceeded: ${metric} = ${value} (budget: ${budget})`);
    
    // Apply immediate optimizations based on violated metric
    switch (metric) {
      case 'LCP':
        this.applyEmergencyLCPOptimizations();
        break;
      case 'FID':
        this.applyEmergencyFIDOptimizations();
        break;
      case 'CLS':
        this.applyEmergencyCLSOptimizations();
        break;
    }
    
    // Add to recommendations
    this.recommendations.push({
      type: 'budget_violation',
      metric,
      value,
      budget,
      severity: 'high',
      timestamp: Date.now(),
      suggestion: this.getBudgetViolationSuggestion(metric)
    });
  }

  /**
   * Apply emergency LCP optimizations
   */
  applyEmergencyLCPOptimizations() {
    // Increase preloading aggressiveness
    resourcePreloader.options.maxConcurrentPreloads = 8;
    
    // Preload critical images immediately
    const criticalImages = document.querySelectorAll('img[data-critical]');
    criticalImages.forEach(img => {
      resourcePreloader.preloadResource(img.src, {
        type: 'image',
        priority: 'critical'
      });
    });
  }

  /**
   * Apply emergency FID optimizations
   */
  applyEmergencyFIDOptimizations() {
    // Defer all non-critical JavaScript
    this.deferNonCriticalJavaScript();
    
    // Break up long tasks
    this.breakUpLongTasks();
  }

  /**
   * Apply emergency CLS optimizations
   */
  applyEmergencyCLSOptimizations() {
    // Add dimensions to all images
    this.addImageDimensions();
    
    // Reserve space for all dynamic content
    this.reserveSpaceForDynamicContent();
  }

  /**
   * Break up long tasks to improve FID
   */
  breakUpLongTasks() {
    // Use scheduler.postTask or setTimeout to break up work
    const breakUpWork = (work, chunkSize = 5) => {
      const chunks = [];
      for (let i = 0; i < work.length; i += chunkSize) {
        chunks.push(work.slice(i, i + chunkSize));
      }
      
      const processChunk = (index) => {
        if (index < chunks.length) {
          chunks[index].forEach(task => task());
          
          // Schedule next chunk
          if ('scheduler' in window && 'postTask' in window.scheduler) {
            window.scheduler.postTask(() => processChunk(index + 1), { priority: 'user-blocking' });
          } else {
            setTimeout(() => processChunk(index + 1), 0);
          }
        }
      };
      
      processChunk(0);
    };
    
    // Apply to any queued work
    if (this.queuedWork && this.queuedWork.length > 0) {
      breakUpWork(this.queuedWork);
      this.queuedWork = [];
    }
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(currentPerformance) {
    if (!this.options.enableRecommendations) return;

    const newRecommendations = [];
    const { coreWebVitals } = currentPerformance;

    // LCP recommendations
    if (coreWebVitals.LCP?.current > this.options.targetMetrics.LCP * 0.8) {
      newRecommendations.push({
        type: 'lcp_improvement',
        severity: 'medium',
        suggestion: 'Consider optimizing image loading and critical CSS delivery',
        impact: 'high',
        effort: 'medium'
      });
    }

    // FID recommendations
    if (coreWebVitals.FID?.current > this.options.targetMetrics.FID * 0.8) {
      newRecommendations.push({
        type: 'fid_improvement',
        severity: 'medium',
        suggestion: 'Consider deferring non-critical JavaScript and optimizing event handlers',
        impact: 'high',
        effort: 'low'
      });
    }

    // Cache recommendations
    const cacheStats = cacheManager.getStats();
    if (cacheStats.hitRate < 70) {
      newRecommendations.push({
        type: 'cache_optimization',
        severity: 'low',
        suggestion: 'Cache hit rate is low. Consider preloading more frequently accessed resources',
        impact: 'medium',
        effort: 'low'
      });
    }

    // Add new recommendations
    this.recommendations.push(...newRecommendations.map(rec => ({
      ...rec,
      timestamp: Date.now()
    })));

    // Keep only recent recommendations (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.recommendations = this.recommendations.filter(rec => rec.timestamp > oneDayAgo);
  }

  /**
   * Get suggestion for budget violation
   */
  getBudgetViolationSuggestion(metric) {
    const suggestions = {
      LCP: 'Optimize image loading, preload critical resources, and minimize render-blocking CSS',
      FID: 'Defer non-critical JavaScript, optimize event handlers, and break up long tasks',
      CLS: 'Add dimensions to images, reserve space for dynamic content, and avoid layout shifts',
      FCP: 'Optimize critical CSS delivery and minimize render-blocking resources',
      TTFB: 'Optimize server response time and consider using a CDN'
    };
    
    return suggestions[metric] || 'Review performance metrics and optimize accordingly';
  }

  /**
   * Get event handlers for optimization
   */
  getEventHandlers(eventType) {
    // This is a simplified implementation
    // In practice, you'd need a more sophisticated way to track event handlers
    return [];
  }

  /**
   * Perform non-critical maintenance tasks
   */
  performNonCriticalMaintenance() {
    // Clean up old cache entries
    cacheManager.cleanupExpired();
    
    // Update performance history
    this.cleanupPerformanceHistory();
    
    // Optimize resource preloading based on usage patterns
    this.optimizePreloadingPatterns();
  }

  /**
   * Clean up old performance history
   */
  cleanupPerformanceHistory() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.performanceHistory = this.performanceHistory.filter(
      entry => entry.timestamp > oneHourAgo
    );
  }

  /**
   * Optimize preloading patterns based on usage
   */
  optimizePreloadingPatterns() {
    const preloaderStats = resourcePreloader.getStats();
    
    // Adjust preloading strategy based on network conditions
    if (preloaderStats.networkInfo?.effectiveType === '4g') {
      resourcePreloader.options.maxConcurrentPreloads = Math.min(
        resourcePreloader.options.maxConcurrentPreloads + 1,
        8
      );
    } else if (preloaderStats.networkInfo?.effectiveType === '3g') {
      resourcePreloader.options.maxConcurrentPreloads = Math.max(
        resourcePreloader.options.maxConcurrentPreloads - 1,
        2
      );
    }
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    return {
      currentStrategy: this.options.optimizationLevel,
      performanceMetrics: performanceMonitor.getPerformanceSummary(),
      cacheStats: cacheManager.getStats(),
      preloaderStats: resourcePreloader.getStats(),
      recommendations: this.recommendations,
      performanceHistory: this.performanceHistory.slice(-5), // Last 5 measurements
      budgetStatus: this.getBudgetStatus()
    };
  }

  /**
   * Get budget status
   */
  getBudgetStatus() {
    const summary = performanceMonitor.getPerformanceSummary();
    const status = {};
    
    Object.keys(this.options.targetMetrics).forEach(metric => {
      const target = this.options.targetMetrics[metric];
      const current = summary.coreWebVitals[metric]?.current;
      
      if (current !== undefined) {
        status[metric] = {
          target,
          current,
          status: current <= target ? 'good' : 'needs_improvement',
          percentage: Math.round((current / target) * 100)
        };
      }
    });
    
    return status;
  }

  /**
   * Apply optimization level
   */
  setOptimizationLevel(level) {
    if (!['conservative', 'balanced', 'aggressive'].includes(level)) {
      throw new Error('Invalid optimization level');
    }
    
    this.options.optimizationLevel = level;
    this.setupOptimizationStrategies();
    
    console.log(`Optimization level set to: ${level}`);
  }

  /**
   * Get current recommendations
   */
  getRecommendations() {
    return this.recommendations.slice().sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer({
  enableAdaptiveOptimization: true,
  enablePerformanceBudgets: true,
  enableRecommendations: true,
  optimizationLevel: 'balanced'
});

export default performanceOptimizer;