import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/format';

/**
 * Teinte de la couverture générée d'un article sans image.
 *
 * Calculée à partir du slug : un même article garde toujours la même couleur,
 * et deux articles voisins ont rarement la même. On reste dans les violets
 * et les magentas de la marque (teintes 255 à 325).
 */
function hueFor(slug) {
  let total = 0;
  for (const char of slug) {
    total = (total * 31 + char.charCodeAt(0)) % 997;
  }
  return 255 + (total % 70);
}

/**
 * Carte d'un article dans une liste (page Blog, page Mon espace).
 *
 * `featured` : l'article mis en avant en haut du blog, affiché en grand.
 * Un brouillon porte un badge : il n'apparaît que dans les listes de son auteur.
 */
export default function ArticleCard({ article, featured = false }) {
  return (
    <article className={featured ? 'article-card article-card--featured' : 'article-card'}>
      <Link to={`/blog/${article.slug}`} className="article-card-link">
        <div className="article-card-cover">
          {article.cover_image ? (
            <img src={article.cover_image} alt="" loading="lazy" />
          ) : (
            <div className="article-card-generated" style={{ '--teinte': hueFor(article.slug) }} aria-hidden="true">
              <span>{article.title.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="article-card-body">
          {featured && <p className="article-card-label">À la une</p>}
          <h2>{article.title}</h2>
          {article.excerpt && <p className="article-card-excerpt">{article.excerpt}</p>}
          <p className="article-card-meta">
            <span>
              {article.author.full_name} · {formatDate(article.created_at)}
            </span>
            <span className="article-card-reading">{article.reading_time} min de lecture</span>
            {article.is_published === false && <span className="article-draft-badge">Brouillon</span>}
          </p>
        </div>
      </Link>
    </article>
  );
}
