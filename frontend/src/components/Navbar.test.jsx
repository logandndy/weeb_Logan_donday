import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';

/** Monte la navbar pour un utilisateur connecté, avec un logout espionné. */
function renderConnected() {
  const logout = vi.fn();
  render(
    <AuthContext.Provider value={{ user: { first_name: 'Logan' }, isAuthenticated: true, logout }}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return logout;
}

describe('<Navbar> déconnexion', () => {
  it('demande une confirmation avant de déconnecter', () => {
    const logout = renderConnected();

    fireEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));

    expect(screen.getByRole('heading', { name: 'Se déconnecter ?' })).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(logout).toHaveBeenCalledOnce();
    expect(screen.queryByRole('heading', { name: 'Se déconnecter ?' })).not.toBeInTheDocument();
  });

  it("Annuler ferme la fenêtre sans déconnecter", () => {
    const logout = renderConnected();

    fireEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(logout).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Se déconnecter ?' })).not.toBeInTheDocument();
  });
});
