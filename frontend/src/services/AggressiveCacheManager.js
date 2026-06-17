/**
 * AggressiveCacheManager - Comprehensive caching solution for frequently accessed data
 * Implements multi-layer caching with intelligent cache management
 * 
 * Features:
 * - Memory cache with LRU eviction
 * - IndexedDB persistent cache
 * - Cache warming and preloading
 * - TTL-based expiration
 * - Cache analytics and monitoring
 * - Compression for large data
 */

class AggressiveCacheManager {
  constructor(options = {}) {
    this.options = {
      maxMemorySize: options.maxMemorySize || 50 * 1024 * 1024, // 50MB
      maxMemoryItems: options.maxMemoryItems || 1000,
      defaultTTL: options.defaultTTL || 30 * 60 * 1000, // 30 minutes
      compressionThreshold: options.compressionThreshold || 10 * 1024, // 10KB
      enableAnalytics: options.enableAnalytics !== false,
      dbName: options.dbName || 'dhyan-cache',
      dbVersion: options.dbVersion || 1,
      ...options
    };

    // Memory cache with LRU
    this.memoryCache = new Map();
    this.accessOrder = new Map(); // For LRU tracking
    this.memorySize = 0;

    // Cache analytics
    this.analytics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      compressions: 0,
      errors: 0
    };

    // Initialize IndexedDB
    this.initDB();

    // Preload critical data
    this.preloadCriticalData();

    // Setup periodic cleanup
    this.setupCleanup();
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  async initDB() {
    try {
      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.options.dbName, this.options.dbVersion);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Create cache store
          if (!db.objectStoreNames.contains('cache')) {
            const store = db.createObjectStore('cache', { keyPath: 'key' });
            store.createIndex('expiry', 'expiry', { unique: false });
            store.createIndex('priority', 'priority', { unique: false });
          }
          
          // Create analytics store
          if (!db.objectStoreNames.contains('analytics')) {
            db.createObjectStore('analytics', { keyPath: 'date' });
          }
        };
      });
    } catch (error) {
      console.error('Failed to initialize cache database:', error);
      this.analytics.errors++;
    }
  }

  /**
   * Get data from cache with fallback chain
   */
  async get(key, fallbackFn = null, options = {}) {
    const startTime = performance.now();
    
    try {
      // Check memory cache first
      const memoryResult = this.getFromMemory(key);
      if (memoryResult !== null) {
        this.analytics.hits++;
        this.recordAccess(key);
        return memoryResult;
      }

      // Check IndexedDB cache
      const dbResult = await this.getFromDB(key);
      if (dbResult !== null) {
        // Promote to memory cache
        this.setInMemory(key, dbResult, options);
        this.analytics.hits++;
        this.recordAccess(key);
        return dbResult;
      }

      // Cache miss - use fallback if provided
      this.analytics.misses++;
      
      if (fallbackFn) {
        const data = await fallbackFn();
        if (data !== null && data !== undefined) {
          await this.set(key, data, options);
        }
        return data;
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.analytics.errors++;
      
      // Fallback to function if cache fails
      if (fallbackFn) {
        return await fallbackFn();
      }
      
      return null;
    } finally {
      // Record performance metrics
      const duration = performance.now() - startTime;
      this.recordPerformance('get', duration);
    }
  }

  /**
   * Set data in cache with compression and TTL
   */
  async set(key, data, options = {}) {
    const startTime = performance.now();
    
    try {
      const ttl = options.ttl || this.options.defaultTTL;
      const priority = options.priority || 'medium';
      const expiry = Date.now() + ttl;
      
      // Compress large data
      const processedData = await this.processDataForStorage(data);
      
      // Store in memory cache
      this.setInMemory(key, data, { expiry, priority });
      
      // Store in IndexedDB
      await this.setInDB(key, processedData, { expiry, priority });
      
      this.analytics.sets++;
      this.recordAccess(key);
      
    } catch (error) {
      console.error('Cache set error:', error);
      this.analytics.errors++;
    } finally {
      const duration = performance.now() - startTime;
      this.recordPerformance('set', duration);
    }
  }

  /**
   * Get data from memory cache
   */
  getFromMemory(key) {
    const item = this.memoryCache.get(key);
    if (!item) return null;
    
    // Check expiry
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }
    
    // Update access order for LRU
    this.accessOrder.delete(key);
    this.accessOrder.set(key, Date.now());
    
    return item.data;
  }

  /**
   * Set data in memory cache with LRU eviction
   */
  setInMemory(key, data, options = {}) {
    const size = this.calculateSize(data);
    const item = {
      data,
      size,
      expiry: options.expiry || Date.now() + this.options.defaultTTL,
      priority: options.priority || 'medium',
      timestamp: Date.now()
    };

    // Check if we need to evict items
    while (
      (this.memorySize + size > this.options.maxMemorySize) ||
      (this.memoryCache.size >= this.options.maxMemoryItems)
    ) {
      this.evictLRU();
    }

    // Remove existing item if present
    if (this.memoryCache.has(key)) {
      const existingItem = this.memoryCache.get(key);
      this.memorySize -= existingItem.size;
    }

    // Add new item
    this.memoryCache.set(key, item);
    this.accessOrder.set(key, Date.now());
    this.memorySize += size;
  }

  /**
   * Get data from IndexedDB
   */
  async getFromDB(key) {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);
      
      const result = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      if (!result) return null;
      
      // Check expiry
      if (Date.now() > result.expiry) {
        this.deleteFromDB(key);
        return null;
      }
      
      // Decompress if needed
      return await this.processDataFromStorage(result.data);
      
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * Set data in IndexedDB
   */
  async setInDB(key, data, options = {}) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const item = {
        key,
        data,
        expiry: options.expiry,
        priority: options.priority,
        timestamp: Date.now()
      };
      
      await new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
    } catch (error) {
      console.error('IndexedDB set error:', error);
    }
  }

  /**
   * Process data for storage (compression, serialization)
   */
  async processDataForStorage(data) {
    const serialized = JSON.stringify(data);
    
    if (serialized.length > this.options.compressionThreshold) {
      // Simple compression using gzip if available
      if (window.CompressionStream) {
        try {
          const stream = new CompressionStream('gzip');
          const writer = stream.writable.getWriter();
          const reader = stream.readable.getReader();
          
          writer.write(new TextEncoder().encode(serialized));
          writer.close();
          
          const chunks = [];
          let done = false;
          
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
          }
          
          this.analytics.compressions++;
          return {
            compressed: true,
            data: chunks
          };
        } catch (error) {
          console.warn('Compression failed, storing uncompressed:', error);
        }
      }
    }
    
    return {
      compressed: false,
      data: serialized
    };
  }

  /**
   * Process data from storage (decompression, deserialization)
   */
  async processDataFromStorage(storedData) {
    if (storedData.compressed) {
      // Decompress if needed
      if (window.DecompressionStream) {
        try {
          const stream = new DecompressionStream('gzip');
          const writer = stream.writable.getWriter();
          const reader = stream.readable.getReader();
          
          for (const chunk of storedData.data) {
            writer.write(chunk);
          }
          writer.close();
          
          const chunks = [];
          let done = false;
          
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
          }
          
          const decompressed = new TextDecoder().decode(
            new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
          );
          
          return JSON.parse(decompressed);
        } catch (error) {
          console.error('Decompression failed:', error);
          return null;
        }
      }
    }
    
    return JSON.parse(storedData.data);
  }

  /**
   * Evict least recently used item from memory cache
   */
  evictLRU() {
    if (this.accessOrder.size === 0) return;
    
    // Find oldest access
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const item = this.memoryCache.get(oldestKey);
      if (item) {
        this.memorySize -= item.size;
      }
      
      this.memoryCache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      this.analytics.evictions++;
    }
  }

  /**
   * Calculate approximate size of data
   */
  calculateSize(data) {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch {
      return 1024; // Default size if calculation fails
    }
  }

  /**
   * Record access for analytics
   */
  recordAccess(key) {
    if (!this.options.enableAnalytics) return;
    
    // Simple access tracking
    const now = Date.now();
    if (!this.lastAnalyticsFlush || now - this.lastAnalyticsFlush > 60000) {
      this.flushAnalytics();
      this.lastAnalyticsFlush = now;
    }
  }

  /**
   * Record performance metrics
   */
  recordPerformance(operation, duration) {
    if (!this.options.enableAnalytics) return;
    
    if (window.performance && window.performance.mark) {
      window.performance.mark(`cache-${operation}-${duration}`);
    }
  }

  /**
   * Preload critical data
   */
  async preloadCriticalData() {
    const criticalKeys = [
      'game-metadata',
      'child-profiles',
      'therapeutic-goals',
      'sticker-assets'
    ];
    
    for (const key of criticalKeys) {
      this.get(key).then(cached => {
        if (!cached) {
          console.log(`[CacheManager] Preloading missing critical data: ${key}`);
          // In a real app, this might trigger a fetch. 
          // For now, it just identifies what needs to be fetched.
        }
      }).catch(error => {
        console.warn(`[CacheManager] Failed to check status of ${key}:`, error);
      });
    }
  }

  /**
   * Setup periodic cleanup
   */
  setupCleanup() {
    // Clean expired items every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
    
    // Flush analytics every minute
    setInterval(() => {
      this.flushAnalytics();
    }, 60 * 1000);
  }

  /**
   * Clean up expired items
   */
  async cleanupExpired() {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, item] of this.memoryCache) {
      if (now > item.expiry) {
        this.memorySize -= item.size;
        this.memoryCache.delete(key);
        this.accessOrder.delete(key);
      }
    }
    
    // Clean IndexedDB cache
    if (this.db) {
      try {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const index = store.index('expiry');
        const range = IDBKeyRange.upperBound(now);
        
        const request = index.openCursor(range);
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  }

  /**
   * Flush analytics to storage
   */
  async flushAnalytics() {
    if (!this.options.enableAnalytics || !this.db) return;
    
    try {
      const transaction = this.db.transaction(['analytics'], 'readwrite');
      const store = transaction.objectStore('analytics');
      
      const analyticsData = {
        date: new Date().toISOString().split('T')[0],
        ...this.analytics,
        memorySize: this.memorySize,
        memoryItems: this.memoryCache.size
      };
      
      await new Promise((resolve, reject) => {
        const request = store.put(analyticsData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
    } catch (error) {
      console.error('Analytics flush error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.analytics.hits / (this.analytics.hits + this.analytics.misses) || 0;
    
    return {
      ...this.analytics,
      hitRate: Math.round(hitRate * 100),
      memorySize: this.memorySize,
      memoryItems: this.memoryCache.size,
      maxMemorySize: this.options.maxMemorySize,
      maxMemoryItems: this.options.maxMemoryItems
    };
  }

  /**
   * Clear all caches
   */
  async clear() {
    // Clear memory cache
    this.memoryCache.clear();
    this.accessOrder.clear();
    this.memorySize = 0;
    
    // Clear IndexedDB cache
    if (this.db) {
      try {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error('Clear cache error:', error);
      }
    }
  }

  /**
   * Delete specific key from all caches
   */
  async delete(key) {
    // Remove from memory cache
    const item = this.memoryCache.get(key);
    if (item) {
      this.memorySize -= item.size;
      this.memoryCache.delete(key);
      this.accessOrder.delete(key);
    }
    
    // Remove from IndexedDB
    await this.deleteFromDB(key);
  }

  /**
   * Delete from IndexedDB
   */
  async deleteFromDB(key) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      await new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB delete error:', error);
    }
  }
}

// Create singleton instance
const cacheManager = new AggressiveCacheManager();

export default cacheManager;