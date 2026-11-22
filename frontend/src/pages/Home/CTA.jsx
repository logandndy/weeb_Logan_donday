import { Link } from 'react-router-dom';
import useScrollReveal from '../../hooks/useScrollReveal';
import trendsImg from '../../assets/tendances-analytics.webp';
import '../../styles/Home.css';

const Cta = () => {
  const sectionRef = useScrollReveal();

  return (
    <section className="cta-section" ref={sectionRef}>
      <div className="cta-container">
        <div className="cta-graphic">
          <div className="graphic-placeholder">
            <img src={trendsImg} alt="Tableau de bord de statistiques de performance web"
              width="900" height="600" loading="lazy" />
          </div>
        </div>
        <div className="cta-text">
          <p className="eyebrow">LE WEB, UN ÉCOSYSTÈME EN CONSTANTE ÉVOLUTION</p>
          <h2>
            Restez informé des dernières <span className="highlight">tendances</span>
          </h2>
          <p className="description">
            Chaque semaine, nous analysons les nouveautés du web : frameworks émergents, bonnes
            pratiques SEO, accessibilité, et bien plus encore. Ne manquez aucune actualité du
            digital !
          </p>
          <Link to="/blog" className="text-link">
            Lire les articles récents &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Cta;
