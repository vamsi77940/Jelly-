import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom has no real IndexedDB — fake-indexeddb/auto polyfills the global
// so Dexie (src/lib/storage.ts) works exactly as it does in a browser,
// without mocking storage.ts itself.

// Ensure localStorage exists and has clear()
if (typeof localStorage === 'undefined' || !localStorage.clear) {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => store.get(key) || null),
      setItem: vi.fn((key: string, value: string) => store.set(key, String(value))),
      removeItem: vi.fn((key: string) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
      key: vi.fn((index: number) => Array.from(store.keys())[index] || null),
      get length() {
        return store.size;
      },
    },
    writable: true,
  });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});
