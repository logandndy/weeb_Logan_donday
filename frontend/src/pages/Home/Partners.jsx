import '../../styles/Home.css';

const PARTNERS = ['SmartFinder', 'Zoomerr', 'SHELLS', 'WAVES', 'ArtVenue'];

/** Liste des logos ; la copie est masquée aux lecteurs d'écran. */
function LogosRow({ isDuplicate = false }) {
  return (
    <div className="logos-row" aria-hidden={isDuplicate || undefined}>
      {PARTNERS.map((partner) => (
        <div key={partner} className="partner-logo">
          {partner}
        </div>
      ))}
    </div>
  );
}

const Partners = () => {
  return (
    <section className="partners-section">
      <div className="container">
        <h2 className="partners-title">Ils nous font confiance</h2>

        {/* Bande défilante : la liste est doublée pour boucler sans coupure. */}
        <div className="logos-marquee">
          <div className="logos-track">
            <LogosRow />
            <LogosRow isDuplicate />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
