import type { AxiosInstance } from 'axios';
import type { PresignedUrlRequest, PresignedUrlResponse } from '../types';

export function createUploadsApi(client: AxiosInstance) {
  return {
    getPresignedUrl: (data: PresignedUrlRequest) =>
      client
        .post<PresignedUrlResponse>('/api/v1/uploads/presigned-url', data)
        .then((r) => r.data),
  };
}
