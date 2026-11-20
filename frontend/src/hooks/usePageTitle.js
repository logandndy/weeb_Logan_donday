import { useEffect } from 'react';

const SITE = 'Weeb';

/**
 * Titre de l'onglet du navigateur pour la page affichée.
 *
 * Sans lui, toutes les pages s'appelaient pareil : impossible de s'y
 * retrouver entre plusieurs onglets ou dans l'historique. Sans titre
 * (page d'accueil), le titre du site complet est utilisé.
 */
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} — le blog du web`;
  }, [title]);
}
