import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import des pages
import Home from './pages/Home/Home';
import Contact from './pages/Contact/Contact';
import Login from './pages/Connexion/Login';
import Signup from './pages/Inscription/Signup';
import Blog from './pages/Blog/Blog';

// Import des styles
import './styles/index.css';
import './styles/App.css';

// Import de la Navbar et du Footer pour les afficher sur toutes les pages
import Navbar from './components/navbar';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/** La Navbar est en dehors des Routes pour l'avoir sur toutes les pages */}
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/blog" element={<Blog />} />
        </Routes>
{/** Footer dehors des routes pour l'avoir sur toutes les pages */}
        <Footer />
        
      </div>
    </Router>
  );
}

export default App;