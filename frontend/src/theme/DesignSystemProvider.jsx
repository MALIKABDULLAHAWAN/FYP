import React, { createContext, useContext, useState, useEffect } from 'react';
import { designTokens, defaultAccessibilityPreferences } from './designTokens';
import './designSystem.css';

/**
 * DesignSystemContext provides design tokens and accessibility preferences
 * to all child components via React Context
 */
const DesignSystemContext = createContext();

/**
 * DesignSystemProvider wraps the application and provides:
 * - Design tokens (colors, typography, spacing, etc.)
 * - Accessibility preferences management
 * - Theme application
 */
export function DesignSystemProvider({ children }) {
  const [accessibilityPreferences, setAccessibilityPreferences] = useState(
    defaultAccessibilityPreferences
  );

  // Load accessibility preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('accessibilityPreferences');
    if (saved) {
      try {
        setAccessibilityPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load accessibility preferences:', e);
      }
    }
  }, []);

  // Apply accessibility preferences to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply text size multiplier
    root.style.setProperty(
      '--text-size-multiplier',
      accessibilityPreferences.textSizeMultiplier
    );

    // Apply high contrast mode
    if (accessibilityPreferences.highContrastMode) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    // Apply reduced motion preference
    if (accessibilityPreferences.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Save to localStorage
    localStorage.setItem(
      'accessibilityPreferences',
      JSON.stringify(accessibilityPreferences)
    );
  }, [accessibilityPreferences]);

  // Update individual accessibility preference
  const updateAccessibilityPreference = (key, value) => {
    setAccessibilityPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const value = {
    designTokens,
    accessibilityPreferences,
    updateAccessibilityPreference,
  };

  return (
    <DesignSystemContext.Provider value={value}>
      {children}
    </DesignSystemContext.Provider>
  );
}

/**
 * Hook to access design system context
 * Usage: const { designTokens, accessibilityPreferences } = useDesignSystem();
 */
export function useDesignSystem() {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error(
      'useDesignSystem must be used within a DesignSystemProvider'
    );
  }
  return context;
}

export default DesignSystemProvider;
