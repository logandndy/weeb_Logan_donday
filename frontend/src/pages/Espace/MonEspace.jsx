import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { articlesApi, authApi, session } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useForm from '../../hooks/useForm';
import FormField from '../../components/FormField';
import FormMessage from '../../components/FormMessage';
import Pagination from '../../components/Pagination';
import LoadingStatus from '../../components/LoadingStatus';
import ArticleCard from '../Blog/ArticleCard';
import { formatDate } from '../../utils/format';
import '../../styles/Blog.css';
import '../../styles/Account.css';
import usePageTitle from '../../hooks/usePageTitle';

/**
 * Page Mon espace : tout ce qu'un membre peut gérer lui-même.
 *
 * Avant cette page, un inscrit n'avait aucun endroit pour retrouver ses
 * brouillons, changer son mot de passe ou supprimer son compte.
 */
const MonEspace = () => {
  usePageTitle('Mon espace');
  const { user } = useAuth();

  return (
    <div className="blog-page account-page">
      <header className="blog-header">
        <h1>
          Mon <span className="highlight">espace</span>
        </h1>
        <p>
          Bonjour {user.first_name} ! Retrouvez ici vos articles, vos informations et la sécurité de
          votre compte.
        </p>
      </header>

      <MesArticles />

      <div className="account-grid">
        <Profil />
        <MotDePasse />
      </div>

      <SuppressionCompte />
    </div>
  );
};

/** Mes articles, publiés et brouillons. */
function MesArticles() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useFetch(() => articlesApi.mine(page), [page]);
  const articles = data?.results ?? [];

  return (
    <section className="account-section" aria-labelledby="mes-articles">
      <div className="account-section-header">
        <h2 id="mes-articles">Mes articles</h2>
        <Link to="/blog/nouveau" className="btn btn-primary">
          Écrire un article
        </Link>
      </div>

      {isLoading && <LoadingStatus>Chargement de vos articles...</LoadingStatus>}
      {error && <p className="blog-status blog-status--error" role="alert">{error.message}</p>}
      {!isLoading && !error && articles.length === 0 && (
        <p className="blog-status">Vous n&apos;avez encore rien écrit. Lancez-vous !</p>
      )}

      <div className="articles-grid">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      <Pagination page={page} hasNextPage={Boolean(data?.next)} onChange={setPage} label="Pagination de mes articles" />
    </section>
  );
}

/** Prénom et nom modifiables, email affiché pour information. */
function Profil() {
  const { user, updateUser } = useAuth();
  const [feedback, setFeedback] = useState('');
  const { values, fieldErrors, error, isSubmitting, handleChange, submit } = useForm({
    first_name: user.first_name,
    last_name: user.last_name,
  });

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback('');
    submit(async (form) => {
      updateUser(await authApi.updateMe(form));
      setFeedback('Vos informations ont bien été mises à jour.');
    });
  }

  return (
    <section className="account-section account-card" aria-labelledby="profil">
      <h2 id="profil">Mes informations</h2>
      <p className="account-info">
        {user.email}
        <br />
        Membre depuis le {formatDate(user.date_joined)}
      </p>

      <FormMessage type="error">{error}</FormMessage>
      <FormMessage type="success">{feedback}</FormMessage>

      <form onSubmit={handleSubmit} noValidate>
        <FormField id="profil-first-name" name="first_name" label="Prénom *" required
          value={values.first_name} error={fieldErrors.first_name} onChange={handleChange} />
        <FormField id="profil-last-name" name="last_name" label="Nom *" required
          value={values.last_name} error={fieldErrors.last_name} onChange={handleChange} />
        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </section>
  );
}

const EMPTY_PASSWORDS = { old_password: '', new_password: '', new_password_confirm: '' };

/** Changement de mot de passe : les autres appareils sont déconnectés par le serveur. */
function MotDePasse() {
  const [feedback, setFeedback] = useState('');
  const { values, setValues, fieldErrors, error, isSubmitting, handleChange, submit } = useForm(EMPTY_PASSWORDS);

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback('');
    submit(async (form) => {
      const data = await authApi.changePassword(form);
      // Le serveur a coupé toutes les sessions et en a ouvert une neuve pour ce
      // navigateur : nouveau token d'accès ici, nouveau cookie côté serveur.
      session.start(data.access);
      setValues(EMPTY_PASSWORDS);
      setFeedback(data.detail);
    });
  }

  const field = (name) => ({ name, type: 'password', required: true, value: values[name], error: fieldErrors[name], onChange: handleChange });

  return (
    <section className="account-section account-card" aria-labelledby="mot-de-passe">
      <h2 id="mot-de-passe">Mot de passe</h2>

      <FormMessage type="error">{error}</FormMessage>
      <FormMessage type="success">{feedback}</FormMessage>

      <form onSubmit={handleSubmit} noValidate>
        <FormField id="password-old" label="Actuel *" {...field('old_password')} />
        <FormField id="password-new" label="Nouveau *" {...field('new_password')} />
        <FormField id="password-confirm" label="Confirmation *" {...field('new_password_confirm')} />
        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Modification...' : 'Changer le mot de passe'}
        </button>
      </form>
    </section>
  );
}

/** Suppression du compte (droit à l'effacement), protégée par le mot de passe. */
function SuppressionCompte() {
  const { clearSession } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { values, fieldErrors, error, isSubmitting, handleChange, submit } = useForm({ password: '' });

  function handleSubmit(event) {
    event.preventDefault();
    submit(async ({ password }) => {
      await authApi.deleteMe(password);
      clearSession();
      navigate('/login', { state: { message: 'Votre compte et vos articles ont bien été supprimés.' } });
    });
  }

  return (
    <section className="account-section account-danger" aria-labelledby="supprimer-compte">
      <h2 id="supprimer-compte">Supprimer mon compte</h2>
      <p className="account-info">
        Votre compte et tous vos articles seront définitivement effacés. Cette action ne peut pas être
        annulée.
      </p>

      {isOpen ? (
        <form onSubmit={handleSubmit} noValidate>
          <FormMessage type="error">{error}</FormMessage>
          <FormField id="delete-password" name="password" type="password" label="Votre mot de passe *"
            required value={values.password} error={fieldErrors.password} onChange={handleChange} />
          <div className="account-danger-actions">
            <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
              {isSubmitting ? 'Suppression...' : 'Supprimer définitivement'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-danger" onClick={() => setIsOpen(true)}>
          Supprimer mon compte
        </button>
      )}
    </section>
  );
}

export default MonEspace;
