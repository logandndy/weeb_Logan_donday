import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, newsletterApi } from '../services/api';
import Footer from './Footer';

afterEach(() => {
  vi.restoreAllMocks();
});

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe('<Footer>', () => {
  it('ne propose que des liens vers de vraies pages', () => {
    renderFooter();

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual([
      '/',
      '/blog',
      '/contact',
      '/signup',
      '/login',
      '/blog/nouveau',
      '/confidentialite',
      '/confidentialite',
    ]);
  });

  it('inscrit vraiment l’adresse à la newsletter', async () => {
    const subscribe = vi
      .spyOn(newsletterApi, 'subscribe')
      .mockResolvedValue({ detail: 'Merci ! Vous recevrez nos prochains articles par email.' });
    renderFooter();

    fireEvent.change(screen.getByLabelText('Votre email'), {
      target: { value: 'ada@weeb.fr' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Envoyer' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Merci');
    expect(subscribe).toHaveBeenCalledWith('ada@weeb.fr');
  });

  it('affiche l’erreur si l’adresse est refusée', async () => {
    vi.spyOn(newsletterApi, 'subscribe').mockRejectedValue(
      new ApiError('Saisissez une adresse e-mail valide.', {
        status: 400,
        fieldErrors: { email: 'Saisissez une adresse e-mail valide.' },
      }),
    );
    renderFooter();

    fireEvent.submit(screen.getByRole('button', { name: 'Envoyer' }));

    expect(await screen.findByText('Saisissez une adresse e-mail valide.')).toBeInTheDocument();
  });
});
