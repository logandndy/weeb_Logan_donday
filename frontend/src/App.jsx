import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';

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
import MonEspace from './pages/Espace/MonEspace';
import Desinscription from './pages/Newsletter/Desinscription';
import Confidentialite from './pages/Confidentialite';
import NotFound from './pages/NotFound';

// Cadre commun à toutes les pages (navbar, pied de page, messages)
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

// Routeur « data » : nécessaire pour useBlocker, qui prévient avant de quitter
// un formulaire non enregistré. Toutes les pages partagent le même Layout.
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
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

      <Route
        path="/mon-espace"
        element={
          <ProtectedRoute>
            <MonEspace />
          </ProtectedRoute>
        }
      />

      <Route path="/newsletter/desinscription" element={<Desinscription />} />
      <Route path="/confidentialite" element={<Confidentialite />} />

      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
