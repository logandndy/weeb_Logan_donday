import { Link } from 'react-router-dom';
import useScrollReveal from '../../hooks/useScrollReveal';
import dashboardImg from '../../assets/img-1.png';
import '../../styles/Home.css';

const Features = () => {
  const sectionRef = useScrollReveal();

  return (
    <section className="features-section" ref={sectionRef}>
      <div className="features-container">
        <div className="features-text">
          <p className="eyebrow">DES RESSOURCES POUR TOUS LES NIVEAUX</p>
          <h2>
            <span className="highlight">Apprenez</span> et{' '}
            <span className="highlight">progressez</span>
          </h2>
          <p className="description">
            Que vous débutiez en développement web ou que vous soyez un expert cherchant à
            approfondir vos connaissances, nous vous proposons des tutoriels, guides et bonnes
            pratiques pour apprendre efficacement.
          </p>
          <Link to="/blog" className="text-link">
            Explorer les ressources &rarr;
          </Link>
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
