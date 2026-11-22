import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Confidentialite from './Confidentialite';

describe('<Confidentialite>', () => {
  it('indique les durées de conservation et où exercer ses droits', () => {
    render(
      <MemoryRouter>
        <Confidentialite />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Politique de confidentialité');
    expect(screen.getByText('12 mois au plus')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mon espace' })).toHaveAttribute('href', '/mon-espace');
  });
});
