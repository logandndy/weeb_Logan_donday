import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, authApi } from '../../services/api';
import Signup from './Signup';

afterEach(() => {
  vi.restoreAllMocks();
});

/** Page de connexion simulée : affiche le message transmis par l'inscription. */
function LoginSimule() {
  return <p>{useLocation().state?.message}</p>;
}

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<LoginSimule />} />
      </Routes>
    </MemoryRouter>,
  );
}

function remplirEtEnvoyer() {
  const saisir = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
  saisir('Prénom *', 'Ada');
  saisir('Nom *', 'Lovelace');
  saisir('Email *', 'ada@weeb.fr');
  saisir('Mot de passe *', 'MotDePasse!2026');
  saisir('Confirmer le mot de passe *', 'MotDePasse!2026');
  fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
}

describe('<Signup>', () => {
  it('renvoie vers la connexion avec le message de l’API', async () => {
    const signup = vi.spyOn(authApi, 'signup').mockResolvedValue({
      detail: 'Inscription enregistrée. Votre compte doit être validé par un administrateur.',
    });
    renderSignup();

    remplirEtEnvoyer();

    expect(await screen.findByText(/Votre compte doit être validé par un administrateur/)).toBeInTheDocument();
    expect(signup).toHaveBeenCalledWith({
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@weeb.fr',
      password: 'MotDePasse!2026',
      password_confirm: 'MotDePasse!2026',
    });
  });

  it('affiche l’erreur sous le champ concerné', async () => {
    vi.spyOn(authApi, 'signup').mockRejectedValue(
      new ApiError('Ce mot de passe est trop courant.', {
        status: 400,
        fieldErrors: { password: 'Ce mot de passe est trop courant.' },
      }),
    );
    renderSignup();

    remplirEtEnvoyer();

    expect(await screen.findAllByText('Ce mot de passe est trop courant.')).not.toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Rejoignez-nous' })).toBeInTheDocument();
  });
});
