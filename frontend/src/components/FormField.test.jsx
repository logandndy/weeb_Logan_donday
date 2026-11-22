import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FormField from './FormField';

describe('<FormField>', () => {
  it('affiche puis masque le mot de passe saisi', () => {
    render(<FormField id="mdp" label="Mot de passe *" type="password" value="Secret!2026" onChange={() => {}} />);
    const champ = screen.getByLabelText('Mot de passe *');

    expect(champ).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
    expect(champ).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Masquer le mot de passe' }));
    expect(champ).toHaveAttribute('type', 'password');
  });

  it('n’ajoute pas de bouton aux autres champs', () => {
    render(<FormField id="email" label="Email *" type="email" value="" onChange={() => {}} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
