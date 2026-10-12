/**
 * Données connues à l'avance, créées par `manage.py seed_e2e`
 * (backend/apps/accounts/management/commands/seed_e2e.py).
 */
import path from 'node:path';

export const MOT_DE_PASSE = 'MotDePasse!2026';

export const AUTEUR = { email: 'e2e.auteur@weeb.fr', prenom: 'Ada', nomComplet: 'Ada Lovelace' };
export const COMPTE_RESET = 'e2e.reset@weeb.fr';

export const ARTICLE_PUBLIE = { titre: 'Article E2E publié', slug: 'article-e2e-publie' };
export const BROUILLON = { titre: 'Brouillon E2E', slug: 'brouillon-e2e' };

// Session de l'auteur (tokens du localStorage), enregistrée par auth.setup.js.
export const AUTH_FILE = path.join(import.meta.dirname, '..', '.auth', 'auteur.json');
