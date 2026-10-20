import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ArticleCard from './ArticleCard';

const ARTICLE = {
  id: 1,
  title: 'Les tendances du web',
  slug: 'les-tendances-du-web',
  excerpt: '',
  cover_image: '',
  author: { id: 1, full_name: 'Ada Lovelace' },
  is_published: true,
  reading_time: 3,
  created_at: '2026-10-20T10:00:00Z',
};

function renderCard(props) {
  return render(
    <MemoryRouter>
      <ArticleCard article={ARTICLE} {...props} />
    </MemoryRouter>,
  );
}

describe('<ArticleCard>', () => {
  it('génère une couverture avec l’initiale quand l’article n’a pas d’image', () => {
    const { container } = renderCard();

    const couverture = container.querySelector('.article-card-generated');
    expect(couverture).toHaveTextContent('L');
    // Même slug, même teinte : la couleur d'un article ne change jamais.
    expect(couverture.style.getPropertyValue('--teinte')).toMatch(/^\d+$/);
  });

  it('affiche le temps de lecture', () => {
    renderCard();

    expect(screen.getByText('3 min de lecture')).toBeInTheDocument();
  });

  it('signale l’article mis en avant', () => {
    renderCard({ featured: true });

    expect(screen.getByText('À la une')).toBeInTheDocument();
  });
});
