import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom simule un navigateur (DOM, localStorage) pour exécuter les tests sous Node.
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      // Couverture mesurée sur la logique partagée (appels API, session,
      // composants communs). Les pages sont surtout vérifiées par les tests E2E.
      include: ['src/services/**', 'src/components/**', 'src/context/**'],
    },
  },
})
