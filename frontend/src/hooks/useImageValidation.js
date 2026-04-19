import { useState, useCallback } from 'react';
import { apiFetch } from '../api/client';

/**
 * REACT HOOK FOR IMAGE VALIDATION
 * Provides access to image metadata validation API
 */
export function useImageValidation() {
  const [validationReport, setValidationReport] = useState(null);
  const [fixRecommendations, setFixRecommendations] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);
  
  // Validate all images
  const validateAll = useCallback(async () => {
    setIsValidating(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/v1/therapy/validate-images/');
      
      if (!response.ok) {
        throw new Error('Failed to validate images');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setValidationReport(data.data);
        return data.data;
      } else {
        throw new Error(data.error || 'Validation failed');
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  // Validate single image
  const validateSingle = useCallback(async (gameKey, itemName) => {
    setIsValidating(true);
    setError(null);
    
    try {
      const response = await apiFetch(
        `/api/v1/therapy/validate-image/${gameKey}/${itemName}/`
      );
      
      if (!response.ok) {
        throw new Error('Failed to validate image');
      }
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  // Batch validate images
  const validateBatch = useCallback(async (items) => {
    // items: array of {game_key, item_name}
    setIsValidating(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/v1/therapy/validate-images/batch/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate batch');
      }
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  // Get validation report
  const getReport = useCallback(async () => {
    setIsValidating(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/v1/therapy/validation-report/');
      
      if (!response.ok) {
        throw new Error('Failed to get report');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setValidationReport(data.data.summary);
        return data.data;
      }
      return null;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  // Get fix recommendations
  const getFixes = useCallback(async () => {
    setIsValidating(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/v1/therapy/fix-recommendations/');
      
      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFixRecommendations(data.data);
        return data.data;
      }
      return null;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  // Get validation status color
  const getStatusColor = useCallback((status) => {
    const colors = {
      excellent: '#2ECC71', // Green
      good: '#3498DB',      // Blue
      needs_improvement: '#F39C12', // Orange
      critical: '#E74C3C',   // Red
      unknown: '#95A5A6'     // Gray
    };
    return colors[status] || colors.unknown;
  }, []);
  
  // Get validation status icon
  const getStatusIcon = useCallback((status) => {
    const icons = {
      excellent: '✅',
      good: '👍',
      needs_improvement: '⚠️',
      critical: '❌',
      unknown: '❓'
    };
    return icons[status] || icons.unknown;
  }, []);
  
  return {
    // State
    validationReport,
    fixRecommendations,
    isValidating,
    error,
    
    // Actions
    validateAll,
    validateSingle,
    validateBatch,
    getReport,
    getFixes,
    
    // Helpers
    getStatusColor,
    getStatusIcon,
    
    // Computed
    hasIssues: validationReport ? validationReport.needs_attention > 0 : false,
    excellentPercentage: validationReport?.excellent_percentage || 0,
    totalItems: validationReport?.total_items || 0
  };
}

export default useImageValidation;
