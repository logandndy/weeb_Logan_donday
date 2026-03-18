import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="nav-left-group">
          <div className="logo"><a href="/" className="logo-link">weeb</a></div>
          <div className="nav-links desktop-only">
            <Link to="/">Accueil</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>

        <div className="nav-right-group">
          <div className="auth-links desktop-only">
            <Link to="/login" className="login-link">Connexion</Link>
            <Link to="/signup" className="join-btn">S'inscrire</Link>
          </div>
          
          <button className="burger-menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span className={isMenuOpen ? "bar open" : "bar"}></span>
            <span className={isMenuOpen ? "bar open" : "bar"}></span>
            <span className={isMenuOpen ? "bar open" : "bar"}></span>
          </button>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>Accueil</Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            <Link to="/login" onClick={() => setIsMenuOpen(false)}>Connexion</Link>
            <Link to="/signup" className="join-btn-mobile" onClick={() => setIsMenuOpen(false)}>S'inscrire</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;