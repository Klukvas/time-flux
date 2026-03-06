import type { ThemeTokens, ResolvedTheme } from './types';

export const lightTheme: ThemeTokens = {
  colors: {
    bg: '#F9FAFB',
    bgSecondary: '#F3F4F6',
    bgElevated: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    border: '#E5E7EB',
    borderHover: '#D1D5DB',
    borderLight: '#F3F4F6',
    accent: '#3B82F6',
    accentHover: '#2563EB',
    accentLight: 'rgba(59, 130, 246, 0.08)',
    accentText: '#FFFFFF',
    danger: '#DC2626',
    dangerHover: '#B91C1C',
    dangerLight: 'rgba(220, 38, 38, 0.08)',
    success: '#059669',
    successHover: '#047857',
    successLight: 'rgba(5, 150, 105, 0.08)',
    warning: '#D97706',
    warningHover: '#B45309',
    warningLight: 'rgba(217, 119, 6, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    ring: 'rgba(59, 130, 246, 0.4)',
    shadow: 'rgba(0, 0, 0, 0.04)',
    shadowHover: 'rgba(0, 0, 0, 0.08)',
  },
};

export const darkTheme: ThemeTokens = {
  colors: {
    bg: '#0B0F14',
    bgSecondary: '#151B23',
    bgElevated: '#11161D',
    text: '#F5F7FA',
    textSecondary: '#A7B0BE',
    textTertiary: '#6B7280',
    textInverse: '#0B0F14',
    border: 'rgba(255, 255, 255, 0.06)',
    borderHover: 'rgba(255, 255, 255, 0.12)',
    borderLight: 'rgba(255, 255, 255, 0.03)',
    accent: '#60A5FA',
    accentHover: '#3B82F6',
    accentLight: 'rgba(96, 165, 250, 0.1)',
    accentText: '#0B0F14',
    danger: '#EF4444',
    dangerHover: '#DC2626',
    dangerLight: 'rgba(239, 68, 68, 0.1)',
    success: '#10B981',
    successHover: '#059669',
    successLight: 'rgba(16, 185, 129, 0.1)',
    warning: '#F59E0B',
    warningHover: '#D97706',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    ring: 'rgba(96, 165, 250, 0.4)',
    shadow: 'rgba(0, 0, 0, 0.2)',
    shadowHover: 'rgba(0, 0, 0, 0.3)',
  },
};

const themes: Record<ResolvedTheme, ThemeTokens> = { light: lightTheme, dark: darkTheme };

/** Get the full token set for a resolved theme. */
export function getThemeTokens(theme: ResolvedTheme): ThemeTokens {
  return themes[theme];
}
