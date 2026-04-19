/**
 * AccessibilityChecker React Component
 * 
 * Real-time accessibility monitoring component for child-friendly interfaces
 * Provides visual feedback and reporting for WCAG AA compliance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AccessibilityValidator } from '../services/AccessibilityValidator/AccessibilityValidator.js';
import './AccessibilityChecker.css';

const AccessibilityChecker = ({ 
  targetElement = null,
  autoCheck = true,
  showIndicator = true,
  onValidationComplete = null,
  checkInterval = 5000,
  enableRealTimeMonitoring = false
}) => {
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState(null);
  
  const validatorRef = useRef(null);
  const intervalRef = useRef(null);
  const observerRef = useRef(null);

  // Initialize validator
  useEffect(() => {
    validatorRef.current = new AccessibilityValidator();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Perform accessibility validation
  const validateAccessibility = useCallback(async (element = null) => {
    if (isValidating || !validatorRef.current) return;

    setIsValidating(true);
    setError(null);

    try {
      const elementToCheck = element || targetElement || document.body;
      const results = await validatorRef.current.validateAccessibility(elementToCheck);
      
      setValidationResults(results);
      
      if (onValidationComplete) {
        onValidationComplete(results);
      }
      
    } catch (err) {
      console.error('Accessibility validation failed:', err);
      setError(err.message);
    } finally {
      setIsValidating(false);
    }
  }, [targetElement, isValidating, onValidationComplete]);

  // Set up automatic checking
  useEffect(() => {
    if (autoCheck && !isValidating) {
      // Initial check
      validateAccessibility();
      
      // Set up interval checking
      if (checkInterval > 0) {
        intervalRef.current = setInterval(() => {
          validateAccessibility();
        }, checkInterval);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoCheck, checkInterval, validateAccessibility]);

  // Set up real-time monitoring with MutationObserver
  useEffect(() => {
    if (enableRealTimeMonitoring && !observerRef.current) {
      const elementToObserve = targetElement || document.body;
      
      observerRef.current = new MutationObserver((mutations) => {
        // Debounce validation calls
        if (intervalRef.current) {
          clearTimeout(intervalRef.current);
        }
        
        intervalRef.current = setTimeout(() => {
          validateAccessibility();
        }, 1000);
      });

      observerRef.current.observe(elementToObserve, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'aria-label', 'aria-labelledby', 'alt']
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enableRealTimeMonitoring, targetElement, validateAccessibility]);

  // Get indicator color based on validation results
  const getIndicatorColor = () => {
    if (!validationResults) return '#gray';
    
    if (validationResults.overall.wcagLevel === 'AAA') return '#2ECC71'; // Green
    if (validationResults.overall.wcagLevel === 'AA') return '#F5A623'; // Orange
    if (validationResults.overall.wcagLevel === 'A') return '#F1C40F'; // Yellow
    return '#E74C3C'; // Red
  };

  // Get indicator text
  const getIndicatorText = () => {
    if (isValidating) return 'Checking...';
    if (error) return 'Error';
    if (!validationResults) return 'Not checked';
    
    return `${validationResults.overall.wcagLevel} (${validationResults.overall.score}%)`;
  };

  // Generate summary text for children
  const getChildFriendlySummary = () => {
    if (!validationResults) return null;
    
    const { overall, summary } = validationResults;
    
    if (overall.wcagLevel === 'AAA' || overall.wcagLevel === 'AA') {
      return `Great! This page is easy for all children to use. ${summary.passedChecks} things are working well.`;
    } else if (overall.wcagLevel === 'A') {
      return `Good start! This page works for most children, but ${summary.failedChecks} things could be better.`;
    } else {
      return `This page needs help! ${summary.failedChecks} things are hard for children to use.`;
    }
  };

  // Render accessibility indicator
  const renderIndicator = () => {
    if (!showIndicator) return null;

    return (
      <div 
        className="accessibility-indicator"
        style={{ backgroundColor: getIndicatorColor() }}
        onClick={() => setShowReport(!showReport)}
        title="Click to view accessibility report"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setShowReport(!showReport);
          }
        }}
      >
        <span className="accessibility-indicator-icon" aria-hidden="true">
          ♿
        </span>
        <span className="accessibility-indicator-text">
          {getIndicatorText()}
        </span>
      </div>
    );
  };

  // Render detailed report
  const renderReport = () => {
    if (!showReport || !validationResults) return null;

    const { overall, details, summary } = validationResults;

    return (
      <div className="accessibility-report" role="dialog" aria-labelledby="accessibility-report-title">
        <div className="accessibility-report-header">
          <h2 id="accessibility-report-title">Accessibility Report</h2>
          <button 
            className="accessibility-report-close"
            onClick={() => setShowReport(false)}
            aria-label="Close accessibility report"
          >
            ×
          </button>
        </div>

        <div className="accessibility-report-content">
          {/* Child-friendly summary */}
          <div className="accessibility-summary child-friendly">
            <h3>For Children and Families</h3>
            <p className="child-friendly-text">{getChildFriendlySummary()}</p>
          </div>

          {/* Overall score */}
          <div className="accessibility-score">
            <div className="score-circle" style={{ borderColor: getIndicatorColor() }}>
              <span className="score-number">{overall.score}</span>
              <span className="score-label">Score</span>
            </div>
            <div className="score-details">
              <div className="wcag-level">
                WCAG Level: <strong>{overall.wcagLevel}</strong>
              </div>
              <div className="check-summary">
                ✅ {summary.passedChecks} passed • 
                ❌ {summary.failedChecks} failed • 
                ⚠️ {summary.warnings} warnings
              </div>
            </div>
          </div>

          {/* Detailed results */}
          <div className="accessibility-details">
            <h3>Detailed Results</h3>
            
            {/* Color Contrast */}
            <div className="detail-section">
              <h4>Color Contrast</h4>
              <div className="detail-score">
                Score: {details.colorContrast?.score || 'N/A'}%
                {details.colorContrast?.passed ? ' ✅' : ' ❌'}
              </div>
              {details.colorContrast?.issues?.length > 0 && (
                <ul className="issue-list">
                  {details.colorContrast.issues.slice(0, 3).map((issue, index) => (
                    <li key={index} className="issue-item">
                      {issue.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Keyboard Navigation */}
            <div className="detail-section">
              <h4>Keyboard Navigation</h4>
              <div className="detail-score">
                Score: {details.keyboardNavigation?.score || 'N/A'}%
                {details.keyboardNavigation?.passed ? ' ✅' : ' ❌'}
              </div>
              {details.keyboardNavigation?.issues?.length > 0 && (
                <ul className="issue-list">
                  {details.keyboardNavigation.issues.slice(0, 3).map((issue, index) => (
                    <li key={index} className="issue-item">
                      {issue.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Screen Reader */}
            <div className="detail-section">
              <h4>Screen Reader Support</h4>
              <div className="detail-score">
                Score: {details.screenReader?.score || 'N/A'}%
                {details.screenReader?.passed ? ' ✅' : ' ❌'}
              </div>
              {details.screenReader?.issues?.length > 0 && (
                <ul className="issue-list">
                  {details.screenReader.issues.slice(0, 3).map((issue, index) => (
                    <li key={index} className="issue-item">
                      {issue.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Text Resizing */}
            <div className="detail-section">
              <h4>Text Resizing</h4>
              <div className="detail-score">
                Score: {details.textResizing?.score || 'N/A'}%
                {details.textResizing?.passed ? ' ✅' : ' ❌'}
              </div>
              {details.textResizing?.issues?.length > 0 && (
                <ul className="issue-list">
                  {details.textResizing.issues.slice(0, 3).map((issue, index) => (
                    <li key={index} className="issue-item">
                      {issue.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Reduced Motion */}
            <div className="detail-section">
              <h4>Motion Sensitivity</h4>
              <div className="detail-score">
                Score: {details.reducedMotion?.score || 'N/A'}%
                {details.reducedMotion?.passed ? ' ✅' : ' ❌'}
              </div>
              {details.reducedMotion?.issues?.length > 0 && (
                <ul className="issue-list">
                  {details.reducedMotion.issues.slice(0, 3).map((issue, index) => (
                    <li key={index} className="issue-item">
                      {issue.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="accessibility-actions">
            <button 
              className="btn-primary"
              onClick={() => validateAccessibility()}
              disabled={isValidating}
            >
              {isValidating ? 'Checking...' : 'Check Again'}
            </button>
            
            <button 
              className="btn-secondary"
              onClick={() => {
                const report = validatorRef.current?.generateReport(targetElement || document.body);
                console.log('Detailed Accessibility Report:', report);
                alert('Detailed report logged to console');
              }}
            >
              Export Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render error state
  if (error) {
    return (
      <div className="accessibility-error">
        <span className="error-icon" aria-hidden="true">⚠️</span>
        <span>Accessibility check failed: {error}</span>
        <button onClick={() => validateAccessibility()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="accessibility-checker">
      {renderIndicator()}
      {renderReport()}
    </div>
  );
};

export default AccessibilityChecker;