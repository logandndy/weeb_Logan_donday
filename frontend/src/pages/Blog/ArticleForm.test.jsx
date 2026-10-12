import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthContext from '../../context/AuthContext';
import { articlesApi } from '../../services/api';
import ArticleForm from './ArticleForm';

const ARTICLE = {
  title: 'Un article',
  excerpt: 'Résumé',
  cover_image: '',
  content: 'Contenu de l’article',
  is_published: true,
  author: { id: 1, full_name: 'Ada Lovelace' },
};

/** Ouvre la page de modification avec l'utilisateur voulu. */
function renderEditPage(user) {
  return render(
    <AuthContext.Provider value={{ user, isAuthenticated: true, isLoading: false }}>
      <MemoryRouter initialEntries={['/blog/un-article/modifier']}>
        <Routes>
          <Route path="/blog/:slug/modifier" element={<ArticleForm />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('<ArticleForm> en modification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pré-remplit le formulaire pour l’auteur', async () => {
    vi.spyOn(articlesApi, 'retrieve').mockResolvedValue(ARTICLE);

    renderEditPage({ id: 1, is_staff: false });

    expect(await screen.findByDisplayValue('Un article')).toBeInTheDocument();
  });

  it('refuse l’accès à un autre utilisateur', async () => {
    vi.spyOn(articlesApi, 'retrieve').mockResolvedValue(ARTICLE);

    renderEditPage({ id: 2, is_staff: false });

    expect(
      await screen.findByText("Seul l'auteur de cet article peut le modifier."),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
