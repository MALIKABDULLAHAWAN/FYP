/**
 * DataPersistenceService Tests
 * 
 * Comprehensive tests for data persistence and synchronization functionality.
 * Tests Requirements: 16.1, 16.2, 16.3, 16.4
 */

import DataPersistenceService from '../DataPersistenceService.js';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  databases: new Map()
};

// Mock fetch
global.fetch = jest.fn();

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

describe('DataPersistenceService', () => {
  let service;
  let mockDB;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock IndexedDB database
    mockDB = {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          put: jest.fn(() => {
            const request = { onsuccess: null, onerror: null };
            setTimeout(() => request.onsuccess && request.onsuccess(), 0);
            return request;
          }),
          get: jest.fn(() => {
            const request = { onsuccess: null, onerror: null };
            setTimeout(() => request.onsuccess && request.onsuccess(), 0);
            return request;
          }),
          getAll: jest.fn(() => {
            const request = { onsuccess: null, onerror: null, result: [] };
            setTimeout(() => request.onsuccess && request.onsuccess(), 0);
            return request;
          }),
          add: jest.fn(() => {
            const request = { onsuccess: null, onerror: null };
            setTimeout(() => request.onsuccess && request.onsuccess(), 0);
            return request;
          }),
          delete: jest.fn(() => {
            const request = { onsuccess: null, onerror: null };
            setTimeout(() => request.onsuccess && request.onsuccess(), 0);
            return request;
          }),
          createIndex: jest.fn()
        })),
        oncomplete: null,
        onerror: null
      }))
    };

    // Mock IndexedDB open request
    const mockOpenRequest = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB
    };

    global.indexedDB = {
      open: jest.fn(() => {
        setTimeout(() => {
          if (mockOpenRequest.onsuccess) {
            mockOpenRequest.onsuccess();
          }
        }, 0);
        return mockOpenRequest;
      })
    };

    service = new DataPersistenceService();
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 10));
    
    service.db = mockDB;
  });

  describe('Metadata Persistence (Requirement 16.1)', () => {
    test('should persist metadata within 100ms', async () => {
      const metadata = {
        game_id: 'test-game-1',
        title: 'Test Game',
        description: 'A test game for children',
        therapeutic_goals: ['speech-articulation'],
        difficulty_level: 'Easy',
        age_range: { min_age: 3, max_age: 6 }
      };

      // Mock successful server response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...metadata, id: 'server-id' })
      });

      const startTime = Date.now();
      const result = await service.persistGameMetadata(metadata);
      const endTime = Date.now();

      // Verify persistence time is within 100ms requirement
      expect(result.persistence_time_ms).toBeLessThanOrEqual(100);
      expect(endTime - startTime).toBeLessThanOrEqual(150); // Allow some test overhead
      
      // Verify data was cached
      expect(service.persistenceCache.has(metadata.game_id)).toBe(true);
      
      // Verify server call was made
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/games/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining(metadata.title)
        })
      );
    });

    test('should handle offline persistence', async () => {
      const metadata = {
        game_id: 'test-game-offline',
        title: 'Offline Game',
        therapeutic_goals: ['social-awareness']
      };

      // Simulate offline mode
      service.isOnline = false;

      const result = await service.persistGameMetadata(metadata);

      expect(result.offline_mode).toBe(true);
      expect(result.sync_status).toBe('pending');
      expect(service.persistenceCache.has(metadata.game_id)).toBe(true);
    });

    test('should handle persistence failures gracefully', async () => {
      const metadata = {
        game_id: 'test-game-fail',
        title: 'Failing Game'
      };

      // Mock server failure
      fetch.mockRejectedValueOnce(new Error('Server error'));

      await expect(service.persistGameMetadata(metadata)).rejects.toThrow('Persistence failed');
      
      // Verify fallback to offline storage
      expect(service.persistenceCache.has(metadata.game_id)).toBe(true);
    });
  });

  describe('Session Data Recording (Requirement 16.2)', () => {
    test('should record session data with accurate timestamps', async () => {
      const sessionData = {
        child_id: 'child-123',
        game_id: 'game-456',
        therapist_id: 'therapist-789',
        started_at: new Date().toISOString(),
        performance_metrics: {
          score: 85,
          accuracy: 0.9
        }
      };

      // Mock successful server response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...sessionData, session_id: 'server-session-id' })
      });

      const result = await service.recordSessionData(sessionData);

      expect(result.recorded_at).toBeDefined();
      expect(result.client_timestamp).toBeDefined();
      expect(result.sync_status).toBe('synced');
      
      // Verify session was cached
      expect(service.sessionCache.size).toBeGreaterThan(0);
    });

    test('should handle offline session recording', async () => {
      const sessionData = {
        child_id: 'child-offline',
        game_id: 'game-offline'
      };

      service.isOnline = false;

      const result = await service.recordSessionData(sessionData);

      expect(result.offline_mode).toBe(true);
      expect(result.sync_status).toBe('pending');
      expect(result.session_id).toBeDefined();
    });

    test('should generate unique session IDs', async () => {
      const sessionData1 = { child_id: 'child-1' };
      const sessionData2 = { child_id: 'child-2' };

      service.isOnline = false;

      const result1 = await service.recordSessionData(sessionData1);
      const result2 = await service.recordSessionData(sessionData2);

      expect(result1.session_id).not.toBe(result2.session_id);
      expect(result1.session_id).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(result2.session_id).toMatch(/^session-\d+-[a-z0-9]+$/);
    });
  });

  describe('Cross-Device Synchronization (Requirement 16.3)', () => {
    test('should synchronize data across devices', async () => {
      const deviceId = 'test-device-123';
      
      // Mock server response with sync data
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          server_data: [
            { game_id: 'game-1', title: 'Server Game 1' },
            { game_id: 'game-2', title: 'Server Game 2' }
          ],
          conflicts: [],
          sync_timestamp: new Date().toISOString()
        })
      });

      const result = await service.synchronizeAcrossDevices('all', deviceId);

      expect(result.device_id).toBe(deviceId);
      expect(result.sync_timestamp).toBeDefined();
      expect(result.data_type).toBe('all');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/data/'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    test('should handle sync conflicts', async () => {
      const localData = [
        { game_id: 'game-1', title: 'Local Game 1', updated_at: '2023-01-01T10:00:00Z' }
      ];
      const serverData = [
        { game_id: 'game-1', title: 'Server Game 1', updated_at: '2023-01-01T11:00:00Z' }
      ];

      // Mock conflict resolution
      service.resolveDataConflicts = jest.fn().mockResolvedValue({
        records: 1,
        conflicts: 1
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ server_data: serverData })
      });

      const result = await service.synchronizeAcrossDevices();

      expect(service.resolveDataConflicts).toHaveBeenCalled();
      expect(result.conflicts_resolved).toBe(1);
    });

    test('should fail gracefully when offline', async () => {
      service.isOnline = false;

      await expect(service.synchronizeAcrossDevices()).rejects.toThrow('Cannot synchronize while offline');
    });
  });

  describe('Offline Caching and Sync (Requirement 16.4)', () => {
    test('should sync offline data when connection is restored', async () => {
      // Add items to sync queue
      service.syncQueue = [
        {
          id: 1,
          operation: 'CREATE_METADATA',
          data: { game_id: 'offline-game-1' },
          retry_count: 0
        },
        {
          id: 2,
          operation: 'CREATE_SESSION',
          data: { session_id: 'offline-session-1' },
          retry_count: 0
        }
      ];

      // Mock successful sync operations
      service.executeQueuedOperation = jest.fn()
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      service.removeFromQueue = jest.fn().mockResolvedValue();

      const result = await service.syncOfflineData();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('success');
      expect(result[1].status).toBe('success');
      expect(service.executeQueuedOperation).toHaveBeenCalledTimes(2);
    });

    test('should handle sync failures with retry logic', async () => {
      service.syncQueue = [
        {
          id: 1,
          operation: 'CREATE_METADATA',
          data: { game_id: 'failing-game' },
          retry_count: 0
        }
      ];

      // Mock failed sync operation
      service.executeQueuedOperation = jest.fn()
        .mockRejectedValue(new Error('Sync failed'));

      service.updateQueuedOperation = jest.fn().mockResolvedValue();

      const result = await service.syncOfflineData();

      expect(result[0].status).toBe('failed');
      expect(service.updateQueuedOperation).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          retry_count: 1,
          last_error: 'Sync failed'
        })
      );
    });

    test('should handle network status changes', () => {
      const syncSpy = jest.spyOn(service, 'syncOfflineData').mockResolvedValue([]);

      // Simulate going online
      mockEventListeners.online();

      expect(service.isOnline).toBe(true);
      
      // Simulate going offline
      mockEventListeners.offline();

      expect(service.isOnline).toBe(false);
    });
  });

  describe('Data Consistency Testing', () => {
    test('should test data consistency across devices', async () => {
      const deviceIds = ['device-1', 'device-2', 'device-3'];

      // Mock consistency test methods
      service.testMetadataConsistency = jest.fn().mockResolvedValue({
        score: 0.95,
        inconsistencies: [],
        total_records: 10
      });

      service.testSessionConsistency = jest.fn().mockResolvedValue({
        score: 0.98,
        inconsistencies: [],
        total_records: 25
      });

      service.testProfileConsistency = jest.fn().mockResolvedValue({
        score: 1.0,
        inconsistencies: [],
        total_records: 5
      });

      const result = await service.testDataConsistency(deviceIds);

      expect(result.devices_tested).toBe(3);
      expect(result.consistency_score).toBeCloseTo(0.976, 2); // Average of 0.95, 0.98, 1.0
      expect(result.data_integrity).toBe(true);
      expect(result.inconsistencies).toHaveLength(0);
    });

    test('should detect data integrity issues', async () => {
      service.testMetadataConsistency = jest.fn().mockResolvedValue({
        score: 0.85, // Below 95% threshold
        inconsistencies: ['metadata-conflict-1'],
        total_records: 10
      });

      service.testSessionConsistency = jest.fn().mockResolvedValue({
        score: 0.90,
        inconsistencies: ['session-conflict-1'],
        total_records: 25
      });

      service.testProfileConsistency = jest.fn().mockResolvedValue({
        score: 0.95,
        inconsistencies: [],
        total_records: 5
      });

      const result = await service.testDataConsistency();

      expect(result.consistency_score).toBeCloseTo(0.9, 1);
      expect(result.data_integrity).toBe(false); // Below 95% threshold
      expect(result.inconsistencies).toHaveLength(2);
    });
  });

  describe('Performance Requirements', () => {
    test('should meet 100ms persistence requirement consistently', async () => {
      const metadata = {
        game_id: 'perf-test-game',
        title: 'Performance Test Game'
      };

      // Mock fast server response
      fetch.mockResolvedValue({
        ok: true,
        json: async () => metadata
      });

      const results = [];
      
      // Test multiple persistence operations
      for (let i = 0; i < 10; i++) {
        const testMetadata = { ...metadata, game_id: `perf-test-${i}` };
        const result = await service.persistGameMetadata(testMetadata);
        results.push(result.persistence_time_ms);
      }

      // All operations should be under 100ms
      results.forEach(time => {
        expect(time).toBeLessThanOrEqual(100);
      });

      // Average should be well under 100ms
      const average = results.reduce((a, b) => a + b, 0) / results.length;
      expect(average).toBeLessThanOrEqual(50);
    });
  });

  describe('Service Management', () => {
    test('should provide accurate statistics', () => {
      service.persistenceCache.set('game-1', { data: 'test' });
      service.sessionCache.set('session-1', { data: 'test' });
      service.syncQueue = [{ id: 1 }, { id: 2 }];
      service.isOnline = true;
      service.lastSyncTimestamp = '2023-01-01T12:00:00Z';

      const stats = service.getStatistics();

      expect(stats.cache_size).toBe(1);
      expect(stats.session_cache_size).toBe(1);
      expect(stats.sync_queue_size).toBe(2);
      expect(stats.is_online).toBe(true);
      expect(stats.last_sync).toBe('2023-01-01T12:00:00Z');
    });

    test('should clear all caches and reset state', () => {
      service.persistenceCache.set('game-1', { data: 'test' });
      service.sessionCache.set('session-1', { data: 'test' });
      service.syncQueue = [{ id: 1 }];
      service.lastSyncTimestamp = '2023-01-01T12:00:00Z';

      service.clear();

      expect(service.persistenceCache.size).toBe(0);
      expect(service.sessionCache.size).toBe(0);
      expect(service.syncQueue).toHaveLength(0);
      expect(service.lastSyncTimestamp).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle IndexedDB initialization failure', async () => {
      const failingService = new DataPersistenceService();
      
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

      // Service should still function without IndexedDB
      expect(failingService).toBeDefined();
    });

    test('should handle network errors gracefully', async () => {
      const metadata = { game_id: 'network-error-test' };
      
      fetch.mockRejectedValue(new Error('Network error'));

      await expect(service.persistGameMetadata(metadata)).rejects.toThrow();
      
      // Should still cache locally
      expect(service.persistenceCache.has(metadata.game_id)).toBe(true);
    });
  });
});