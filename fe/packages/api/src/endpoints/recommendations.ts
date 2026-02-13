import type { AxiosInstance } from 'axios';
import type { RecommendationsResponse } from '../types';

export function createRecommendationsApi(client: AxiosInstance) {
  return {
    list: () =>
      client.get<RecommendationsResponse>('/api/v1/recommendations').then((r) => r.data),
  };
}
