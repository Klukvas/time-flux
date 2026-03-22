import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaPeriodAssign } from './media-period-assign';
import type { DayMedia } from '@timeflux/api';

// ── Mocks ──────────────────────────────────────────────────

const mockMutate = vi.fn();
const mockVariables = { id: '' };

vi.mock('@timeflux/hooks', () => ({
  useUpdateDayMediaPeriod: () => ({
    mutate: mockMutate,
    isPending: false,
    variables: mockVariables,
  }),
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'day_form.media_chapters': 'Photo chapters',
        'day_form.media_chapters_info': 'Assign photos to specific chapters.',
        'day_form.all_periods': 'No period',
      };
      return map[key] ?? key;
    },
    language: 'en',
  }),
}));

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));
vi.mock('@timeflux/api', async () => {
  const actual =
    await vi.importActual<typeof import('@timeflux/api')>('@timeflux/api');
  return {
    ...actual,
    extractApiError: vi.fn(() => ({ error_code: 'TEST', message: 'err' })),
  };
});
vi.mock('@timeflux/domain', async () => {
  const actual =
    await vi.importActual<typeof import('@timeflux/domain')>(
      '@timeflux/domain',
    );
  return { ...actual, getUserMessage: vi.fn(() => 'Error message') };
});

// ── Fixtures ───────────────────────────────────────────────

const PERIODS = [
  {
    id: 'p1',
    eventGroup: { id: 'g1', title: 'Work' },
    category: { color: '#38BDF8' },
  },
  {
    id: 'p2',
    eventGroup: { id: 'g2', title: 'Travel' },
    category: { color: '#2DD4BF' },
  },
];

function makeMedia(
  overrides: Partial<DayMedia> & { id: string; fileName: string },
): DayMedia {
  return {
    s3Key: `uploads/user/${overrides.id}.jpg`,
    url: `https://s3.example.com/${overrides.id}`,
    contentType: 'image/jpeg',
    size: 1024,
    createdAt: '2024-01-15T00:00:00Z',
    periodId: null,
    ...overrides,
  };
}

const MEDIA: DayMedia[] = [
  makeMedia({ id: 'm1', fileName: 'photo1.jpg', periodId: null }),
  makeMedia({ id: 'm2', fileName: 'photo2.jpg', periodId: 'p1' }),
];

// ── Tests ──────────────────────────────────────────────────

describe('MediaPeriodAssign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no periods', () => {
    const { container } = render(
      <MediaPeriodAssign media={MEDIA} periods={[]} date="2024-01-15" />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when no media', () => {
    const { container } = render(
      <MediaPeriodAssign media={[]} periods={PERIODS} date="2024-01-15" />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders header with info icon', () => {
    render(
      <MediaPeriodAssign media={MEDIA} periods={PERIODS} date="2024-01-15" />,
    );

    expect(screen.getByText('Photo chapters')).toBeDefined();
    expect(
      screen.getByText('Assign photos to specific chapters.'),
    ).toBeDefined();
  });

  it('renders a row for each media item', () => {
    render(
      <MediaPeriodAssign media={MEDIA} periods={PERIODS} date="2024-01-15" />,
    );

    expect(screen.getByTestId('media-row-m1')).toBeDefined();
    expect(screen.getByTestId('media-row-m2')).toBeDefined();
    expect(screen.getByText('photo1.jpg')).toBeDefined();
    expect(screen.getByText('photo2.jpg')).toBeDefined();
  });

  it('shows thumbnail image when url is present', () => {
    const { container } = render(
      <MediaPeriodAssign media={MEDIA} periods={PERIODS} date="2024-01-15" />,
    );

    const images = container.querySelectorAll('img');
    expect(images.length).toBe(2);
  });

  it('shows placeholder when url is null', () => {
    const mediaNoUrl = [
      makeMedia({ id: 'm3', fileName: 'nourl.jpg', url: null }),
    ];
    const { container } = render(
      <MediaPeriodAssign
        media={mediaNoUrl}
        periods={PERIODS}
        date="2024-01-15"
      />,
    );

    expect(container.querySelectorAll('img').length).toBe(0);
    // Should show SVG placeholder
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });

  it('shows color dot for assigned period', () => {
    render(
      <MediaPeriodAssign media={MEDIA} periods={PERIODS} date="2024-01-15" />,
    );

    // m2 has periodId 'p1' → should have a color dot
    expect(screen.getByTestId('color-dot-m2')).toBeDefined();
    // m1 has no period → no color dot
    expect(screen.queryByTestId('color-dot-m1')).toBeNull();
  });

  it('dropdown shows all period options plus "No period"', () => {
    render(
      <MediaPeriodAssign
        media={[MEDIA[0]]}
        periods={PERIODS}
        date="2024-01-15"
      />,
    );

    const select = screen.getByTestId('period-select-m1') as HTMLSelectElement;
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(3); // No period + Work + Travel
    expect(options[0].textContent).toBe('No period');
    expect(options[1].textContent).toBe('Work');
    expect(options[2].textContent).toBe('Travel');
  });

  it('dropdown value reflects current periodId', () => {
    render(
      <MediaPeriodAssign media={MEDIA} periods={PERIODS} date="2024-01-15" />,
    );

    const select1 = screen.getByTestId('period-select-m1') as HTMLSelectElement;
    expect(select1.value).toBe(''); // No period

    const select2 = screen.getByTestId('period-select-m2') as HTMLSelectElement;
    expect(select2.value).toBe('p1'); // Work
  });

  it('calls updateMediaPeriod.mutate when dropdown changes to a period', () => {
    render(
      <MediaPeriodAssign
        media={[MEDIA[0]]}
        periods={PERIODS}
        date="2024-01-15"
      />,
    );

    const select = screen.getByTestId('period-select-m1') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'p2' } });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'm1', date: '2024-01-15', data: { periodId: 'p2' } },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it('calls updateMediaPeriod.mutate with null when "No period" selected', () => {
    render(
      <MediaPeriodAssign
        media={[MEDIA[1]]}
        periods={PERIODS}
        date="2024-01-15"
      />,
    );

    const select = screen.getByTestId('period-select-m2') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '' } });

    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'm2', date: '2024-01-15', data: { periodId: null } },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it('renders multiple media items independently', () => {
    const threeMedia = [
      makeMedia({ id: 'a', fileName: 'a.jpg', periodId: null }),
      makeMedia({ id: 'b', fileName: 'b.jpg', periodId: 'p1' }),
      makeMedia({ id: 'c', fileName: 'c.jpg', periodId: 'p2' }),
    ];

    render(
      <MediaPeriodAssign
        media={threeMedia}
        periods={PERIODS}
        date="2024-01-15"
      />,
    );

    const list = screen.getByTestId('media-period-list');
    expect(list.children.length).toBe(3);

    expect(
      (screen.getByTestId('period-select-a') as HTMLSelectElement).value,
    ).toBe('');
    expect(
      (screen.getByTestId('period-select-b') as HTMLSelectElement).value,
    ).toBe('p1');
    expect(
      (screen.getByTestId('period-select-c') as HTMLSelectElement).value,
    ).toBe('p2');
  });
});
