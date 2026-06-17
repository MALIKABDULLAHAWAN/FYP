/**
 * OfflineCacheService
 *
 * Lightweight offline cache + sync queue used by tests and runtime.
 */
import DataPersistenceService from './DataPersistenceService.js';

class OfflineCacheService {
  constructor() {
    this.cacheName = 'dhyan-therapy-cache-v1';
    this.cacheStorage = null;
    this.fallbackCache = new Map();
    this.syncQueue = [];
    this.syncInProgress = false;
    this.isOnline = navigator.onLine;
    this.cacheStrategy = 'cache_first';
    this.maxCacheSize = 50 * 1024 * 1024;
    this.persistenceService = new DataPersistenceService();

    this.initializeCache();
    this.setupNetworkListeners();
  }

  async initializeCache() {
    try {
      if (window.caches) {
        this.cacheStorage = await window.caches.open(this.cacheName);
      } else {
        this.loadFallbackCache();
      }
    } catch (error) {
      console.error('Failed to initialize cache:', error);
      this.loadFallbackCache();
    }
  }

  loadFallbackCache() {
    try {
      const raw = localStorage.getItem('dhyan_fallback_cache');
      const parsed = raw ? JSON.parse(raw) : {};
      this.fallbackCache = new Map(Object.entries(parsed));
    } catch (error) {
      console.error('Failed to load fallback cache:', error);
      this.fallbackCache = new Map();
    }
  }

  async persistFallbackCache() {
    const obj = Object.fromEntries(this.fallbackCache.entries());
    localStorage.setItem('dhyan_fallback_cache', JSON.stringify(obj));
  }

  setupNetworkListeners() {
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncCachedData();
    });
  }

  async cacheData(key, data, options = {}) {
    const entry = {
      key,
      data,
      timestamp: Date.now(),
      expires: options.expires ?? Date.now() + 3600000,
      metadata: options.metadata || {},
      priority: options.priority || 'normal',
    };

    try {
      if (this.cacheStorage) {
        await this.cacheStorage.put(key, new Response(JSON.stringify(entry)));
      } else {
        this.fallbackCache.set(key, entry);
        await this.persistFallbackCache();
      }
      return true;
    } catch (error) {
      console.error(`Failed to cache data for key ${key}:`, error);
      return false;
    }
  }

  async getCachedData(key) {
    try {
      let entry = null;
      if (this.cacheStorage) {
        const response = await this.cacheStorage.match(key);
        if (!response) return null;
        entry = await response.json();
      } else {
        entry = this.fallbackCache.get(key) || null;
      }

      if (!entry) return null;
      if (entry.expires && Date.now() > entry.expires) {
        await this.removeCachedData(key);
        return null;
      }
      return entry.data;
    } catch (error) {
      console.error(`Failed to retrieve cached data for key ${key}:`, error);
      return null;
    }
  }

  async removeCachedData(key) {
    if (this.cacheStorage) {
      await this.cacheStorage.delete(key);
    } else {
      this.fallbackCache.delete(key);
      await this.persistFallbackCache();
    }
    return true;
  }

  async cacheGameMetadata(metadata) {
    return this.cacheData(`game_metadata_${metadata.game_id}`, metadata, {
      priority: 'high',
      metadata: { type: 'game_metadata', game_id: metadata.game_id },
      expires: Date.now() + 24 * 3600000,
    });
  }

  async cacheSessionData(sessionData) {
    return this.cacheData(`session_data_${sessionData.session_id}`, sessionData, {
      priority: 'normal',
      metadata: {
        type: 'session_data',
        session_id: sessionData.session_id,
        child_id: sessionData.child_id,
      },
      expires: Date.now() + 7 * 24 * 3600000,
    });
  }

  async cacheChildProfile(profileData) {
    return this.cacheData(`child_profile_${profileData.child_id}`, profileData, {
      priority: 'high',
      metadata: { type: 'child_profile', child_id: profileData.child_id },
      expires: Date.now() + 24 * 3600000,
    });
  }

  async cacheGameImage(imageUrl, imageBlob) {
    try {
      if (this.cacheStorage) {
        try {
          const response = new Response(imageBlob);
          await this.cacheStorage.put(imageUrl, response);
          return true;
        } catch {
          // Fall through to base64 fallback for constrained test/runtime envs.
        }
      }

      const base64 = await this.blobToBase64(imageBlob);
      return this.cacheData(imageUrl, {
        type: 'image',
        data: base64,
        contentType: imageBlob.type || 'application/octet-stream',
      });
    } catch (error) {
      console.error(`Failed to cache image ${imageUrl}:`, error);
      return false;
    }
  }

  async getCachedImage(imageUrl) {
    if (this.cacheStorage) {
      const response = await this.cacheStorage.match(imageUrl);
      return response ? response.blob() : null;
    }
    const cached = await this.getCachedData(imageUrl);
    if (!cached || cached.type !== 'image') return null;
    return this.base64ToBlob(cached.data, cached.contentType);
  }

  async queueForSync(operation, dataType, data) {
    const id = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const item = { id, operation, dataType, data, retryCount: 0, maxRetries: 3, status: 'pending' };
    this.syncQueue.push(item);
    await this.cacheData(`sync_queue_${id}`, item, { priority: 'high', metadata: { type: 'sync_queue' } });
    if (this.isOnline) {
      setTimeout(() => this.syncCachedData(), 1000);
    }
    return id;
  }

  async loadSyncQueue() {
    return this.syncQueue;
  }

  async processSyncItem(item) {
    if (item.operation !== 'CREATE') {
      throw new Error(`Unknown sync operation: ${item.operation}`);
    }
    if (item.dataType === 'game_metadata') {
      return this.persistenceService.persistGameMetadata(item.data);
    }
    if (item.dataType === 'session_data') {
      return this.persistenceService.recordSessionData(item.data);
    }
    throw new Error(`Unsupported data type: ${item.dataType}`);
  }

  async removeSyncItem(id) {
    this.syncQueue = this.syncQueue.filter((i) => i.id !== id);
    await this.removeCachedData(`sync_queue_${id}`);
  }

  async syncCachedData() {
    if (this.syncInProgress) return { status: 'skipped', reason: 'sync_in_progress' };
    if (!this.isOnline) return { status: 'skipped', reason: 'offline' };

    this.syncInProgress = true;
    try {
      await this.loadSyncQueue();
      const items = this.syncQueue.filter((i) => i.status === 'pending' || i.status === 'retry');
      const result = { total_items: items.length, successful: 0, failed: 0, errors: [], success: true };

      for (const item of items) {
        try {
          await this.processSyncItem(item);
          result.successful += 1;
          await this.removeSyncItem(item.id);
        } catch (error) {
          item.retryCount += 1;
          item.lastError = error.message;
          if (item.retryCount >= item.maxRetries) {
            item.status = 'failed';
            result.failed += 1;
            result.errors.push({ id: item.id, error: error.message });
          } else {
            item.status = 'retry';
          }
          result.success = false;
        }
      }
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  async clearCache() {
    if (window.caches) {
      await window.caches.delete(this.cacheName);
      this.cacheStorage = await window.caches.open(this.cacheName);
    }
    this.fallbackCache.clear();
    await this.persistFallbackCache();
    this.syncQueue = [];
    return true;
  }

  async getCacheStatistics() {
    try {
      let itemCount = 0;
      let totalSize = 0;
      if (this.cacheStorage) {
        const keys = await this.cacheStorage.keys();
        itemCount = keys.length;
        for (const req of keys) {
          const match = await this.cacheStorage.match(req);
          if (match && match.arrayBuffer) {
            const buf = await match.arrayBuffer();
            totalSize += buf.byteLength;
          }
        }
      } else {
        itemCount = this.fallbackCache.size;
        for (const [, value] of this.fallbackCache) {
          totalSize += this.calculateDataSize(value);
        }
      }
      return {
        item_count: itemCount,
        total_size_bytes: totalSize,
        sync_queue_size: this.syncQueue.length,
        is_online: this.isOnline,
        sync_in_progress: this.syncInProgress,
      };
    } catch (error) {
      console.error('Failed to get cache statistics:', error);
      return { error: error.message, item_count: 0, total_size_bytes: 0, sync_queue_size: this.syncQueue.length };
    }
  }

  getStatus() {
    return {
      is_online: this.isOnline,
      cache_initialized: !!this.cacheStorage || !!this.fallbackCache,
      sync_queue_size: this.syncQueue.length,
      sync_in_progress: this.syncInProgress,
      cache_strategy: this.cacheStrategy,
      max_cache_size_mb: this.maxCacheSize / (1024 * 1024),
    };
  }

  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  base64ToBlob(base64, contentType = '') {
    const byteCharacters = atob(base64.split(',')[1] || '');
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) byteNumbers[i] = byteCharacters.charCodeAt(i);
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: contentType });
    // Helps test environments with mocked Blob constructors.
    try {
      Object.setPrototypeOf(blob, Blob.prototype);
    } catch {}
    return blob;
  }

  calculateDataSize(data) {
    return new Blob([JSON.stringify(data)]).size;
  }
}

export default OfflineCacheService;
