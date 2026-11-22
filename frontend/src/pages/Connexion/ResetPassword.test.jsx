import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../../services/api';
import ResetPassword from './ResetPassword';

afterEach(() => {
  vi.restoreAllMocks();
});

function renderReset(url) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<p>Page de connexion</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('<ResetPassword>', () => {
  it('signale un lien incomplet au lieu d’afficher le formulaire', () => {
    renderReset('/reset-password?uid=abc');

    expect(screen.getByRole('heading', { name: 'Lien invalide' })).toBeInTheDocument();
  });

  it('envoie l’identifiant et le jeton du lien avec le nouveau mot de passe', async () => {
    const confirm = vi.spyOn(authApi, 'confirmPasswordReset').mockResolvedValue({});
    renderReset('/reset-password?uid=abc&token=xyz');

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe *'), { target: { value: 'Nouveau!2026' } });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe *'), { target: { value: 'Nouveau!2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));

    expect(await screen.findByText('Page de connexion')).toBeInTheDocument();
    expect(confirm).toHaveBeenCalledWith({
      uid: 'abc',
      token: 'xyz',
      new_password: 'Nouveau!2026',
      new_password_confirm: 'Nouveau!2026',
    });
  });
});
