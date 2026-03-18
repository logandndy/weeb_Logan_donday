import React from 'react';

const Contact = () => {
  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Votre avis compte !</h1>
        <p>
          Votre retour est essentiel pour nous améliorer ! Partagez votre expérience, dites-nous ce que vous aimez et ce que nous pourrions améliorer. Vos suggestions nous aident à faire de ce blog une ressource toujours plus utile et enrichissante.
        </p>
      </div>
      
      <div className="contact-form-container">
        <form className="contact-form">
          <div className="form-row">
            <div className="input-group">
              <input type="text" id="nom" required placeholder=" " />
              <label htmlFor="nom">Nom *</label>
            </div>
            <div className="input-group">
              <input type="text" id="prenom" required placeholder=" " />
              <label htmlFor="prenom">Prénom *</label>
            </div>
          </div>
          
          <div className="form-row">
            {/* L'input étrange sur ta maquette a été corrigé pour être propre */}
            <div className="input-group full-width">
              <input type="email" id="email" required placeholder=" " />
              <label htmlFor="email">Email *</label>
            </div>
          </div>

          <div className="input-group full-width">
            <textarea id="message" rows="4" required placeholder=" "></textarea>
            <label htmlFor="message">Message *</label>
          </div>

          <button type="submit" className="btn-primary">Contact</button>
        </form>
      </div>
    </div>
  );
};

export default Contact;