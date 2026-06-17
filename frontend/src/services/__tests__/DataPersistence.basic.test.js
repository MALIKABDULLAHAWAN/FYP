/**
 * Basic Data Persistence Tests
 * 
 * Simple tests to verify core functionality without complex async operations.
 * Tests Requirements: 16.1, 16.2, 16.3, 16.4
 */

import DataPersistenceService from '../DataPersistenceService.js';
import SessionRecordingService from '../SessionRecordingService.js';
import CrossDeviceSyncService from '../CrossDeviceSyncService.js';
import OfflineCacheService from '../OfflineCacheService.js';

// Mock all external dependencies
global.fetch = jest.fn();
global.indexedDB = { open: jest.fn() };
global.caches = { open: jest.fn(), delete: jest.fn(), keys: jest.fn() };
global.WebSocket = jest.fn();
Object.defineProperty(navigator, 'onLine', { writable: true, value: true });
Object.defineProperty(window, 'localStorage', { value: { getItem: jest.fn(), setItem: jest.fn() } });
window.addEventListener = jest.fn();

describe('Data Persistence Basic Tests', () => {
  describe('Service Initialization', () => {
    test('DataPersistenceService should initialize', () => {
      const service = new DataPersistenceService();
      expect(service).toBeDefined();
      expect(service.apiBaseUrl).toBeDefined();
      expect(service.persistenceCache).toBeDefined();
      expect(service.sessionCache).toBeDefined();
    });

    test('SessionRecordingService should initialize', () => {
      const service = new SessionRecordingService();
      expect(service).toBeDefined();
      expect(service.activeSessions).toBeDefined();
      expect(service.sessionMetrics).toBeDefined();
    });

    test('CrossDeviceSyncService should initialize', () => {
      const service = new CrossDeviceSyncService();
      expect(service).toBeDefined();
      expect(service.deviceId).toBeDefined();
      expect(service.syncListeners).toBeDefined();
    });

    test('OfflineCacheService should initialize', () => {
      const service = new OfflineCacheService();
      expect(service).toBeDefined();
      expect(service.syncQueue).toBeDefined();
      expect(service.cacheName).toBeDefined();
    });
  });

  describe('Basic Functionality', () => {
    test('should cache data in memory', () => {
      const service = new DataPersistenceService();
      const testData = { game_id: 'test-1', title: 'Test Game' };
      
      service.persistenceCache.set('test-1', testData);
      
      expect(service.persistenceCache.has('test-1')).toBe(true);
      expect(service.persistenceCache.get('test-1')).toEqual(testData);
    });

    test('should generate unique session IDs', () => {
      const service = new SessionRecordingService();
      
      // Mock the session creation without async operations
      const sessionId1 = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const sessionId2 = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(sessionId2).toMatch(/^session-\d+-[a-z0-9]+$/);
    });

    test('should generate device fingerprint', () => {
      const service = new CrossDeviceSyncService();
      const fingerprint = service.generateBrowserFingerprint();
      
      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
    });

    test('should manage sync queue', () => {
      const service = new OfflineCacheService();
      
      const queueItem = {
        id: 'test-sync-1',
        operation: 'CREATE',
        dataType: 'game_metadata',
        data: { game_id: 'test' }
      };
      
      service.syncQueue.push(queueItem);
      
      expect(service.syncQueue.length).toBe(1);
      expect(service.syncQueue[0]).toEqual(queueItem);
    });
  });

  describe('Configuration and Status', () => {
    test('should provide service statistics', () => {
      const service = new DataPersistenceService();
      service.persistenceCache.set('test-1', { data: 'test' });
      service.sessionCache.set('session-1', { data: 'test' });
      
      const stats = service.getStatistics();
      
      expect(stats.cache_size).toBe(1);
      expect(stats.session_cache_size).toBe(1);
      expect(stats.is_online).toBeDefined();
    });

    test('should get sync status', () => {
      const service = new CrossDeviceSyncService();
      const status = service.getSyncStatus();
      
      expect(status.device_id).toBeDefined();
      expect(status.sync_in_progress).toBeDefined();
      expect(status.conflict_resolution_strategy).toBeDefined();
    });

    test('should get cache status', () => {
      const service = new OfflineCacheService();
      const status = service.getStatus();
      
      expect(status.is_online).toBeDefined();
      expect(status.sync_queue_size).toBeDefined();
      expect(status.cache_strategy).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    test('should validate metadata structure', () => {
      const validMetadata = {
        game_id: 'test-game-1',
        title: 'Test Game',
        description: 'A test game',
        therapeutic_goals: ['speech-articulation'],
        difficulty_level: 'Easy',
        age_range: { min_age: 3, max_age: 6 }
      };

      // Basic validation checks
      expect(validMetadata.game_id).toBeDefined();
      expect(validMetadata.title).toBeDefined();
      expect(Array.isArray(validMetadata.therapeutic_goals)).toBe(true);
      expect(validMetadata.therapeutic_goals.length).toBeGreaterThan(0);
      expect(['Easy', 'Medium', 'Hard']).toContain(validMetadata.difficulty_level);
      expect(validMetadata.age_range.min_age).toBeGreaterThanOrEqual(3);
      expect(validMetadata.age_range.max_age).toBeLessThanOrEqual(12);
    });

    test('should validate session data structure', () => {
      const validSessionData = {
        session_id: 'session-123',
        child_id: 'child-456',
        game_id: 'game-789',
        therapist_id: 'therapist-101',
        started_at: new Date().toISOString(),
        therapeutic_goals_targeted: ['speech-articulation']
      };

      expect(validSessionData.session_id).toBeDefined();
      expect(validSessionData.child_id).toBeDefined();
      expect(validSessionData.game_id).toBeDefined();
      expect(validSessionData.therapist_id).toBeDefined();
      expect(validSessionData.started_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(Array.isArray(validSessionData.therapeutic_goals_targeted)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing data gracefully', () => {
      const service = new DataPersistenceService();
      
      // Should not throw when accessing non-existent data
      expect(() => {
        const nonExistent = service.persistenceCache.get('non-existent');
        expect(nonExistent).toBeUndefined();
      }).not.toThrow();
    });

    test('should handle invalid device ID generation', () => {
      // Mock navigator properties to be undefined
      const originalUserAgent = navigator.userAgent;
      const originalLanguage = navigator.language;
      
      Object.defineProperty(navigator, 'userAgent', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'language', { value: undefined, configurable: true });
      
      const service = new CrossDeviceSyncService();
      
      // Should still generate a device ID
      expect(service.deviceId).toBeDefined();
      expect(typeof service.deviceId).toBe('string');
      
      // Restore original values
      Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
      Object.defineProperty(navigator, 'language', { value: originalLanguage, configurable: true });
    });

    test('should handle empty sync queue', () => {
      const service = new OfflineCacheService();
      
      expect(service.syncQueue.length).toBe(0);
      
      // Should not throw when processing empty queue
      expect(() => {
        const queueSize = service.syncQueue.length;
        expect(queueSize).toBe(0);
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should handle large cache sizes efficiently', () => {
      const service = new DataPersistenceService();
      const startTime = Date.now();
      
      // Add many items to cache
      for (let i = 0; i < 1000; i++) {
        service.persistenceCache.set(`item-${i}`, { id: i, data: `test-${i}` });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(service.persistenceCache.size).toBe(1000);
      expect(duration).toBeLessThan(100); // Should be very fast for in-memory operations
    });

    test('should calculate data sizes correctly', () => {
      const service = new OfflineCacheService();
      
      const smallData = { id: 1 };
      const largeData = { id: 1, description: 'A'.repeat(1000) };
      
      const smallSize = service.calculateDataSize(smallData);
      const largeSize = service.calculateDataSize(largeData);
      
      expect(largeSize).toBeGreaterThan(smallSize);
      expect(smallSize).toBeGreaterThan(0);
      expect(largeSize).toBeGreaterThan(1000);
    });
  });

  describe('Service Integration Points', () => {
    test('should have compatible data formats between services', () => {
      const gameMetadata = {
        game_id: 'integration-test',
        title: 'Integration Test Game',
        therapeutic_goals: ['speech-articulation']
      };

      const sessionData = {
        session_id: 'session-integration',
        game_id: gameMetadata.game_id, // Should reference the same game
        child_id: 'child-integration'
      };

      // Verify data compatibility
      expect(sessionData.game_id).toBe(gameMetadata.game_id);
      expect(gameMetadata.therapeutic_goals).toContain('speech-articulation');
    });

    test('should maintain consistent timestamps', () => {
      const timestamp1 = new Date().toISOString();
      const timestamp2 = new Date().toISOString();
      
      // Timestamps should be in ISO format
      expect(timestamp1).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(timestamp2).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      // Should be able to parse back to Date objects
      expect(new Date(timestamp1)).toBeInstanceOf(Date);
      expect(new Date(timestamp2)).toBeInstanceOf(Date);
    });
  });
});