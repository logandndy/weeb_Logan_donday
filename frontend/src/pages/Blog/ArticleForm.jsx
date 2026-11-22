import { Link, useNavigate, useParams } from 'react-router-dom';
import { articlesApi } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useForm from '../../hooks/useForm';
import FormField from '../../components/FormField';
import FormMessage from '../../components/FormMessage';
import usePageTitle from '../../hooks/usePageTitle';
import '../../styles/Blog.css';

const EMPTY_ARTICLE = {
  title: '',
  excerpt: '',
  cover_image: '',
  content: '',
  is_published: true,
};

/**
 * Ajout et modification d'un article.
 *
 * La présence d'un `slug` dans l'URL bascule en mode édition : l'article est
 * d'abord chargé, puis le formulaire s'affiche pré-rempli.
 */
const ArticleForm = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const isEditing = slug !== undefined;
  usePageTitle(isEditing ? 'Modifier l’article' : 'Nouvel article');
  const { data, isLoading, error } = useFetch(
    () => (isEditing ? articlesApi.retrieve(slug) : Promise.resolve(null)),
    [slug],
  );

  if (isLoading) {
    return <p className="blog-status">Chargement de l&apos;article...</p>;
  }

  if (error) {
    return <p className="blog-status blog-status--error" role="alert">{error.message}</p>;
  }

  // Même règle que le backend (IsAuthorOrReadOnly) : l'auteur ou un admin.
  // Le backend refuserait de toute façon la modification. On évite seulement
  // d'afficher un formulaire inutilisable.
  if (data && data.author.id !== user.id && !user.is_staff) {
    return (
      <div className="blog-status">
        <p>Seul l&apos;auteur de cet article peut le modifier.</p>
        <Link to={`/blog/${slug}`}>Retour à l&apos;article</Link>
      </div>
    );
  }

  const initialValues = data
    ? {
        title: data.title,
        excerpt: data.excerpt,
        cover_image: data.cover_image,
        content: data.content,
        is_published: data.is_published,
      }
    : EMPTY_ARTICLE;

  return <ArticleFormFields slug={slug} initialValues={initialValues} />;
};

/** Le formulaire lui-même, une fois les valeurs de départ connues. */
function ArticleFormFields({ slug, initialValues }) {
  const navigate = useNavigate();
  const isEditing = slug !== undefined;
  const { values, fieldErrors, error, isSubmitting, handleChange, submit } = useForm(initialValues);

  function handleSubmit(event) {
    event.preventDefault();
    submit(async (form) => {
      const article = isEditing ? await articlesApi.update(slug, form) : await articlesApi.create(form);
      navigate(`/blog/${article.slug}`);
    });
  }

  const field = (name) => ({ name, value: values[name], error: fieldErrors[name], onChange: handleChange });

  return (
    <div className="article-form-page">
      <div className="article-form-container">
        <h1>{isEditing ? 'Modifier l’article' : 'Écrire un article'}</h1>

        <FormMessage type="error">{error}</FormMessage>

        <form className="article-form" onSubmit={handleSubmit} noValidate>
          <FormField id="article-title" label="Titre *" required className="full-width" {...field('title')} />
          <FormField id="article-excerpt" label="Accroche" className="full-width" {...field('excerpt')} />
          <FormField id="article-cover" type="url" label="Image de couverture (URL)" className="full-width"
            {...field('cover_image')} />
          <FormField id="article-content" label="Contenu *" multiline rows="14" required className="full-width"
            {...field('content')} />

          <label className="checkbox-group" htmlFor="article-published">
            <input
              type="checkbox"
              id="article-published"
              name="is_published"
              checked={values.is_published}
              onChange={handleChange}
            />
            <span>Publier l&apos;article immédiatement</span>
          </label>

          <div className="article-form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/blog')}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ArticleForm;
