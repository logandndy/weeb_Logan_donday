/** Parcours 5 : un visiteur envoie un message depuis la page Contact. */
import { expect, test } from '@playwright/test';

test('envoi du formulaire de contact', async ({ page }) => {
  await page.goto('/contact');
  await page.locator('#nom').fill('Donday');
  await page.locator('#prenom').fill('Logan');
  await page.locator('#email').fill('logan@weeb.fr');
  await page.locator('#message').fill('Bravo pour le blog, les articles sont très clairs.');
  // Rôle « button » : le lien « Contact » de la navbar porte le même nom.
  await page.getByRole('button', { name: 'Contact' }).click();

  await expect(page.locator('.form-message--success')).toHaveText(
    'Merci ! Votre message a bien été envoyé, nous vous répondrons rapidement.',
  );
  await expect(page.locator('#message')).toHaveValue('');
});
