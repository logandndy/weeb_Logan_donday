import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

// Intitulés de la maquette, reliés aux pages qui existent déjà.
const FOOTER_COLUMNS = [
  {
    title: 'PRODUCT',
    links: [
      { label: 'Pricing', to: '/contact' },
      { label: 'Overview', to: '/' },
      { label: 'Browse', to: '/blog' },
      { label: 'Accessibility', to: '/contact' },
      { label: 'Five', to: '/' },
    ],
  },
  {
    title: 'SOLUTIONS',
    links: [
      { label: 'Brainstorming', to: '/blog' },
      { label: 'Ideation', to: '/blog' },
      { label: 'Wireframing', to: '/blog' },
      { label: 'Research', to: '/blog' },
    ],
  },
  {
    title: 'RESOURCES',
    links: [
      { label: 'Help Center', to: '/contact' },
      { label: 'Blog', to: '/blog' },
      { label: 'Tutorials', to: '/blog' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About', to: '/' },
      { label: 'Press', to: '/blog' },
      { label: 'Events', to: '/blog' },
      { label: 'Careers', to: '/contact' },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: 'YT', name: 'YouTube', href: 'https://www.youtube.com' },
  { label: 'FB', name: 'Facebook', href: 'https://www.facebook.com' },
  { label: 'TW', name: 'X (Twitter)', href: 'https://x.com' },
  { label: 'IG', name: 'Instagram', href: 'https://www.instagram.com' },
  { label: 'IN', name: 'LinkedIn', href: 'https://www.linkedin.com' },
];

const Footer = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  /** La newsletter n'a pas encore de backend : on confirme sans recharger la page. */
  function handleNewsletterSubmit(event) {
    event.preventDefault();
    setIsSubscribed(true);
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
            <h3>NEWSLETTER</h3>
            <p className="newsletter-desc">
              Le web en constante évolution, direct dans votre boîte mail.
            </p>
            {isSubscribed ? (
              <p className="newsletter-success" role="status">
                Merci ! La newsletter ouvre bientôt, en attendant retrouvez nos articles sur le
                blog.
              </p>
            ) : (
              <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  placeholder="Votre email"
                  aria-label="Votre email"
                  required
                />
                <button type="submit">Envoyer</button>
              </form>
            )}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Weeb, Inc. All rights reserved.</p>
        <div className="social-links">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
