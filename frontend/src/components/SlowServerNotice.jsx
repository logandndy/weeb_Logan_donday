import useIsSlow from '../hooks/useIsSlow';

/**
 * Message affiché quand une requête tarde : le serveur sort de veille.
 * N'affiche rien tant que l'attente reste normale.
 */
export default function SlowServerNotice({ active }) {
  const isSlow = useIsSlow(active);

  if (!isSlow) {
    return null;
  }

  return (
    <p className="slow-server-notice" role="status">
      Le serveur se réveille, cela peut prendre jusqu&apos;à une minute. Merci de votre patience.
    </p>
  );
}
