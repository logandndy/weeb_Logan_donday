import { useState } from 'react';
import { contactApi } from '../../services/api';
import useForm from '../../hooks/useForm';
import FormField from '../../components/FormField';
import FormMessage from '../../components/FormMessage';

const EMPTY_FORM = { last_name: '', first_name: '', email: '', message: '' };

/** Page Contact : envoie le message saisi vers l'API. */
const Contact = () => {
  const [feedback, setFeedback] = useState('');
  const { values, setValues, fieldErrors, error, isSubmitting, handleChange, submit } = useForm(EMPTY_FORM);

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback('');
    submit(async (form) => {
      await contactApi.send(form);
      setValues(EMPTY_FORM);
      setFeedback('Merci ! Votre message a bien été envoyé, nous vous répondrons rapidement.');
    });
  }

  const field = (name) => ({ name, value: values[name], error: fieldErrors[name], onChange: handleChange, required: true });

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
            <FormField id="nom" label="Nom *" {...field('last_name')} />
            <FormField id="prenom" label="Prénom *" {...field('first_name')} />
          </div>

          <div className="form-row">
            <FormField id="email" type="email" label="Email *" className="full-width" {...field('email')} />
          </div>

          <FormField id="message" label="Message *" multiline rows="4" className="full-width" {...field('message')} />

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Contact'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
