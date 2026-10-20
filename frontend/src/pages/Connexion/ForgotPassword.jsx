import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import useForm from '../../hooks/useForm';
import FormField from '../../components/FormField';
import FormMessage from '../../components/FormMessage';

/** Demande d'un lien de réinitialisation de mot de passe. */
const ForgotPassword = () => {
  const [feedback, setFeedback] = useState('');
  const { values, error, isSubmitting, handleChange, submit } = useForm({ email: '' });

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback('');
    submit(async ({ email }) => {
      const data = await authApi.requestPasswordReset(email);
      setFeedback(data.detail);
    });
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Mot de passe oublié</h1>
        <p className="form-intro">
          Saisissez l&apos;adresse email de votre compte : nous vous enverrons un lien pour choisir
          un nouveau mot de passe.
        </p>

        <FormMessage type="error">{error}</FormMessage>
        <FormMessage type="success">{feedback}</FormMessage>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <FormField id="forgot-email" name="email" type="email" label="Email *" required
            value={values.email} onChange={handleChange} />

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <div className="login-links">
          <p className="create-account">
            <Link to="/login">Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
