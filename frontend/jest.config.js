export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/services/EmojiReplacer/__tests__/setup.js',
    '<rootDir>/src/services/__tests__/setup.js',
    '<rootDir>/src/services/__tests__/accessibility-setup.js'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-router-dom)/)'
  ]
};