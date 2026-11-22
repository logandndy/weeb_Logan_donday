import { useState } from 'react';
import FormMessage from './FormMessage';

/** Icônes « œil » (afficher) et « œil barré » (masquer), dessinées en SVG. */
function EyeIcon({ crossed }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M3 3l18 18" />}
    </svg>
  );
}

/**
 * Champ de formulaire avec label flottant et message d'erreur.
 *
 * Le `placeholder=" "` est volontaire : le CSS s'en sert (`:placeholder-shown`)
 * pour faire remonter le label dès que le champ contient du texte.
 * `multiline` affiche une zone de texte au lieu d'un champ sur une ligne.
 * Un champ mot de passe reçoit un bouton pour afficher ce qu'on a tapé :
 * on vérifie sa saisie au lieu de la retaper en cas de faute de frappe.
 */
export default function FormField({ id, label, error, multiline = false, className = '', type, ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);
  const isPassword = type === 'password';
  const Input = multiline ? 'textarea' : 'input';
  const classes = ['input-group', isPassword && 'input-group--password', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Input id={id} placeholder=" " type={isPassword && isVisible ? 'text' : type} {...inputProps} />
      <label htmlFor={id}>{label}</label>
      {isPassword && (
        <button
          type="button"
          className="password-toggle"
          onClick={() => setIsVisible(!isVisible)}
          aria-label={isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={isVisible}
        >
          <EyeIcon crossed={isVisible} />
        </button>
      )}
      <FormMessage type="field">{error}</FormMessage>
    </div>
  );
}
