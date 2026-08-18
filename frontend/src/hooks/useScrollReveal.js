import { useEffect, useRef } from 'react';

/**
 * Révèle une section lorsqu'elle entre dans le champ de vision.
 *
 * Ajoute la classe `is-visible` à l'élément référencé, sur laquelle s'appuient
 * les animations définies dans Home.css.
 *
 * @param {number} threshold Proportion de l'élément visible avant déclenchement.
 * @returns {import('react').RefObject} Référence à poser sur la section.
 */
export default function useScrollReveal(threshold = 0.2) {
  const sectionRef = useRef(null);

  useEffect(() => {
    // La référence est copiée : au démontage, `sectionRef.current` peut déjà
    // avoir été remis à null et le nettoyage ne cible plus le bon élément.
    const section = sectionRef.current;
    if (!section) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      },
      { threshold },
    );

    observer.observe(section);

    return () => observer.unobserve(section);
  }, [threshold]);

  return sectionRef;
}
