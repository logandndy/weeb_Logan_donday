import React, { useEffect, useRef } from 'react';
import '../../styles/Home.css';
import svgImg from '../../assets/img-2.png'; 

const Cta = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          entries[0].target.classList.add('is-visible');
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  return (
    <section className="cta-section" ref={sectionRef}>
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