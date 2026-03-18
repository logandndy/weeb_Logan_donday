import React from 'react';

const Signup = () => {
  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1>Rejoignez-nous</h1>
        
        <form className="signup-form">
          <div className="input-group">
            <input type="text" id="signup-name" required placeholder=" " />
            <label htmlFor="signup-name">Nom complet *</label>
          </div>

          <div className="input-group">
            <input type="email" id="signup-email" required placeholder=" " />
            <label htmlFor="signup-email">Email *</label>
          </div>
          
          <div className="input-group">
            <input type="password" id="signup-password" required placeholder=" " />
            <label htmlFor="signup-password">Mot de passe *</label>
          </div>

          <div className="input-group">
            <input type="password" id="signup-confirm-password" required placeholder=" " />
            <label htmlFor="signup-confirm-password">Confirmer le mot de passe *</label>
          </div>

          <button type="submit" className="btn-primary signup-btn">Créer mon compte</button>
        </form>

        <div className="signup-links">
          <p className="login-account">
            Vous avez déjà un compte ? <br />
            <a href="/login">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;