import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ConfirmDialog from './ConfirmDialog';
import '../styles/Navbar.css';

// NavLink ajoute la classe "active" au lien de la page en cours.
// `end` sur l'accueil : sinon "/" serait actif sur toutes les pages.
const NAV_LINKS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  /** Déconnecte l'utilisateur (après confirmation) et le ramène à l'accueil. */
  function handleLogout() {
    setIsLogoutOpen(false);
    logout();
    closeMenu();
    navigate('/');
  }

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="nav-left-group">
          <div className="logo">
            <Link to="/" className="logo-link">
              weeb
            </Link>
          </div>
          <div className="nav-links desktop-only">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="nav-right-group">
          <div className="auth-links desktop-only">
            {isAuthenticated ? (
              <>
                <Link to="/blog/nouveau" className="login-link">
                  Écrire
                </Link>
                <NavLink to="/mon-espace" className="nav-user" title="Mon espace">
                  {user.first_name}
                </NavLink>
                <button type="button" className="btn btn-primary join-btn" onClick={() => setIsLogoutOpen(true)}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="login-link">
                  Connexion
                </Link>
                <Link to="/signup" className="btn btn-primary join-btn">
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>

          <button
            className="burger-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Ouvrir le menu de navigation"
          >
            <span className={isMenuOpen ? 'bar open' : 'bar'}></span>
            <span className={isMenuOpen ? 'bar open' : 'bar'}></span>
            <span className={isMenuOpen ? 'bar open' : 'bar'}></span>
          </button>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} onClick={closeMenu}>
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <>
                <NavLink to="/mon-espace" onClick={closeMenu}>
                  Mon espace
                </NavLink>
                <Link to="/blog/nouveau" onClick={closeMenu}>
                  Écrire un article
                </Link>
                <button type="button" className="btn btn-primary btn-block" onClick={() => setIsLogoutOpen(true)}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>
                  Connexion
                </Link>
                <Link to="/signup" className="btn btn-primary btn-block" onClick={closeMenu}>
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={isLogoutOpen}
        title="Se déconnecter ?"
        message="Vous devrez saisir à nouveau votre email et votre mot de passe pour revenir."
        confirmLabel="Se déconnecter"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
