import { Link } from 'react-router-dom';
// L'image est importée plutôt que référencée par un chemin `/src/...` : Vite
// la traite ainsi comme un asset et l'URL reste valide après le build.
import heroImg from '../../assets/img-1.png';

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
          <Link to="/blog" className="btn-filled-purple">
            Découvrir les articles
          </Link>
          <a href="#newsletter" className="btn-outline-white">
            S'abonner à la newsletter
          </a>
        </div>
        <div className="hero-image-wrapper">
          <img src={heroImg} alt="Interface du blog Weeb" className="hero-main-img" />
        </div>
      </div>
    </section>
  );
};

export default Hero;