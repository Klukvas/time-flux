import type { AxiosInstance } from 'axios';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types';

export function createAuthApi(client: AxiosInstance) {
  return {
    login: (data: LoginRequest) =>
      client.post<AuthResponse>('/api/v1/auth/login', data).then((r) => r.data),

    register: (data: RegisterRequest) =>
      client.post<AuthResponse>('/api/v1/auth/register', data).then((r) => r.data),

    refresh: (refreshToken: string) =>
      client.post<AuthResponse>('/api/v1/auth/refresh', { refresh_token: refreshToken }).then((r) => r.data),

    logout: (refreshToken: string) =>
      client.post<void>('/api/v1/auth/logout', { refresh_token: refreshToken }),

    completeOnboarding: () =>
      client.patch<AuthUser>('/api/v1/auth/onboarding').then((r) => r.data),
  };
}
