import type { AxiosInstance } from 'axios';
import type { MemoriesContextResponse, OnThisDayResponse } from '../types';
import type { MemoriesContextParams } from '../types-local';

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
        .get<MemoriesContextResponse>('/api/v1/memories/context', { params })
        .then((r) => r.data),
  };
}
