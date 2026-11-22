import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FlashMessage, { FLASH_DURATION_MS } from './FlashMessage';

/** Ouvre une page arrivée avec (ou sans) message dans l'état de navigation. */
function renderWithState(state) {
  const router = createMemoryRouter([{ path: '/', element: <FlashMessage /> }], {
    initialEntries: [{ pathname: '/', state }],
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('<FlashMessage>', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche le message puis le retire de l’historique', () => {
    const router = renderWithState({ flash: 'Article supprimé.' });

    expect(screen.getByText('Article supprimé.')).toBeInTheDocument();
    // Un rechargement de la page ne doit pas le réafficher.
    expect(router.state.location.state).toBeNull();
  });

  it('disparaît tout seul après quelques secondes', () => {
    vi.useFakeTimers();
    renderWithState({ flash: 'Vous êtes déconnecté.' });

    act(() => vi.advanceTimersByTime(FLASH_DURATION_MS));

    expect(screen.queryByText('Vous êtes déconnecté.')).not.toBeInTheDocument();
  });

  it('n’affiche rien sans message', () => {
    renderWithState(null);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
