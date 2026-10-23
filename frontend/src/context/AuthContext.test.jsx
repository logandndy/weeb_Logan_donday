import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useAuth from '../hooks/useAuth';
import { authApi, request, session } from '../services/api';
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
  it('sans session dans ce navigateur, ne contacte pas l’API et reste déconnecté', async () => {
    const me = vi.spyOn(authApi, 'me');

    renderProvider();

    expect(await screen.findByText('déconnecté')).toBeInTheDocument();
    expect(me).not.toHaveBeenCalled();
  });

  it('restaure la session au rechargement de la page', async () => {
    // Après un rechargement : plus de token en mémoire, seulement l'indicateur.
    localStorage.setItem('weeb_session', '1');
    vi.spyOn(authApi, 'me').mockResolvedValue(ADA);

    renderProvider();

    expect(await screen.findByText('connecté : Ada')).toBeInTheDocument();
  });

  it('reste déconnecté si la session ne peut pas être restaurée', async () => {
    localStorage.setItem('weeb_session', '1');
    vi.spyOn(authApi, 'me').mockRejectedValue(new Error('Session expirée'));

    renderProvider();

    expect(await screen.findByText('déconnecté')).toBeInTheDocument();
  });

  it('login() garde le token d’accès en mémoire et l’utilisateur', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({ access: 'a', user: ADA });
    renderProvider();
    await screen.findByText('déconnecté');

    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    expect(await screen.findByText('connecté : Ada')).toBeInTheDocument();
    expect(session.getAccess()).toBe('a');
  });

  it('logout() demande au serveur de fermer la session puis vide la session locale', async () => {
    session.start('token-a');
    vi.spyOn(authApi, 'me').mockResolvedValue(ADA);
    const logoutApi = vi.spyOn(authApi, 'logout').mockResolvedValue(null);
    renderProvider();
    await screen.findByText('connecté : Ada');

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(logoutApi).toHaveBeenCalled();
    expect(screen.getByText('déconnecté')).toBeInTheDocument();
    expect(session.getAccess()).toBeNull();
  });

  it('logout() ferme la session même si le serveur ne répond pas', async () => {
    session.start('token-a');
    vi.spyOn(authApi, 'me').mockResolvedValue(ADA);
    vi.spyOn(authApi, 'logout').mockRejectedValue(new Error('Réseau indisponible'));
    renderProvider();
    await screen.findByText('connecté : Ada');

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(screen.getByText('déconnecté')).toBeInTheDocument();
    expect(session.mayExist()).toBe(false);
  });

  it('repasse en visiteur quand le serveur met fin à la session', async () => {
    session.start('token-a');
    vi.spyOn(authApi, 'me').mockResolvedValue(ADA);
    renderProvider();
    await screen.findByText('connecté : Ada');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: 'Votre session a expiré.' }),
    });

    await act(() => request('/articles/').catch(() => {}));

    expect(screen.getByText('déconnecté')).toBeInTheDocument();
  });
});
