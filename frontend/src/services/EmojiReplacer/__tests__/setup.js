/**
 * Test setup for Emoji Replacer System
 * Configures testing environment and utilities
 */

// Mock DOM environment for testing
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock image loading for tests
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.onload && this.onload();
    }, 100);
  }
};

// Mock URL.createObjectURL for asset testing
const OriginalURL = global.URL;
global.URL = class URL extends OriginalURL {
  static createObjectURL = jest.fn(() => 'mock-blob-url');
  static revokeObjectURL = jest.fn();
};

// Test utilities
export const createMockImageAsset = (overrides = {}) => ({
  url: '/test-image.jpg',
  altText: 'Test therapeutic image for testing purposes',
  width: 32,
  height: 32,
  accessibility: {
    colorContrast: 4.8,
    screenReaderCompatible: true,
    focusIndicator: 'outline: 2px solid var(--primary);'
  },
  therapeuticContext: {
    ageAppropriate: true,
    culturallySensitive: true,
    license: 'therapeutic-use-approved',
    therapeuticGoals: ['test-goal']
  },
  ...overrides
});

export const createMockEmojiMapping = (overrides = {}) => ({
  emoji: '👶',
  context: 'test-context',
  position: 0,
  category: 'ui',
  subcategory: 'generic',
  ...overrides
});

export const createMockValidationResult = (overrides = {}) => ({
  suitable: true,
  errors: [],
  warnings: [],
  validatedAt: new Date().toISOString(),
  ...overrides
});

// Sample component code for testing
export const sampleComponentWithEmojis = `
import React from 'react';

export default function TestComponent() {
  return (
    <div className="container">
      <div className="header">
        <div className="h1">👨‍⚕️ Test Console</div>
        <button className="btn btnPrimary">
          ➕ Add Item
        </button>
      </div>
      
      <div className="stats-grid">
        <StatCard icon="👶" label="Children" value={5} />
        <StatCard icon="📋" label="Sessions" value={10} />
        <StatCard icon="✅" label="Completed" value={8} />
      </div>
      
      <div className="tabs">
        <button>📊 Overview</button>
        <button>👶 Children</button>
        <button>📋 Sessions</button>
      </div>
    </div>
  );
}
`;

export const sampleComponentWithoutEmojis = `
import React from 'react';

export default function CleanComponent() {
  return (
    <div className="container">
      <div className="header">
        <div className="h1">Clean Console</div>
        <button className="btn btnPrimary">
          Add Item
        </button>
      </div>
    </div>
  );
}
`;

// Property-based testing utilities
export const generateRandomEmoji = () => {
  const emojis = ['👶', '📋', '✅', '🎯', '📊', '👨‍⚕️', '🗣️', '🎙️', '⚡', '❌'];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

export const generateRandomContext = () => {
  const contexts = ['header', 'stat', 'nav', 'form', 'action', 'speech', 'audio', 'feedback'];
  return contexts[Math.floor(Math.random() * contexts.length)];
};

export const generateComponentWithRandomEmojis = (count = 5) => {
  let component = `
import React from 'react';

export default function RandomComponent() {
  return (
    <div className="container">
  `;
  
  for (let i = 0; i < count; i++) {
    const emoji = generateRandomEmoji();
    const context = generateRandomContext();
    component += `
      <div className="${context}">
        <span>${emoji}</span>
      </div>
    `;
  }
  
  component += `
    </div>
  );
}
  `;
  
  return component;
};

// Assertion helpers
export const assertNoEmojisRemain = (componentCode) => {
  const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const matches = componentCode.match(emojiPattern);
  expect(matches).toBeNull();
};

export const assertValidImageTags = (componentCode) => {
  const imagePattern = /<img[^>]*src="[^"]*"[^>]*alt="[^"]*"[^>]*>/g;
  const images = componentCode.match(imagePattern) || [];
  
  images.forEach(img => {
    expect(img).toMatch(/alt="[^"]{10,}"/); // Alt text minimum 10 characters
    expect(img).toMatch(/src="[^"]+"/); // Valid src attribute
    expect(img).toMatch(/width="\d+"/); // Width specified
    expect(img).toMatch(/height="\d+"/); // Height specified
  });
};

export const assertTherapeuticCompliance = (asset) => {
  expect(asset.therapeuticContext.ageAppropriate).toBe(true);
  expect(asset.therapeuticContext.culturallySensitive).toBe(true);
  expect(asset.therapeuticContext.license).toBeTruthy();
  expect(asset.altText.length).toBeGreaterThanOrEqual(10);
  expect(asset.accessibility.colorContrast).toBeGreaterThanOrEqual(4.5);
};