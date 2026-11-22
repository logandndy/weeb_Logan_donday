import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

/** Page affichée pour toute URL qui ne correspond à aucune route. */
const NotFound = () => {
  usePageTitle('Page introuvable');
  return (
    <div className="not-found-page">
      <p className="not-found-code">404</p>
      <h1>Cette page n&apos;existe pas</h1>
      <p className="not-found-text">
        Le lien est peut-être erroné, ou la page a été déplacée.
      </p>
      <Link to="/" className="btn btn-primary">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
};

export default NotFound;
