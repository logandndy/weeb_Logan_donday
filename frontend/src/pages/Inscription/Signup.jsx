import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import FormMessage from '../../components/FormMessage';

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password_confirm: '',
};

/**
 * Page d'inscription.
 *
 * Le compte créé reste inactif tant qu'un administrateur ne l'a pas validé :
 * l'utilisateur en est informé avant d'être renvoyé vers la page de connexion.
 */
const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
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
    setFieldErrors({});

    try {
      const data = await authApi.signup(form);
      navigate('/login', { state: { message: data.detail } });
    } catch (apiError) {
      setError(apiError.message);
      setFieldErrors(apiError.fieldErrors ?? {});
      setIsSubmitting(false);
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1>Rejoignez-nous</h1>

        <FormMessage type="error">{error}</FormMessage>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <input
              type="text"
              id="signup-first-name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="signup-first-name">Prénom *</label>
            <FormMessage type="field">{fieldErrors.first_name}</FormMessage>
          </div>

          <div className="input-group">
            <input
              type="text"
              id="signup-last-name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="signup-last-name">Nom *</label>
            <FormMessage type="field">{fieldErrors.last_name}</FormMessage>
          </div>

          <div className="input-group">
            <input
              type="email"
              id="signup-email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="signup-email">Email *</label>
            <FormMessage type="field">{fieldErrors.email}</FormMessage>
          </div>

          <div className="input-group">
            <input
              type="password"
              id="signup-password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="signup-password">Mot de passe *</label>
            <FormMessage type="field">{fieldErrors.password}</FormMessage>
          </div>

          <div className="input-group">
            <input
              type="password"
              id="signup-confirm-password"
              name="password_confirm"
              value={form.password_confirm}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="signup-confirm-password">Confirmer le mot de passe *</label>
            <FormMessage type="field">{fieldErrors.password_confirm}</FormMessage>
          </div>

          <button type="submit" className="btn-primary signup-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="signup-links">
          <p className="login-account">
            Vous avez déjà un compte ? <br />
            <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
