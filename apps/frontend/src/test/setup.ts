/**
 * Test setup file for Vitest
 * This file runs before all tests
 */

import { afterEach } from 'vitest';
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

