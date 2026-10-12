/** Parcours 3 et 4 : un auteur connecté publie, modifie puis supprime un article. */
import { expect, test } from '@playwright/test';
import { AUTEUR, AUTH_FILE } from './donnees.js';

// Session enregistrée par auth.setup.js : pas de nouvelle connexion ici.
test.use({ storageState: AUTH_FILE });

const CONTENU =
  'Un article écrit par Playwright pour vérifier tout le parcours de publication.';

/** Publie un article depuis le formulaire et renvoie son slug (lu dans l'URL). */
async function publierArticle(page, titre) {
  await page.goto('/blog/nouveau');
  await page.locator('#article-title').fill(titre);
  await page.locator('#article-excerpt').fill('Accroche du test E2E');
  await page.locator('#article-content').fill(CONTENU);
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page).toHaveURL(/\/blog\/article-playwright-\d+$/);
  return new URL(page.url()).pathname.split('/').pop();
}

test.describe('Auteur connecté', () => {
  test('publie un article qui apparaît sur le blog', async ({ page }) => {
    const titre = `Article Playwright ${Date.now()}`;

    await page.goto('/');
    await expect(page.locator('.navbar-container .nav-user')).toHaveText(AUTEUR.prenom);

    await publierArticle(page, titre);

    await expect(page.locator('h1')).toHaveText(titre);
    await expect(page.getByRole('link', { name: 'Modifier' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Supprimer' })).toBeVisible();

    await page.goto('/blog');
    await expect(page.locator('article.article-card h2', { hasText: titre })).toBeVisible();
  });

  test('modifie puis supprime son article', async ({ page }) => {
    const titre = `Article Playwright ${Date.now()}`;
    const slug = await publierArticle(page, titre);

    // Modification : le formulaire est pré-rempli, le slug ne change pas.
    await page.getByRole('link', { name: 'Modifier' }).click();
    await expect(page).toHaveURL(new RegExp(`/blog/${slug}/modifier$`));
    await expect(page.locator('#article-title')).toHaveValue(titre);

    const nouveauTitre = `${titre} (modifié)`;
    await page.locator('#article-title').fill(nouveauTitre);
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(page).toHaveURL(new RegExp(`/blog/${slug}$`));
    await expect(page.locator('h1')).toHaveText(nouveauTitre);

    // Suppression : on accepte la fenêtre de confirmation du navigateur.
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Supprimer' }).click();

    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.locator('article.article-card').first()).toBeVisible();
    await expect(page.locator('article.article-card h2', { hasText: nouveauTitre })).toHaveCount(0);
  });
});
