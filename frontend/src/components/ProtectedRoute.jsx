import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Réserve une route aux utilisateurs authentifiés.
 *
 * Le backend refuse déjà les requêtes non autorisées ; cette protection sert à
 * éviter d'afficher une interface inutilisable, pas à sécuriser les données.
 *
 * La page demandée est mémorisée dans l'état de navigation afin de rediriger
 * l'utilisateur au bon endroit après sa connexion.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="route-loading">
        <span className="spinner" aria-hidden="true"></span>
        <p>Vérification de votre session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
