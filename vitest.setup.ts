// Setup for vitest/jsdom environment
import '@testing-library/jest-dom';

// Provide a basic clipboard mock if not available
if (typeof navigator !== 'undefined' && !(navigator as any).clipboard) {
  (navigator as any).clipboard = {
    writeText: async (text: string) => {
      (navigator as any)._lastCopied = text;
      return Promise.resolve();
    }
  };
}

// Provide globals if needed
if (typeof window === 'undefined') {
  // jsdom should provide window, but guard for safety
  // no-op
}
