import type { AxiosInstance } from 'axios';
import type { Day, DayQueryParams, UpdateDayLocationRequest, UpsertDayRequest } from '../types';

export function createDaysApi(client: AxiosInstance) {
  return {
    list: (params: DayQueryParams) =>
      client.get<Day[]>('/api/v1/days', { params }).then((r) => r.data),

    upsert: (date: string, data: UpsertDayRequest) =>
      client.put<Day>(`/api/v1/days/${date}`, data).then((r) => r.data),

    updateLocation: (date: string, data: UpdateDayLocationRequest) =>
      client.patch<Day>(`/api/v1/days/${date}/location`, data).then((r) => r.data),
  };
}
