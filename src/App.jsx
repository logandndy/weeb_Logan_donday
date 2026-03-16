import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import './styles/index.css';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<div style={{color: 'white', textAlign: 'center', padding: '100px'}}>Page Contact en construction</div>} />
          <Route path="/login" element={<div style={{color: 'white', textAlign: 'center', padding: '100px'}}>Page Login en construction</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;