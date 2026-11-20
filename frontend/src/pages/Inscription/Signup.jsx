import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import useForm from '../../hooks/useForm';
import FormField from '../../components/FormField';
import FormMessage from '../../components/FormMessage';
import usePageTitle from '../../hooks/usePageTitle';

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
  usePageTitle('Inscription');
  const navigate = useNavigate();
  const { values, fieldErrors, error, isSubmitting, handleChange, submit } = useForm(EMPTY_FORM);

  function handleSubmit(event) {
    event.preventDefault();
    submit(async (form) => {
      const data = await authApi.signup(form);
      navigate('/login', { state: { message: data.detail } });
    });
  }

  /** Raccourci : chaque champ est relié à sa valeur, son erreur et handleChange. */
  const field = (name) => ({ name, value: values[name], error: fieldErrors[name], onChange: handleChange, required: true });

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1>Rejoignez-nous</h1>

        <FormMessage type="error">{error}</FormMessage>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          <FormField id="signup-first-name" label="Prénom *" {...field('first_name')} />
          <FormField id="signup-last-name" label="Nom *" {...field('last_name')} />
          <FormField id="signup-email" type="email" label="Email *" {...field('email')} />
          <FormField id="signup-password" type="password" label="Mot de passe *" {...field('password')} />
          <FormField id="signup-confirm-password" type="password" label="Confirmer le mot de passe *"
            {...field('password_confirm')} />

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer mon compte'}
          </button>
          <p className="form-legal">
            Vos informations servent uniquement à gérer votre compte. Voir notre{' '}
            <Link to="/confidentialite">politique de confidentialité</Link>.
          </p>
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
