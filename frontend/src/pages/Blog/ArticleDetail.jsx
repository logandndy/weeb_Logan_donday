import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { articlesApi } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import '../../styles/Blog.css';

/** Formate une date ISO en date lisible en français. */
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Page template d'affichage d'un article, identifié par son slug dans l'URL. */
const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isStale = false;

    async function loadArticle() {
      setIsLoading(true);
      setError('');

      try {
        const data = await articlesApi.retrieve(slug);
        if (!isStale) {
          setArticle(data);
        }
      } catch (apiError) {
        if (!isStale) {
          setError(
            apiError.status === 404
              ? "Cet article n'existe pas ou a été supprimé."
              : apiError.message,
          );
        }
      } finally {
        if (!isStale) {
          setIsLoading(false);
        }
      }
    }

    loadArticle();
    return () => {
      isStale = true;
    };
  }, [slug]);

  /** Supprime l'article après confirmation, puis renvoie vers la liste. */
  async function handleDelete() {
    if (!window.confirm('Supprimer définitivement cet article ?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await articlesApi.remove(slug);
      navigate('/blog');
    } catch (apiError) {
      setError(apiError.message);
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <p className="blog-status">Chargement de l&apos;article...</p>;
  }

  if (error) {
    return (
      <div className="article-page">
        <p className="blog-status blog-status--error" role="alert">
          {error}
        </p>
        <Link to="/blog" className="text-link">
          &larr; Retour au blog
        </Link>
      </div>
    );
  }

  const isAuthor = user !== null && user.id === article.author.id;

  return (
    <article className="article-page">
      <Link to="/blog" className="text-link article-back">
        &larr; Retour au blog
      </Link>

      <header className="article-header">
        <h1>{article.title}</h1>
        <p className="article-meta">
          Par {article.author.full_name} · {formatDate(article.created_at)}
          {!article.is_published && <span className="article-draft-badge">Brouillon</span>}
        </p>
        {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}
      </header>

      {article.cover_image && (
        <img src={article.cover_image} alt="" className="article-cover" />
      )}

      {/* Le contenu est saisi en texte brut : chaque paragraphe est séparé par
          une ligne vide. On ne rend jamais de HTML fourni par l'utilisateur. */}
      <div className="article-content">
        {article.content
          .split(/\n\s*\n/)
          .filter((paragraph) => paragraph.trim() !== '')
          .map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
      </div>

      {isAuthor && (
        <div className="article-actions">
          <Link to={`/blog/${article.slug}/modifier`} className="btn-primary">
            Modifier
          </Link>
          <button
            type="button"
            className="btn-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      )}
    </article>
  );
};

export default ArticleDetail;
