import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer" id="newsletter">
      <div className="footer-container">
        <div className="footer-brand">
          <h2 className="logo">weeb</h2>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h3>PRODUCT</h3>
            <a href="#">Pricing</a>
            <a href="#">Overview</a>
            <a href="#">Browse</a>
            <a href="#">Accessibility</a>
            <a href="#">Five</a>
          </div>
          <div className="footer-column">
            <h3>SOLUTIONS</h3>
            <a href="#">Brainstorming</a>
            <a href="#">Ideation</a>
            <a href="#">Wireframing</a>
            <a href="#">Research</a>
          </div>
          <div className="footer-column">
            <h3>RESOURCES</h3>
            <a href="#">Help Center</a>
            <a href="#">Blog</a>
            <a href="#">Tutorials</a>
          </div>
          <div className="footer-column">
            <h3>COMPANY</h3>
            <a href="#">About</a>
            <a href="#">Press</a>
            <a href="#">Events</a>
            <a href="#">Careers</a>
          </div>
          <div className="footer-column newsletter-col">
            <h3>NEWSLETTER</h3>
            <p className="newsletter-desc">
              Le web en constante évolution, direct dans votre boîte mail.
            </p>
            <form className="newsletter-form">
              <input type="email" placeholder="Votre email" required />
              <button type="submit">Envoyer</button>
            </form>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Weeb, Inc. All rights reserved.</p>
        <div className="social-links">
          <a href="#">YT</a>
          <a href="#">FB</a>
          <a href="#">TW</a>
          <a href="#">IG</a>
          <a href="#">IN</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;