/**
 * Étape préalable : connexion de l'auteur, une seule fois pour tout le run.
 *
 * La connexion est limitée à 5 essais par minute : se connecter dans chaque
 * test ferait vite tomber sur un 429. On se connecte donc ici via l'interface,
 * puis on enregistre l'état du navigateur (tokens dans le localStorage). Les
 * parcours connectés repartent de cet état.
 */
import { expect, test as setup } from '@playwright/test';
import { AUTEUR, AUTH_FILE, MOT_DE_PASSE } from './donnees.js';

setup('connexion de l’auteur', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#login-email').fill(AUTEUR.email);
  await page.locator('#login-password').fill(MOT_DE_PASSE);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.locator('.navbar-container .nav-user')).toHaveText(AUTEUR.prenom);

  await page.context().storageState({ path: AUTH_FILE });
});
