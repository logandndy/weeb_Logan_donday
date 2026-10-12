/** Parcours 6 : mot de passe oublié. */
import { expect, test } from '@playwright/test';
import { COMPTE_RESET } from './donnees.js';

test.describe('Mot de passe oublié', () => {
  test('demande d’un lien depuis la page de connexion', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Mot de passe oublié ?' }).click();
    await expect(page).toHaveURL(/\/mot-de-passe-oublie$/);

    await page.locator('#forgot-email').fill(COMPTE_RESET);
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();

    // Même réponse que le compte existe ou non (on ne révèle pas les comptes).
    await expect(page.locator('.form-message--success')).toHaveText(
      "Si un compte existe avec cette adresse, un email de réinitialisation vient d'être envoyé.",
    );
  });

  test('un lien de réinitialisation incomplet est signalé', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.locator('h1')).toHaveText('Lien invalide');
  });
});
