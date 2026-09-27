import React from 'react';
import '../../styles/Home.css';

const Partners = () => {
  return (
    <section className="partners-section">
      <div className="container">
        <h2 className="partners-title">Ils nous font confiance</h2>
        
        <div className="logos-row">
          <div className="partner-logo">SmartFinder</div>
          <div className="partner-logo">Zoomerr</div>
          <div className="partner-logo">SHELLS</div>
          <div className="partner-logo">WAVES</div>
          <div className="partner-logo">ArtVenue</div>
        </div>
      </div>
    </section>
  );
};

export default Partners;