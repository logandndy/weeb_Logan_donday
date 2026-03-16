import React from 'react';

const Hero = () => {
  return (
    <section className="hero-container">
      <div className="hero-content">
        <h1 className="hero-title">
          Explorez le <span className="text-purple">Web</span> sous toutes <br />
          ses <span className="underline-purple">facettes</span>
        </h1>
        <p className="hero-description">
          Le monde du web évolue constamment, et nous sommes là pour vous guider à travers ses tendances, 
          technologies et meilleures pratiques. Que vous soyez développeur, designer ou passionné du digital, 
          notre blog vous offre du contenu de qualité pour rester à la pointe.
        </p>
        <div className="hero-btns-row">
          <button className="btn-filled-purple">Découvrir les articles</button>
          <button className="btn-outline-white">S'abonner à la newsletter</button>
        </div>
        <div className="hero-image-wrapper">
          <img src="/src/assets/hero.png" alt="Interface" className="hero-main-img" />
        </div>
      </div>
    </section>
  );
};

export default Hero;