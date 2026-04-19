/**
 * Design Tokens for Child-Friendly UI Enhancement
 * Defines color palette, typography, spacing, and other design system constants
 */

export const designTokens = {
  // Colors
  colors: {
    primary: {
      blue: '#4A90E2',      // Calming, trust-building
      green: '#7ED321',     // Growth, nature, positivity
      orange: '#F5A623',    // Energy, enthusiasm, warmth
      purple: '#BD10E0',    // Creativity, imagination
    },
    secondary: {
      success: '#2ECC71',   // Positive reinforcement
      warning: '#F1C40F',   // Attention, caution
      error: '#E74C3C',     // Error states
      neutral: '#95A5A6',   // Disabled states, secondary text
    },
    background: {
      primary: '#FFFFFF',   // Clean, non-overwhelming
      secondary: '#F8F9FA', // Subtle differentiation
      accent: '#E8F4F8',    // Highlight important areas
    },
  },

  // Typography
  typography: {
    fontFamily: {
      primary: '"Quicksand", sans-serif',
      fallback: '"Segoe UI", "Roboto", sans-serif',
    },
    sizes: {
      display: '32px',      // Page titles
      h1: '24px',           // Section titles
      h2: '20px',           // Subsections
      body: '16px',         // Body text
      small: '14px',        // Labels, captions
    },
    weights: {
      regular: 400,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.3,
      relaxed: 1.5,
      loose: 1.6,
    },
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  // Border Radius
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 2px 8px rgba(0, 0, 0, 0.1)',
    large: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },

  // Breakpoints
  breakpoints: {
    mobile: '320px',
    tablet: '641px',
    desktop: '1025px',
  },

  // Touch targets
  touchTarget: {
    minimum: '44px',
    comfortable: '48px',
  },

  // Transitions
  transitions: {
    fast: '100ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modal: 400,
    tooltip: 500,
    sticker: -1,
  },
};

/**
 * Accessibility preferences that can be customized per user
 */
export const defaultAccessibilityPreferences = {
  textSizeMultiplier: 1.0,      // 1.0 - 2.0
  animationEnabled: true,
  highContrastMode: false,
  screenReaderEnabled: false,
  reducedMotion: false,
};

/**
 * Media query helpers
 */
export const mediaQueries = {
  mobile: `@media (max-width: 640px)`,
  tablet: `@media (min-width: 641px) and (max-width: 1024px)`,
  desktop: `@media (min-width: 1025px)`,
  prefersReducedMotion: `@media (prefers-reduced-motion: reduce)`,
};
