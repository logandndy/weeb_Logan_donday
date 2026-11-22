import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
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
  // Routeur « data », comme dans l'application : useBlocker en a besoin.
  const router = createMemoryRouter(
    [
      { path: '/blog/:slug/modifier', element: <ArticleForm /> },
      { path: '/blog', element: <p>Liste du blog</p> },
    ],
    { initialEntries: ['/blog/un-article/modifier'] },
  );
  return render(
    <AuthContext.Provider value={{ user, isAuthenticated: true, isLoading: false }}>
      <RouterProvider router={router} />
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

  it('prévient avant de quitter un formulaire modifié', async () => {
    vi.spyOn(articlesApi, 'retrieve').mockResolvedValue(ARTICLE);
    renderEditPage({ id: 1, is_staff: false });

    fireEvent.change(await screen.findByDisplayValue('Un article'), {
      target: { name: 'title', value: 'Nouveau titre' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(await screen.findByRole('heading', { name: 'Quitter sans enregistrer ?' })).toBeInTheDocument();

    // « Annuler » dans la fenêtre : on reste sur le formulaire, saisie intacte.
    fireEvent.click(screen.getAllByRole('button', { name: 'Annuler' }).at(-1));
    expect(screen.getByDisplayValue('Nouveau titre')).toBeInTheDocument();
    expect(screen.queryByText('Liste du blog')).not.toBeInTheDocument();
  });

  it('laisse partir sans question si rien n’a changé', async () => {
    vi.spyOn(articlesApi, 'retrieve').mockResolvedValue(ARTICLE);
    renderEditPage({ id: 1, is_staff: false });

    await screen.findByDisplayValue('Un article');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(await screen.findByText('Liste du blog')).toBeInTheDocument();
  });
});
