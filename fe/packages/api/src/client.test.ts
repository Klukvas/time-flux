import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosError, type AxiosInstance } from 'axios';
import { createApiClient, extractApiError } from './client';
import type { ApiErrorResponse } from './types-local';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

describe('extractApiError', () => {
  it('returns response data when error is an AxiosError with error_code', () => {
    const apiError: ApiErrorResponse = {
      error_code: 'VALIDATION_ERROR',
      message: 'Invalid input provided',
    };
    const error = new AxiosError(
      'Request failed',
      '422',
      undefined,
      undefined,
      {
        data: apiError,
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: { headers: {} as any },
      },
    );

    const result = extractApiError(error);

    expect(result).toEqual({
      error_code: 'VALIDATION_ERROR',
      message: 'Invalid input provided',
    });
  });

  it('returns response data with details when present', () => {
    const apiError: ApiErrorResponse = {
      error_code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: { field: 'email', reason: 'invalid format' },
    };
    const error = new AxiosError(
      'Request failed',
      '422',
      undefined,
      undefined,
      {
        data: apiError,
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: { headers: {} as any },
      },
    );

    const result = extractApiError(error);

    expect(result).toEqual(apiError);
    expect(result.details).toEqual({
      field: 'email',
      reason: 'invalid format',
    });
  });

  it('returns generic error when AxiosError has no response (network error)', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');

    const result = extractApiError(error);

    expect(result).toEqual({
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  it('returns generic error when AxiosError response has no error_code', () => {
    const error = new AxiosError('Server Error', '500', undefined, undefined, {
      data: { message: 'Internal Server Error' },
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: {} as any },
    });

    const result = extractApiError(error);

    expect(result).toEqual({
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  it('returns generic error for a standard Error instance', () => {
    const error = new Error('Something broke');

    const result = extractApiError(error);

    expect(result).toEqual({
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  it('returns generic error for a string error', () => {
    const result = extractApiError('unexpected string error');

    expect(result).toEqual({
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  it('returns generic error for null', () => {
    const result = extractApiError(null);

    expect(result).toEqual({
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  it('returns generic error for undefined', () => {
    const result = extractApiError(undefined);

    expect(result).toEqual({
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });
});

describe('createApiClient', () => {
  const mockInterceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };

  const mockClient = {
    interceptors: mockInterceptors,
    defaults: { baseURL: '' },
  } as unknown as AxiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.create).mockReturnValue(mockClient);
  });

  it('creates an axios instance with the provided baseURL', () => {
    const config = {
      baseURL: 'https://api.example.com',
      getToken: () => null,
      getRefreshToken: () => null,
      onTokenRefreshed: vi.fn(),
      onUnauthorized: vi.fn(),
    };

    createApiClient(config);

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('creates an axios instance with the correct content-type header', () => {
    const config = {
      baseURL: 'https://api.test.com',
      getToken: () => null,
      getRefreshToken: () => null,
      onTokenRefreshed: vi.fn(),
      onUnauthorized: vi.fn(),
    };

    createApiClient(config);

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('registers request and response interceptors', () => {
    const config = {
      baseURL: 'https://api.example.com',
      getToken: () => null,
      getRefreshToken: () => null,
      onTokenRefreshed: vi.fn(),
      onUnauthorized: vi.fn(),
    };

    createApiClient(config);

    expect(mockInterceptors.request.use).toHaveBeenCalledTimes(1);
    expect(mockInterceptors.response.use).toHaveBeenCalledTimes(1);
  });

  it('returns the created axios instance', () => {
    const config = {
      baseURL: 'https://api.example.com',
      getToken: () => null,
      getRefreshToken: () => null,
      onTokenRefreshed: vi.fn(),
      onUnauthorized: vi.fn(),
    };

    const result = createApiClient(config);

    expect(result).toBe(mockClient);
  });

  describe('request interceptor', () => {
    it('attaches Authorization header when token is available', () => {
      const config = {
        baseURL: 'https://api.example.com',
        getToken: () => 'test-access-token',
        getRefreshToken: () => null,
        onTokenRefreshed: vi.fn(),
        onUnauthorized: vi.fn(),
      };

      createApiClient(config);

      const requestInterceptor = mockInterceptors.request.use.mock.calls[0][0];
      const reqConfig = { headers: { Authorization: '' } } as any;

      const result = requestInterceptor(reqConfig);

      expect(result.headers.Authorization).toBe('Bearer test-access-token');
    });

    it('does not attach Authorization header when token is null', () => {
      const config = {
        baseURL: 'https://api.example.com',
        getToken: () => null,
        getRefreshToken: () => null,
        onTokenRefreshed: vi.fn(),
        onUnauthorized: vi.fn(),
      };

      createApiClient(config);

      const requestInterceptor = mockInterceptors.request.use.mock.calls[0][0];
      const reqConfig = { headers: {} } as any;

      const result = requestInterceptor(reqConfig);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor (error handler)', () => {
    it('rejects non-401 errors without attempting refresh', async () => {
      const config = {
        baseURL: 'https://api.example.com',
        getToken: () => 'token',
        getRefreshToken: () => 'refresh-token',
        onTokenRefreshed: vi.fn(),
        onUnauthorized: vi.fn(),
      };

      createApiClient(config);

      const errorHandler = mockInterceptors.response.use.mock.calls[0][1];
      const error = new AxiosError('Bad Request', '400', undefined, undefined, {
        data: {},
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: {} as any },
      });
      error.config = { url: '/api/v1/days', headers: {} } as any;

      await expect(errorHandler(error)).rejects.toBe(error);
      expect(config.onUnauthorized).not.toHaveBeenCalled();
    });

    it('rejects 401 errors for auth endpoints without attempting refresh', async () => {
      const config = {
        baseURL: 'https://api.example.com',
        getToken: () => 'token',
        getRefreshToken: () => 'refresh-token',
        onTokenRefreshed: vi.fn(),
        onUnauthorized: vi.fn(),
      };

      createApiClient(config);

      const errorHandler = mockInterceptors.response.use.mock.calls[0][1];

      for (const url of ['/auth/login', '/auth/register', '/auth/refresh']) {
        const error = new AxiosError(
          'Unauthorized',
          '401',
          undefined,
          undefined,
          {
            data: {},
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config: { headers: {} as any },
          },
        );
        error.config = { url, headers: {} } as any;

        await expect(errorHandler(error)).rejects.toBe(error);
      }

      expect(config.onUnauthorized).not.toHaveBeenCalled();
    });

    it('refreshes token and retries on 401 when refresh token is available', async () => {
      const onTokenRefreshed = vi.fn();
      const config = {
        baseURL: 'https://api.example.com',
        getToken: () => 'expired-token',
        getRefreshToken: () => 'valid-refresh-token',
        onTokenRefreshed,
        onUnauthorized: vi.fn(),
      };

      createApiClient(config);

      // Mock axios.post for refresh endpoint
      const mockPost = vi.mocked(axios.post ?? vi.fn());
      (axios as any).post = vi.fn().mockResolvedValue({
        data: { access_token: 'new-token', refresh_token: 'new-refresh' },
      });

      // Mock the client itself (for retry)
      const retryResult = { data: 'success' };
      (mockClient as any).mockResolvedValue?.(retryResult);
      // Make the client callable for retry
      const callableClient = Object.assign(
        vi.fn().mockResolvedValue(retryResult),
        mockClient,
      );
      vi.mocked(axios.create).mockReturnValue(callableClient as any);

      // Re-create to get the callable client
      createApiClient(config);
      const errorHandler = mockInterceptors.response.use.mock.calls[1][1];

      const error = new AxiosError(
        'Unauthorized',
        '401',
        undefined,
        undefined,
        {
          data: {},
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: { headers: {} as any },
        },
      );
      error.config = { url: '/api/v1/days', headers: {}, _retry: false } as any;

      const result = await errorHandler(error);

      expect(onTokenRefreshed).toHaveBeenCalledWith('new-token', 'new-refresh');
      expect(result).toEqual(retryResult);
    });

    it('calls onUnauthorized when refresh request fails', async () => {
      const onUnauthorized = vi.fn();
      const config = {
        baseURL: 'https://api.example.com',
        getToken: () => 'expired-token',
        getRefreshToken: () => 'bad-refresh-token',
        onTokenRefreshed: vi.fn(),
        onUnauthorized,
      };

      createApiClient(config);

      // Mock axios.post to fail
      (axios as any).post = vi
        .fn()
        .mockRejectedValue(new Error('refresh failed'));

      const errorHandler = mockInterceptors.response.use.mock.calls[0][1];
      const error = new AxiosError(
        'Unauthorized',
        '401',
        undefined,
        undefined,
        {
          data: {},
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: { headers: {} as any },
        },
      );
      error.config = { url: '/api/v1/days', headers: {} } as any;

      await expect(errorHandler(error)).rejects.toBe(error);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('calls onUnauthorized when refresh token is missing on 401', async () => {
      const config = {
        baseURL: 'https://api.example.com',
        getToken: () => 'token',
        getRefreshToken: () => null,
        onTokenRefreshed: vi.fn(),
        onUnauthorized: vi.fn(),
      };

      createApiClient(config);

      const errorHandler = mockInterceptors.response.use.mock.calls[0][1];
      const error = new AxiosError(
        'Unauthorized',
        '401',
        undefined,
        undefined,
        {
          data: {},
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: { headers: {} as any },
        },
      );
      error.config = { url: '/api/v1/days', headers: {} } as any;

      await expect(errorHandler(error)).rejects.toBe(error);
      expect(config.onUnauthorized).toHaveBeenCalledTimes(1);
    });
  });
});
