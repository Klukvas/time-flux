import type { AxiosInstance } from 'axios';
import { createAuthApi } from './endpoints/auth';
import { createCategoriesApi } from './endpoints/categories';
import { createDayStatesApi } from './endpoints/day-states';
import { createDaysApi } from './endpoints/days';
import { createEventGroupsApi } from './endpoints/event-groups';
import { createMediaApi } from './endpoints/media';
import { createTimelineApi } from './endpoints/timeline';
import { createUploadsApi } from './endpoints/uploads';
import { createMemoriesApi } from './endpoints/memories';
import { createRecommendationsApi } from './endpoints/recommendations';
import { createAnalyticsApi } from './endpoints/analytics';

export { createApiClient, extractApiError } from './client';
export type { ApiClientConfig, SessionClearer, TokenGetter, TokenSetter } from './client';
export * from './types';

export interface Api {
  auth: ReturnType<typeof createAuthApi>;
  categories: ReturnType<typeof createCategoriesApi>;
  dayStates: ReturnType<typeof createDayStatesApi>;
  days: ReturnType<typeof createDaysApi>;
  eventGroups: ReturnType<typeof createEventGroupsApi>;
  media: ReturnType<typeof createMediaApi>;
  timeline: ReturnType<typeof createTimelineApi>;
  uploads: ReturnType<typeof createUploadsApi>;
  memories: ReturnType<typeof createMemoriesApi>;
  recommendations: ReturnType<typeof createRecommendationsApi>;
  analytics: ReturnType<typeof createAnalyticsApi>;
}

export function createApi(client: AxiosInstance): Api {
  return {
    auth: createAuthApi(client),
    categories: createCategoriesApi(client),
    dayStates: createDayStatesApi(client),
    days: createDaysApi(client),
    eventGroups: createEventGroupsApi(client),
    media: createMediaApi(client),
    timeline: createTimelineApi(client),
    uploads: createUploadsApi(client),
    memories: createMemoriesApi(client),
    recommendations: createRecommendationsApi(client),
    analytics: createAnalyticsApi(client),
  };
}
