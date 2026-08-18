import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { articlesApi } from '../../services/api';
import FormMessage from '../../components/FormMessage';
import '../../styles/Blog.css';

const EMPTY_ARTICLE = {
  title: '',
  excerpt: '',
  cover_image: '',
  content: '',
  is_published: true,
};

/**
 * Formulaire d'ajout et de modification d'un article.
 *
 * Le même composant sert aux deux usages : la présence d'un `slug` dans l'URL
 * bascule le formulaire en mode édition et pré-remplit les champs.
 */
const ArticleForm = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isEditing = slug !== undefined;

  const [form, setForm] = useState(EMPTY_ARTICLE);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      return undefined;
    }

    let isStale = false;

    async function loadArticle() {
      try {
        const data = await articlesApi.retrieve(slug);
        if (!isStale) {
          setForm({
            title: data.title,
            excerpt: data.excerpt,
            cover_image: data.cover_image,
            content: data.content,
            is_published: data.is_published,
          });
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

    loadArticle();
    return () => {
      isStale = true;
    };
  }, [slug, isEditing]);

  /** Met à jour un champ du formulaire et efface l'erreur qui lui est associée. */
  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setFieldErrors({});

    try {
      const article = isEditing
        ? await articlesApi.update(slug, form)
        : await articlesApi.create(form);
      navigate(`/blog/${article.slug}`);
    } catch (apiError) {
      setError(apiError.message);
      setFieldErrors(apiError.fieldErrors ?? {});
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="blog-status">Chargement de l&apos;article...</p>;
  }

  return (
    <div className="article-form-page">
      <div className="article-form-container">
        <h1>{isEditing ? 'Modifier l’article' : 'Écrire un article'}</h1>

        <FormMessage type="error">{error}</FormMessage>

        <form className="article-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group full-width">
            <input
              type="text"
              id="article-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="article-title">Titre *</label>
            <FormMessage type="field">{fieldErrors.title}</FormMessage>
          </div>

          <div className="input-group full-width">
            <input
              type="text"
              id="article-excerpt"
              name="excerpt"
              value={form.excerpt}
              onChange={handleChange}
              placeholder=" "
            />
            <label htmlFor="article-excerpt">Accroche</label>
            <FormMessage type="field">{fieldErrors.excerpt}</FormMessage>
          </div>

          <div className="input-group full-width">
            <input
              type="url"
              id="article-cover"
              name="cover_image"
              value={form.cover_image}
              onChange={handleChange}
              placeholder=" "
            />
            <label htmlFor="article-cover">Image de couverture (URL)</label>
            <FormMessage type="field">{fieldErrors.cover_image}</FormMessage>
          </div>

          <div className="input-group full-width">
            <textarea
              id="article-content"
              name="content"
              rows="14"
              value={form.content}
              onChange={handleChange}
              required
              placeholder=" "
            ></textarea>
            <label htmlFor="article-content">Contenu *</label>
            <FormMessage type="field">{fieldErrors.content}</FormMessage>
          </div>

          <label className="checkbox-group" htmlFor="article-published">
            <input
              type="checkbox"
              id="article-published"
              name="is_published"
              checked={form.is_published}
              onChange={handleChange}
            />
            <span>Publier l&apos;article immédiatement</span>
          </label>

          <div className="article-form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => navigate('/blog')}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleForm;
