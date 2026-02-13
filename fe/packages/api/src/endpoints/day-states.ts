import type { AxiosInstance } from 'axios';
import type { CreateDayStateRequest, CreateFromRecommendationRequest, DayState, UpdateDayStateRequest } from '../types';

export function createDayStatesApi(client: AxiosInstance) {
  return {
    list: () =>
      client.get<DayState[]>('/api/v1/day-states').then((r) => r.data),

    create: (data: CreateDayStateRequest) =>
      client.post<DayState>('/api/v1/day-states', data).then((r) => r.data),

    createFromRecommendation: (data: CreateFromRecommendationRequest) =>
      client.post<DayState>('/api/v1/day-states/from-recommendation', data).then((r) => r.data),

    update: (id: string, data: UpdateDayStateRequest) =>
      client.patch<DayState>(`/api/v1/day-states/${id}`, data).then((r) => r.data),

    delete: (id: string) =>
      client.delete(`/api/v1/day-states/${id}`).then(() => void 0),
  };
}
