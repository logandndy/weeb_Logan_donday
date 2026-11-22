import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Durée d'affichage d'un message, en millisecondes. */
export const FLASH_DURATION_MS = 4000;

/**
 * Bandeau de confirmation après une action (« Article publié », « Vous êtes déconnecté »...).
 *
 * Une page l'affiche en naviguant avec un message dans l'état de navigation :
 * `navigate('/blog', { state: { flash: 'Article supprimé.' } })`.
 * Le message est ensuite retiré de l'historique : il ne réapparaît pas si
 * l'utilisateur recharge la page.
 */
export default function FlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [shown, setShown] = useState(null);

  // Nouveau message : on le retient pendant le rendu (pas d'effet en cascade).
  const incoming = location.state?.flash;
  if (incoming && shown?.key !== location.key) {
    setShown({ text: incoming, key: location.key });
  }

  useEffect(() => {
    if (!incoming) return;
    const rest = { ...location.state };
    delete rest.flash;
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: Object.keys(rest).length > 0 ? rest : null,
    });
  }, [incoming, location, navigate]);

  useEffect(() => {
    if (!shown) return undefined;
    const timer = setTimeout(() => setShown(null), FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [shown]);

  // Le conteneur reste dans la page : les lecteurs d'écran annoncent ce qui y apparaît.
  return (
    <div className="flash-region" role="status" aria-live="polite">
      {shown && (
        <p className="flash-message">
          <span>{shown.text}</span>
          <button type="button" className="flash-close" aria-label="Fermer le message" onClick={() => setShown(null)}>
            &times;
          </button>
        </p>
      )}
    </div>
  );
}
