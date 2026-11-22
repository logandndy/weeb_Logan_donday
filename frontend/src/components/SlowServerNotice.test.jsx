import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SLOW_DELAY_MS } from '../hooks/useIsSlow';
import SlowServerNotice from './SlowServerNotice';

const MESSAGE = /Le serveur se réveille/;

describe('<SlowServerNotice>', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ne dit rien pendant une attente normale', () => {
    render(<SlowServerNotice active />);

    act(() => vi.advanceTimersByTime(SLOW_DELAY_MS - 1));

    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
  });

  it('prévient quand l’attente se prolonge, et se tait une fois la réponse arrivée', () => {
    const { rerender } = render(<SlowServerNotice active />);

    act(() => vi.advanceTimersByTime(SLOW_DELAY_MS));
    expect(screen.getByText(MESSAGE)).toBeInTheDocument();

    rerender(<SlowServerNotice active={false} />);
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
  });
});
