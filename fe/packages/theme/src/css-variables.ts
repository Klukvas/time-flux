import type { SemanticColors, ResolvedTheme } from './types';
import { getThemeTokens } from './tokens';

/**
 * Map semantic color keys to CSS variable names.
 * Used by Tailwind and globals.css.
 */
const COLOR_VAR_MAP: Record<keyof SemanticColors, string> = {
  bg: '--color-bg',
  bgSecondary: '--color-bg-secondary',
  bgCard: '--color-bg-card',
  text: '--color-text',
  textSecondary: '--color-text-secondary',
  textTertiary: '--color-text-tertiary',
  border: '--color-border',
  borderLight: '--color-border-light',
  accent: '--color-accent',
  accentHover: '--color-accent-hover',
  accentText: '--color-accent-text',
  danger: '--color-danger',
  dangerHover: '--color-danger-hover',
  success: '--color-success',
  overlay: '--color-overlay',
  ring: '--color-ring',
};

/** Generate a CSS variables string for a given theme. */
export function generateCssVariables(theme: ResolvedTheme): string {
  const tokens = getThemeTokens(theme);
  return Object.entries(COLOR_VAR_MAP)
    .map(([key, varName]) => `${varName}: ${tokens.colors[key as keyof SemanticColors]};`)
    .join('\n  ');
}

/** CSS variable references for Tailwind config. */
export const cssVarRefs: Record<keyof SemanticColors, string> = Object.fromEntries(
  Object.entries(COLOR_VAR_MAP).map(([key, varName]) => [key, `var(${varName})`]),
) as Record<keyof SemanticColors, string>;
