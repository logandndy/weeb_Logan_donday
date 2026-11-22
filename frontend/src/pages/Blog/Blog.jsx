import { useState } from 'react';
import { Link } from 'react-router-dom';
import { articlesApi } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import LoadingStatus from '../../components/LoadingStatus';
import Pagination from '../../components/Pagination';
import ArticleCard from './ArticleCard';
import '../../styles/Blog.css';
import usePageTitle from '../../hooks/usePageTitle';

/** Page Blog : liste paginée des articles publiés. */
const Blog = () => {
  usePageTitle('Blog');
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useFetch(() => articlesApi.list(page), [page]);

  const articles = data?.results ?? [];
  const hasNextPage = Boolean(data?.next);

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
          <Link to="/blog/nouveau" className="btn btn-primary blog-new-btn">
            Écrire un article
          </Link>
        )}
      </header>

      {isLoading && <LoadingStatus>Chargement des articles...</LoadingStatus>}

      {error && (
        <p className="blog-status blog-status--error" role="alert">
          {error.message}
        </p>
      )}

      {!isLoading && !error && articles.length === 0 && (
        <p className="blog-status">Aucun article publié pour le moment.</p>
      )}

      <div className="articles-grid">
        {/* Le plus récent est mis en avant, seulement en première page. */}
        {articles.map((article, index) => (
          <ArticleCard key={article.id} article={article} featured={page === 1 && index === 0} />
        ))}
      </div>

      <Pagination page={page} hasNextPage={hasNextPage} onChange={setPage} label="Pagination des articles" />
    </div>
  );
};

export default Blog;
