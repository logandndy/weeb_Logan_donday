/** Parcours 5 : la session de l'auteur, telle que le navigateur la voit. */
import { expect } from '@playwright/test';
import { AUTEUR } from './donnees.js';
import { test } from './session.js';

test.describe('Session', () => {
  test('survit au rechargement, sans token lisible par le JavaScript', async ({ page }) => {
    await page.goto('/mon-espace');
    await page.reload();

    await expect(page.locator('.navbar-container .nav-user')).toHaveText(AUTEUR.prenom);
    // Le cookie HttpOnly n'apparaît pas dans document.cookie, et aucun token
    // n'est rangé dans le stockage du navigateur.
    expect(await page.evaluate(() => document.cookie)).not.toContain('weeb_refresh');
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toMatch(/eyJ/);
  });

  // Dernier test connecté du run : il ferme la session de l'auteur.
  test('la déconnexion ferme vraiment la session côté serveur', async ({ page }) => {
    await page.goto('/blog');
    await page.locator('.navbar-container').getByRole('button', { name: 'Déconnexion' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page.locator('.navbar-container .nav-user')).toHaveCount(0);

    const refresh = await page.request.post('/api/auth/refresh/');
    expect(refresh.status()).toBe(401);
  });
});
