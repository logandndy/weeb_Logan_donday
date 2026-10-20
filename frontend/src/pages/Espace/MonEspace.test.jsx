import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthContext from '../../context/AuthContext';
import { articlesApi, authApi, tokenStorage } from '../../services/api';
import MonEspace from './MonEspace';

const ADA = {
  id: 1,
  email: 'ada@weeb.fr',
  first_name: 'Ada',
  last_name: 'Lovelace',
  is_staff: false,
  date_joined: '2026-03-16T10:00:00Z',
};

const BROUILLON = {
  id: 7,
  title: 'Mon brouillon',
  slug: 'mon-brouillon',
  excerpt: '',
  cover_image: '',
  author: { id: 1, full_name: 'Ada Lovelace' },
  is_published: false,
  created_at: '2026-10-01T10:00:00Z',
};

/** Affiche la page avec un contexte d'authentification contrôlé par le test. */
function renderPage(auth = {}) {
  const value = { user: ADA, isAuthenticated: true, updateUser: vi.fn(), clearSession: vi.fn(), ...auth };
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/mon-espace']}>
        <Routes>
          <Route path="/mon-espace" element={<MonEspace />} />
          <Route path="/login" element={<p>Page de connexion</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return value;
}

/** Remplit un champ repéré par son label. */
function remplir(label, valeur) {
  fireEvent.change(screen.getByLabelText(label), { target: { value: valeur } });
}

describe('<MonEspace>', () => {
  beforeEach(() => {
    vi.spyOn(articlesApi, 'mine').mockResolvedValue({ results: [BROUILLON], next: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('liste mes articles avec un badge sur les brouillons', async () => {
    renderPage();

    expect(await screen.findByText('Mon brouillon')).toBeInTheDocument();
    expect(screen.getByText('Brouillon')).toBeInTheDocument();
  });

  it('enregistre la nouvelle session après un changement de mot de passe', async () => {
    vi.spyOn(authApi, 'changePassword').mockResolvedValue({
      detail: 'Mot de passe modifié.',
      access: 'nouvel-access',
      refresh: 'nouveau-refresh',
    });
    renderPage();

    remplir('Actuel *', 'Ancien!2026');
    remplir('Nouveau *', 'Nouveau!2026');
    remplir('Confirmation *', 'Nouveau!2026');
    fireEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));

    expect(await screen.findByText('Mot de passe modifié.')).toBeInTheDocument();
    expect(tokenStorage.getRefresh()).toBe('nouveau-refresh');
  });

  it('supprime le compte après confirmation du mot de passe', async () => {
    const deleteMe = vi.spyOn(authApi, 'deleteMe').mockResolvedValue(null);
    const { clearSession } = renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer mon compte' }));
    remplir('Votre mot de passe *', 'MotDePasse!2026');
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));

    expect(await screen.findByText('Page de connexion')).toBeInTheDocument();
    expect(deleteMe).toHaveBeenCalledWith('MotDePasse!2026');
    expect(clearSession).toHaveBeenCalled();
  });
});
