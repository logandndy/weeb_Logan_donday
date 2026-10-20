import { useEffect, useState } from 'react';

/**
 * Charge des données depuis l'API et suit l'état du chargement.
 *
 * `loader` est une fonction asynchrone qui renvoie les données. Elle est
 * relancée à chaque changement d'une valeur de `deps` (numéro de page, slug...).
 * Une réponse qui arrive après ce changement est ignorée : on n'affiche jamais
 * les données d'une page qu'on a déjà quittée.
 *
 * @returns {{ data: any, setData: Function, isLoading: boolean, error: Error|null }}
 */
export default function useFetch(loader, deps) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isStale = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await loader();
        if (!isStale) {
          setData(result);
        }
      } catch (apiError) {
        if (!isStale) {
          setError(apiError);
        }
      } finally {
        if (!isStale) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      isStale = true;
    };
    // `loader` est recréée à chaque rendu : ce sont les `deps` qui décident du rechargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, isLoading, error };
}
