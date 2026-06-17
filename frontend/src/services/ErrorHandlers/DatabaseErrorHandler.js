/**
 * DatabaseErrorHandler - Handles database connection failures with offline mode
 * 
 * Provides comprehensive error handling for:
 * - Database connection failures
 * - Query timeout errors
 * - Data synchronization issues
 * - Offline mode with local caching
 * - Automatic reconnection attempts
 * 
 * Requirements: 5.4, 5.5
 */

class DatabaseErrorHandler {
  constructor() {
    this.connectionLog = [];
    this.offlineMode = false;
    this.offlineQueue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // Start with 5 seconds
    this.maxReconnectDelay = 300000; // Max 5 minutes
    this.lastSuccessfulConnection = null;
    this.offlineCache = new Map();
    this.syncQueue = [];
    this.connectionStatus = 'unknown';
  }

  /**
   * Handle database connection failure
   * 
   * @param {Error} error - Connection error
   * @param {string} operation - Operation that failed
   * @param {Object} context - Additional context
   * @returns {Object} Error handling result
   */
  handleConnectionFailure(error, operation = 'unknown', context = {}) {
    const failureId = this.generateFailureId();
    const timestamp = new Date().toISOString();

    // Log the connection failure
    this.logConnectionError({
      failureId,
      error: error.message,
      operation,
      context,
      timestamp,
      severity: 'high',
      reconnectAttempt: this.reconnectAttempts
    });

    // Enter offline mode if not already
    if (!this.offlineMode) {
      this.enterOfflineMode(error, operation);
    }

    // Schedule reconnection attempt
    this.scheduleReconnection();

    // Return offline mode response
    return {
      success: false,
      offlineMode: true,
      failureId,
      operation,
      userMessage: this.generateOfflineMessage(operation),
      cachedDataAvailable: this.hasCachedData(operation, context),
      queuedForSync: this.queueOperation(operation, context),
      reconnectScheduled: true,
      nextReconnectIn: this.getNextReconnectDelay(),
      timestamp
    };
  }

  /**
   * Handle query timeout error
   */
  handleQueryTimeout(query, timeout, context = {}) {
    const failureId = this.generateFailureId();
    const timestamp = new Date().toISOString();

    this.logConnectionError({
      failureId,
      type: 'query-timeout',
      query: query.substring(0, 100), // Log first 100 chars
      timeout,
      context,
      timestamp,
      severity: 'medium'
    });

    // Check if we should enter offline mode
    const recentTimeouts = this.getRecentTimeouts(5); // Last 5 minutes
    if (recentTimeouts.length >= 3) {
      return this.handleConnectionFailure(
        new Error('Multiple query timeouts detected'),
        'query-timeout',
        { query, timeout, ...context }
      );
    }

    return {
      success: false,
      timeout: true,
      failureId,
      query: query.substring(0, 50) + '...',
      userMessage: 'Database is responding slowly. Please try again.',
      canRetry: true,
      retryRecommendation: 'Wait a few seconds and try again',
      timestamp
    };
  }

  /**
   * Handle data synchronization error
   */
  handleSyncError(syncData, error, context = {}) {
    const failureId = this.generateFailureId();
    const timestamp = new Date().toISOString();

    this.logConnectionError({
      failureId,
      type: 'sync-error',
      error: error.message,
      syncDataType: typeof syncData,
      context,
      timestamp,
      severity: 'medium'
    });

    // Add to sync queue for retry
    this.syncQueue.push({
      id: failureId,
      data: syncData,
      context,
      timestamp,
      attempts: 0,
      maxAttempts: 3
    });

    return {
      success: false,
      syncError: true,
      failureId,
      queuedForRetry: true,
      userMessage: 'Data will be synchronized when connection is restored',
      timestamp
    };
  }

  /**
   * Enter offline mode
   */
  enterOfflineMode(error, operation) {
    if (!this.offlineMode) {
      this.offlineMode = true;
      this.connectionStatus = 'offline';
      
      const timestamp = new Date().toISOString();
      
      this.logConnectionError({
        failureId: this.generateFailureId(),
        type: 'offline-mode-entered',
        trigger: operation,
        error: error.message,
        timestamp,
        severity: 'high'
      });

      // Notify user about offline mode
      this.notifyOfflineMode();
    }
  }

  /**
   * Exit offline mode
   */
  exitOfflineMode() {
    if (this.offlineMode) {
      this.offlineMode = false;
      this.connectionStatus = 'online';
      this.reconnectAttempts = 0;
      this.lastSuccessfulConnection = new Date().toISOString();
      
      this.logConnectionError({
        failureId: this.generateFailureId(),
        type: 'offline-mode-exited',
        timestamp: new Date().toISOString(),
        severity: 'low'
      });

      // Start syncing queued operations
      this.processSyncQueue();
      
      // Notify user about reconnection
      this.notifyReconnection();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logConnectionError({
        failureId: this.generateFailureId(),
        type: 'max-reconnect-attempts-reached',
        attempts: this.reconnectAttempts,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      });
      return;
    }

    const delay = this.getNextReconnectDelay();
    
    setTimeout(async () => {
      try {
        this.reconnectAttempts++;
        
        // Test connection
        const connected = await this.testConnection();
        
        if (connected) {
          this.exitOfflineMode();
        } else {
          // Schedule next attempt
          this.scheduleReconnection();
        }
      } catch (error) {
        // Reconnection failed, schedule next attempt
        this.scheduleReconnection();
      }
    }, delay);
  }

  /**
   * Get next reconnection delay (exponential backoff)
   */
  getNextReconnectDelay() {
    const baseDelay = this.reconnectDelay;
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts);
    const jitteredDelay = exponentialDelay + (Math.random() * 1000); // Add jitter
    
    return Math.min(jitteredDelay, this.maxReconnectDelay);
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      // In a real implementation, this would ping the database
      // For now, we'll simulate a connection test
      const response = await fetch('/api/health', {
        method: 'HEAD',
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Queue operation for offline processing
   */
  queueOperation(operation, context) {
    const queueItem = {
      id: this.generateFailureId(),
      operation,
      context,
      timestamp: new Date().toISOString(),
      status: 'queued'
    };

    this.offlineQueue.push(queueItem);
    
    // Keep queue size manageable
    if (this.offlineQueue.length > 100) {
      this.offlineQueue = this.offlineQueue.slice(-50);
    }

    return queueItem.id;
  }

  /**
   * Process sync queue when connection is restored
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    const itemsToSync = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of itemsToSync) {
      try {
        // Attempt to sync the item
        await this.syncItem(item);
        
        this.logConnectionError({
          failureId: this.generateFailureId(),
          type: 'sync-success',
          itemId: item.id,
          timestamp: new Date().toISOString(),
          severity: 'low'
        });
      } catch (error) {
        // Sync failed, check if we should retry
        item.attempts++;
        
        if (item.attempts < item.maxAttempts) {
          this.syncQueue.push(item);
        } else {
          this.logConnectionError({
            failureId: this.generateFailureId(),
            type: 'sync-failed-permanently',
            itemId: item.id,
            error: error.message,
            timestamp: new Date().toISOString(),
            severity: 'high'
          });
        }
      }
    }
  }

  /**
   * Sync individual item
   */
  async syncItem(item) {
    // In a real implementation, this would sync the specific data
    // For now, we'll simulate the sync operation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Sync failed'));
        }
      }, 100);
    });
  }

  /**
   * Check if cached data is available for operation
   */
  hasCachedData(operation, context) {
    const cacheKey = this.generateCacheKey(operation, context);
    return this.offlineCache.has(cacheKey);
  }

  /**
   * Get cached data for operation
   */
  getCachedData(operation, context) {
    const cacheKey = this.generateCacheKey(operation, context);
    const cached = this.offlineCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return {
        success: true,
        data: cached.data,
        cached: true,
        cacheAge: Date.now() - cached.timestamp,
        userMessage: 'Showing cached data (offline mode)'
      };
    }

    return {
      success: false,
      cached: false,
      userMessage: 'No cached data available for this operation'
    };
  }

  /**
   * Cache data for offline use
   */
  cacheData(operation, context, data) {
    const cacheKey = this.generateCacheKey(operation, context);
    
    this.offlineCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      operation,
      context
    });

    // Keep cache size manageable
    if (this.offlineCache.size > 100) {
      const oldestKey = this.offlineCache.keys().next().value;
      this.offlineCache.delete(oldestKey);
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(operation, context) {
    const contextStr = JSON.stringify(context);
    return `${operation}-${btoa(contextStr).substring(0, 20)}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cached) {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    return (Date.now() - cached.timestamp) < maxAge;
  }

  /**
   * Generate offline message for user
   */
  generateOfflineMessage(operation) {
    const messages = {
      'game-metadata': 'Working offline - game information may be limited',
      'session-save': 'Session data will be saved when connection is restored',
      'image-load': 'Using cached images - some images may not be available',
      'user-auth': 'Authentication will be verified when connection is restored',
      'unknown': 'Working offline - changes will sync when connected'
    };

    return messages[operation] || messages.unknown;
  }

  /**
   * Notify user about offline mode
   */
  notifyOfflineMode() {
    // In a real implementation, this would show a toast or notification
    console.log('🔌 Working offline - changes will sync when connection is restored');
  }

  /**
   * Notify user about reconnection
   */
  notifyReconnection() {
    // In a real implementation, this would show a toast or notification
    console.log('✅ Connection restored - syncing data...');
  }

  /**
   * Get recent timeout errors
   */
  getRecentTimeouts(minutes = 5) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.connectionLog.filter(entry => 
      entry.type === 'query-timeout' && new Date(entry.timestamp) > cutoff
    );
  }

  /**
   * Generate failure ID
   */
  generateFailureId() {
    return `db_fail_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Log connection error
   */
  logConnectionError(errorData) {
    this.connectionLog.push({
      ...errorData,
      id: errorData.failureId || this.generateFailureId()
    });

    // Keep log size manageable
    if (this.connectionLog.length > 500) {
      this.connectionLog = this.connectionLog.slice(-250);
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStatistics() {
    const stats = {
      currentStatus: this.connectionStatus,
      offlineMode: this.offlineMode,
      reconnectAttempts: this.reconnectAttempts,
      lastSuccessfulConnection: this.lastSuccessfulConnection,
      queuedOperations: this.offlineQueue.length,
      pendingSyncs: this.syncQueue.length,
      cachedItems: this.offlineCache.size,
      totalErrors: 0,
      byType: {},
      bySeverity: {}
    };

    this.connectionLog.forEach(entry => {
      if (entry.type !== 'offline-mode-exited' && entry.type !== 'sync-success') {
        stats.totalErrors++;
        stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
        stats.bySeverity[entry.severity] = (stats.bySeverity[entry.severity] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Get system health status
   */
  getSystemHealth() {
    const stats = this.getConnectionStatistics();
    const recentErrors = this.getRecentErrors(30); // Last 30 minutes
    
    let healthStatus = 'healthy';
    let healthScore = 100;

    if (this.offlineMode) {
      healthStatus = 'offline';
      healthScore = 20;
    } else if (recentErrors.length > 5) {
      healthStatus = 'unstable';
      healthScore = 40;
    } else if (recentErrors.length > 2) {
      healthStatus = 'warning';
      healthScore = 70;
    }

    return {
      status: healthStatus,
      score: healthScore,
      offlineMode: this.offlineMode,
      recentErrors: recentErrors.length,
      queuedOperations: stats.queuedOperations,
      recommendation: this.getHealthRecommendation(healthStatus)
    };
  }

  /**
   * Get health recommendation
   */
  getHealthRecommendation(healthStatus) {
    const recommendations = {
      healthy: 'Database connection is stable',
      warning: 'Some connection issues detected, monitoring recommended',
      unstable: 'Frequent connection issues, check network connectivity',
      offline: 'Working offline - check internet connection and database availability'
    };

    return recommendations[healthStatus] || 'Unknown status';
  }

  /**
   * Force offline mode for testing
   */
  forceOfflineMode(enabled = true) {
    if (enabled && !this.offlineMode) {
      this.enterOfflineMode(new Error('Forced offline mode'), 'testing');
    } else if (!enabled && this.offlineMode) {
      this.exitOfflineMode();
    }
  }

  /**
   * Clear logs and reset system
   */
  clearLogs() {
    this.connectionLog = [];
    this.offlineQueue = [];
    this.syncQueue = [];
    this.offlineCache.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(minutes = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.connectionLog.filter(entry => 
      new Date(entry.timestamp) > cutoff && 
      entry.type !== 'offline-mode-exited' && 
      entry.type !== 'sync-success'
    );
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus() {
    return {
      queueLength: this.offlineQueue.length,
      oldestItem: this.offlineQueue.length > 0 ? this.offlineQueue[0].timestamp : null,
      newestItem: this.offlineQueue.length > 0 ? this.offlineQueue[this.offlineQueue.length - 1].timestamp : null,
      operations: this.offlineQueue.map(item => ({
        id: item.id,
        operation: item.operation,
        timestamp: item.timestamp,
        status: item.status
      }))
    };
  }
}

// Export singleton instance
export default new DatabaseErrorHandler();