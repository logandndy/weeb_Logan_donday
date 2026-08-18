import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import FormMessage from '../../components/FormMessage';

/** Demande d'un lien de réinitialisation de mot de passe. */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setFeedback('');

    try {
      const data = await authApi.requestPasswordReset(email);
      setFeedback(data.detail);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="input-group">
            <input
              type="email"
              id="forgot-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder=" "
            />
            <label htmlFor="forgot-email">Email *</label>
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={isSubmitting}>
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
