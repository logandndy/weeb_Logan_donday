import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { session } from '../services/api';

// Chaque test repart d'un état propre : DOM vidé, session et stockage effacés,
// mocks réinitialisés.
afterEach(() => {
  cleanup();
  session.clear();
  session.onEnd(() => {});
  localStorage.clear();
  vi.restoreAllMocks();
});
