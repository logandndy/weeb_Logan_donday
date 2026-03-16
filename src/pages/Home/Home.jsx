import React from 'react';
import Navbar from '../../components/navbar';
import Hero from './Hero';
import Partners from './Partners';
import Features from './Features';
import '../../styles/Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      <Partners />
      <Features />
    </div>
  );
};

export default Home;