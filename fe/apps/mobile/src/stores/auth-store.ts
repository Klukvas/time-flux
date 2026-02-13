import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@lifespan/api';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  ready: boolean;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

const TOKEN_KEY = 'lifespan_token';
const REFRESH_TOKEN_KEY = 'lifespan_refresh_token';
const USER_KEY = 'lifespan_user';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  ready: false,

  setAuth: (token, refreshToken, user) => {
    SecureStore.setItemAsync(TOKEN_KEY, token);
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, refreshToken, user });
  },

  setTokens: (token, refreshToken) => {
    SecureStore.setItemAsync(TOKEN_KEY, token);
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    set({ token, refreshToken });
  },

  logout: () => {
    SecureStore.deleteItemAsync(TOKEN_KEY);
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, refreshToken: null, user: null });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      if (token && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        set({ token, refreshToken, user, ready: true });
      } else {
        set({ ready: true });
      }
    } catch {
      set({ ready: true });
    }
  },
}));
