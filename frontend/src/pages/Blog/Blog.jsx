import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

/** Page Blog : liste paginée des articles récupérés depuis l'API. */
const Blog = () => {
  const { isAuthenticated } = useAuth();

  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // `isStale` évite d'appliquer la réponse d'une page qu'on a déjà quittée.
    let isStale = false;

    async function loadArticles() {
      setIsLoading(true);
      setError('');

      try {
        const data = await articlesApi.list(page);
        if (!isStale) {
          setArticles(data.results);
          setHasNextPage(data.next !== null);
        }
      } catch (apiError) {
        if (!isStale) {
          setError(apiError.message);
        }
      } finally {
        if (!isStale) {
          setIsLoading(false);
        }
      }
    }

    loadArticles();
    return () => {
      isStale = true;
    };
  }, [page]);

  return (
    <div className="blog-page">
      <header className="blog-header">
        <h1>
          Notre <span className="highlight">Blog</span>
        </h1>
        <p>
          Tendances, bonnes pratiques et retours d&apos;expérience : tout ce qui fait bouger le web,
          analysé par notre équipe.
        </p>

        {isAuthenticated && (
          <Link to="/blog/nouveau" className="btn-primary blog-new-btn">
            Écrire un article
          </Link>
        )}
      </header>

      {isLoading && <p className="blog-status">Chargement des articles...</p>}

      {error && (
        <p className="blog-status blog-status--error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && articles.length === 0 && (
        <p className="blog-status">Aucun article publié pour le moment.</p>
      )}

      <div className="articles-grid">
        {articles.map((article) => (
          <article key={article.id} className="article-card">
            <Link to={`/blog/${article.slug}`} className="article-card-link">
              <div className="article-card-cover">
                {article.cover_image ? (
                  <img src={article.cover_image} alt="" loading="lazy" />
                ) : (
                  <span className="article-card-placeholder">weeb</span>
                )}
              </div>

              <div className="article-card-body">
                <h2>{article.title}</h2>
                {article.excerpt && <p className="article-card-excerpt">{article.excerpt}</p>}
                <p className="article-card-meta">
                  {article.author.full_name} · {formatDate(article.created_at)}
                </p>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {(page > 1 || hasNextPage) && (
        <nav className="blog-pagination" aria-label="Pagination des articles">
          <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1}>
            &larr; Précédent
          </button>
          <span>Page {page}</span>
          <button type="button" onClick={() => setPage(page + 1)} disabled={!hasNextPage}>
            Suivant &rarr;
          </button>
        </nav>
      )}
    </div>
  );
};

export default Blog;
