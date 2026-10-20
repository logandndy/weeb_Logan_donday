import { useState } from 'react';

/**
 * État d'un formulaire envoyé à l'API : valeurs, erreurs et envoi en cours.
 *
 * Tous les formulaires du site suivent le même schéma : on tape, l'erreur du
 * champ disparaît ; on envoie, le bouton se bloque ; si l'API refuse, le
 * message général et les erreurs par champ (format Django REST Framework)
 * s'affichent. Ce hook regroupe ce schéma pour ne l'écrire qu'une fois.
 */
export default function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Met à jour le champ modifié et efface l'erreur qui lui était associée. */
  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setValues((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  /** Exécute `action(values)` ; en cas d'erreur de l'API, l'affiche dans le formulaire. */
  async function submit(action) {
    setIsSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      await action(values);
    } catch (apiError) {
      setError(apiError.message);
      setFieldErrors(apiError.fieldErrors ?? {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return { values, setValues, fieldErrors, error, isSubmitting, handleChange, submit };
}
