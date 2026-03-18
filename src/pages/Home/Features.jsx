import React, { useEffect, useRef } from 'react';
import '../../styles/Home.css';
import dashboardImg from '../../assets/img-1.png'; 

const Features = () => {
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
    <section className="features-section" ref={sectionRef}>
      <div className="features-container">
        <div className="features-text">
          <p className="eyebrow">DES RESSOURCES POUR TOUS LES NIVEAUX</p>
          <h2><span className="highlight">Apprenez</span> et <span className="highlight">progressez</span></h2>
          <p className="description">
            Que vous débutiez en développement web ou que vous soyez un expert cherchant à approfondir vos connaissances, nous vous proposons des tutoriels, guides et bonnes pratiques pour apprendre efficacement.
          </p>
          <a href="/resources" className="text-link">Explorer les ressources &rarr;</a>
        </div>
        <div className="features-image">
          <div className="mockup-placeholder">
            <img src={dashboardImg} alt="Dashboard des ressources" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;