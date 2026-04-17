/**
 * CrossDeviceSyncService
 * 
 * Handles cross-device data synchronization to ensure consistent data across all devices.
 * Implements conflict resolution, device identification, and real-time sync capabilities.
 * 
 * Requirements: 16.3 - Cross-device data synchronization
 */

import DataPersistenceService from './DataPersistenceService.js';

class CrossDeviceSyncService {
  constructor() {
    this.persistenceService = new DataPersistenceService();
    this.deviceId = this.generateDeviceId();
    this.syncInterval = null;
    this.lastSyncTimestamp = null;
    this.conflictResolutionStrategy = 'server_wins'; // 'server_wins', 'client_wins', 'merge'
    this.syncInProgress = false;
    this.syncListeners = [];
    
    // Initialize WebSocket for real-time sync (if available)
    this.initializeRealTimeSync();
    
    // Start periodic sync
    this.startPeriodicSync();
  }

  /**
   * Initialize real-time synchronization via WebSocket
   * @private
   */
  initializeRealTimeSync() {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/sync/';
      this.websocket = new WebSocket(`${wsUrl}${this.deviceId}/`);
      
      this.websocket.onopen = () => {
        console.log('Real-time sync connection established');
        this.sendDeviceRegistration();
      };
      
      this.websocket.onmessage = (event) => {
        this.handleRealTimeSyncMessage(JSON.parse(event.data));
      };
      
      this.websocket.onclose = () => {
        console.log('Real-time sync connection closed, attempting reconnect...');
        setTimeout(() => this.initializeRealTimeSync(), 5000);
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.warn('Real-time sync not available:', error.message);
    }
  }

  /**
   * Send device registration to server
   * @private
   */
  sendDeviceRegistration() {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'device_registration',
        device_id: this.deviceId,
        device_info: this.getDeviceInfo(),
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Handle real-time sync messages
   * @private
   */
  async handleRealTimeSyncMessage(message) {
    switch (message.type) {
      case 'data_update':
        await this.handleDataUpdate(message);
        break;
      case 'sync_request':
        await this.handleSyncRequest(message);
        break;
      case 'conflict_notification':
        await this.handleConflictNotification(message);
        break;
      default:
        console.log('Unknown sync message type:', message.type);
    }
  }

  /**
   * Synchronize all data across devices
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async synchronizeAllData(options = {}) {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return { status: 'in_progress' };
    }

    this.syncInProgress = true;
    const syncStartTime = Date.now();

    try {
      console.log('Starting cross-device synchronization');
      
      const syncResults = {
        sync_id: `sync-${Date.now()}-${this.deviceId}`,
        device_id: this.deviceId,
        started_at: new Date().toISOString(),
        data_types_synced: [],
        conflicts_resolved: 0,
        records_synced: 0,
        errors: []
      };

      // Sync game metadata
      try {
        const metadataResult = await this.syncGameMetadata(options);
        syncResults.data_types_synced.push('game_metadata');
        syncResults.conflicts_resolved += metadataResult.conflicts_resolved;
        syncResults.records_synced += metadataResult.records_synced;
      } catch (error) {
        syncResults.errors.push({ type: 'game_metadata', error: error.message });
      }

      // Sync session data
      try {
        const sessionResult = await this.syncSessionData(options);
        syncResults.data_types_synced.push('session_data');
        syncResults.conflicts_resolved += sessionResult.conflicts_resolved;
        syncResults.records_synced += sessionResult.records_synced;
      } catch (error) {
        syncResults.errors.push({ type: 'session_data', error: error.message });
      }

      // Sync child profiles
      try {
        const profileResult = await this.syncChildProfiles(options);
        syncResults.data_types_synced.push('child_profiles');
        syncResults.conflicts_resolved += profileResult.conflicts_resolved;
        syncResults.records_synced += profileResult.records_synced;
      } catch (error) {
        syncResults.errors.push({ type: 'child_profiles', error: error.message });
      }

      syncResults.completed_at = new Date().toISOString();
      syncResults.duration_ms = Date.now() - syncStartTime;
      syncResults.success = syncResults.errors.length === 0;

      this.lastSyncTimestamp = syncResults.completed_at;
      
      // Notify sync listeners
      this.notifySyncListeners('sync_completed', syncResults);
      
      console.log('Cross-device synchronization completed:', syncResults);
      
      return syncResults;
    } catch (error) {
      console.error('Cross-device synchronization failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync game metadata across devices
   * @private
   */
  async syncGameMetadata(options) {
    const apiUrl = `${this.persistenceService.apiBaseUrl}/games/sync/`;
    
    // Get local metadata changes since last sync
    const localChanges = await this.getLocalChanges('game_metadata', this.lastSyncTimestamp);
    
    const syncRequest = {
      device_id: this.deviceId,
      last_sync: this.lastSyncTimestamp,
      local_changes: localChanges,
      conflict_resolution: this.conflictResolutionStrategy
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.persistenceService.getAuthToken()}`
      },
      body: JSON.stringify(syncRequest)
    });

    if (!response.ok) {
      throw new Error(`Metadata sync failed: ${response.statusText}`);
    }

    const syncResult = await response.json();
    
    // Apply server changes locally
    await this.applyServerChanges('game_metadata', syncResult.server_changes);
    
    return {
      conflicts_resolved: syncResult.conflicts_resolved || 0,
      records_synced: syncResult.records_synced || 0
    };
  }

  /**
   * Sync session data across devices
   * @private
   */
  async syncSessionData(options) {
    const apiUrl = `${this.persistenceService.apiBaseUrl}/game-sessions/sync/`;
    
    // Get local session changes since last sync
    const localChanges = await this.getLocalChanges('session_data', this.lastSyncTimestamp);
    
    const syncRequest = {
      device_id: this.deviceId,
      last_sync: this.lastSyncTimestamp,
      local_changes: localChanges,
      conflict_resolution: this.conflictResolutionStrategy
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.persistenceService.getAuthToken()}`
      },
      body: JSON.stringify(syncRequest)
    });

    if (!response.ok) {
      throw new Error(`Session sync failed: ${response.statusText}`);
    }

    const syncResult = await response.json();
    
    // Apply server changes locally
    await this.applyServerChanges('session_data', syncResult.server_changes);
    
    return {
      conflicts_resolved: syncResult.conflicts_resolved || 0,
      records_synced: syncResult.records_synced || 0
    };
  }

  /**
   * Sync child profiles across devices
   * @private
   */
  async syncChildProfiles(options) {
    const apiUrl = `${this.persistenceService.apiBaseUrl}/child-profiles/sync/`;
    
    // Get local profile changes since last sync
    const localChanges = await this.getLocalChanges('child_profiles', this.lastSyncTimestamp);
    
    const syncRequest = {
      device_id: this.deviceId,
      last_sync: this.lastSyncTimestamp,
      local_changes: localChanges,
      conflict_resolution: this.conflictResolutionStrategy
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.persistenceService.getAuthToken()}`
      },
      body: JSON.stringify(syncRequest)
    });

    if (!response.ok) {
      throw new Error(`Profile sync failed: ${response.statusText}`);
    }

    const syncResult = await response.json();
    
    // Apply server changes locally
    await this.applyServerChanges('child_profiles', syncResult.server_changes);
    
    return {
      conflicts_resolved: syncResult.conflicts_resolved || 0,
      records_synced: syncResult.records_synced || 0
    };
  }

  /**
   * Get local changes since last sync
   * @private
   */
  async getLocalChanges(dataType, sinceTimestamp) {
    // This would query IndexedDB for changes since the timestamp
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Apply server changes locally
   * @private
   */
  async applyServerChanges(dataType, changes) {
    if (!changes || changes.length === 0) {
      return;
    }

    for (const change of changes) {
      try {
        await this.applyChange(dataType, change);
      } catch (error) {
        console.error(`Failed to apply change for ${dataType}:`, error);
      }
    }
  }

  /**
   * Apply a single change locally
   * @private
   */
  async applyChange(dataType, change) {
    switch (change.operation) {
      case 'CREATE':
      case 'UPDATE':
        await this.persistenceService.storeOffline(dataType, change.data);
        break;
      case 'DELETE':
        // Handle deletion
        break;
      default:
        console.warn(`Unknown change operation: ${change.operation}`);
    }
  }

  /**
   * Handle data update from real-time sync
   * @private
   */
  async handleDataUpdate(message) {
    if (message.device_id === this.deviceId) {
      // Ignore updates from this device
      return;
    }

    console.log('Received real-time data update:', message);
    
    try {
      await this.applyChange(message.data_type, {
        operation: message.operation,
        data: message.data
      });
      
      // Notify listeners
      this.notifySyncListeners('data_updated', {
        data_type: message.data_type,
        operation: message.operation,
        source_device: message.device_id
      });
    } catch (error) {
      console.error('Failed to apply real-time update:', error);
    }
  }

  /**
   * Handle sync request from another device
   * @private
   */
  async handleSyncRequest(message) {
    console.log('Received sync request from device:', message.device_id);
    
    // Trigger a sync if not already in progress
    if (!this.syncInProgress) {
      setTimeout(() => this.synchronizeAllData(), 1000);
    }
  }

  /**
   * Handle conflict notification
   * @private
   */
  async handleConflictNotification(message) {
    console.log('Received conflict notification:', message);
    
    // Notify listeners about the conflict
    this.notifySyncListeners('conflict_detected', {
      conflict_id: message.conflict_id,
      data_type: message.data_type,
      conflicting_devices: message.devices
    });
  }

  /**
   * Register a sync event listener
   * @param {Function} listener - Event listener function
   */
  addSyncListener(listener) {
    this.syncListeners.push(listener);
  }

  /**
   * Remove a sync event listener
   * @param {Function} listener - Event listener function
   */
  removeSyncListener(listener) {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  /**
   * Notify all sync listeners
   * @private
   */
  notifySyncListeners(eventType, data) {
    this.syncListeners.forEach(listener => {
      try {
        listener(eventType, data);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  /**
   * Start periodic synchronization
   * @private
   */
  startPeriodicSync() {
    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      if (!this.syncInProgress && navigator.onLine) {
        this.synchronizeAllData().catch(error => {
          console.error('Periodic sync failed:', error);
        });
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop periodic synchronization
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Generate unique device identifier
   * @private
   */
  generateDeviceId() {
    let deviceId = localStorage.getItem('dhyan_device_id');
    
    if (!deviceId) {
      // Generate device ID based on browser fingerprint and timestamp
      const fingerprint = this.generateBrowserFingerprint();
      const timestamp = Date.now();
      deviceId = `device-${fingerprint}-${timestamp}`;
      localStorage.setItem('dhyan_device_id', deviceId);
    }
    
    return deviceId;
  }

  /**
   * Generate browser fingerprint for device identification
   * @private
   */
  generateBrowserFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get device information
   * @private
   */
  getDeviceInfo() {
    return {
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone_offset: new Date().getTimezoneOffset(),
      online: navigator.onLine,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Set conflict resolution strategy
   * @param {string} strategy - 'server_wins', 'client_wins', or 'merge'
   */
  setConflictResolutionStrategy(strategy) {
    const validStrategies = ['server_wins', 'client_wins', 'merge'];
    if (validStrategies.includes(strategy)) {
      this.conflictResolutionStrategy = strategy;
    } else {
      throw new Error(`Invalid conflict resolution strategy: ${strategy}`);
    }
  }

  /**
   * Get sync status
   * @returns {Object} - Current sync status
   */
  getSyncStatus() {
    return {
      device_id: this.deviceId,
      last_sync: this.lastSyncTimestamp,
      sync_in_progress: this.syncInProgress,
      websocket_connected: this.websocket && this.websocket.readyState === WebSocket.OPEN,
      conflict_resolution_strategy: this.conflictResolutionStrategy,
      periodic_sync_active: this.syncInterval !== null
    };
  }

  /**
   * Force immediate synchronization
   * @returns {Promise<Object>} - Sync results
   */
  async forceSyncNow() {
    return await this.synchronizeAllData({ force: true });
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopPeriodicSync();
    
    if (this.websocket) {
      this.websocket.close();
    }
    
    this.syncListeners = [];
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      device_id: this.deviceId,
      last_sync: this.lastSyncTimestamp,
      sync_in_progress: this.syncInProgress,
      listeners_count: this.syncListeners.length,
      websocket_status: this.websocket ? this.websocket.readyState : 'not_connected',
      conflict_resolution_strategy: this.conflictResolutionStrategy
    };
  }
}

export default CrossDeviceSyncService;