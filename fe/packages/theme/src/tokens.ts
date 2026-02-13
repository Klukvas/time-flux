import type { ThemeTokens, ResolvedTheme } from './types';

export const lightTheme: ThemeTokens = {
  colors: {
    bg: '#f9fafb',           // gray-50
    bgSecondary: '#ffffff',   // white
    bgCard: '#ffffff',        // white
    text: '#111827',          // gray-900
    textSecondary: '#6b7280', // gray-500
    textTertiary: '#9ca3af',  // gray-400
    border: '#e5e7eb',        // gray-200
    borderLight: '#f3f4f6',   // gray-100
    accent: '#3b82f6',        // brand-500
    accentHover: '#2563eb',   // brand-600
    accentText: '#ffffff',    // white
    danger: '#ef4444',        // red-500
    dangerHover: '#dc2626',   // red-600
    success: '#22c55e',       // green-500
    overlay: 'rgba(0, 0, 0, 0.5)',
    ring: 'rgba(59, 130, 246, 0.5)', // brand-500 / 50%
  },
};

export const darkTheme: ThemeTokens = {
  colors: {
    bg: '#111827',            // gray-900
    bgSecondary: '#1f2937',   // gray-800
    bgCard: '#1f2937',        // gray-800
    text: '#f9fafb',          // gray-50
    textSecondary: '#9ca3af', // gray-400
    textTertiary: '#6b7280',  // gray-500
    border: '#374151',        // gray-700
    borderLight: '#1f2937',   // gray-800
    accent: '#60a5fa',        // brand-400
    accentHover: '#3b82f6',   // brand-500
    accentText: '#111827',    // gray-900
    danger: '#f87171',        // red-400
    dangerHover: '#ef4444',   // red-500
    success: '#4ade80',       // green-400
    overlay: 'rgba(0, 0, 0, 0.7)',
    ring: 'rgba(96, 165, 250, 0.5)', // brand-400 / 50%
  },
};

const themes: Record<ResolvedTheme, ThemeTokens> = { light: lightTheme, dark: darkTheme };

/** Get the full token set for a resolved theme. */
export function getThemeTokens(theme: ResolvedTheme): ThemeTokens {
  return themes[theme];
}
