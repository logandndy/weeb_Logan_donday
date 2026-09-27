import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import FormMessage from '../../components/FormMessage';

/** Page de connexion. */
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Message éventuellement transmis par une autre page (par exemple après une
  // inscription ou une réinitialisation de mot de passe).
  const incomingMessage = location.state?.message;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login(form.email, form.password);
      // Retour sur la page initialement demandée si l'utilisateur a été
      // redirigé ici par une route protégée.
      navigate(location.state?.from ?? '/blog', { replace: true });
    } catch (apiError) {
      setError(
        apiError.status === 401
          ? "Identifiants incorrects, ou compte pas encore validé par un administrateur."
          : apiError.message,
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Se connecter</h1>

        <FormMessage type="success">{incomingMessage}</FormMessage>
        <FormMessage type="error">{error}</FormMessage>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <input
              type="email"
              id="login-email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="login-email">Email *</label>
          </div>

          <div className="input-group">
            <input
              type="password"
              id="login-password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="login-password">Password *</label>
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-links">
          <Link to="/mot-de-passe-oublie" className="forgot-password">
            Mot de passe oublié ?
          </Link>
          <p className="create-account">
            Vous n&apos;avez pas de compte ? Vous
            <br />
            pouvez en <Link to="/signup">créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
