import { Link } from 'react-router-dom';
import { articlesApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import ArticleCard from '../Blog/ArticleCard';
import '../../styles/Blog.css';

/** Nombre d'articles mis en avant sur l'accueil. */
const COUNT = 3;

/**
 * Les derniers articles publiés, sur l'accueil.
 *
 * La section ne s'affiche que s'il y a des articles à montrer : pendant le
 * chargement, en cas d'erreur ou sur un blog vide, l'accueil reste tel quel.
 */
const LatestArticles = () => {
  const { data } = useFetch(() => articlesApi.list(1), []);
  const articles = (data?.results ?? []).slice(0, COUNT);

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="latest-section" aria-labelledby="derniers-articles">
      <div className="latest-header">
        <h2 id="derniers-articles">
          Derniers <span className="highlight">articles</span>
        </h2>
        <Link to="/blog" className="text-link">
          Voir tout le blog &rarr;
        </Link>
      </div>
      <div className="articles-grid">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};

export default LatestArticles;
