import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';
import useForm from '../../hooks/useForm';
import FormField from '../../components/FormField';
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
  const { values, fieldErrors, error, isSubmitting, handleChange, submit } = useForm({
    new_password: '',
    new_password_confirm: '',
  });

  function handleSubmit(event) {
    event.preventDefault();
    submit(async (form) => {
      await authApi.confirmPasswordReset({ uid, token, ...form });
      navigate('/login', {
        state: { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' },
      });
    });
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
          <Link to="/mot-de-passe-oublie" className="btn btn-primary btn-block">
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
          <FormField id="reset-password" name="new_password" type="password" label="Nouveau mot de passe *"
            required value={values.new_password} error={fieldErrors.new_password} onChange={handleChange} />
          <FormField id="reset-password-confirm" name="new_password_confirm" type="password"
            label="Confirmer le mot de passe *" required value={values.new_password_confirm}
            error={fieldErrors.new_password_confirm} onChange={handleChange} />

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Réinitialiser'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
