import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../styles/Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setIsMenuOpen(false);

  /** Déconnecte l'utilisateur et le ramène à l'accueil. */
  function handleLogout() {
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
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
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
                <span className="nav-user">{user.first_name}</span>
                <button type="button" className="join-btn" onClick={handleLogout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="login-link">
                  Connexion
                </Link>
                <Link to="/signup" className="join-btn">
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
              <Link key={link.to} to={link.to} onClick={closeMenu}>
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link to="/blog/nouveau" onClick={closeMenu}>
                  Écrire un article
                </Link>
                <button type="button" className="join-btn-mobile" onClick={handleLogout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>
                  Connexion
                </Link>
                <Link to="/signup" className="join-btn-mobile" onClick={closeMenu}>
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
