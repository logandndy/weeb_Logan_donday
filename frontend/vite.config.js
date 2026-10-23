import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Comme Vercel en production : /api est relayé vers Django. Le front et
    // l'API partagent ainsi le même domaine (cookie de session, pas de CORS).
    // API_PROXY_TARGET permet aux tests E2E de viser leur propre API.
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8000',
    },
  },
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
