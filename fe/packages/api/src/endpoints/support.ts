import type { AxiosInstance } from 'axios';

export interface CreateSupportRequest {
  subject: string;
  body: string;
  page: string;
  platform: string;
}

export function createSupportApi(client: AxiosInstance) {
  return {
    send: (data: CreateSupportRequest) =>
      client.post<void>('/api/v1/support', data).then((r) => r.data),
  };
}
