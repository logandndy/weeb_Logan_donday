/** Parcours 2 : inscription, puis connexion refusée tant qu'un admin n'a pas validé le compte. */
import { expect, test } from '@playwright/test';
import { MOT_DE_PASSE } from './donnees.js';

test('inscription puis connexion refusée avant validation', async ({ page }) => {
  // Adresse unique : le test peut être relancé sans tomber sur « email déjà utilisé ».
  const email = `e2e.inscrit.${Date.now()}@weeb.fr`;

  await page.goto('/signup');
  await page.locator('#signup-first-name').fill('Katherine');
  await page.locator('#signup-last-name').fill('Johnson');
  await page.locator('#signup-email').fill(email);
  await page.locator('#signup-password').fill(MOT_DE_PASSE);
  await page.locator('#signup-confirm-password').fill(MOT_DE_PASSE);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('.form-message--success')).toContainText(
    'Il doit être validé par un administrateur',
  );

  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(MOT_DE_PASSE);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page.locator('.form-message--error')).toHaveText(
    'Identifiants incorrects, ou compte pas encore validé par un administrateur.',
  );
  await expect(page).toHaveURL(/\/login$/);
});
