import type { AxiosInstance } from 'axios';
import type { CreateDayMediaRequest, DayMedia } from '../types';

export function createMediaApi(client: AxiosInstance) {
  return {
    listForDay: (date: string) =>
      client.get<DayMedia[]>(`/api/v1/days/${date}/media`).then((r) => r.data),

    create: (date: string, data: CreateDayMediaRequest) =>
      client.post<DayMedia>(`/api/v1/days/${date}/media`, data).then((r) => r.data),

    delete: (id: string) =>
      client.delete(`/api/v1/media/${id}`).then(() => void 0),
  };
}
