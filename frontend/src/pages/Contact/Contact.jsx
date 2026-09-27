import { useState } from 'react';
import { contactApi } from '../../services/api';
import FormMessage from '../../components/FormMessage';

const EMPTY_FORM = { last_name: '', first_name: '', email: '', message: '' };

/** Page Contact : envoie le message saisi vers l'API. */
const Contact = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setFeedback('');
    setFieldErrors({});

    try {
      await contactApi.send(form);
      setForm(EMPTY_FORM);
      setFeedback('Merci ! Votre message a bien été envoyé, nous vous répondrons rapidement.');
    } catch (apiError) {
      setError(apiError.message);
      setFieldErrors(apiError.fieldErrors ?? {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Votre avis compte !</h1>
        <p>
          Votre retour est essentiel pour nous améliorer ! Partagez votre expérience, dites-nous ce
          que vous aimez et ce que nous pourrions améliorer. Vos suggestions nous aident à faire de
          ce blog une ressource toujours plus utile et enrichissante.
        </p>
      </div>

      <div className="contact-form-container">
        <FormMessage type="error">{error}</FormMessage>
        <FormMessage type="success">{feedback}</FormMessage>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="input-group">
              <input
                type="text"
                id="nom"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                placeholder=" "
              />
              <label htmlFor="nom">Nom *</label>
              <FormMessage type="field">{fieldErrors.last_name}</FormMessage>
            </div>

            <div className="input-group">
              <input
                type="text"
                id="prenom"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                placeholder=" "
              />
              <label htmlFor="prenom">Prénom *</label>
              <FormMessage type="field">{fieldErrors.first_name}</FormMessage>
            </div>
          </div>

          <div className="form-row">
            <div className="input-group full-width">
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder=" "
              />
              <label htmlFor="email">Email *</label>
              <FormMessage type="field">{fieldErrors.email}</FormMessage>
            </div>
          </div>

          <div className="input-group full-width">
            <textarea
              id="message"
              name="message"
              rows="4"
              value={form.message}
              onChange={handleChange}
              required
              placeholder=" "
            ></textarea>
            <label htmlFor="message">Message *</label>
            <FormMessage type="field">{fieldErrors.message}</FormMessage>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Contact'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
