/**
 * Configuration des tests de bout en bout (E2E) de Weeb avec Playwright.
 *
 * Playwright démarre lui-même l'API Django et le frontend Vite, puis pilote un
 * vrai navigateur Chromium comme le ferait un utilisateur : clics, saisie,
 * navigation. On vérifie ainsi que front, API et base fonctionnent ensemble.
 */
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// Ports dédiés aux tests (et non 8000 / 5173) : les E2E peuvent tourner
// pendant que les serveurs de développement sont lancés, sans conflit.
const API_PORT = 8001;
const FRONT_PORT = 5174;
const FRONT_URL = `http://127.0.0.1:${FRONT_PORT}`;

export default defineConfig({
  testDir: './tests',
  // Un seul navigateur à la fois : les parcours partagent la même base et le
  // même compte, et la connexion est limitée à 5 essais par minute.
  workers: 1,
  fullyParallel: false,
  // En CI, un test qui échoue est relancé une fois (réseau lent, démarrage...).
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: FRONT_URL,
    // Écran d'ordinateur : sous 768 px, la navbar passe en menu burger.
    viewport: { width: 1280, height: 720 },
    // En cas d'échec : trace et capture d'écran dans le rapport, pour comprendre.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Se connecte une seule fois et mémorise la session (voir auth.setup.js).
    { name: 'setup', testMatch: /auth\.setup\.js/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  webServer: [
    {
      // Base SQLite dédiée, recréée à chaque run, puis runserver (voir start-backend.js).
      command: `node start-backend.js ${API_PORT}`,
      url: `http://127.0.0.1:${API_PORT}/api/health/`,
      env: {
        // Obligatoire : sans DEBUG, Django redirige tout le HTTP vers HTTPS.
        DEBUG: 'True',
        DATABASE_URL: 'sqlite:///e2e.sqlite3',
        CORS_ALLOWED_ORIGINS: FRONT_URL,
        FRONTEND_URL: FRONT_URL,
        // Jamais de vrai email ni d'erreur envoyée à Sentry pendant les tests,
        // même si le .env local définit ces clés.
        BREVO_API_KEY: '',
        SENTRY_DSN: '',
      },
      // Toujours un serveur neuf : redémarrer runserver remet aussi à zéro
      // les compteurs de limitation de débit (stockés en mémoire).
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${FRONT_PORT} --strictPort`,
      cwd: '../frontend',
      url: FRONT_URL,
      env: { VITE_API_URL: `http://127.0.0.1:${API_PORT}/api` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
