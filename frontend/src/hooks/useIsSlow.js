import { useEffect, useState } from 'react';

/** Délai après lequel une attente est jugée anormalement longue. */
export const SLOW_DELAY_MS = 3000;

/**
 * Passe à `true` quand `active` reste vrai plus de `delay` millisecondes.
 *
 * Sert à prévenir l'utilisateur pendant le réveil du serveur : l'API est
 * hébergée sur une offre gratuite qui se met en veille, et la première
 * requête peut alors prendre près d'une minute.
 */
export default function useIsSlow(active, delay = SLOW_DELAY_MS) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => setIsSlow(true), delay);
    return () => {
      clearTimeout(timer);
      setIsSlow(false);
    };
  }, [active, delay]);

  return active && isSlow;
}
