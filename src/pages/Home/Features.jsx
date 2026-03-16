import React from 'react';

const Features = () => {
  return (
    <section className="feature-section">
      <div className="container-flex-row">
        <div className="content-left">
          <span className="caption-text">DES RESSOURCES POUR TOUS LES NIVEAUX</span>
          <h2 className="title-72px">
            <span className="purple-text">Apprenez</span> et progressez
          </h2>
          <p className="description-p">
            Que vous débutiez en développement web ou que vous soyez un expert cherchant à approfondir vos connaissances, 
            nous vous proposons des tutoriels, guides et bonnes pratiques pour apprendre efficacement.
          </p>
          <button className="btn-explorer-clean">
            Explorer les ressources <span className="arrow">→</span>
          </button>
        </div>
        <div className="content-right">
          <img src="/src/assets/hero.png" alt="Ressources" className="img-fill-480" />
        </div>
      </div>
    </section>
  );
};

export default Features;