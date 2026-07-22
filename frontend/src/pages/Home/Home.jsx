import React from 'react';
import Navbar from '../../components/navbar';
import Hero from './Hero';
import Partners from './Partners';
import Features from './Features';
import '../../styles/Home.css';
import CTA from './CTA';

const Home = () => {
  return (
    <div className="home-page">
      <Hero />
      <Partners />
      <Features />
      <CTA />
    </div>
  );
};

export default Home;