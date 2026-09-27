import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Chaque test repart d'un état propre : DOM vidé, stockage effacé, mocks réinitialisés.
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
