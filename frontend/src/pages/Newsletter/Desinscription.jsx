import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { newsletterApi } from '../../services/api';
import useForm from '../../hooks/useForm';
import FormMessage from '../../components/FormMessage';

/**
 * Désinscription de la newsletter, depuis le lien reçu dans l'email de bienvenue.
 *
 * La désinscription demande un clic : certains antivirus de messagerie ouvrent
 * les liens des emails tout seuls, ils ne doivent pas désinscrire les gens.
 */
const Desinscription = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [confirmation, setConfirmation] = useState('');
  const { error, isSubmitting, submit } = useForm({});

  function handleSubmit(event) {
    event.preventDefault();
    submit(async () => {
      const data = await newsletterApi.unsubscribe(token);
      setConfirmation(data.detail);
    });
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Newsletter</h1>

        {!token && (
          <p className="form-intro">
            Ce lien de désinscription est incomplet. Utilisez le lien reçu dans l&apos;email de
            bienvenue.
          </p>
        )}

        <FormMessage type="error">{error}</FormMessage>
        <FormMessage type="success">{confirmation}</FormMessage>

        {token && !confirmation && (
          <form onSubmit={handleSubmit}>
            <p className="form-intro">
              Vous ne souhaitez plus recevoir nos articles par email ? Votre adresse sera
              définitivement supprimée.
            </p>
            <button type="submit" className="btn-primary login-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Désinscription...' : 'Me désinscrire'}
            </button>
          </form>
        )}

        <div className="login-links">
          <p className="create-account">
            <Link to="/blog">Retour au blog</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Desinscription;
