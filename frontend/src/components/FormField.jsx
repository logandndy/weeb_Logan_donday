import FormMessage from './FormMessage';

/**
 * Champ de formulaire avec label flottant et message d'erreur.
 *
 * Le `placeholder=" "` est volontaire : le CSS s'en sert (`:placeholder-shown`)
 * pour faire remonter le label dès que le champ contient du texte.
 * `multiline` affiche une zone de texte au lieu d'un champ sur une ligne.
 */
export default function FormField({ id, label, error, multiline = false, className = '', ...inputProps }) {
  const Input = multiline ? 'textarea' : 'input';

  return (
    <div className={`input-group ${className}`.trim()}>
      <Input id={id} placeholder=" " {...inputProps} />
      <label htmlFor={id}>{label}</label>
      <FormMessage type="field">{error}</FormMessage>
    </div>
  );
}
