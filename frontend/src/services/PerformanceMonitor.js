/**
 * PerformanceMonitor - Comprehensive performance monitoring and metrics collection
 * Tracks Core Web Vitals, custom metrics, and user experience indicators
 * 
 * Features:
 * - Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - Custom performance metrics
 * - Real User Monitoring (RUM)
 * - Performance budgets and alerts
 * - Automatic reporting and analytics
 */

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableCoreWebVitals: options.enableCoreWebVitals !== false,
      enableCustomMetrics: options.enableCustomMetrics !== false,
      enableRUM: options.enableRUM !== false,
      reportingEndpoint: options.reportingEndpoint ?? null,
      reportingInterval: options.reportingInterval || 30000, // 30 seconds
      performanceBudgets: options.performanceBudgets || {
        LCP: 2500, // 2.5 seconds
        FID: 100,  // 100ms
        CLS: 0.1,  // 0.1
        FCP: 1800, // 1.8 seconds
        TTFB: 600  // 600ms
      },
      ...options
    };

    this.metrics = new Map();
    this.observers = new Map();
    this.reportingQueue = [];
    this.isInitialized = false;

    this.init();
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.isInitialized) return;

    try {
      // Initialize Core Web Vitals monitoring
      if (this.options.enableCoreWebVitals) {
        this.initCoreWebVitals();
      }

      // Initialize custom metrics
      if (this.options.enableCustomMetrics) {
        this.initCustomMetrics();
      }

      // Initialize Real User Monitoring
      if (this.options.enableRUM) {
        this.initRUM();
      }

      // Setup periodic reporting
      this.setupReporting();

      // Setup performance budgets monitoring
      this.setupBudgetMonitoring();

      this.isInitialized = true;
      console.log('PerformanceMonitor initialized');

    } catch (error) {
      console.error('Failed to initialize PerformanceMonitor:', error);
    }
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  initCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // First Input Delay (FID)
    this.observeFID();

    // Cumulative Layout Shift (CLS)
    this.observeCLS();

    // First Contentful Paint (FCP)
    this.observeFCP();

    // Time to First Byte (TTFB)
    this.observeTTFB();
  }

  /**
   * Observe Largest Contentful Paint
   */
  observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric('LCP', lastEntry.startTime, {
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || window.location.href,
          timestamp: Date.now()
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('LCP', observer);
    } catch (error) {
      console.error('Failed to observe LCP:', error);
    }
  }

  /**
   * Observe First Input Delay
   */
  observeFID() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('FID', entry.processingStart - entry.startTime, {
            eventType: entry.name,
            timestamp: Date.now()
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('FID', observer);
    } catch (error) {
      console.error('Failed to observe FID:', error);
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            if (sessionValue && 
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              this.recordMetric('CLS', clsValue, {
                timestamp: Date.now(),
                sessionEntries: sessionEntries.length
              });
            }
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('CLS', observer);
    } catch (error) {
      console.error('Failed to observe CLS:', error);
    }
  }

  /**
   * Observe First Contentful Paint
   */
  observeFCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime, {
              timestamp: Date.now()
            });
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('FCP', observer);
    } catch (error) {
      console.error('Failed to observe FCP:', error);
    }
  }

  /**
   * Observe Time to First Byte
   */
  observeTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        this.recordMetric('TTFB', ttfb, {
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to observe TTFB:', error);
    }
  }

  /**
   * Initialize custom metrics monitoring
   */
  initCustomMetrics() {
    // Component render times
    this.trackComponentRenders();

    // Image loading times
    this.trackImageLoading();

    // API response times
    this.trackAPIResponses();

    // User interaction response times
    this.trackUserInteractions();

    // Memory usage
    this.trackMemoryUsage();
  }

  /**
   * Track component render times
   */
  trackComponentRenders() {
    // Hook into React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      hook.onCommitFiberRoot = (id, root, priorityLevel) => {
        const renderTime = performance.now();
        this.recordMetric('component_render', renderTime, {
          rootId: id,
          priority: priorityLevel,
          timestamp: Date.now()
        });
      };
    }
  }

  /**
   * Track image loading performance
   */
  trackImageLoading() {
    const originalImage = window.Image;
    const monitor = this;

    window.Image = function(...args) {
      const img = new originalImage(...args);
      const startTime = performance.now();

      img.addEventListener('load', function() {
        const loadTime = performance.now() - startTime;
        monitor.recordMetric('image_load', loadTime, {
          src: this.src,
          width: this.naturalWidth,
          height: this.naturalHeight,
          timestamp: Date.now()
        });
      });

      img.addEventListener('error', function() {
        const errorTime = performance.now() - startTime;
        monitor.recordMetric('image_error', errorTime, {
          src: this.src,
          timestamp: Date.now()
        });
      });

      return img;
    };
  }

  /**
   * Track API response times
   */
  trackAPIResponses() {
    const originalFetch = window.fetch;
    const monitor = this;

    window.fetch = function(...args) {
      const startTime = performance.now();
      const url = args[0];

      return originalFetch.apply(this, args)
        .then(response => {
          const responseTime = performance.now() - startTime;
          monitor.recordMetric('api_response', responseTime, {
            url: typeof url === 'string' ? url : url.url,
            status: response.status,
            ok: response.ok,
            timestamp: Date.now()
          });
          return response;
        })
        .catch(error => {
          const errorTime = performance.now() - startTime;
          monitor.recordMetric('api_error', errorTime, {
            url: typeof url === 'string' ? url : url.url,
            error: error.message,
            timestamp: Date.now()
          });
          throw error;
        });
    };
  }

  /**
   * Track user interaction response times
   */
  trackUserInteractions() {
    const interactionTypes = ['click', 'keydown', 'touchstart'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        const startTime = performance.now();
        
        // Use requestAnimationFrame to measure response time
        requestAnimationFrame(() => {
          const responseTime = performance.now() - startTime;
          this.recordMetric('interaction_response', responseTime, {
            type,
            target: event.target.tagName,
            timestamp: Date.now()
          });
        });
      }, { passive: true });
    });
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.recordMetric('memory_usage', memory.usedJSHeapSize, {
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: Date.now()
        });
      }, 10000); // Every 10 seconds
    }
  }

  /**
   * Initialize Real User Monitoring
   */
  initRUM() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.recordMetric('page_visibility', document.hidden ? 'hidden' : 'visible', {
        timestamp: Date.now()
      });
    });

    // Track connection changes
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.recordMetric('connection_info', connection.effectiveType, {
        downlink: connection.downlink,
        rtt: connection.rtt,
        timestamp: Date.now()
      });

      connection.addEventListener('change', () => {
        this.recordMetric('connection_change', connection.effectiveType, {
          downlink: connection.downlink,
          rtt: connection.rtt,
          timestamp: Date.now()
        });
      });
    }

    // Track device information
    this.recordMetric('device_info', navigator.userAgent, {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${screen.width}x${screen.height}`,
      devicePixelRatio: window.devicePixelRatio,
      timestamp: Date.now()
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      metadata,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.metrics.set(`${name}-${Date.now()}`, metric);
    this.reportingQueue.push(metric);

    // Check performance budgets
    this.checkBudget(name, value);

    // Emit custom event for real-time monitoring
    window.dispatchEvent(new CustomEvent('performance-metric', {
      detail: metric
    }));
  }

  /**
   * Check performance budgets
   */
  checkBudget(metricName, value) {
    const budget = this.options.performanceBudgets[metricName];
    if (budget && value > budget) {
      console.warn(`Performance budget exceeded for ${metricName}: ${value} > ${budget}`);
      
      this.recordMetric('budget_exceeded', value, {
        metric: metricName,
        budget,
        excess: value - budget,
        timestamp: Date.now()
      });

      // Emit budget exceeded event
      window.dispatchEvent(new CustomEvent('performance-budget-exceeded', {
        detail: { metric: metricName, value, budget }
      }));
    }
  }

  /**
   * Setup periodic reporting
   */
  setupReporting() {
    setInterval(() => {
      this.reportMetrics();
    }, this.options.reportingInterval);

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportMetrics(true);
    });
  }

  /**
   * Setup performance budget monitoring
   */
  setupBudgetMonitoring() {
    // Monitor for budget violations and alert
    window.addEventListener('performance-budget-exceeded', (event) => {
      const { metric, value, budget } = event.detail;
      
      // Could integrate with alerting system
      if (window.gtag) {
        window.gtag('event', 'performance_budget_exceeded', {
          metric_name: metric,
          metric_value: value,
          budget_limit: budget
        });
      }
    });
  }

  /**
   * Report metrics to analytics endpoint
   */
  async reportMetrics(immediate = false) {
    if (this.reportingQueue.length === 0) return;
    if (!this.options.reportingEndpoint) {
      // No backend collector configured in this environment.
      this.reportingQueue = [];
      return;
    }

    const metricsToReport = [...this.reportingQueue];
    this.reportingQueue = [];

    try {
      // Use sendBeacon for immediate reporting (page unload)
      if (immediate && 'sendBeacon' in navigator) {
        navigator.sendBeacon(
          this.options.reportingEndpoint,
          JSON.stringify({ metrics: metricsToReport })
        );
      } else {
        // Use fetch for regular reporting
        await fetch(this.options.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ metrics: metricsToReport })
        }).catch(() => {
          // Silently fail if endpoint doesn't exist
          // This is expected in development when backend doesn't have this endpoint
        });
      }

      // Only log in development mode
      if (import.meta.env.DEV) {
        console.log(`Reported ${metricsToReport.length} performance metrics`);
      }
    } catch (error) {
      // Silently fail - don't spam console with errors
      // Re-queue metrics for next attempt only if it's a network error
      if (error.message && !error.message.includes('404')) {
        this.reportingQueue.unshift(...metricsToReport);
      }
    }
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary() {
    const summary = {
      coreWebVitals: {},
      customMetrics: {},
      budgetStatus: {}
    };

    // Aggregate Core Web Vitals
    ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].forEach(metric => {
      const entries = Array.from(this.metrics.values())
        .filter(m => m.name === metric)
        .map(m => m.value);
      
      if (entries.length > 0) {
        summary.coreWebVitals[metric] = {
          current: entries[entries.length - 1],
          average: entries.reduce((a, b) => a + b, 0) / entries.length,
          count: entries.length
        };
      }
    });

    // Check budget status
    Object.keys(this.options.performanceBudgets).forEach(metric => {
      const budget = this.options.performanceBudgets[metric];
      const current = summary.coreWebVitals[metric]?.current;
      
      if (current !== undefined) {
        summary.budgetStatus[metric] = {
          budget,
          current,
          status: current <= budget ? 'good' : 'exceeded',
          percentage: Math.round((current / budget) * 100)
        };
      }
    });

    return summary;
  }

  /**
   * Start performance monitoring for a specific operation
   */
  startTiming(name) {
    const startTime = performance.now();
    return {
      end: (metadata = {}) => {
        const duration = performance.now() - startTime;
        this.recordMetric(`timing_${name}`, duration, metadata);
        return duration;
      }
    };
  }

  /**
   * Mark a performance milestone
   */
  mark(name, metadata = {}) {
    if (performance.mark) {
      performance.mark(name);
    }
    
    this.recordMetric(`mark_${name}`, performance.now(), metadata);
  }

  /**
   * Measure time between two marks
   */
  measure(name, startMark, endMark, metadata = {}) {
    if (performance.measure) {
      performance.measure(name, startMark, endMark);
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        this.recordMetric(`measure_${name}`, measure.duration, metadata);
      }
    }
  }

  /**
   * Cleanup and disconnect observers
   */
  cleanup() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    this.metrics.clear();
    this.reportingQueue = [];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor({
  enableCoreWebVitals: true,
  enableCustomMetrics: true,
  enableRUM: true,
  reportingInterval: 30000,
  performanceBudgets: {
    LCP: 2000, // 2 seconds for child-friendly app
    FID: 100,  // 100ms
    CLS: 0.1,  // 0.1
    FCP: 1500, // 1.5 seconds
    TTFB: 500  // 500ms
  }
});

export default performanceMonitor;