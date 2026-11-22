/**
 * Boutons Précédent / Suivant d'une liste paginée par l'API (10 éléments par page).
 * Rien n'est affiché quand tout tient sur une seule page.
 */
export default function Pagination({ page, hasNextPage, onChange, label }) {
  if (page === 1 && !hasNextPage) {
    return null;
  }

  return (
    <nav className="blog-pagination" aria-label={label}>
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1}>
        &larr; Précédent
      </button>
      <span>Page {page}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={!hasNextPage}>
        Suivant &rarr;
      </button>
    </nav>
  );
}
