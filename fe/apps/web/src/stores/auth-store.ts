import { create } from 'zustand';
import type { AuthUser } from '@timeflux/api';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
  hydrate: () => void;
}

const TOKEN_KEY = 'timeflux_token';
const REFRESH_TOKEN_KEY = 'timeflux_refresh_token';
const USER_KEY = 'timeflux_user';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,

  setAuth: (token, refreshToken, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, refreshToken, user });
  },

  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  setTokens: (token, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    set({ token, refreshToken });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, refreshToken: null, user: null });
  },

  hydrate: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const raw = JSON.parse(userStr);
        const user: AuthUser = { ...raw, birthDate: raw.birthDate ?? null };
        set({ token, refreshToken, user });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  },
}));
