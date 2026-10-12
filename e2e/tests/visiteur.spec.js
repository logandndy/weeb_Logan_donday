/** Parcours 1 : un visiteur non connecté consulte le blog. */
import { expect, test } from '@playwright/test';
import { ARTICLE_PUBLIE, AUTEUR, BROUILLON } from './donnees.js';

test.describe('Visiteur', () => {
  test('lit un article publié, sans boutons de modification', async ({ page }) => {
    await page.goto('/blog');

    const carte = page.locator('article.article-card', { hasText: ARTICLE_PUBLIE.titre });
    await expect(carte.locator('h2')).toHaveText(ARTICLE_PUBLIE.titre);
    // La liste est chargée : le brouillon, lui, ne doit pas y être.
    await expect(page.locator('article.article-card', { hasText: BROUILLON.titre })).toHaveCount(0);

    await carte.locator('a.article-card-link').click();

    await expect(page).toHaveURL(new RegExp(`/blog/${ARTICLE_PUBLIE.slug}$`));
    await expect(page.locator('h1')).toHaveText(ARTICLE_PUBLIE.titre);
    await expect(page.locator('.article-meta')).toContainText(`Par ${AUTEUR.nomComplet}`);
    await expect(page.getByRole('link', { name: 'Modifier' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Supprimer' })).toHaveCount(0);
  });

  test('ne peut pas ouvrir un brouillon par son adresse', async ({ page }) => {
    await page.goto(`/blog/${BROUILLON.slug}`);

    await expect(page.getByRole('alert')).toHaveText("Cet article n'existe pas ou a été supprimé.");
  });

  test('est renvoyé vers la connexion s’il veut écrire un article', async ({ page }) => {
    await page.goto('/blog/nouveau');

    await expect(page).toHaveURL(/\/login$/);
  });
});
