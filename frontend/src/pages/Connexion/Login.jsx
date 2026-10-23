import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import FormField from '../../components/FormField';
import FormMessage from '../../components/FormMessage';

/** Page de connexion. */
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { values, error, isSubmitting, handleChange, submit } = useForm({ email: '', password: '' });

  // Message éventuellement transmis par une autre page (par exemple après une
  // inscription ou une réinitialisation de mot de passe).
  const incomingMessage = location.state?.message;

  function handleSubmit(event) {
    event.preventDefault();
    submit(async ({ email, password }) => {
      try {
        await login(email, password);
      } catch (apiError) {
        // Même message dans les deux cas : on ne dit pas lequel des deux est faux.
        if (apiError.status === 401) {
          apiError.message = 'Identifiants incorrects, ou compte pas encore validé par un administrateur.';
        }
        throw apiError;
      }
      // Retour sur la page initialement demandée si l'utilisateur a été
      // redirigé ici par une route protégée.
      navigate(location.state?.from ?? '/blog', { replace: true });
    });
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Se connecter</h1>

        <FormMessage type="success">{incomingMessage}</FormMessage>
        <FormMessage type="error">{error}</FormMessage>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <FormField id="login-email" name="email" type="email" label="Email *" required
            value={values.email} onChange={handleChange} />
          <FormField id="login-password" name="password" type="password" label="Mot de passe *" required
            value={values.password} onChange={handleChange} />

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-links">
          <Link to="/mot-de-passe-oublie" className="forgot-password">
            Mot de passe oublié ?
          </Link>
          <p className="create-account">
            Vous n&apos;avez pas de compte ? <br />
            <Link to="/signup">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
