import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AuthContext from '../../context/AuthContext';
import { articlesApi } from '../../services/api';
import ArticleDetail from './ArticleDetail';

const ARTICLE = {
  title: 'Un article',
  slug: 'un-article',
  excerpt: '',
  cover_image: '',
  content: 'Contenu de l’article',
  is_published: true,
  created_at: '2026-10-01T10:00:00Z',
  author: { id: 1, full_name: 'Ada Lovelace' },
};

/** Ouvre la page d'un article avec l'utilisateur voulu (null = visiteur). */
async function renderArticle(user) {
  vi.spyOn(articlesApi, 'retrieve').mockResolvedValue(ARTICLE);
  render(
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading: false }}>
      <MemoryRouter initialEntries={['/blog/un-article']}>
        <Routes>
          <Route path="/blog/:slug" element={<ArticleDetail />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  await screen.findByRole('heading', { name: 'Un article' });
}

describe('<ArticleDetail> boutons Modifier / Supprimer', () => {
  it('les affiche à l’auteur', async () => {
    await renderArticle({ id: 1, is_staff: false });

    expect(screen.getByRole('link', { name: 'Modifier' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
  });

  it('les affiche à un administrateur (même règle que le backend)', async () => {
    await renderArticle({ id: 99, is_staff: true });

    expect(screen.getByRole('link', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('les masque à un autre utilisateur', async () => {
    await renderArticle({ id: 2, is_staff: false });

    expect(screen.queryByRole('link', { name: 'Modifier' })).not.toBeInTheDocument();
  });

  it('les masque à un visiteur', async () => {
    await renderArticle(null);

    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
  });
});
