import type { AxiosInstance } from 'axios';
import type { MoodOverviewResponse } from '../types';

export function createAnalyticsApi(client: AxiosInstance) {
  return {
    moodOverview: () =>
      client.get<MoodOverviewResponse>('/api/v1/analytics/mood-overview').then((r) => r.data),
  };
}
