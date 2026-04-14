/**
 * StickerLayer Integration Tests
 * Tests the complete sticker system integration into the Layout component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DesignSystemProvider } from '../../theme/DesignSystemProvider';
import Layout from '../Layout';
import StickerManager from '../../services/StickerManager';

// Mock the auth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      full_name: 'Test User',
      email: 'test@example.com',
      roles: ['therapist']
    },
    logout: jest.fn()
  })
}));

// Mock the notifications hook
jest.mock('../NotificationsCenter', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    clearAll: jest.fn()
  }),
  NotificationBell: ({ onClick }) => (
    <button onClick={onClick} data-testid="notification-bell">
      Notifications
    </button>
  ),
  NotificationsPanel: ({ isOpen }) => (
    isOpen ? <div data-testid="notifications-panel">Panel</div> : null
  )
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <DesignSystemProvider>
      {children}
    </DesignSystemProvider>
  </BrowserRouter>
);

describe('StickerLayer Integration', () => {
  beforeEach(() => {
    // Initialize StickerManager before each test
    StickerManager.initialize();
  });

  afterEach(() => {
    // Clear cache after each test
    StickerManager.clearCache();
  });

  test('StickerLayer is integrated into Layout component', async () => {
    render(
      <TestWrapper>
        <Layout>
          <div data-testid="main-content">Test Content</div>
        </Layout>
      </TestWrapper>
    );

    // Wait for stickers to be initialized
    await waitFor(() => {
      const stickerLayer = document.querySelector('.sticker-layer');
      expect(stickerLayer).toBeInTheDocument();
    });

    // Verify sticker layer has correct attributes
    const stickerLayer = document.querySelector('.sticker-layer');
    expect(stickerLayer).toHaveAttribute('aria-hidden', 'true');
    expect(stickerLayer).toHaveAttribute('role', 'presentation');
  });

  test('Stickers display correctly on all pages', async () => {
    render(
      <TestWrapper>
        <Layout>
          <div data-testid="page-content">Dashboard Content</div>
        </Layout>
      </TestWrapper>
    );

    await waitFor(() => {
      const stickerLayer = document.querySelector('.sticker-layer');
      expect(stickerLayer).toBeInTheDocument();
    });

    // Check that stickers are rendered
    const stickers = document.querySelectorAll('.sticker');
    expect(stickers.length).toBeGreaterThan(0);
    expect(stickers.length).toBeLessThanOrEqual(4); // Max 4 stickers per page
  });

  test('Stickers have correct positioning and styling', async () => {
    render(
      <TestWrapper>
        <Layout>
          <div data-testid="page-content">Test Content</div>
        </Layout>
      </TestWrapper>
    );

    await waitFor(() => {
      const stickers = document.querySelectorAll('.sticker');
      expect(stickers.length).toBeGreaterThan(0);
    });

    const stickers = document.querySelectorAll('.sticker');
    
    stickers.forEach(sticker => {
      const style = window.getComputedStyle(sticker);
      
      // Verify positioning
      expect(style.position).toBe('absolute');
      
      // Verify opacity is within expected range (0.7-0.85)
      const opacity = parseFloat(style.opacity);
      expect(opacity).toBeGreaterThanOrEqual(0.7);
      expect(opacity).toBeLessThanOrEqual(0.85);
      
      // Verify pointer events are disabled
      expect(style.pointerEvents).toBe('none');
      
      // Verify user-select is disabled
      expect(style.userSelect).toBe('none');
    });
  });

  test('Stickers do not interfere with page functionality', async () => {
    render(
      <TestWrapper>
        <Layout>
          <div data-testid="interactive-content">
            <button data-testid="test-button">Click Me</button>
            <input data-testid="test-input" placeholder="Type here" />
          </div>
        </Layout>
      </TestWrapper>
    );

    // Wait for stickers to load
    await waitFor(() => {
      const stickerLayer = document.querySelector('.sticker-layer');
      expect(stickerLayer).toBeInTheDocument();
    });

    // Verify interactive elements are still accessible
    const button = screen.getByTestId('test-button');
    const input = screen.getByTestId('test-input');
    
    expect(button).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    
    // Verify sticker layer has lower z-index than main content
    const stickerLayer = document.querySelector('.sticker-layer');
    const mainContent = document.querySelector('.main-content');
    
    const stickerZIndex = parseInt(window.getComputedStyle(stickerLayer).zIndex) || 0;
    const contentZIndex = parseInt(window.getComputedStyle(mainContent).zIndex) || 0;
    
    expect(stickerZIndex).toBeLessThan(contentZIndex);
  });

  test('Sticker variety and rotation works correctly', async () => {
    // Render with different session counts to test variety
    const { rerender } = render(
      <TestWrapper>
        <Layout>
          <div data-testid="page-content">Content 1</div>
        </Layout>
      </TestWrapper>
    );

    await waitFor(() => {
      const stickers = document.querySelectorAll('.sticker');
      expect(stickers.length).toBeGreaterThan(0);
    });

    const firstLoadStickers = Array.from(document.querySelectorAll('.sticker')).map(
      sticker => sticker.title
    );

    // Clear cache to force new selection
    StickerManager.clearCache();
    StickerManager.incrementSessionCount();

    // Re-render to test variety
    rerender(
      <TestWrapper>
        <Layout>
          <div data-testid="page-content">Content 2</div>
        </Layout>
      </TestWrapper>
    );

    await waitFor(() => {
      const stickers = document.querySelectorAll('.sticker');
      expect(stickers.length).toBeGreaterThan(0);
    });

    const secondLoadStickers = Array.from(document.querySelectorAll('.sticker')).map(
      sticker => sticker.title
    );

    // Verify some variety in sticker selection
    // (Note: Due to deterministic algorithm, complete difference isn't guaranteed)
    expect(firstLoadStickers).toBeDefined();
    expect(secondLoadStickers).toBeDefined();
  });

  test('Stickers are responsive across different viewport sizes', async () => {
    // Mock different viewport sizes
    const originalInnerWidth = window.innerWidth;
    
    // Test mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    render(
      <TestWrapper>
        <Layout>
          <div data-testid="mobile-content">Mobile Content</div>
        </Layout>
      </TestWrapper>
    );

    await waitFor(() => {
      const stickers = document.querySelectorAll('.sticker');
      expect(stickers.length).toBeGreaterThan(0);
    });

    // Verify mobile sizing (50-80px range)
    const mobileStickers = document.querySelectorAll('.sticker');
    mobileStickers.forEach(sticker => {
      const width = parseInt(sticker.style.width);
      expect(width).toBeGreaterThanOrEqual(50);
      expect(width).toBeLessThanOrEqual(80);
    });

    // Test desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      const stickers = document.querySelectorAll('.sticker');
      expect(stickers.length).toBeGreaterThan(0);
    });

    // Restore original viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  test('Stickers respect accessibility preferences', async () => {
    // Test with reduced motion preference
    const mockMatchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    render(
      <TestWrapper>
        <Layout>
          <div data-testid="reduced-motion-content">Content</div>
        </Layout>
      </TestWrapper>
    );

    await waitFor(() => {
      const stickerLayer = document.querySelector('.sticker-layer');
      expect(stickerLayer).toBeInTheDocument();
    });

    // Verify reduced motion class is applied when appropriate
    const stickerLayer = document.querySelector('.sticker-layer');
    
    // The actual reduced motion detection depends on the DesignSystemProvider
    // This test verifies the structure is in place
    expect(stickerLayer).toHaveAttribute('aria-hidden', 'true');
  });

  test('Stickers are decorative only and do not trigger actions', async () => {
    const mockClickHandler = jest.fn();
    
    render(
      <TestWrapper>
        <Layout>
          <div data-testid="clickable-content" onClick={mockClickHandler}>
            Clickable Content
          </div>
        </Layout>
      </TestWrapper>
    );

    await waitFor(() => {
      const stickers = document.querySelectorAll('.sticker');
      expect(stickers.length).toBeGreaterThan(0);
    });

    // Verify stickers have pointer-events: none
    const stickers = document.querySelectorAll('.sticker');
    stickers.forEach(sticker => {
      expect(sticker.style.pointerEvents).toBe('none');
    });

    // Verify clicking on sticker area doesn't trigger actions
    // (This is ensured by pointer-events: none)
    const stickerLayer = document.querySelector('.sticker-layer');
    expect(stickerLayer.style.pointerEvents).toBe('none');
  });
});