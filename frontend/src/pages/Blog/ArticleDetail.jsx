import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { articlesApi } from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingStatus from '../../components/LoadingStatus';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/format';
import '../../styles/Blog.css';

/** Page template d'affichage d'un article, identifié par son slug dans l'URL. */
const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: article, isLoading, error: loadError } = useFetch(() => articlesApi.retrieve(slug), [slug]);
  usePageTitle(article?.title ?? 'Article');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  /** Supprime l'article (après confirmation), puis renvoie vers la liste. */
  async function handleDelete() {
    setIsConfirmOpen(false);
    setIsDeleting(true);
    try {
      await articlesApi.remove(slug);
      navigate('/blog', { state: { flash: 'Article supprimé.' } });
    } catch (apiError) {
      setDeleteError(apiError.message);
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <LoadingStatus>Chargement de l&apos;article...</LoadingStatus>;
  }

  if (loadError) {
    return (
      <div className="article-page">
        <p className="blog-status blog-status--error" role="alert">
          {loadError.status === 404 ? "Cet article n'existe pas ou a été supprimé." : loadError.message}
        </p>
        <Link to="/blog" className="text-link">
          &larr; Retour au blog
        </Link>
      </div>
    );
  }

  // Même règle que le backend (IsAuthorOrReadOnly) et que ArticleForm :
  // l'auteur ou un administrateur peut modifier et supprimer.
  const canEdit = user !== null && (user.id === article.author.id || user.is_staff);

  return (
    <article className="article-page">
      <Link to="/blog" className="text-link article-back">
        &larr; Retour au blog
      </Link>

      <header className="article-header">
        <h1>{article.title}</h1>
        <p className="article-meta">
          Par {article.author.full_name} · {formatDate(article.created_at)} ·{' '}
          {article.reading_time} min de lecture
          {!article.is_published && <span className="article-draft-badge">Brouillon</span>}
        </p>
        {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}
      </header>

      {article.cover_image && <img src={article.cover_image} alt="" className="article-cover" />}

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

      {deleteError && (
        <p className="blog-status blog-status--error" role="alert">
          {deleteError}
        </p>
      )}

      {canEdit && (
        <div className="article-actions">
          <Link to={`/blog/${article.slug}/modifier`} className="btn btn-primary">
            Modifier
          </Link>
          <button type="button" className="btn btn-danger" onClick={() => setIsConfirmOpen(true)}
            disabled={isDeleting}>
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        title="Supprimer cet article ?"
        message="Cette action est définitive : l'article ne pourra pas être récupéré."
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </article>
  );
};

export default ArticleDetail;
