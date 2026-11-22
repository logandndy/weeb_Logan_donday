/** Formate une date ISO en date lisible en français (ex. « 12 octobre 2026 »). */
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
