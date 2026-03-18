import React from 'react';

const Login = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Se connecter</h1>
        
        <form className="login-form">
          <div className="input-group">
            <input type="email" id="login-email" required placeholder=" " />
            <label htmlFor="login-email">Email *</label>
          </div>
          
          <div className="input-group">
            <input type="password" id="login-password" required placeholder=" " />
            <label htmlFor="login-password">Password *</label>
          </div>

          <button type="submit" className="btn-primary login-btn">Se connecter</button>
        </form>

        <div className="login-links">
          <a href="/" className="forgot-password">Mot de passe oublié ?</a>
          <p className="create-account">
            Vous n'avez pas de compte ? Vous<br />pouvez en <a href="/signup">créer un compte</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;