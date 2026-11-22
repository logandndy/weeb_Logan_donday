import { useState } from 'react';
import { Link } from 'react-router-dom';
import { newsletterApi } from '../services/api';
import useForm from '../hooks/useForm';
import FormMessage from './FormMessage';
import '../styles/Footer.css';

// Uniquement des liens vers des pages qui existent vraiment. « Écrire un
// article » passe par la connexion si besoin, puis revient au formulaire.
const FOOTER_COLUMNS = [
  {
    title: 'Explorer',
    links: [
      { label: 'Accueil', to: '/' },
      { label: 'Blog', to: '/blog' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Votre compte',
    links: [
      { label: 'Créer un compte', to: '/signup' },
      { label: 'Se connecter', to: '/login' },
      { label: 'Écrire un article', to: '/blog/nouveau' },
    ],
  },
];

const Footer = () => {
  const [confirmation, setConfirmation] = useState('');
  const { values, error, fieldErrors, isSubmitting, handleChange, submit } = useForm({ email: '' });

  /** Inscrit l'adresse à la newsletter : un email de bienvenue est envoyé. */
  function handleNewsletterSubmit(event) {
    event.preventDefault();
    submit(async ({ email }) => {
      const data = await newsletterApi.subscribe(email);
      setConfirmation(data.detail);
    });
  }

  return (
    <footer className="footer" id="newsletter">
      <div className="footer-container">
        <div className="footer-brand">
          <h2 className="logo">weeb</h2>
        </div>
        <div className="footer-links">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="footer-column">
              <h3>{column.title}</h3>
              {column.links.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="footer-column newsletter-col">
            <h3>Newsletter</h3>
            <p className="newsletter-desc">
              Le web en constante évolution, direct dans votre boîte mail.
            </p>
            {confirmation ? (
              <p className="newsletter-success" role="status">
                {confirmation}
              </p>
            ) : (
              <>
                <form className="newsletter-form" onSubmit={handleNewsletterSubmit} noValidate>
                  <input
                    type="email"
                    name="email"
                    placeholder="Votre email"
                    aria-label="Votre email"
                    required
                    value={values.email}
                    onChange={handleChange}
                  />
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '...' : 'Envoyer'}
                  </button>
                </form>
                <FormMessage type="field">{fieldErrors.email ?? error}</FormMessage>
                <p className="form-legal">
                  Désinscription possible à tout moment.{' '}
                  <Link to="/confidentialite">Confidentialité</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          &copy; 2026 Weeb ·{' '}
          <Link to="/confidentialite" className="footer-legal-link">
            Confidentialité
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
