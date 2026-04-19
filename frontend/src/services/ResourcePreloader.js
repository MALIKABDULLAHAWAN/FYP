/**
 * ResourcePreloader - Intelligent resource preloading for critical assets
 * Implements strategic preloading to improve perceived performance
 * 
 * Features:
 * - Critical resource identification and preloading
 * - Intelligent prefetching based on user behavior
 * - Network-aware loading strategies
 * - Cache-aware preloading
 * - Performance monitoring and optimization
 */

import cacheManager from './AggressiveCacheManager';
import performanceMonitor from './PerformanceMonitor';

class ResourcePreloader {
  constructor(options = {}) {
    this.options = {
      enableIntelligentPrefetch: options.enableIntelligentPrefetch !== false,
      enableNetworkAwareness: options.enableNetworkAwareness !== false,
      maxConcurrentPreloads: options.maxConcurrentPreloads || 6,
      preloadTimeout: options.preloadTimeout || 10000, // 10 seconds
      criticalResourcesOnly: options.criticalResourcesOnly || false,
      ...options
    };

    this.preloadQueue = [];
    this.activePreloads = new Set();
    this.preloadedResources = new Set();
    this.userBehaviorData = new Map();
    this.networkInfo = null;

    this.init();
  }

  /**
   * Initialize resource preloader
   */
  init() {
    // Monitor network conditions
    this.initNetworkMonitoring();

    // Track user behavior for intelligent prefetching
    this.initBehaviorTracking();

    // Preload critical resources immediately
    this.preloadCriticalResources();

    // Setup intersection observer for viewport-based preloading
    this.setupViewportPreloading();

    console.log('ResourcePreloader initialized');
  }

  /**
   * Initialize network monitoring
   */
  initNetworkMonitoring() {
    if ('connection' in navigator) {
      this.networkInfo = navigator.connection;
      
      // Update preloading strategy based on connection
      this.updatePreloadingStrategy();

      // Listen for connection changes
      this.networkInfo.addEventListener('change', () => {
        this.updatePreloadingStrategy();
      });
    }
  }

  /**
   * Update preloading strategy based on network conditions
   */
  updatePreloadingStrategy() {
    if (!this.networkInfo) return;

    const { effectiveType, saveData, downlink } = this.networkInfo;

    // Adjust strategy for slow connections or data saver mode
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.options.maxConcurrentPreloads = 2;
      this.options.criticalResourcesOnly = true;
    } else if (effectiveType === '3g') {
      this.options.maxConcurrentPreloads = 4;
      this.options.criticalResourcesOnly = false;
    } else {
      // Fast connection (4g, 5g)
      this.options.maxConcurrentPreloads = 6;
      this.options.criticalResourcesOnly = false;
    }

    console.log(`Preloading strategy updated for ${effectiveType} connection`);
  }

  /**
   * Initialize user behavior tracking
   */
  initBehaviorTracking() {
    // Track page visits
    this.trackPageVisit();

    // Track hover events for link prefetching
    this.trackHoverEvents();

    // Track scroll behavior
    this.trackScrollBehavior();

    // Track game selections
    this.trackGameSelections();
  }

  /**
   * Track page visits for pattern recognition
   */
  trackPageVisit() {
    const currentPage = window.location.pathname;
    const visitData = this.userBehaviorData.get('pageVisits') || {};
    
    visitData[currentPage] = (visitData[currentPage] || 0) + 1;
    this.userBehaviorData.set('pageVisits', visitData);

    // Predict next likely pages
    this.predictNextPages(currentPage);
  }

  /**
   * Track hover events for intelligent prefetching
   */
  trackHoverEvents() {
    let hoverTimeout;

    document.addEventListener('mouseover', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        this.prefetchResource(link.href, { priority: 'medium', trigger: 'hover' });
      }, 100); // 100ms hover delay
    });

    document.addEventListener('mouseout', () => {
      clearTimeout(hoverTimeout);
    });
  }

  /**
   * Track scroll behavior for viewport-based preloading
   */
  trackScrollBehavior() {
    let scrollTimeout;

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.preloadViewportResources();
      }, 150);
    }, { passive: true });
  }

  /**
   * Track game selections for predictive preloading
   */
  trackGameSelections() {
    document.addEventListener('click', (event) => {
      const gameCard = event.target.closest('[data-game-id]');
      if (gameCard) {
        const gameId = gameCard.dataset.gameId;
        this.recordGameSelection(gameId);
        this.preloadRelatedGameResources(gameId);
      }
    });
  }

  /**
   * Preload critical resources immediately
   */
  async preloadCriticalResources() {
    const criticalResources = [
      // Critical CSS - commented out as files don't exist yet
      // { url: '/assets/css/critical.css', type: 'style', priority: 'critical' },
      
      // Essential fonts - commented out as files don't exist yet
      // { url: '/assets/fonts/quicksand-regular.woff2', type: 'font', priority: 'critical' },
      // { url: '/assets/fonts/quicksand-bold.woff2', type: 'font', priority: 'critical' },
      
      // Core JavaScript modules - commented out as files don't exist yet
      // { url: '/assets/js/core.js', type: 'script', priority: 'critical' },
      
      // Essential images - commented out as files don't exist yet
      // { url: '/assets/images/logo.svg', type: 'image', priority: 'critical' },
      // { url: '/assets/images/placeholder.svg', type: 'image', priority: 'critical' },
      
      // Critical stickers - commented out as files don't exist yet
      // { url: '/assets/stickers/animals/butterfly.svg', type: 'image', priority: 'high' },
      // { url: '/assets/stickers/nature/flower.svg', type: 'image', priority: 'high' }
    ];

    for (const resource of criticalResources) {
      await this.preloadResource(resource.url, resource);
    }
  }

  /**
   * Preload a single resource
   */
  async preloadResource(url, options = {}) {
    const {
      type = 'fetch',
      priority = 'medium',
      crossorigin = 'anonymous',
      trigger = 'manual',
      timeout = this.options.preloadTimeout
    } = options;

    // Skip if already preloaded or in progress
    if (this.preloadedResources.has(url) || this.activePreloads.has(url)) {
      return;
    }

    // Check if resource is already cached
    const cached = await cacheManager.get(`preload-${url}`);
    if (cached) {
      this.preloadedResources.add(url);
      return;
    }

    // Queue if too many concurrent preloads
    if (this.activePreloads.size >= this.options.maxConcurrentPreloads) {
      this.preloadQueue.push({ url, options });
      return;
    }

    this.activePreloads.add(url);

    try {
      const startTime = performance.now();
      
      // Use appropriate preloading method based on type
      let success = false;
      
      switch (type) {
        case 'image':
          success = await this.preloadImage(url, { crossorigin, timeout });
          break;
        case 'font':
          success = await this.preloadFont(url, { crossorigin, timeout });
          break;
        case 'style':
          success = await this.preloadStylesheet(url, { timeout });
          break;
        case 'script':
          success = await this.preloadScript(url, { timeout });
          break;
        default:
          success = await this.preloadFetch(url, { timeout });
      }

      if (success) {
        this.preloadedResources.add(url);
        
        // Cache the successful preload
        await cacheManager.set(`preload-${url}`, { 
          url, 
          preloadedAt: Date.now(),
          type,
          priority 
        }, { ttl: 60 * 60 * 1000 }); // 1 hour TTL
      }

      // Record performance metrics
      const loadTime = performance.now() - startTime;
      performanceMonitor.recordMetric('resource_preload', loadTime, {
        url,
        type,
        priority,
        trigger,
        success,
        timestamp: Date.now()
      });

    } catch (error) {
      console.warn(`Failed to preload resource: ${url}`, error);
      
      performanceMonitor.recordMetric('resource_preload_error', 0, {
        url,
        type,
        error: error.message,
        timestamp: Date.now()
      });
    } finally {
      this.activePreloads.delete(url);
      
      // Process next item in queue
      if (this.preloadQueue.length > 0) {
        const next = this.preloadQueue.shift();
        this.preloadResource(next.url, next.options);
      }
    }
  }

  /**
   * Preload image resource
   */
  preloadImage(url, options = {}) {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => resolve(false), options.timeout);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      
      if (options.crossorigin) {
        img.crossOrigin = options.crossorigin;
      }
      
      img.src = url;
    });
  }

  /**
   * Preload font resource
   */
  preloadFont(url, options = {}) {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      const timeout = setTimeout(() => resolve(false), options.timeout);
      
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = url;
      
      if (options.crossorigin) {
        link.crossOrigin = options.crossorigin;
      }
      
      link.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      link.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      
      document.head.appendChild(link);
    });
  }

  /**
   * Preload stylesheet resource
   */
  preloadStylesheet(url, options = {}) {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      const timeout = setTimeout(() => resolve(false), options.timeout);
      
      link.rel = 'preload';
      link.as = 'style';
      link.href = url;
      
      link.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      link.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      
      document.head.appendChild(link);
    });
  }

  /**
   * Preload script resource
   */
  preloadScript(url, options = {}) {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      const timeout = setTimeout(() => resolve(false), options.timeout);
      
      link.rel = 'preload';
      link.as = 'script';
      link.href = url;
      
      link.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      link.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      
      document.head.appendChild(link);
    });
  }

  /**
   * Preload using fetch API
   */
  async preloadFetch(url, options = {}) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Setup viewport-based preloading
   */
  setupViewportPreloading() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Preload images
          const images = element.querySelectorAll('img[data-src]');
          images.forEach(img => {
            this.preloadResource(img.dataset.src, { 
              type: 'image', 
              priority: 'medium',
              trigger: 'viewport'
            });
          });
          
          // Preload linked resources
          const links = element.querySelectorAll('a[href]');
          links.forEach(link => {
            if (this.shouldPrefetchLink(link.href)) {
              this.prefetchResource(link.href, { 
                priority: 'low',
                trigger: 'viewport'
              });
            }
          });
          
          observer.unobserve(element);
        }
      });
    }, {
      rootMargin: '100px'
    });

    // Observe sections that might contain preloadable content
    document.querySelectorAll('section, article, .game-card, .content-section')
      .forEach(element => observer.observe(element));
  }

  /**
   * Preload resources in viewport
   */
  preloadViewportResources() {
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;
    const preloadZone = {
      top: scrollTop - viewportHeight,
      bottom: scrollTop + viewportHeight * 2
    };

    // Find elements in preload zone
    document.querySelectorAll('[data-preload]').forEach(element => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrollTop;
      
      if (elementTop >= preloadZone.top && elementTop <= preloadZone.bottom) {
        const preloadUrl = element.dataset.preload;
        const preloadType = element.dataset.preloadType || 'fetch';
        
        this.preloadResource(preloadUrl, {
          type: preloadType,
          priority: 'medium',
          trigger: 'scroll'
        });
      }
    });
  }

  /**
   * Predict next likely pages based on user behavior
   */
  predictNextPages(currentPage) {
    const pageTransitions = {
      '/dashboard': ['/game', '/profile', '/therapist'],
      '/game': ['/dashboard', '/game'],
      '/therapist': ['/dashboard', '/game'],
      '/profile': ['/dashboard']
    };

    const likelyPages = pageTransitions[currentPage] || [];
    
    likelyPages.forEach(page => {
      this.prefetchResource(page, { 
        priority: 'low',
        trigger: 'prediction'
      });
    });
  }

  /**
   * Record game selection for behavior analysis
   */
  recordGameSelection(gameId) {
    const selections = this.userBehaviorData.get('gameSelections') || {};
    selections[gameId] = (selections[gameId] || 0) + 1;
    this.userBehaviorData.set('gameSelections', selections);
  }

  /**
   * Preload related game resources
   */
  async preloadRelatedGameResources(gameId) {
    try {
      // Preload game assets
      const gameAssets = [
        `/api/games/${gameId}/image`,
        `/api/games/${gameId}/metadata`,
        `/api/games/${gameId}/assets`
      ];

      for (const asset of gameAssets) {
        this.preloadResource(asset, {
          priority: 'high',
          trigger: 'game-selection'
        });
      }

      // Preload related games
      const relatedGames = await this.getRelatedGames(gameId);
      relatedGames.forEach(relatedGameId => {
        this.preloadResource(`/api/games/${relatedGameId}/image`, {
          type: 'image',
          priority: 'medium',
          trigger: 'related-game'
        });
      });

    } catch (error) {
      console.warn('Failed to preload related game resources:', error);
    }
  }

  /**
   * Get related games based on similarity
   */
  async getRelatedGames(gameId) {
    // This would typically call an API to get related games
    // For now, return mock data
    return [`related-${gameId}-1`, `related-${gameId}-2`];
  }

  /**
   * Determine if a link should be prefetched
   */
  shouldPrefetchLink(href) {
    // Don't prefetch external links
    if (href.startsWith('http') && !href.includes(window.location.hostname)) {
      return false;
    }

    // Don't prefetch certain file types
    const skipExtensions = ['.pdf', '.zip', '.exe', '.dmg'];
    if (skipExtensions.some(ext => href.toLowerCase().includes(ext))) {
      return false;
    }

    // Don't prefetch if data saver is enabled
    if (this.networkInfo?.saveData) {
      return false;
    }

    return true;
  }

  /**
   * Prefetch a resource (lighter than preload)
   */
  async prefetchResource(url, options = {}) {
    if (this.preloadedResources.has(url)) return;

    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      
      if (options.crossorigin) {
        link.crossOrigin = options.crossorigin;
      }
      
      document.head.appendChild(link);
      
      performanceMonitor.recordMetric('resource_prefetch', 0, {
        url,
        trigger: options.trigger || 'manual',
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.warn(`Failed to prefetch resource: ${url}`, error);
    }
  }

  /**
   * Get preloading statistics
   */
  getStats() {
    return {
      preloadedResources: this.preloadedResources.size,
      activePreloads: this.activePreloads.size,
      queuedPreloads: this.preloadQueue.length,
      userBehaviorData: Object.fromEntries(this.userBehaviorData),
      networkInfo: this.networkInfo ? {
        effectiveType: this.networkInfo.effectiveType,
        downlink: this.networkInfo.downlink,
        rtt: this.networkInfo.rtt,
        saveData: this.networkInfo.saveData
      } : null
    };
  }

  /**
   * Clear preloaded resources
   */
  clear() {
    this.preloadedResources.clear();
    this.activePreloads.clear();
    this.preloadQueue = [];
    this.userBehaviorData.clear();
  }
}

// Create singleton instance
const resourcePreloader = new ResourcePreloader({
  enableIntelligentPrefetch: true,
  enableNetworkAwareness: true,
  maxConcurrentPreloads: 6,
  preloadTimeout: 10000
});

export default resourcePreloader;