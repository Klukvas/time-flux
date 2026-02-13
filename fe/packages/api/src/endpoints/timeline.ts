import type { AxiosInstance } from 'axios';
import type {
  TimelineQueryParams,
  TimelineResponse,
  WeekQueryParams,
  WeekTimelineResponse,
} from '../types';

export function createTimelineApi(client: AxiosInstance) {
  return {
    get: (params?: TimelineQueryParams) =>
      client.get<TimelineResponse>('/api/v1/timeline', { params }).then((r) => r.data),

    week: (params: WeekQueryParams) =>
      client
        .get<WeekTimelineResponse>('/api/v1/timeline/week', { params })
        .then((r) => r.data),
  };
}
