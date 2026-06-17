/**
 * AccessibilityChecker Component Test Suite
 * 
 * Tests for the real-time accessibility monitoring React component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import AccessibilityChecker from '../AccessibilityChecker.jsx';
import { AccessibilityValidator } from '../../services/AccessibilityValidator/AccessibilityValidator.js';

// Mock the AccessibilityValidator
jest.mock('../../services/AccessibilityValidator/AccessibilityValidator.js', () => ({
  AccessibilityValidator: jest.fn().mockImplementation(() => ({
    validateAccessibility: jest.fn(),
    generateReport: jest.fn(),
    clearResults: jest.fn()
  }))
}));

// Mock performance.now for consistent testing
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
});

describe('AccessibilityChecker Component', () => {
  let mockValidator;
  let mockValidationResults;

  beforeEach(() => {
    // Create mock validation results
    mockValidationResults = {
      timestamp: new Date().toISOString(),
      element: 'body',
      overall: {
        passed: true,
        score: 85,
        wcagLevel: 'AA'
      },
      colorContrast: {
        passed: true,
        score: 90,
        issues: []
      },
      keyboardNavigation: {
        passed: true,
        score: 88,
        issues: []
      },
      screenReader: {
        passed: true,
        score: 82,
        issues: []
      },
      textResizing: {
        passed: true,
        score: 80,
        issues: []
      },
      reducedMotion: {
        passed: true,
        score: 95,
        issues: []
      },
      summary: {
        totalChecks: 10,
        passedChecks: 9,
        failedChecks: 1,
        warnings: 0
      },
      validationDuration: 150
    };

    // Mock validator instance
    mockValidator = {
      validateAccessibility: jest.fn().mockResolvedValue(mockValidationResults),
      generateReport: jest.fn().mockReturnValue({
        summary: {
          overallScore: 85,
          wcagCompliance: 'AA',
          timestamp: mockValidationResults.timestamp,
          validationDuration: 150
        },
        details: {
          colorContrast: { score: 90, passed: true, issues: [] },
          keyboardNavigation: { score: 88, passed: true, issues: [] },
          screenReader: { score: 82, passed: true, issues: [] },
          textResizing: { score: 80, passed: true, issues: [] },
          reducedMotion: { score: 95, passed: true, issues: [] }
        },
        recommendations: [],
        childFriendlyIssues: []
      }),
      clearResults: jest.fn()
    };

    AccessibilityValidator.mockImplementation(() => mockValidator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render accessibility indicator by default', () => {
      render(<AccessibilityChecker />);
      
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      expect(indicator).toBeInTheDocument();
    });

    it('should not render indicator when showIndicator is false', () => {
      render(<AccessibilityChecker showIndicator={false} />);
      
      const indicator = screen.queryByRole('button', { name: /click to view accessibility report/i });
      expect(indicator).not.toBeInTheDocument();
    });

    it('should show loading state during validation', async () => {
      // Make validation take longer
      mockValidator.validateAccessibility.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockValidationResults), 100))
      );

      render(<AccessibilityChecker autoCheck={true} />);
      
      // Should show checking state initially
      expect(screen.getByText('Checking...')).toBeInTheDocument();
      
      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.getByText('AA (85%)')).toBeInTheDocument();
      });
    });
  });

  describe('Automatic Validation', () => {
    it('should perform automatic validation when autoCheck is true', async () => {
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(mockValidator.validateAccessibility).toHaveBeenCalledWith(document.body);
      });
    });

    it('should not perform automatic validation when autoCheck is false', () => {
      render(<AccessibilityChecker autoCheck={false} />);
      
      expect(mockValidator.validateAccessibility).not.toHaveBeenCalled();
    });

    it('should call onValidationComplete callback', async () => {
      const onValidationComplete = jest.fn();
      
      render(
        <AccessibilityChecker 
          autoCheck={true} 
          onValidationComplete={onValidationComplete}
        />
      );
      
      await waitFor(() => {
        expect(onValidationComplete).toHaveBeenCalledWith(mockValidationResults);
      });
    });
  });

  describe('Indicator Display', () => {
    it('should display correct indicator color for AA compliance', async () => {
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
        expect(indicator).toHaveStyle({ backgroundColor: '#F5A623' }); // Orange for AA
      });
    });

    it('should display correct indicator color for AAA compliance', async () => {
      mockValidationResults.overall.wcagLevel = 'AAA';
      mockValidationResults.overall.score = 96;
      
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
        expect(indicator).toHaveStyle({ backgroundColor: '#2ECC71' }); // Green for AAA
      });
    });

    it('should display correct indicator color for failed compliance', async () => {
      mockValidationResults.overall.wcagLevel = 'FAIL';
      mockValidationResults.overall.score = 45;
      
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
        expect(indicator).toHaveStyle({ backgroundColor: '#E74C3C' }); // Red for FAIL
      });
    });
  });

  describe('Report Modal', () => {
    it('should open report modal when indicator is clicked', async () => {
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('AA (85%)')).toBeInTheDocument();
      });
      
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      fireEvent.click(indicator);
      
      expect(screen.getByRole('dialog', { name: /accessibility report/i })).toBeInTheDocument();
      expect(screen.getByText('Accessibility Report')).toBeInTheDocument();
    });

    it('should close report modal when close button is clicked', async () => {
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('AA (85%)')).toBeInTheDocument();
      });
      
      // Open modal
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      fireEvent.click(indicator);
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: /close accessibility report/i });
      fireEvent.click(closeButton);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display child-friendly summary', async () => {
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('AA (85%)')).toBeInTheDocument();
      });
      
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      fireEvent.click(indicator);
      
      expect(screen.getByText('For Children and Families')).toBeInTheDocument();
      expect(screen.getByText(/Great! This page is easy for all children to use/)).toBeInTheDocument();
    });

    it('should display detailed results', async () => {
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('AA (85%)')).toBeInTheDocument();
      });
      
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      fireEvent.click(indicator);
      
      expect(screen.getByText('Detailed Results')).toBeInTheDocument();
      expect(screen.getByText('Color Contrast')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Navigation')).toBeInTheDocument();
      expect(screen.getByText('Screen Reader Support')).toBeInTheDocument();
      expect(screen.getByText('Text Resizing')).toBeInTheDocument();
      expect(screen.getByText('Motion Sensitivity')).toBeInTheDocument();
    });
  });

  describe('Manual Validation', () => {
    it('should allow manual validation trigger', async () => {
      render(<AccessibilityChecker autoCheck={false} />);
      
      // Manually trigger validation by clicking indicator
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      fireEvent.click(indicator);
      
      // Should show report even without auto-check
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle check again button', async () => {
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('AA (85%)')).toBeInTheDocument();
      });
      
      // Open modal
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      fireEvent.click(indicator);
      
      // Click check again
      const checkAgainButton = screen.getByRole('button', { name: /check again/i });
      fireEvent.click(checkAgainButton);
      
      expect(mockValidator.validateAccessibility).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should display error state when validation fails', async () => {
      mockValidator.validateAccessibility.mockRejectedValue(new Error('Validation failed'));
      
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Accessibility check failed/)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      mockValidator.validateAccessibility
        .mockRejectedValueOnce(new Error('Validation failed'))
        .mockResolvedValueOnce(mockValidationResults);
      
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('AA (85%)')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for indicator', async () => {
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('AA (85%)')).toBeInTheDocument();
      });
      
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      
      // Test Enter key
      fireEvent.keyDown(indicator, { key: 'Enter' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: /close accessibility report/i });
      fireEvent.click(closeButton);
      
      // Test Space key
      fireEvent.keyDown(indicator, { key: ' ' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Real-time Monitoring', () => {
    it('should set up MutationObserver when enableRealTimeMonitoring is true', () => {
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn()
      };
      
      global.MutationObserver = jest.fn().mockImplementation(() => mockObserver);
      
      render(<AccessibilityChecker enableRealTimeMonitoring={true} />);
      
      expect(global.MutationObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'aria-label', 'aria-labelledby', 'alt']
      });
    });
  });

  describe('Export Functionality', () => {
    it('should handle export report button', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('AA (85%)')).toBeInTheDocument();
      });
      
      // Open modal
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      fireEvent.click(indicator);
      
      // Click export button
      const exportButton = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(exportButton);
      
      expect(mockValidator.generateReport).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Detailed Accessibility Report:', expect.any(Object));
      expect(alertSpy).toHaveBeenCalledWith('Detailed report logged to console');
      
      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Child-Friendly Features', () => {
    it('should display appropriate child-friendly summary for good accessibility', async () => {
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('AA (85%)')).toBeInTheDocument();
      });
      
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      fireEvent.click(indicator);
      
      expect(screen.getByText(/Great! This page is easy for all children to use/)).toBeInTheDocument();
    });

    it('should display appropriate child-friendly summary for poor accessibility', async () => {
      mockValidationResults.overall.wcagLevel = 'FAIL';
      mockValidationResults.overall.score = 45;
      mockValidationResults.summary.failedChecks = 8;
      
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('FAIL (45%)')).toBeInTheDocument();
      });
      
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      fireEvent.click(indicator);
      
      expect(screen.getByText(/This page needs help!/)).toBeInTheDocument();
    });

    it('should display appropriate child-friendly summary for moderate accessibility', async () => {
      mockValidationResults.overall.wcagLevel = 'A';
      mockValidationResults.overall.score = 65;
      mockValidationResults.summary.failedChecks = 3;
      
      render(<AccessibilityChecker autoCheck={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('A (65%)')).toBeInTheDocument();
      });
      
      const indicator = screen.getByRole('button', { name: /click to view accessibility report/i });
      fireEvent.click(indicator);
      
      expect(screen.getByText(/Good start! This page works for most children/)).toBeInTheDocument();
    });
  });

  describe('Component Cleanup', () => {
    it('should clean up intervals and observers on unmount', () => {
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn()
      };
      
      global.MutationObserver = jest.fn().mockImplementation(() => mockObserver);
      
      const { unmount } = render(
        <AccessibilityChecker 
          enableRealTimeMonitoring={true}
          checkInterval={1000}
        />
      );
      
      unmount();
      
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });
});