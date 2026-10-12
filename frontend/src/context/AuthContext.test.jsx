import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useAuth from '../hooks/useAuth';
import { authApi, tokenStorage } from '../services/api';
import { AuthProvider } from './AuthContext';

const ADA = { id: 1, first_name: 'Ada', is_staff: false };

/** Petit composant qui affiche l'état du contexte et expose login / logout. */
function Sonde() {
  const { user, isLoading, login, logout } = useAuth();

  let etat = 'déconnecté';
  if (isLoading) etat = 'chargement';
  else if (user) etat = `connecté : ${user.first_name}`;

  return (
    <>
      <p>{etat}</p>
      <button type="button" onClick={() => login('ada@weeb.fr', 'MotDePasse!2026')}>
        login
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Sonde />
    </AuthProvider>,
  );
}

describe('<AuthProvider>', () => {
  it('sans token, ne contacte pas l’API et reste déconnecté', async () => {
    const me = vi.spyOn(authApi, 'me');

    renderProvider();

    expect(await screen.findByText('déconnecté')).toBeInTheDocument();
    expect(me).not.toHaveBeenCalled();
  });

  it('restaure la session si le token est encore valide', async () => {
    tokenStorage.save({ access: 'token-a', refresh: 'token-r' });
    vi.spyOn(authApi, 'me').mockResolvedValue(ADA);

    renderProvider();

    expect(await screen.findByText('connecté : Ada')).toBeInTheDocument();
  });

  it('efface les tokens si le profil ne peut pas être chargé', async () => {
    tokenStorage.save({ access: 'token-a', refresh: 'token-r' });
    vi.spyOn(authApi, 'me').mockRejectedValue(new Error('Token invalide'));

    renderProvider();

    expect(await screen.findByText('déconnecté')).toBeInTheDocument();
    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getRefresh()).toBeNull();
  });

  it('login() enregistre les tokens et l’utilisateur', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({ access: 'a', refresh: 'r', user: ADA });
    renderProvider();
    await screen.findByText('déconnecté');

    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    expect(await screen.findByText('connecté : Ada')).toBeInTheDocument();
    expect(tokenStorage.getAccess()).toBe('a');
    expect(tokenStorage.getRefresh()).toBe('r');
  });

  it('logout() vide les tokens et l’utilisateur', async () => {
    tokenStorage.save({ access: 'token-a', refresh: 'token-r' });
    vi.spyOn(authApi, 'me').mockResolvedValue(ADA);
    renderProvider();
    await screen.findByText('connecté : Ada');

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(screen.getByText('déconnecté')).toBeInTheDocument();
    expect(tokenStorage.getAccess()).toBeNull();
  });
});
