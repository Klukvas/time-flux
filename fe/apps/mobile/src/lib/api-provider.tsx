import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createApiClient, createApi } from '@lifespan/api';
import { ApiContext } from '@lifespan/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { router } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const logout = useAuthStore((s) => s.logout);

  const api = useMemo(() => {
    const client = createApiClient({
      baseURL: API_BASE_URL,
      getToken: () => token,
      getRefreshToken: () => refreshToken,
      onTokenRefreshed: (newAccess, newRefresh) => {
        setTokens(newAccess, newRefresh);
      },
      onUnauthorized: () => {
        logout();
        router.replace('/(auth)/login');
      },
    });
    return createApi(client);
  }, [token, refreshToken, setTokens, logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </QueryClientProvider>
  );
}
