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
      include: ['src/services/**', 'src/components/**'],
    },
  },
})
