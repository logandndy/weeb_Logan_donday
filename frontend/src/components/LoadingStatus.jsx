import SlowServerNotice from './SlowServerNotice';

/** Texte de chargement d'une page, complété si le serveur met du temps à répondre. */
export default function LoadingStatus({ children }) {
  return (
    <div className="blog-status">
      <p>{children}</p>
      <SlowServerNotice active />
    </div>
  );
}
