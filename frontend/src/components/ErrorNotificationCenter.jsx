/**
 * ErrorNotificationCenter - Displays user-friendly error notifications
 * 
 * Shows notifications from the comprehensive error handling system with:
 * - Child-friendly error messages
 * - Visual indicators and icons
 * - Action buttons for error resolution
 * - Auto-hide for low severity errors
 * - Graceful degradation information
 * 
 * Requirements: 5.4, 5.5, 7.2
 */

import React, { useState, useEffect } from 'react';
import unifiedErrorHandler from '../services/ErrorHandlers/index.js';
import './ErrorNotificationCenter.css';

const ErrorNotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    // Poll for new notifications
    const pollInterval = setInterval(() => {
      const pendingNotifications = unifiedErrorHandler.getPendingNotifications();
      setNotifications(pendingNotifications);
      
      // Update system health
      const health = unifiedErrorHandler.getSystemHealth();
      setSystemHealth(health);
    }, 2000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleNotificationAction = (notification, action) => {
    switch (action.action) {
      case 'retry-image-load':
        // Trigger image retry
        console.log('Retrying image load:', action.data);
        break;
        
      case 'show-validation-errors':
        // Show validation error details
        console.log('Showing validation errors:', action.data);
        break;
        
      case 'show-alternatives':
        // Show alternative games
        console.log('Showing alternatives:', action.data);
        break;
        
      case 'use-cached-data':
        // Use cached data
        console.log('Using cached data:', action.data);
        break;
        
      case 'dismiss':
      default:
        // Dismiss notification
        unifiedErrorHandler.clearNotification(notification.id);
        break;
    }
  };

  const getHealthStatusColor = (status) => {
    const colors = {
      healthy: '#7ED321',
      'minor-issues': '#F5A623',
      warning: '#E74C3C',
      degraded: '#8B0000',
      critical: '#8B0000'
    };
    return colors[status] || '#F5A623';
  };

  const getHealthStatusIcon = (status) => {
    const icons = {
      healthy: '✅',
      'minor-issues': '⚠️',
      warning: '🔶',
      degraded: '🔴',
      critical: '🚨'
    };
    return icons[status] || '⚠️';
  };

  return (
    <div className="error-notification-center">
      {/* System Health Indicator */}
      {systemHealth && (
        <div 
          className="system-health-indicator"
          style={{ borderColor: getHealthStatusColor(systemHealth.overall.status) }}
        >
          <span className="health-icon">
            {getHealthStatusIcon(systemHealth.overall.status)}
          </span>
          <span className="health-text">
            {systemHealth.overall.recommendation}
          </span>
        </div>
      )}

      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification notification-${notification.severity.toLowerCase()}`}
            style={{ borderLeftColor: notification.color }}
          >
            <div className="notification-header">
              <span className="notification-icon">{notification.icon}</span>
              <span className="notification-title">{notification.title}</span>
              <button
                className="notification-close"
                onClick={() => handleNotificationAction(notification, { action: 'dismiss' })}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
            
            <div className="notification-message">
              {notification.message}
            </div>
            
            {notification.actions && notification.actions.length > 1 && (
              <div className="notification-actions">
                {notification.actions
                  .filter(action => action.action !== 'dismiss')
                  .map((action, index) => (
                    <button
                      key={index}
                      className="notification-action-button"
                      onClick={() => handleNotificationAction(notification, action)}
                    >
                      {action.label}
                    </button>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorNotificationCenter;