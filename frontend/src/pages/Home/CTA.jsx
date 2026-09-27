import { Link } from 'react-router-dom';
import useScrollReveal from '../../hooks/useScrollReveal';
import svgImg from '../../assets/img-2.png';
import '../../styles/Home.css';

const Cta = () => {
  const sectionRef = useScrollReveal();

  return (
    <section className="cta-section" ref={sectionRef}>
      <div className="cta-container">
        <div className="cta-graphic">
          <div className="graphic-placeholder">
            <img src={svgImg} alt="Illustration des tendances du web" />
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
