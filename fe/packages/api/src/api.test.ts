import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { createApi } from './index';

vi.mock('./endpoints/auth', () => ({
  createAuthApi: vi.fn(() => ({ login: vi.fn(), register: vi.fn() })),
}));
vi.mock('./endpoints/categories', () => ({
  createCategoriesApi: vi.fn(() => ({ list: vi.fn(), create: vi.fn() })),
}));
vi.mock('./endpoints/day-states', () => ({
  createDayStatesApi: vi.fn(() => ({ list: vi.fn() })),
}));
vi.mock('./endpoints/days', () => ({
  createDaysApi: vi.fn(() => ({ get: vi.fn() })),
}));
vi.mock('./endpoints/event-groups', () => ({
  createEventGroupsApi: vi.fn(() => ({ list: vi.fn() })),
}));
vi.mock('./endpoints/media', () => ({
  createMediaApi: vi.fn(() => ({ upload: vi.fn() })),
}));
vi.mock('./endpoints/timeline', () => ({
  createTimelineApi: vi.fn(() => ({ get: vi.fn() })),
}));
vi.mock('./endpoints/uploads', () => ({
  createUploadsApi: vi.fn(() => ({ upload: vi.fn() })),
}));
vi.mock('./endpoints/memories', () => ({
  createMemoriesApi: vi.fn(() => ({ list: vi.fn() })),
}));
vi.mock('./endpoints/recommendations', () => ({
  createRecommendationsApi: vi.fn(() => ({ list: vi.fn() })),
}));
vi.mock('./endpoints/analytics', () => ({
  createAnalyticsApi: vi.fn(() => ({ get: vi.fn() })),
}));
vi.mock('./endpoints/subscriptions', () => ({
  createSubscriptionsApi: vi.fn(() => ({ get: vi.fn() })),
}));
vi.mock('./endpoints/users', () => ({
  createUsersApi: vi.fn(() => ({ updateProfile: vi.fn() })),
}));

const EXPECTED_GROUPS = [
  'auth',
  'categories',
  'dayStates',
  'days',
  'eventGroups',
  'media',
  'timeline',
  'uploads',
  'memories',
  'recommendations',
  'analytics',
  'subscriptions',
  'users',
] as const;

describe('createApi', () => {
  const mockClient = {} as AxiosInstance;

  it('returns an object with all expected endpoint groups', () => {
    const api = createApi(mockClient);

    for (const group of EXPECTED_GROUPS) {
      expect(api).toHaveProperty(group);
    }
  });

  it('returns exactly the expected number of endpoint groups', () => {
    const api = createApi(mockClient);

    expect(Object.keys(api)).toHaveLength(EXPECTED_GROUPS.length);
  });

  it('returns no undefined groups', () => {
    const api = createApi(mockClient);

    for (const group of EXPECTED_GROUPS) {
      expect(api[group]).toBeDefined();
    }
  });

  it('returns objects (not primitives) for every endpoint group', () => {
    const api = createApi(mockClient);

    for (const group of EXPECTED_GROUPS) {
      expect(typeof api[group]).toBe('object');
      expect(api[group]).not.toBeNull();
    }
  });

  it('passes the client to each endpoint factory', async () => {
    const { createAuthApi } = await import('./endpoints/auth');
    const { createCategoriesApi } = await import('./endpoints/categories');
    const { createDayStatesApi } = await import('./endpoints/day-states');
    const { createDaysApi } = await import('./endpoints/days');
    const { createEventGroupsApi } = await import('./endpoints/event-groups');
    const { createMediaApi } = await import('./endpoints/media');
    const { createTimelineApi } = await import('./endpoints/timeline');
    const { createUploadsApi } = await import('./endpoints/uploads');
    const { createMemoriesApi } = await import('./endpoints/memories');
    const { createRecommendationsApi } =
      await import('./endpoints/recommendations');
    const { createAnalyticsApi } = await import('./endpoints/analytics');
    const { createSubscriptionsApi } =
      await import('./endpoints/subscriptions');
    const { createUsersApi } = await import('./endpoints/users');

    createApi(mockClient);

    expect(createAuthApi).toHaveBeenCalledWith(mockClient);
    expect(createCategoriesApi).toHaveBeenCalledWith(mockClient);
    expect(createDayStatesApi).toHaveBeenCalledWith(mockClient);
    expect(createDaysApi).toHaveBeenCalledWith(mockClient);
    expect(createEventGroupsApi).toHaveBeenCalledWith(mockClient);
    expect(createMediaApi).toHaveBeenCalledWith(mockClient);
    expect(createTimelineApi).toHaveBeenCalledWith(mockClient);
    expect(createUploadsApi).toHaveBeenCalledWith(mockClient);
    expect(createMemoriesApi).toHaveBeenCalledWith(mockClient);
    expect(createRecommendationsApi).toHaveBeenCalledWith(mockClient);
    expect(createAnalyticsApi).toHaveBeenCalledWith(mockClient);
    expect(createSubscriptionsApi).toHaveBeenCalledWith(mockClient);
    expect(createUsersApi).toHaveBeenCalledWith(mockClient);
  });

  it('creates a fresh api object on each call', () => {
    const api1 = createApi(mockClient);
    const api2 = createApi(mockClient);

    expect(api1).not.toBe(api2);
  });
});
