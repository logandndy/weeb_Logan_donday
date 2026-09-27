import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AuthContext from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

/** Page de connexion factice qui affiche d'où vient l'utilisateur. */
function LoginPage() {
  const location = useLocation();
  return <p>Page de connexion (depuis {location.state?.from})</p>;
}

/** Monte l'application sur /articles/new avec l'état de connexion voulu. */
function renderWithAuth(auth) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/articles/new']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/articles/new"
            element={
              <ProtectedRoute>
                <p>Formulaire d’article</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('<ProtectedRoute>', () => {
  it('affiche la page à un utilisateur connecté', () => {
    renderWithAuth({ isAuthenticated: true, isLoading: false });

    expect(screen.getByText('Formulaire d’article')).toBeInTheDocument();
  });

  it('redirige un visiteur vers /login en mémorisant la page demandée', () => {
    renderWithAuth({ isAuthenticated: false, isLoading: false });

    expect(screen.getByText('Page de connexion (depuis /articles/new)')).toBeInTheDocument();
    expect(screen.queryByText('Formulaire d’article')).not.toBeInTheDocument();
  });

  it('attend la vérification de la session avant de décider', () => {
    renderWithAuth({ isAuthenticated: false, isLoading: true });

    expect(screen.getByText('Vérification de votre session...')).toBeInTheDocument();
    expect(screen.queryByText(/Page de connexion/)).not.toBeInTheDocument();
  });
});
