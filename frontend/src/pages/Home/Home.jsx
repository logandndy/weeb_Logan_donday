import Hero from './Hero';
import Partners from './Partners';
import Features from './Features';
import '../../styles/Home.css';
import CTA from './CTA';
import LatestArticles from './LatestArticles';
import usePageTitle from '../../hooks/usePageTitle';

const Home = () => {
  usePageTitle();
  return (
    <div className="home-page">
      <Hero />
      <Partners />
      <LatestArticles />
      <Features />
      <CTA />
    </div>
  );
};

export default Home;
