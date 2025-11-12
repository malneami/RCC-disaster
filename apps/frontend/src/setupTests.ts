import { afterEach, vi } from 'vitest';
// Note: Testing library imports are optional and may not be installed
// @ts-ignore - Optional dependency
let cleanup: (() => void) | undefined;
try {
  // @ts-ignore
  const testingLibrary = require('@testing-library/react');
  cleanup = testingLibrary.cleanup;
} catch {
  // Testing library not installed, skip cleanup
}

// Cleanup after each test
afterEach(() => {
  if (cleanup) {
    cleanup();
  }
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
