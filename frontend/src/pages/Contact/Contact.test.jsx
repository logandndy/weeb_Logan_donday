import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { contactApi } from '../../services/api';
import Contact from './Contact';

describe('<Contact>', () => {
  it('remercie le visiteur et vide le formulaire après l’envoi', async () => {
    const send = vi.spyOn(contactApi, 'send').mockResolvedValue({ id: 1 });
    render(<Contact />);

    fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'Donday' } });
    fireEvent.change(screen.getByLabelText('Prénom *'), { target: { value: 'Logan' } });
    fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'logan@weeb.fr' } });
    fireEvent.change(screen.getByLabelText('Message *'), {
      target: { value: 'Bravo pour le blog, très clair.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Contact' }));

    expect(
      await screen.findByText(
        'Merci ! Votre message a bien été envoyé, nous vous répondrons rapidement.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Message *')).toHaveValue('');
    expect(send).toHaveBeenCalledWith({
      last_name: 'Donday',
      first_name: 'Logan',
      email: 'logan@weeb.fr',
      message: 'Bravo pour le blog, très clair.',
    });
  });
});
