import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock environment variables for tests
vi.stubGlobal('import.meta', {
  env: {
    VITE_API_URL: 'http://localhost:8000',
    VITE_WS_URL: 'ws://localhost:8000/ws',
  },
});

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Extend Vitest's expect with jest-dom matchers
expect.extend({});

// Mock ResizeObserver for ReactFlow
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as any).ResizeObserver = ResizeObserverMock;
