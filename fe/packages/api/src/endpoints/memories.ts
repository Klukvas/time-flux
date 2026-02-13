import type { AxiosInstance } from 'axios';
import type { DayContextResponse, MemoriesContextParams, OnThisDayResponse } from '../types';

export function createMemoriesApi(client: AxiosInstance) {
  return {
    onThisDay: (date?: string) =>
      client
        .get<OnThisDayResponse>('/api/v1/memories/on-this-day', {
          params: date ? { date } : undefined,
        })
        .then((r) => r.data),

    context: (params: MemoriesContextParams) =>
      client
        .get<DayContextResponse>('/api/v1/memories/context', { params })
        .then((r) => r.data),
  };
}
