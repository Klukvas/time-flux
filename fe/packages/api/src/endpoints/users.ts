import type { AxiosInstance } from 'axios';
import type { AuthUser, UpdateProfileRequest } from '../types';

export function createUsersApi(client: AxiosInstance) {
  return {
    updateProfile: (data: UpdateProfileRequest) =>
      client
        .patch<AuthUser>('/api/v1/users/profile', data)
        .then((r) => r.data),
  };
}
