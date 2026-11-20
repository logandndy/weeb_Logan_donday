import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/format';

/**
 * Carte d'un article dans une liste (page Blog, page Mon espace).
 *
 * Un brouillon porte un badge : il n'apparaît que dans les listes de son auteur.
 */
export default function ArticleCard({ article }) {
  return (
    <article className="article-card">
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
            {article.is_published === false && <span className="article-draft-badge">Brouillon</span>}
          </p>
        </div>
      </Link>
    </article>
  );
}
