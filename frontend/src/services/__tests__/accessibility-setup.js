/**
 * Test setup for Accessibility Validator tests
 * Provides DOM mocking and utilities for accessibility testing
 */

// Mock DOM APIs that may not be available in test environment
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {
    // Mock implementation
  }
  
  disconnect() {
    // Mock implementation
  }
};

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now())
};

// Mock window.matchMedia for reduced motion testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock getComputedStyle with default values
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = jest.fn((element) => {
  return {
    color: 'rgb(0, 0, 0)',
    backgroundColor: 'rgb(255, 255, 255)',
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.2',
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    outline: 'none',
    boxShadow: 'none',
    border: 'none',
    animation: 'none',
    animationName: 'none',
    animationDuration: '0s',
    animationIterationCount: '1',
    animationTimingFunction: 'ease',
    transition: 'none',
    transitionProperty: 'none',
    transitionDuration: '0s',
    transform: 'none',
    overflow: 'visible',
    ...originalGetComputedStyle(element)
  };
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 30,
  top: 0,
  left: 0,
  right: 100,
  bottom: 30,
  x: 0,
  y: 0
}));

// Mock focus method
Element.prototype.focus = jest.fn();

// Mock matches method for CSS selector testing
Element.prototype.matches = Element.prototype.matches || function(selector) {
  const element = this;
  const matches = (element.document || element.ownerDocument).querySelectorAll(selector);
  let i = matches.length;
  while (--i >= 0 && matches.item(i) !== element) {}
  return i > -1;
};

// Mock CSS rule access for reduced motion testing
Object.defineProperty(document, 'styleSheets', {
  value: [],
  writable: true
});

// Helper function to create mock CSS rules
global.createMockStyleSheet = (rules = []) => {
  return {
    cssRules: rules.map(rule => ({
      type: rule.type || 1, // CSSRule.STYLE_RULE
      selectorText: rule.selector,
      style: rule.style || {},
      conditionText: rule.condition
    }))
  };
};

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
console.error = jest.fn((...args) => {
  // Only show actual errors, not expected test errors
  if (!args[0]?.includes?.('Accessibility validation failed')) {
    originalConsoleError(...args);
  }
});

// Cleanup function for tests
global.cleanupAccessibilityTest = () => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Clean up any test elements
  const testElements = document.querySelectorAll('[data-test-element]');
  testElements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
};