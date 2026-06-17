/**
 * Data Persistence Integration Tests
 * 
 * Integration tests for all data persistence services working together.
 * Tests Requirements: 16.1, 16.2, 16.3, 16.4 - Complete data persistence and synchronization
 */

import DataPersistenceService from '../DataPersistenceService.js';
import SessionRecordingService from '../SessionRecordingService.js';
import CrossDeviceSyncService from '../CrossDeviceSyncService.js';
import OfflineCacheService from '../OfflineCacheService.js';

// Mock external dependencies
global.fetch = jest.fn();
global.indexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          put: jest.fn(() => ({ onsuccess: null, onerror: null })),
          get: jest.fn(() => ({ onsuccess: null, onerror: null })),
          getAll: jest.fn(() => ({ onsuccess: null, onerror: null })),
          add: jest.fn(() => ({ onsuccess: null, onerror: null })),
          delete: jest.fn(() => ({ onsuccess: null, onerror: null }))
        }))
      }))
    }
  }))
};

global.caches = {
  open: jest.fn().mockResolvedValue({
    put: jest.fn().mockResolvedValue(),
    match: jest.fn(),
    delete: jest.fn().mockResolvedValue(),
    keys: jest.fn().mockResolvedValue([])
  }),
  delete: jest.fn().mockResolvedValue(true),
  keys: jest.fn().mockResolvedValue([])
};

global.WebSocket = jest.fn().mockImplementation(() => ({
  readyState: 1,
  send: jest.fn(),
  close: jest.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null
}));

Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

window.addEventListener = jest.fn();

describe('Data Persistence Integration', () => {
  let persistenceService;
  let sessionService;
  let syncService;
  let cacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, id: 'server-id' })
    });

    persistenceService = new DataPersistenceService();
    sessionService = new SessionRecordingService();
    syncService = new CrossDeviceSyncService();
    cacheService = new OfflineCacheService();

    // Initialize services with mocked dependencies
    persistenceService.db = {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          put: jest.fn(() => ({ onsuccess: null, onerror: null })),
          add: jest.fn(() => ({ onsuccess: null, onerror: null }))
        }))
      }))
    };
  });

  describe('End-to-End Data Flow', () => {
    test('should handle complete therapy session lifecycle', async () => {
      // 1. Start a therapy session
      const sessionConfig = {
        child_id: 'child-123',
        game_id: 'game-456',
        therapist_id: 'therapist-789',
        therapeutic_goals: ['speech-articulation', 'social-awareness'],
        difficulty: 'Medium'
      };

      const session = await sessionService.startSession(sessionConfig);
      expect(session.session_id).toBeDefined();
      expect(session.status).toBe('active');

      // 2. Record game metadata
      const gameMetadata = {
        game_id: sessionConfig.game_id,
        title: 'Speech Therapy Game',
        description: 'A game focused on speech articulation',
        therapeutic_goals: ['speech-articulation'],
        difficulty_level: 'Medium',
        age_range: { min_age: 5, max_age: 8 }
      };

      const persistedMetadata = await persistenceService.persistGameMetadata(gameMetadata);
      expect(persistedMetadata.persistence_time_ms).toBeLessThanOrEqual(100);

      // 3. Record session interactions and performance
      sessionService.recordInteraction(session.session_id, {
        type: 'click',
        target: 'start-button',
        timestamp: new Date().toISOString()
      });

      sessionService.recordPerformance(session.session_id, {
        score: 85,
        accuracy: 0.9,
        completion_percentage: 0.75
      });

      sessionService.recordEngagement(session.session_id, {
        type: 'success',
        level: 'high',
        duration_ms: 5000
      });

      // 4. Cache data for offline access
      await cacheService.cacheGameMetadata(gameMetadata);
      await cacheService.cacheSessionData(session);

      // 5. Complete the session
      const completedSession = await sessionService.completeSession(session.session_id, {
        therapist_notes: 'Excellent progress shown',
        child_engagement_level: 'high'
      });

      expect(completedSession.status).toBe('completed');
      expect(completedSession.performance_metrics.score).toBe(85);
      expect(completedSession.engagement_score).toBeGreaterThan(0);

      // 6. Verify data consistency across services
      const cacheStats = await cacheService.getCacheStatistics();
      expect(cacheStats.item_count).toBeGreaterThan(0);

      const persistenceStats = persistenceService.getStatistics();
      expect(persistenceStats.cache_size).toBeGreaterThan(0);
      expect(persistenceStats.session_cache_size).toBe(0); // Session completed and removed
    });

    test('should handle offline-to-online synchronization', async () => {
      // 1. Simulate offline mode
      navigator.onLine = false;
      persistenceService.isOnline = false;
      cacheService.isOnline = false;

      // 2. Create data while offline
      const offlineMetadata = {
        game_id: 'offline-game-123',
        title: 'Offline Game',
        therapeutic_goals: ['cognitive-development']
      };

      const offlineResult = await persistenceService.persistGameMetadata(offlineMetadata);
      expect(offlineResult.offline_mode).toBe(true);
      expect(offlineResult.sync_status).toBe('pending');

      // 3. Queue data for sync
      await cacheService.queueForSync('CREATE', 'game_metadata', offlineMetadata);
      expect(cacheService.syncQueue.length).toBeGreaterThan(0);

      // 4. Simulate going back online
      navigator.onLine = true;
      persistenceService.isOnline = true;
      cacheService.isOnline = true;

      // 5. Trigger synchronization
      const syncResult = await cacheService.syncCachedData();
      expect(syncResult.total_items).toBeGreaterThan(0);

      // 6. Verify cross-device sync
      const crossDeviceSyncResult = await syncService.synchronizeAllData();
      expect(crossDeviceSyncResult.success).toBe(true);
      expect(crossDeviceSyncResult.device_id).toBeDefined();
    });

    test('should maintain data consistency across multiple devices', async () => {
      // 1. Create data on device 1
      const device1Metadata = {
        game_id: 'multi-device-game',
        title: 'Multi-Device Game',
        updated_at: '2023-01-01T10:00:00Z'
      };

      await persistenceService.persistGameMetadata(device1Metadata);

      // 2. Simulate data from device 2 with later timestamp
      const device2Metadata = {
        game_id: 'multi-device-game',
        title: 'Multi-Device Game (Updated)',
        updated_at: '2023-01-01T11:00:00Z'
      };

      // Mock server response with conflict resolution
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          server_changes: [
            { operation: 'UPDATE', data: device2Metadata }
          ],
          conflicts_resolved: 1,
          records_synced: 1
        })
      });

      // 3. Perform cross-device sync
      const syncResult = await syncService.synchronizeAllData();
      expect(syncResult.conflicts_resolved).toBe(1);
      expect(syncResult.records_synced).toBe(1);

      // 4. Test data consistency
      const consistencyResult = await persistenceService.testDataConsistency(['device-1', 'device-2']);
      expect(consistencyResult.consistency_score).toBeGreaterThanOrEqual(0.95);
      expect(consistencyResult.data_integrity).toBe(true);
    });
  });

  describe('Performance Requirements Validation', () => {
    test('should meet 100ms persistence requirement under load', async () => {
      const metadataItems = [];
      const persistenceTimes = [];

      // Create multiple metadata items
      for (let i = 0; i < 10; i++) {
        metadataItems.push({
          game_id: `perf-test-${i}`,
          title: `Performance Test Game ${i}`,
          therapeutic_goals: ['speech-articulation']
        });
      }

      // Persist all items and measure time
      for (const metadata of metadataItems) {
        const result = await persistenceService.persistGameMetadata(metadata);
        persistenceTimes.push(result.persistence_time_ms);
      }

      // Verify all persistence operations were under 100ms
      persistenceTimes.forEach(time => {
        expect(time).toBeLessThanOrEqual(100);
      });

      // Verify average is well under the limit
      const averageTime = persistenceTimes.reduce((a, b) => a + b, 0) / persistenceTimes.length;
      expect(averageTime).toBeLessThanOrEqual(50);
    });

    test('should handle concurrent operations efficiently', async () => {
      const concurrentOperations = [];

      // Create concurrent persistence operations
      for (let i = 0; i < 5; i++) {
        concurrentOperations.push(
          persistenceService.persistGameMetadata({
            game_id: `concurrent-${i}`,
            title: `Concurrent Game ${i}`
          })
        );
      }

      // Create concurrent session operations
      for (let i = 0; i < 5; i++) {
        concurrentOperations.push(
          sessionService.startSession({
            child_id: `child-${i}`,
            game_id: `game-${i}`
          })
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(concurrentOperations);
      const totalTime = Date.now() - startTime;

      // All operations should complete successfully
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
      });

      // Total time should be reasonable for concurrent operations
      expect(totalTime).toBeLessThanOrEqual(1000); // 1 second for all operations
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from network failures', async () => {
      // 1. Start with successful operation
      const metadata = {
        game_id: 'resilience-test',
        title: 'Resilience Test Game'
      };

      const successResult = await persistenceService.persistGameMetadata(metadata);
      expect(successResult.sync_status).toBe('synced');

      // 2. Simulate network failure
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const failureMetadata = {
        game_id: 'failure-test',
        title: 'Failure Test Game'
      };

      // Should fallback to offline storage
      await expect(persistenceService.persistGameMetadata(failureMetadata)).rejects.toThrow();
      
      // But data should still be cached locally
      expect(persistenceService.persistenceCache.has(failureMetadata.game_id)).toBe(true);

      // 3. Restore network and verify recovery
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const recoveryResult = await persistenceService.persistGameMetadata({
        game_id: 'recovery-test',
        title: 'Recovery Test Game'
      });

      expect(recoveryResult.sync_status).toBe('synced');
    });

    test('should handle service initialization failures gracefully', async () => {
      // Mock IndexedDB failure
      global.indexedDB.open = jest.fn(() => {
        const request = { onerror: null };
        setTimeout(() => {
          if (request.onerror) {
            request.onerror({ target: { error: new Error('IndexedDB failed') } });
          }
        }, 0);
        return request;
      });

      // Services should still initialize and function
      const resilientPersistenceService = new DataPersistenceService();
      expect(resilientPersistenceService).toBeDefined();

      // Mock Cache API failure
      global.caches.open = jest.fn().mockRejectedValue(new Error('Cache API failed'));

      const resilientCacheService = new OfflineCacheService();
      expect(resilientCacheService).toBeDefined();
      expect(resilientCacheService.fallbackCache).toBeDefined();
    });

    test('should handle data corruption gracefully', async () => {
      // Simulate corrupted cache data
      const corruptedData = 'invalid-json-data';
      mockLocalStorage.getItem.mockReturnValue(corruptedData);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Service should handle corruption and continue functioning
      const resilientCacheService = new OfflineCacheService();
      expect(resilientCacheService.fallbackCache.size).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Data Validation and Integrity', () => {
    test('should validate data integrity across all services', async () => {
      const testData = {
        game_id: 'integrity-test',
        title: 'Data Integrity Test',
        therapeutic_goals: ['speech-articulation'],
        difficulty_level: 'Medium',
        age_range: { min_age: 5, max_age: 8 }
      };

      // 1. Persist data
      const persistedData = await persistenceService.persistGameMetadata(testData);
      expect(persistedData.game_id).toBe(testData.game_id);

      // 2. Cache data
      await cacheService.cacheGameMetadata(testData);
      const cachedData = await cacheService.getCachedData(`game_metadata_${testData.game_id}`);
      expect(cachedData.game_id).toBe(testData.game_id);

      // 3. Verify data consistency
      expect(cachedData.title).toBe(persistedData.title);
      expect(cachedData.therapeutic_goals).toEqual(persistedData.therapeutic_goals);
    });

    test('should maintain referential integrity', async () => {
      // Create related data
      const childProfile = {
        child_id: 'child-ref-test',
        name: 'Test Child',
        age: 6
      };

      const gameMetadata = {
        game_id: 'game-ref-test',
        title: 'Reference Test Game',
        age_range: { min_age: 5, max_age: 8 }
      };

      const sessionData = {
        child_id: childProfile.child_id,
        game_id: gameMetadata.game_id,
        therapist_id: 'therapist-123'
      };

      // Persist all related data
      await persistenceService.persistGameMetadata(gameMetadata);
      await cacheService.cacheChildProfile(childProfile);
      
      const session = await sessionService.startSession(sessionData);

      // Verify relationships are maintained
      expect(session.child_id).toBe(childProfile.child_id);
      expect(session.game_id).toBe(gameMetadata.game_id);

      const completedSession = await sessionService.completeSession(session.session_id);
      expect(completedSession.child_id).toBe(childProfile.child_id);
      expect(completedSession.game_id).toBe(gameMetadata.game_id);
    });
  });

  describe('Service Cleanup and Resource Management', () => {
    test('should properly cleanup resources', async () => {
      // Create some test data
      await persistenceService.persistGameMetadata({
        game_id: 'cleanup-test',
        title: 'Cleanup Test'
      });

      const session = await sessionService.startSession({
        child_id: 'child-cleanup',
        game_id: 'game-cleanup'
      });

      await cacheService.cacheGameMetadata({
        game_id: 'cache-cleanup',
        title: 'Cache Cleanup Test'
      });

      // Verify data exists
      expect(persistenceService.persistenceCache.size).toBeGreaterThan(0);
      expect(sessionService.activeSessions.size).toBeGreaterThan(0);
      expect(cacheService.syncQueue.length).toBeGreaterThan(0);

      // Cleanup all services
      persistenceService.clear();
      sessionService.clear();
      await cacheService.clearCache();
      syncService.cleanup();

      // Verify cleanup
      expect(persistenceService.persistenceCache.size).toBe(0);
      expect(sessionService.activeSessions.size).toBe(0);
      expect(cacheService.syncQueue.length).toBe(0);
      expect(syncService.syncListeners.length).toBe(0);
    });

    test('should handle memory management efficiently', async () => {
      const initialMemoryUsage = process.memoryUsage();

      // Create a large amount of test data
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          persistenceService.persistGameMetadata({
            game_id: `memory-test-${i}`,
            title: `Memory Test Game ${i}`,
            description: 'A'.repeat(1000) // Large description
          })
        );
      }

      await Promise.all(promises);

      // Clear data
      persistenceService.clear();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemoryUsage = process.memoryUsage();

      // Memory usage should not have grown excessively
      const memoryGrowth = finalMemoryUsage.heapUsed - initialMemoryUsage.heapUsed;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    });
  });
});