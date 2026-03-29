import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SupportButton } from './support-button';

// ── Mocks ──────────────────────────────────────────────────

vi.mock('./support-modal', () => ({
  SupportModal: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="support-modal">
        <button data-testid="close-modal" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

// ── Tests ──────────────────────────────────────────────────

describe('SupportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the floating button', () => {
    render(<SupportButton />);
    expect(screen.getByLabelText('Support')).toBeDefined();
  });

  it('does not show modal initially', () => {
    render(<SupportButton />);
    expect(screen.queryByTestId('support-modal')).toBeNull();
  });

  it('opens modal when button is clicked', () => {
    render(<SupportButton />);
    fireEvent.click(screen.getByLabelText('Support'));
    expect(screen.getByTestId('support-modal')).toBeDefined();
  });

  it('closes modal when onClose is called', () => {
    render(<SupportButton />);
    fireEvent.click(screen.getByLabelText('Support'));
    expect(screen.getByTestId('support-modal')).toBeDefined();

    fireEvent.click(screen.getByTestId('close-modal'));
    expect(screen.queryByTestId('support-modal')).toBeNull();
  });
});
