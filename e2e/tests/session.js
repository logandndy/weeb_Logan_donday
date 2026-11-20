/**
 * `test` pour les parcours connectés : chaque test repart de la session de
 * l'auteur, puis l'enregistre de nouveau à la fin.
 *
 * Le cookie de session change à chaque renouvellement et l'ancien est grillé
 * (rotation). Repartir toujours du cookie de auth.setup.js échouerait donc dès
 * le deuxième test : chacun reprend le cookie laissé par le précédent.
 */
import { test as base } from '@playwright/test';
import { AUTH_FILE } from './donnees.js';

export const test = base.extend({
  storageState: AUTH_FILE,
  context: async ({ context }, use) => {
    await use(context);
    await context.storageState({ path: AUTH_FILE });
  },
});
