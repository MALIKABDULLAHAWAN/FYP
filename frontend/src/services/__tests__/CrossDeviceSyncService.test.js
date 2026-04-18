/**
 * CrossDeviceSyncService Tests
 * 
 * Tests for cross-device data synchronization functionality.
 * Tests Requirement: 16.3 - Cross-device data synchronization
 */

import CrossDeviceSyncService from '../CrossDeviceSyncService.js';
import DataPersistenceService from '../DataPersistenceService.js';

// Mock DataPersistenceService
jest.mock('../DataPersistenceService.js');

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  readyState: 1, // OPEN
  send: jest.fn(),
  close: jest.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock canvas for fingerprinting
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  textBaseline: '',
  font: '',
  fillText: jest.fn(),
  toDataURL: jest.fn(() => 'mock-canvas-data')
}));

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'mock-canvas-data');

describe('CrossDeviceSyncService', () => {
  let service;
  let mockPersistenceService;
  let mockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPersistenceService = {
      apiBaseUrl: 'http://localhost:8000/api',
      getAuthToken: jest.fn().mockReturnValue('mock-token'),
      storeOffline: jest.fn().mockResolvedValue()
    };
    
    DataPersistenceService.mockImplementation(() => mockPersistenceService);
    
    mockWebSocket = {
      readyState: 1,
      send: jest.fn(),
      close: jest.fn(),
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null
    };
    
    global.WebSocket.mockImplementation(() => mockWebSocket);
    
    // Mock localStorage for device ID
    mockLocalStorage.getItem.mockReturnValue(null);
    
    service = new CrossDeviceSyncService();
    service.websocket = mockWebSocket;
  });

  describe('Device Identification', () => {
    test('should generate unique device ID', () => {
      expect(service.deviceId).toBeDefined();
      expect(service.deviceId).toMatch(/^device-[a-z0-9]+-\d+$/);
    });

    test('should reuse existing device ID from localStorage', () => {
      const existingDeviceId = 'device-existing-123';
      mockLocalStorage.getItem.mockReturnValue(existingDeviceId);
      
      const newService = new CrossDeviceSyncService();
      
      expect(newService.deviceId).toBe(existingDeviceId);
    });

    test('should generate browser fingerprint', () => {
      const fingerprint = service.generateBrowserFingerprint();
      
      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
    });

    test('should get device information', () => {
      const deviceInfo = service.getDeviceInfo();
      
      expect(deviceInfo.user_agent).toBeDefined();
      expect(deviceInfo.language).toBeDefined();
      expect(deviceInfo.screen_resolution).toBeDefined();
      expect(deviceInfo.timezone_offset).toBeDefined();
      expect(deviceInfo.online).toBeDefined();
      expect(deviceInfo.timestamp).toBeDefined();
    });
  });

  describe('WebSocket Real-Time Sync', () => {
    test('should initialize WebSocket connection', () => {
      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining(service.deviceId)
      );
    });

    test('should send device registration on connection open', () => {
      // Simulate WebSocket open event
      mockWebSocket.onopen();
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'device_registration',
          device_id: service.deviceId,
          device_info: expect.any(Object),
          timestamp: expect.any(String)
        })
      );
    });

    test('should handle data update messages', async () => {
      const updateMessage = {
        type: 'data_update',
        device_id: 'other-device-123',
        data_type: 'game_metadata',
        operation: 'CREATE',
        data: { game_id: 'new-game', title: 'New Game' }
      };

      const listenerSpy = jest.fn();
      service.addSyncListener(listenerSpy);

      await service.handleDataUpdate(updateMessage);

      expect(mockPersistenceService.storeOffline).toHaveBeenCalledWith(
        'game_metadata',
        updateMessage.data
      );
      
      expect(listenerSpy).toHaveBeenCalledWith(
        'data_updated',
        expect.objectContaining({
          data_type: 'game_metadata',
          operation: 'CREATE',
          source_device: 'other-device-123'
        })
      );
    });

    test('should ignore updates from same device', async () => {
      const updateMessage = {
        type: 'data_update',
        device_id: service.deviceId, // Same device
        data_type: 'game_metadata',
        operation: 'CREATE',
        data: { game_id: 'new-game' }
      };

      await service.handleDataUpdate(updateMessage);

      expect(mockPersistenceService.storeOffline).not.toHaveBeenCalled();
    });

    test('should handle sync request messages', async () => {
      const syncSpy = jest.spyOn(service, 'synchronizeAllData').mockResolvedValue({});
      
      const syncRequestMessage = {
        type: 'sync_request',
        device_id: 'other-device-123'
      };

      await service.handleSyncRequest(syncRequestMessage);

      // Should trigger sync after delay
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(syncSpy).toHaveBeenCalled();
    });

    test('should handle conflict notifications', async () => {
      const listenerSpy = jest.fn();
      service.addSyncListener(listenerSpy);

      const conflictMessage = {
        type: 'conflict_notification',
        conflict_id: 'conflict-123',
        data_type: 'game_metadata',
        devices: ['device-1', 'device-2']
      };

      await service.handleConflictNotification(conflictMessage);

      expect(listenerSpy).toHaveBeenCalledWith(
        'conflict_detected',
        expect.objectContaining({
          conflict_id: 'conflict-123',
          data_type: 'game_metadata',
          conflicting_devices: ['device-1', 'device-2']
        })
      );
    });
  });

  describe('Data Synchronization', () => {
    test('should synchronize all data types', async () => {
      // Mock successful sync responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            server_changes: [],
            conflicts_resolved: 1,
            records_synced: 5
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            server_changes: [],
            conflicts_resolved: 0,
            records_synced: 3
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            server_changes: [],
            conflicts_resolved: 2,
            records_synced: 1
          })
        });

      // Mock helper methods
      service.getLocalChanges = jest.fn().mockResolvedValue([]);
      service.applyServerChanges = jest.fn().mockResolvedValue();

      const result = await service.synchronizeAllData();

      expect(result.sync_id).toBeDefined();
      expect(result.device_id).toBe(service.deviceId);
      expect(result.started_at).toBeDefined();
      expect(result.completed_at).toBeDefined();
      expect(result.data_types_synced).toEqual(['game_metadata', 'session_data', 'child_profiles']);
      expect(result.conflicts_resolved).toBe(3); // 1 + 0 + 2
      expect(result.records_synced).toBe(9); // 5 + 3 + 1
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Verify API calls were made
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/games/sync/',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    test('should handle sync failures gracefully', async () => {
      // Mock one successful and one failed sync
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ server_changes: [], conflicts_resolved: 0, records_synced: 1 })
        })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ server_changes: [], conflicts_resolved: 0, records_synced: 2 })
        });

      service.getLocalChanges = jest.fn().mockResolvedValue([]);
      service.applyServerChanges = jest.fn().mockResolvedValue();

      const result = await service.synchronizeAllData();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        type: 'session_data',
        error: 'Network error'
      });
      expect(result.data_types_synced).toEqual(['game_metadata', 'child_profiles']);
    });

    test('should prevent concurrent sync operations', async () => {
      service.syncInProgress = true;

      const result = await service.synchronizeAllData();

      expect(result.status).toBe('in_progress');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should sync specific data types', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ server_changes: [], conflicts_resolved: 0, records_synced: 1 })
      });

      service.getLocalChanges = jest.fn().mockResolvedValue([]);
      service.applyServerChanges = jest.fn().mockResolvedValue();

      await service.syncGameMetadata();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/games/sync/',
        expect.objectContaining({ method: 'POST' })
      );

      expect(service.getLocalChanges).toHaveBeenCalledWith('game_metadata', service.lastSyncTimestamp);
    });
  });

  describe('Conflict Resolution', () => {
    test('should set conflict resolution strategy', () => {
      service.setConflictResolutionStrategy('client_wins');
      expect(service.conflictResolutionStrategy).toBe('client_wins');

      service.setConflictResolutionStrategy('merge');
      expect(service.conflictResolutionStrategy).toBe('merge');
    });

    test('should reject invalid conflict resolution strategy', () => {
      expect(() => {
        service.setConflictResolutionStrategy('invalid_strategy');
      }).toThrow('Invalid conflict resolution strategy: invalid_strategy');
    });

    test('should apply server changes with different operations', async () => {
      const changes = [
        { operation: 'CREATE', data: { game_id: 'new-game' } },
        { operation: 'UPDATE', data: { game_id: 'existing-game' } },
        { operation: 'DELETE', data: { game_id: 'deleted-game' } }
      ];

      await service.applyServerChanges('game_metadata', changes);

      expect(mockPersistenceService.storeOffline).toHaveBeenCalledTimes(2); // CREATE and UPDATE
    });
  });

  describe('Sync Listeners', () => {
    test('should add and remove sync listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      service.addSyncListener(listener1);
      service.addSyncListener(listener2);

      expect(service.syncListeners).toHaveLength(2);

      service.removeSyncListener(listener1);

      expect(service.syncListeners).toHaveLength(1);
      expect(service.syncListeners).toContain(listener2);
    });

    test('should notify sync listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      service.addSyncListener(listener1);
      service.addSyncListener(listener2);

      const eventData = { test: 'data' };
      service.notifySyncListeners('test_event', eventData);

      expect(listener1).toHaveBeenCalledWith('test_event', eventData);
      expect(listener2).toHaveBeenCalledWith('test_event', eventData);
    });

    test('should handle listener errors gracefully', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      service.addSyncListener(errorListener);
      service.addSyncListener(goodListener);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.notifySyncListeners('test_event', {});

      expect(consoleSpy).toHaveBeenCalledWith('Sync listener error:', expect.any(Error));
      expect(goodListener).toHaveBeenCalled(); // Should still call other listeners

      consoleSpy.mockRestore();
    });
  });

  describe('Periodic Sync', () => {
    test('should start periodic sync', () => {
      expect(service.syncInterval).toBeDefined();
    });

    test('should stop periodic sync', () => {
      const intervalId = service.syncInterval;
      service.stopPeriodicSync();

      expect(service.syncInterval).toBeNull();
    });
  });

  describe('Service Status and Management', () => {
    test('should get sync status', () => {
      service.lastSyncTimestamp = '2023-01-01T12:00:00Z';
      service.syncInProgress = false;
      service.conflictResolutionStrategy = 'server_wins';

      const status = service.getSyncStatus();

      expect(status.device_id).toBe(service.deviceId);
      expect(status.last_sync).toBe('2023-01-01T12:00:00Z');
      expect(status.sync_in_progress).toBe(false);
      expect(status.websocket_connected).toBe(true);
      expect(status.conflict_resolution_strategy).toBe('server_wins');
      expect(status.periodic_sync_active).toBe(true);
    });

    test('should force immediate sync', async () => {
      const syncSpy = jest.spyOn(service, 'synchronizeAllData').mockResolvedValue({ success: true });

      const result = await service.forceSyncNow();

      expect(syncSpy).toHaveBeenCalledWith({ force: true });
      expect(result.success).toBe(true);
    });

    test('should get service statistics', () => {
      service.lastSyncTimestamp = '2023-01-01T12:00:00Z';
      service.syncInProgress = false;
      service.addSyncListener(jest.fn());
      service.addSyncListener(jest.fn());

      const stats = service.getStatistics();

      expect(stats.device_id).toBe(service.deviceId);
      expect(stats.last_sync).toBe('2023-01-01T12:00:00Z');
      expect(stats.sync_in_progress).toBe(false);
      expect(stats.listeners_count).toBe(2);
      expect(stats.websocket_status).toBe(1); // WebSocket.OPEN
      expect(stats.conflict_resolution_strategy).toBe('server_wins');
    });

    test('should cleanup resources', () => {
      service.addSyncListener(jest.fn());
      service.addSyncListener(jest.fn());

      service.cleanup();

      expect(service.syncInterval).toBeNull();
      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(service.syncListeners).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle WebSocket initialization failure', () => {
      global.WebSocket.mockImplementation(() => {
        throw new Error('WebSocket not supported');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      new CrossDeviceSyncService();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Real-time sync not available:',
        'WebSocket not supported'
      );

      consoleSpy.mockRestore();
    });

    test('should handle WebSocket connection errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate WebSocket error
      mockWebSocket.onerror(new Error('Connection failed'));

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    test('should handle WebSocket reconnection', () => {
      const initSpy = jest.spyOn(service, 'initializeRealTimeSync');

      // Simulate WebSocket close
      mockWebSocket.onclose();

      // Wait for reconnection timeout
      setTimeout(() => {
        expect(initSpy).toHaveBeenCalled();
      }, 5100);
    });

    test('should handle sync API failures', async () => {
      fetch.mockRejectedValue(new Error('API unavailable'));

      service.getLocalChanges = jest.fn().mockResolvedValue([]);

      await expect(service.syncGameMetadata()).rejects.toThrow('Metadata sync failed');
    });

    test('should handle malformed sync messages', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.handleRealTimeSyncMessage({ type: 'unknown_type' });

      expect(consoleSpy).toHaveBeenCalledWith('Unknown sync message type:', 'unknown_type');

      consoleSpy.mockRestore();
    });
  });
});