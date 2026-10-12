import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AuthContext from '../../context/AuthContext';
import { ApiError } from '../../services/api';
import Login from './Login';

/** Monte la page de connexion avec une fonction login simulée. */
function renderLogin(login) {
  return render(
    <AuthContext.Provider value={{ user: null, isAuthenticated: false, isLoading: false, login }}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/blog" element={<p>Page du blog</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

/** Remplit le formulaire (les champs sont retrouvés par leur libellé, comme un utilisateur). */
function remplirEtEnvoyer() {
  fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'ada@weeb.fr' } });
  fireEvent.change(screen.getByLabelText('Mot de passe *'), {
    target: { value: 'MotDePasse!2026' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
}

describe('<Login>', () => {
  it('explique un refus 401 sans dire si c’est l’email ou le mot de passe', async () => {
    const login = vi.fn().mockRejectedValue(new ApiError('No active account', { status: 401 }));
    renderLogin(login);

    remplirEtEnvoyer();

    expect(
      await screen.findByText(
        'Identifiants incorrects, ou compte pas encore validé par un administrateur.',
      ),
    ).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith('ada@weeb.fr', 'MotDePasse!2026');
  });

  it('redirige vers le blog après une connexion réussie', async () => {
    const login = vi.fn().mockResolvedValue({ id: 1, first_name: 'Ada' });
    renderLogin(login);

    remplirEtEnvoyer();

    expect(await screen.findByText('Page du blog')).toBeInTheDocument();
  });
});
