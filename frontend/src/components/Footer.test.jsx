import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe('<Footer>', () => {
  it('relie les liens de la maquette aux vraies pages', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'Help Center' })).toHaveAttribute('href', '/contact');
  });

  it('confirme l’inscription à la newsletter sans recharger la page', () => {
    renderFooter();

    fireEvent.change(screen.getByLabelText('Votre email'), {
      target: { value: 'ada@weeb.fr' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Envoyer' }));

    expect(screen.getByRole('status')).toHaveTextContent('Merci');
  });
});
