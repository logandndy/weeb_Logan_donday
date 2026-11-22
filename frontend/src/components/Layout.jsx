import { Outlet, ScrollRestoration } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FlashMessage from './FlashMessage';

/** Cadre commun à toutes les pages : navbar, contenu de la page, pied de page. */
export default function Layout() {
  return (
    <div className="app-container">
      <Navbar />
      <FlashMessage />

      <main className="app-main">
        <Outlet />
      </main>

      <Footer />
      {/* Chaque nouvelle page s'ouvre en haut, le bouton Retour retrouve la position. */}
      <ScrollRestoration />
    </div>
  );
}
