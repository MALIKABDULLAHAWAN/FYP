/**
 * Test setup for data persistence services
 */

// Mock Canvas API - Define HTMLCanvasElement if not available
if (typeof HTMLCanvasElement === 'undefined') {
  global.HTMLCanvasElement = class HTMLCanvasElement {
    constructor() {
      this.width = 1;
      this.height = 1;
    }
    
    getContext() {
      return {
        textBaseline: '',
        font: '',
        fillText: jest.fn(),
        toDataURL: jest.fn(() => 'data:image/webp;base64,mock-webp-data')
      };
    }
    
    toDataURL() {
      return 'data:image/webp;base64,mock-webp-data';
    }
  };
}

HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  textBaseline: '',
  font: '',
  fillText: jest.fn(),
  toDataURL: jest.fn(() => 'mock-canvas-data')
}));

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'mock-canvas-data');

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(() => {
    const request = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: {
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            put: jest.fn(() => ({ onsuccess: null, onerror: null })),
            get: jest.fn(() => ({ onsuccess: null, onerror: null })),
            getAll: jest.fn(() => ({ onsuccess: null, onerror: null, result: [] })),
            add: jest.fn(() => ({ onsuccess: null, onerror: null })),
            delete: jest.fn(() => ({ onsuccess: null, onerror: null })),
            createIndex: jest.fn()
          }))
        }))
      }
    };
    
    // Simulate successful initialization
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  })
};

global.indexedDB = mockIndexedDB;

// Mock Cache API
global.caches = {
  open: jest.fn().mockResolvedValue({
    put: jest.fn().mockResolvedValue(),
    match: jest.fn(),
    delete: jest.fn().mockResolvedValue(),
    keys: jest.fn().mockResolvedValue([])
  }),
  delete: jest.fn().mockResolvedValue(true),
  keys: jest.fn().mockResolvedValue([])
};

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  readyState: 1, // OPEN
  send: jest.fn(),
  close: jest.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null
}));

// Mock fetch
global.fetch = jest.fn();

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock window events
window.addEventListener = jest.fn();

// Mock Blob
global.Blob = jest.fn().mockImplementation((content, options) => ({
  size: content ? content[0].length : 0,
  type: options?.type || 'application/json'
}));

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(function() {
    this.onload({ target: { result: 'data:image/png;base64,mock-base64-data' } });
  }),
  onload: null,
  onerror: null
}));

// Mock Response
global.Response = jest.fn().mockImplementation((body, init) => ({
  json: jest.fn().mockResolvedValue(JSON.parse(body)),
  blob: jest.fn().mockResolvedValue(new Blob([body])),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(body.length)),
  headers: init?.headers || {},
  ok: true,
  status: 200
}));

// Suppress console errors for expected test scenarios
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress specific expected errors
  if (args[0] && typeof args[0] === 'string') {
    if (args[0].includes('HTMLCanvasElement.prototype.getContext')) {
      return; // Suppress canvas errors
    }
    if (args[0].includes('Not implemented')) {
      return; // Suppress jsdom not implemented errors
    }
  }
  originalConsoleError.apply(console, args);
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset fetch mock
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true })
  });
  
  // Reset localStorage mock
  mockLocalStorage.getItem.mockReturnValue(null);
  mockLocalStorage.setItem.mockImplementation(() => {});
  mockLocalStorage.removeItem.mockImplementation(() => {});
  
  // Reset navigator.onLine
  navigator.onLine = true;
});