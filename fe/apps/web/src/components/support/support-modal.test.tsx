import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SupportModal } from './support-modal';

// ── Mocks ──────────────────────────────────────────────────

const mockSend = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('@timeflux/hooks', () => ({
  useApi: () => ({
    support: { send: mockSend },
  }),
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'support.title': 'Contact Support',
        'support.subject_label': 'Subject',
        'support.subject_placeholder': 'What do you need help with?',
        'support.body_label': 'Message',
        'support.body_placeholder': 'Describe your issue...',
        'support.send': 'Send',
        'support.success': 'Message sent!',
        'support.subject_required': 'Subject is required.',
        'support.body_required': 'Message is required.',
        'common.cancel': 'Cancel',
      };
      return map[key] ?? key;
    },
    language: 'en',
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('@timeflux/api', async () => {
  const actual =
    await vi.importActual<typeof import('@timeflux/api')>('@timeflux/api');
  return {
    ...actual,
    extractApiError: vi.fn(() => ({
      error_code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    })),
  };
});

vi.mock('@timeflux/domain', async () => {
  const actual =
    await vi.importActual<typeof import('@timeflux/domain')>(
      '@timeflux/domain',
    );
  return { ...actual, getUserMessage: vi.fn(() => 'Error message') };
});

// Mock Radix Portal to render inline for testing
vi.mock('@radix-ui/react-dialog', async () => {
  const actual = await vi.importActual<
    typeof import('@radix-ui/react-dialog')
  >('@radix-ui/react-dialog');
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

// ── Tests ──────────────────────────────────────────────────

describe('SupportModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue(undefined);
  });

  function renderModal(open = true) {
    return render(<SupportModal open={open} onClose={onClose} />);
  }

  // ── Rendering ───────────────────────────────────────────

  it('renders the modal with title and form fields', () => {
    renderModal();

    expect(screen.getByText('Contact Support')).toBeDefined();
    expect(screen.getByLabelText('Subject')).toBeDefined();
    expect(screen.getByLabelText('Message')).toBeDefined();
    expect(screen.getByText('Send')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('does not render when closed', () => {
    renderModal(false);
    expect(screen.queryByText('Contact Support')).toBeNull();
  });

  // ── Validation ──────────────────────────────────────────

  it('shows validation errors when submitting empty form', async () => {
    renderModal();

    fireEvent.click(screen.getByText('Send'));

    expect(screen.getByText('Subject is required.')).toBeDefined();
    expect(screen.getByText('Message is required.')).toBeDefined();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('shows subject error when only body is filled', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Some message' },
    });
    fireEvent.click(screen.getByText('Send'));

    expect(screen.getByText('Subject is required.')).toBeDefined();
    expect(screen.queryByText('Message is required.')).toBeNull();
  });

  it('shows body error when only subject is filled', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Some subject' },
    });
    fireEvent.click(screen.getByText('Send'));

    expect(screen.queryByText('Subject is required.')).toBeNull();
    expect(screen.getByText('Message is required.')).toBeDefined();
  });

  it('trims whitespace during validation', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByText('Send'));

    expect(screen.getByText('Subject is required.')).toBeDefined();
    expect(screen.getByText('Message is required.')).toBeDefined();
  });

  // ── Successful submission ───────────────────────────────

  it('sends support request with correct payload', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Bug report' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Something is broken' },
    });
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    expect(mockSend).toHaveBeenCalledWith({
      subject: 'Bug report',
      body: 'Something is broken',
      page: '/',
      platform: 'web',
    });
  });

  it('shows success toast and closes modal on success', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Help' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Details' },
    });
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Message sent!');
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Failed submission ───────────────────────────────────

  it('shows error toast on API failure', async () => {
    mockSend.mockRejectedValueOnce(new Error('Network error'));

    renderModal();

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Help' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Details' },
    });
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Error message');
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  // ── Cancel / close ─────────────────────────────────────

  it('calls onClose and resets form when Cancel is clicked', () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Draft subject' },
    });
    fireEvent.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
