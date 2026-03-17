import React from 'react';
import '../../styles/Home.css';
import svgImg from '../../assets/img-2.png'; 

const Cta = () => {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-graphic">
          <div className="graphic-placeholder">
            <img src={svgImg} alt="svgImg" />
          </div>
        </div>
        <div className="cta-text">
          <p className="eyebrow">LE WEB, UN ÉCOSYSTÈME EN CONSTANTE ÉVOLUTION</p>
          <h2>Restez informé des dernières <span className="highlight">tendances</span></h2>
          <p className="description">
            Chaque semaine, nous analysons les nouveautés du web : frameworks émergents, bonnes pratiques SEO, accessibilité, et bien plus encore. Ne manquez aucune actualité du digital !
          </p>
          <a href="./Blog" className="text-link">Lire les articles récents &rarr;</a>
        </div>
      </div>
    </section>
  );
};

export default Cta;