/**
 * OfflineCacheService Tests
 * 
 * Tests for offline data caching and synchronization on reconnection.
 * Tests Requirement: 16.4 - Offline caching and sync on reconnection
 */

import OfflineCacheService from '../OfflineCacheService.js';
import DataPersistenceService from '../DataPersistenceService.js';

// Mock DataPersistenceService
jest.mock('../DataPersistenceService.js');

// Mock Cache API
global.caches = {
  open: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn()
};

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock window events
const mockEventListeners = {};
window.addEventListener = jest.fn((event, callback) => {
  mockEventListeners[event] = callback;
});

// Mock Blob
global.Blob = jest.fn().mockImplementation((content, options) => ({
  size: content ? content[0].length : 0,
  type: options?.type || 'application/json'
}));

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(function() {
    this.onload({ target: { result: 'data:image/png;base64,mock-base64-data' } });
  }),
  onload: null,
  onerror: null
}));

describe('OfflineCacheService', () => {
  let service;
  let mockPersistenceService;
  let mockCacheStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPersistenceService = {
      persistGameMetadata: jest.fn().mockResolvedValue({ success: true }),
      recordSessionData: jest.fn().mockResolvedValue({ success: true })
    };
    
    DataPersistenceService.mockImplementation(() => mockPersistenceService);
    
    mockCacheStorage = {
      put: jest.fn().mockResolvedValue(),
      match: jest.fn(),
      delete: jest.fn().mockResolvedValue(),
      keys: jest.fn().mockResolvedValue([])
    };
    
    global.caches.open.mockResolvedValue(mockCacheStorage);
    global.caches.delete.mockResolvedValue(true);
    global.caches.keys.mockResolvedValue(['dhyan-therapy-cache-v1']);
    
    service = new OfflineCacheService();
    service.cacheStorage = mockCacheStorage;
  });

  describe('Cache Initialization', () => {
    test('should initialize cache storage successfully', async () => {
      expect(global.caches.open).toHaveBeenCalledWith('dhyan-therapy-cache-v1');
      expect(service.cacheStorage).toBe(mockCacheStorage);
    });

    test('should fallback to localStorage when Cache API unavailable', async () => {
      // Mock Cache API as unavailable
      delete window.caches;
      
      const fallbackService = new OfflineCacheService();
      
      expect(fallbackService.fallbackCache).toBeDefined();
      expect(fallbackService.fallbackCache instanceof Map).toBe(true);
    });

    test('should load existing fallback cache from localStorage', async () => {
      delete window.caches;
      
      const existingCache = {
        'key1': { data: 'value1', timestamp: Date.now() },
        'key2': { data: 'value2', timestamp: Date.now() }
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingCache));
      
      const fallbackService = new OfflineCacheService();
      
      expect(fallbackService.fallbackCache.size).toBe(2);
      expect(fallbackService.fallbackCache.get('key1')).toEqual(existingCache.key1);
    });

    test('should handle localStorage parsing errors gracefully', async () => {
      delete window.caches;
      
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const fallbackService = new OfflineCacheService();
      
      expect(fallbackService.fallbackCache.size).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load fallback cache:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Network Status Handling', () => {
    test('should handle online/offline events', () => {
      const syncSpy = jest.spyOn(service, 'syncCachedData').mockResolvedValue({});
      
      // Simulate going offline
      mockEventListeners.offline();
      expect(service.isOnline).toBe(false);
      
      // Simulate going online
      mockEventListeners.online();
      expect(service.isOnline).toBe(true);
      expect(syncSpy).toHaveBeenCalled();
    });
  });

  describe('Data Caching', () => {
    test('should cache data with Cache API', async () => {
      const key = 'test-key';
      const data = { id: 1, name: 'Test Data' };
      const options = { priority: 'high', expires: Date.now() + 3600000 };

      const result = await service.cacheData(key, data, options);

      expect(result).toBe(true);
      expect(mockCacheStorage.put).toHaveBeenCalledWith(
        key,
        expect.any(Response)
      );
    });

    test('should cache data with fallback storage', async () => {
      service.cacheStorage = null;
      service.fallbackCache = new Map();
      service.persistFallbackCache = jest.fn().mockResolvedValue();

      const key = 'test-key';
      const data = { id: 1, name: 'Test Data' };

      const result = await service.cacheData(key, data);

      expect(result).toBe(true);
      expect(service.fallbackCache.has(key)).toBe(true);
      expect(service.persistFallbackCache).toHaveBeenCalled();
    });

    test('should handle cache failures gracefully', async () => {
      mockCacheStorage.put.mockRejectedValue(new Error('Cache full'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.cacheData('test-key', { data: 'test' });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to cache data for key test-key:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Data Retrieval', () => {
    test('should retrieve cached data with Cache API', async () => {
      const cachedData = {
        key: 'test-key',
        data: { id: 1, name: 'Test Data' },
        timestamp: Date.now(),
        expires: Date.now() + 3600000
      };

      const mockResponse = {
        json: jest.fn().mockResolvedValue(cachedData)
      };

      mockCacheStorage.match.mockResolvedValue(mockResponse);

      const result = await service.getCachedData('test-key');

      expect(result).toEqual(cachedData.data);
      expect(mockCacheStorage.match).toHaveBeenCalledWith('test-key');
    });

    test('should retrieve cached data with fallback storage', async () => {
      service.cacheStorage = null;
      service.fallbackCache = new Map();
      
      const cachedData = {
        data: { id: 1, name: 'Test Data' },
        expires: Date.now() + 3600000
      };
      
      service.fallbackCache.set('test-key', cachedData);

      const result = await service.getCachedData('test-key');

      expect(result).toEqual(cachedData.data);
    });

    test('should return null for expired cache entries', async () => {
      const expiredData = {
        data: { id: 1, name: 'Expired Data' },
        expires: Date.now() - 1000 // Expired 1 second ago
      };

      const mockResponse = {
        json: jest.fn().mockResolvedValue(expiredData)
      };

      mockCacheStorage.match.mockResolvedValue(mockResponse);
      service.removeCachedData = jest.fn().mockResolvedValue(true);

      const result = await service.getCachedData('expired-key');

      expect(result).toBeNull();
      expect(service.removeCachedData).toHaveBeenCalledWith('expired-key');
    });

    test('should return null for non-existent cache entries', async () => {
      mockCacheStorage.match.mockResolvedValue(null);

      const result = await service.getCachedData('non-existent-key');

      expect(result).toBeNull();
    });
  });

  describe('Specialized Caching Methods', () => {
    test('should cache game metadata with high priority', async () => {
      const metadata = {
        game_id: 'game-123',
        title: 'Test Game',
        therapeutic_goals: ['speech-articulation']
      };

      const cacheSpy = jest.spyOn(service, 'cacheData').mockResolvedValue(true);

      const result = await service.cacheGameMetadata(metadata);

      expect(result).toBe(true);
      expect(cacheSpy).toHaveBeenCalledWith(
        'game_metadata_game-123',
        metadata,
        expect.objectContaining({
          priority: 'high',
          metadata: expect.objectContaining({
            type: 'game_metadata',
            game_id: 'game-123'
          })
        })
      );
    });

    test('should cache session data', async () => {
      const sessionData = {
        session_id: 'session-123',
        child_id: 'child-456',
        performance_metrics: { score: 85 }
      };

      const cacheSpy = jest.spyOn(service, 'cacheData').mockResolvedValue(true);

      const result = await service.cacheSessionData(sessionData);

      expect(result).toBe(true);
      expect(cacheSpy).toHaveBeenCalledWith(
        'session_data_session-123',
        sessionData,
        expect.objectContaining({
          priority: 'normal',
          metadata: expect.objectContaining({
            type: 'session_data',
            session_id: 'session-123',
            child_id: 'child-456'
          })
        })
      );
    });

    test('should cache child profile data', async () => {
      const profileData = {
        child_id: 'child-123',
        name: 'Test Child',
        age: 6
      };

      const cacheSpy = jest.spyOn(service, 'cacheData').mockResolvedValue(true);

      const result = await service.cacheChildProfile(profileData);

      expect(result).toBe(true);
      expect(cacheSpy).toHaveBeenCalledWith(
        'child_profile_child-123',
        profileData,
        expect.objectContaining({
          priority: 'high',
          metadata: expect.objectContaining({
            type: 'child_profile',
            child_id: 'child-123'
          })
        })
      );
    });
  });

  describe('Image Caching', () => {
    test('should cache game images with Cache API', async () => {
      const imageUrl = 'https://example.com/game-image.jpg';
      const imageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });

      const result = await service.cacheGameImage(imageUrl, imageBlob);

      expect(result).toBe(true);
      expect(mockCacheStorage.put).toHaveBeenCalledWith(
        imageUrl,
        expect.any(Response)
      );
    });

    test('should cache images with fallback storage', async () => {
      service.cacheStorage = null;
      service.blobToBase64 = jest.fn().mockResolvedValue('data:image/jpeg;base64,fake-data');
      const cacheSpy = jest.spyOn(service, 'cacheData').mockResolvedValue(true);

      const imageUrl = 'https://example.com/game-image.jpg';
      const imageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });

      const result = await service.cacheGameImage(imageUrl, imageBlob);

      expect(result).toBe(true);
      expect(cacheSpy).toHaveBeenCalledWith(
        imageUrl,
        expect.objectContaining({
          type: 'image',
          data: 'data:image/jpeg;base64,fake-data',
          contentType: 'image/jpeg'
        })
      );
    });

    test('should retrieve cached images', async () => {
      const imageUrl = 'https://example.com/game-image.jpg';
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      const mockResponse = {
        blob: jest.fn().mockResolvedValue(mockBlob)
      };

      mockCacheStorage.match.mockResolvedValue(mockResponse);

      const result = await service.getCachedImage(imageUrl);

      expect(result).toBe(mockBlob);
      expect(mockCacheStorage.match).toHaveBeenCalledWith(imageUrl);
    });

    test('should retrieve images from fallback storage', async () => {
      service.cacheStorage = null;
      service.base64ToBlob = jest.fn().mockReturnValue(new Blob(['fake-data']));
      
      const getCachedDataSpy = jest.spyOn(service, 'getCachedData').mockResolvedValue({
        type: 'image',
        data: 'data:image/jpeg;base64,fake-data',
        contentType: 'image/jpeg'
      });

      const result = await service.getCachedImage('test-image-url');

      expect(result).toBeDefined();
      expect(service.base64ToBlob).toHaveBeenCalledWith(
        'data:image/jpeg;base64,fake-data',
        'image/jpeg'
      );
    });
  });

  describe('Sync Queue Management', () => {
    test('should queue data for sync', async () => {
      const cacheSpy = jest.spyOn(service, 'cacheData').mockResolvedValue(true);
      const syncSpy = jest.spyOn(service, 'syncCachedData').mockResolvedValue({});

      const operation = 'CREATE';
      const dataType = 'game_metadata';
      const data = { game_id: 'test-game' };

      const queueId = await service.queueForSync(operation, dataType, data);

      expect(queueId).toMatch(/^sync_\d+_[a-z0-9]+$/);
      expect(service.syncQueue).toHaveLength(1);
      expect(service.syncQueue[0]).toMatchObject({
        id: queueId,
        operation,
        dataType,
        data,
        status: 'pending'
      });

      expect(cacheSpy).toHaveBeenCalledWith(
        `sync_queue_${queueId}`,
        expect.objectContaining({ id: queueId }),
        expect.objectContaining({ priority: 'high' })
      );

      // Should trigger sync if online
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(syncSpy).toHaveBeenCalled();
    });

    test('should not trigger immediate sync when offline', async () => {
      service.isOnline = false;
      const syncSpy = jest.spyOn(service, 'syncCachedData').mockResolvedValue({});

      await service.queueForSync('CREATE', 'game_metadata', { game_id: 'test' });

      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(syncSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cached Data Synchronization', () => {
    test('should sync cached data when online', async () => {
      service.syncQueue = [
        {
          id: 'sync-1',
          operation: 'CREATE',
          dataType: 'game_metadata',
          data: { game_id: 'game-1' },
          retryCount: 0,
          maxRetries: 3,
          status: 'pending'
        },
        {
          id: 'sync-2',
          operation: 'CREATE',
          dataType: 'session_data',
          data: { session_id: 'session-1' },
          retryCount: 0,
          maxRetries: 3,
          status: 'pending'
        }
      ];

      service.loadSyncQueue = jest.fn().mockResolvedValue();
      service.processSyncItem = jest.fn().mockResolvedValue();
      service.removeSyncItem = jest.fn();

      const result = await service.syncCachedData();

      expect(result.total_items).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.success).toBe(true);
      expect(service.processSyncItem).toHaveBeenCalledTimes(2);
      expect(service.removeSyncItem).toHaveBeenCalledTimes(2);
    });

    test('should handle sync failures with retry logic', async () => {
      service.syncQueue = [
        {
          id: 'sync-fail',
          operation: 'CREATE',
          dataType: 'game_metadata',
          data: { game_id: 'failing-game' },
          retryCount: 0,
          maxRetries: 3,
          status: 'pending'
        }
      ];

      service.loadSyncQueue = jest.fn().mockResolvedValue();
      service.processSyncItem = jest.fn().mockRejectedValue(new Error('Sync failed'));
      service.cacheData = jest.fn().mockResolvedValue(true);

      const result = await service.syncCachedData();

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0); // Not failed yet, just retrying
      expect(service.syncQueue[0].retryCount).toBe(1);
      expect(service.syncQueue[0].status).toBe('retry');
      expect(service.syncQueue[0].lastError).toBe('Sync failed');
    });

    test('should mark items as failed after max retries', async () => {
      service.syncQueue = [
        {
          id: 'sync-max-retries',
          operation: 'CREATE',
          dataType: 'game_metadata',
          data: { game_id: 'max-retries-game' },
          retryCount: 3, // Already at max retries
          maxRetries: 3,
          status: 'pending'
        }
      ];

      service.loadSyncQueue = jest.fn().mockResolvedValue();
      service.processSyncItem = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      const result = await service.syncCachedData();

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        id: 'sync-max-retries',
        error: 'Persistent failure'
      });
      expect(service.syncQueue[0].status).toBe('failed');
    });

    test('should skip sync when already in progress', async () => {
      service.syncInProgress = true;

      const result = await service.syncCachedData();

      expect(result.status).toBe('skipped');
      expect(result.reason).toBe('sync_in_progress');
    });

    test('should skip sync when offline', async () => {
      service.isOnline = false;

      const result = await service.syncCachedData();

      expect(result.status).toBe('skipped');
      expect(result.reason).toBe('offline');
    });
  });

  describe('Sync Item Processing', () => {
    test('should process CREATE metadata operations', async () => {
      const queueItem = {
        operation: 'CREATE',
        dataType: 'game_metadata',
        data: { game_id: 'test-game' }
      };

      await service.processSyncItem(queueItem);

      expect(mockPersistenceService.persistGameMetadata).toHaveBeenCalledWith(queueItem.data);
    });

    test('should process CREATE session operations', async () => {
      const queueItem = {
        operation: 'CREATE',
        dataType: 'session_data',
        data: { session_id: 'test-session' }
      };

      await service.processSyncItem(queueItem);

      expect(mockPersistenceService.recordSessionData).toHaveBeenCalledWith(queueItem.data);
    });

    test('should handle unknown operations', async () => {
      const queueItem = {
        operation: 'UNKNOWN',
        dataType: 'game_metadata',
        data: { game_id: 'test-game' }
      };

      await expect(service.processSyncItem(queueItem)).rejects.toThrow(
        'Unknown sync operation: UNKNOWN'
      );
    });
  });

  describe('Cache Management', () => {
    test('should remove cached data', async () => {
      const result = await service.removeCachedData('test-key');

      expect(result).toBe(true);
      expect(mockCacheStorage.delete).toHaveBeenCalledWith('test-key');
    });

    test('should clear all cached data', async () => {
      const result = await service.clearCache();

      expect(result).toBe(true);
      expect(global.caches.delete).toHaveBeenCalledWith('dhyan-therapy-cache-v1');
      expect(global.caches.open).toHaveBeenCalledWith('dhyan-therapy-cache-v1');
      expect(service.syncQueue).toHaveLength(0);
    });

    test('should get cache statistics', async () => {
      const mockRequests = [
        { url: 'http://example.com/api/games/1' },
        { url: 'http://example.com/api/games/2' }
      ];

      mockCacheStorage.keys.mockResolvedValue(mockRequests);
      mockCacheStorage.match.mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
      });

      service.syncQueue = [{ id: 1 }, { id: 2 }];

      const stats = await service.getCacheStatistics();

      expect(stats.item_count).toBe(2);
      expect(stats.total_size_bytes).toBe(2048); // 2 * 1024
      expect(stats.sync_queue_size).toBe(2);
      expect(stats.is_online).toBe(true);
      expect(stats.sync_in_progress).toBe(false);
    });

    test('should handle cache statistics errors', async () => {
      mockCacheStorage.keys.mockRejectedValue(new Error('Cache error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const stats = await service.getCacheStatistics();

      expect(stats.error).toBe('Cache error');
      expect(stats.total_size_bytes).toBe(0);
      expect(stats.item_count).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get cache statistics:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Service Status', () => {
    test('should get service status', () => {
      service.isOnline = true;
      service.syncQueue = [{ id: 1 }, { id: 2 }];
      service.syncInProgress = false;
      service.cacheStrategy = 'cache_first';
      service.maxCacheSize = 50 * 1024 * 1024;

      const status = service.getStatus();

      expect(status.is_online).toBe(true);
      expect(status.cache_initialized).toBe(true);
      expect(status.sync_queue_size).toBe(2);
      expect(status.sync_in_progress).toBe(false);
      expect(status.cache_strategy).toBe('cache_first');
      expect(status.max_cache_size_mb).toBe(50);
    });
  });

  describe('Utility Functions', () => {
    test('should convert blob to base64', async () => {
      const blob = new Blob(['test data'], { type: 'text/plain' });
      
      const result = await service.blobToBase64(blob);
      
      expect(result).toBe('data:image/png;base64,mock-base64-data');
    });

    test('should convert base64 to blob', () => {
      const base64 = 'data:image/jpeg;base64,dGVzdCBkYXRh'; // 'test data' in base64
      const contentType = 'image/jpeg';
      
      const result = service.base64ToBlob(base64, contentType);
      
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe(contentType);
    });

    test('should calculate data size', () => {
      const data = { test: 'data', number: 123 };
      
      const size = service.calculateDataSize(data);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });
  });

  describe('Error Handling', () => {
    test('should handle cache initialization failure', async () => {
      global.caches.open.mockRejectedValue(new Error('Cache initialization failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const failingService = new OfflineCacheService();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize cache:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('should handle cache operation failures gracefully', async () => {
      mockCacheStorage.put.mockRejectedValue(new Error('Storage quota exceeded'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.cacheData('test-key', { data: 'test' });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('should handle retrieval failures gracefully', async () => {
      mockCacheStorage.match.mockRejectedValue(new Error('Cache corrupted'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.getCachedData('test-key');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});