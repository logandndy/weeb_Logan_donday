import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';
import FormMessage from '../../components/FormMessage';

/**
 * Choix d'un nouveau mot de passe.
 *
 * L'identifiant du compte (`uid`) et le jeton de sécurité (`token`) arrivent
 * dans la chaîne de requête du lien envoyé par email.
 */
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [form, setForm] = useState({ new_password: '', new_password_confirm: '' });
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
      await authApi.confirmPasswordReset({ uid, token, ...form });
      navigate('/login', {
        state: { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' },
      });
    } catch (apiError) {
      setError(apiError.message);
      setFieldErrors(apiError.fieldErrors ?? {});
      setIsSubmitting(false);
    }
  }

  // Sans les deux paramètres, le lien a été tronqué ou saisi à la main.
  if (!uid || !token) {
    return (
      <div className="login-page">
        <div className="login-container">
          <h1>Lien invalide</h1>
          <p className="form-intro">
            Ce lien de réinitialisation est incomplet. Relancez une demande depuis la page mot de
            passe oublié.
          </p>
          <Link to="/mot-de-passe-oublie" className="btn-primary login-btn">
            Nouvelle demande
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Nouveau mot de passe</h1>

        <FormMessage type="error">{error}</FormMessage>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <input
              type="password"
              id="reset-password"
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="reset-password">Nouveau mot de passe *</label>
            <FormMessage type="field">{fieldErrors.new_password}</FormMessage>
          </div>

          <div className="input-group">
            <input
              type="password"
              id="reset-password-confirm"
              name="new_password_confirm"
              value={form.new_password_confirm}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="reset-password-confirm">Confirmer le mot de passe *</label>
            <FormMessage type="field">{fieldErrors.new_password_confirm}</FormMessage>
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Réinitialiser'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
