/**
 * Bandeau de retour affiché au-dessus des formulaires.
 *
 * `role="alert"` fait annoncer le message par les lecteurs d'écran dès son
 * apparition, sans que l'utilisateur ait à déplacer le focus.
 */
export default function FormMessage({ type = 'error', children }) {
  if (!children) {
    return null;
  }

  return (
    <p className={`form-message form-message--${type}`} role="alert">
      {children}
    </p>
  );
}
