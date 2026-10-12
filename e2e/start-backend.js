/**
 * Démarre l'API Django pour les tests E2E, sur une base SQLite dédiée.
 *
 * Lancé par Playwright (voir webServer dans playwright.config.js) :
 *   1. supprime la base e2e.sqlite3 du run précédent : chaque run repart de zéro ;
 *   2. crée les tables (migrate) puis le jeu de données connu (seed_e2e) ;
 *   3. démarre runserver, que Playwright arrête à la fin des tests.
 *
 * Écrit en Node plutôt qu'en ligne de commande shell : la même commande
 * fonctionne ainsi sous Windows (poste de dev) et sous Linux (CI).
 */
import { spawn, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

// Port passé par playwright.config.js.
const port = process.argv[2] ?? '8001';
const backendDir = path.resolve(import.meta.dirname, '..', 'backend');

// En CI, `python` est celui installé par setup-python. En local sous Windows,
// on prend celui de l'environnement virtuel du backend. PYTHON permet de forcer.
const python =
  process.env.PYTHON ??
  (process.platform === 'win32' ? path.join(backendDir, 'venv', 'Scripts', 'python.exe') : 'python');

function manage(...args) {
  const result = spawnSync(python, ['manage.py', ...args], { cwd: backendDir, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`Échec de "manage.py ${args.join(' ')}"`);
    process.exit(1);
  }
}

rmSync(path.join(backendDir, 'e2e.sqlite3'), { force: true });
manage('migrate', '--noinput');
manage('seed_e2e');

// --noreload : un seul processus, que Playwright peut arrêter proprement.
const server = spawn(python, ['manage.py', 'runserver', `127.0.0.1:${port}`, '--noreload'], {
  cwd: backendDir,
  stdio: 'inherit',
});
server.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
