import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse, AuthResponse } from './types';

export type TokenGetter = () => string | null;
export type TokenSetter = (accessToken: string, refreshToken: string) => void;
export type SessionClearer = () => void;

export interface ApiClientConfig {
  baseURL: string;
  getToken: TokenGetter;
  getRefreshToken: TokenGetter;
  onTokenRefreshed: TokenSetter;
  onUnauthorized: SessionClearer;
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  let refreshPromise: Promise<AuthResponse> | null = null;

  client.interceptors.request.use((reqConfig) => {
    const token = config.getToken();
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
      const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error);
      }

      // Don't try to refresh if the failing request was the refresh endpoint itself
      if (original.url?.includes('/auth/refresh')) {
        config.onUnauthorized();
        return Promise.reject(error);
      }

      const refreshToken = config.getRefreshToken();
      if (!refreshToken) {
        config.onUnauthorized();
        return Promise.reject(error);
      }

      original._retry = true;

      try {
        // Coalesce concurrent refresh attempts into a single request
        if (!refreshPromise) {
          refreshPromise = axios
            .post<AuthResponse>(`${config.baseURL}/api/v1/auth/refresh`, { refresh_token: refreshToken })
            .then((r) => r.data)
            .finally(() => { refreshPromise = null; });
        }

        const data = await refreshPromise;
        config.onTokenRefreshed(data.access_token, data.refresh_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return client(original);
      } catch {
        config.onUnauthorized();
        return Promise.reject(error);
      }
    },
  );

  return client;
}

export function extractApiError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError(error) && error.response?.data?.error_code) {
    return error.response.data as ApiErrorResponse;
  }
  return {
    error_code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  };
}
