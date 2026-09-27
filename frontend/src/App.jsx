import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Pages
import Home from './pages/Home/Home';
import Contact from './pages/Contact/Contact';
import Login from './pages/Connexion/Login';
import ForgotPassword from './pages/Connexion/ForgotPassword';
import ResetPassword from './pages/Connexion/ResetPassword';
import Signup from './pages/Inscription/Signup';
import Blog from './pages/Blog/Blog';
import ArticleDetail from './pages/Blog/ArticleDetail';
import ArticleForm from './pages/Blog/ArticleForm';
import NotFound from './pages/NotFound';

// Composants communs à toutes les pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

import './styles/index.css';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          {/* Navbar et Footer sont hors des Routes pour rester sur toutes les pages. */}
          <Navbar />

          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/blog" element={<Blog />} />
              {/* Placé avant `/blog/:slug` pour que « nouveau » ne soit pas
                  interprété comme le slug d'un article. */}
              <Route
                path="/blog/nouveau"
                element={
                  <ProtectedRoute>
                    <ArticleForm />
                  </ProtectedRoute>
                }
              />
              <Route path="/blog/:slug" element={<ArticleDetail />} />
              <Route
                path="/blog/:slug/modifier"
                element={
                  <ProtectedRoute>
                    <ArticleForm />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
