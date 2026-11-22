import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { articlesApi } from '../../services/api';
import LatestArticles from './LatestArticles';

/** Article minimal pour une carte. */
const article = (id) => ({
  id,
  slug: `article-${id}`,
  title: `Article ${id}`,
  excerpt: '',
  cover_image: '',
  created_at: '2026-11-22T10:00:00Z',
  reading_time: 2,
  is_published: true,
  author: { id: 1, full_name: 'Ada Lovelace' },
});

function renderSection() {
  return render(
    <MemoryRouter>
      <LatestArticles />
    </MemoryRouter>,
  );
}

describe('<LatestArticles>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('montre les trois derniers articles publiés', async () => {
    vi.spyOn(articlesApi, 'list').mockResolvedValue({ results: [1, 2, 3, 4].map(article), next: null });

    renderSection();

    expect(await screen.findByRole('heading', { name: 'Derniers articles' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.queryByText('Article 4')).not.toBeInTheDocument();
  });

  it('ne s’affiche pas si le blog est vide', async () => {
    const list = vi.spyOn(articlesApi, 'list').mockResolvedValue({ results: [], next: null });

    const { container } = renderSection();

    await vi.waitFor(() => expect(list).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
