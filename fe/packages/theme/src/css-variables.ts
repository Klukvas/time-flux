import type { SemanticColors, ResolvedTheme } from './types';
import { getThemeTokens } from './tokens';

/**
 * Map semantic color keys to CSS variable names.
 * Used by Tailwind and globals.css.
 */
const COLOR_VAR_MAP: Record<keyof SemanticColors, string> = {
  bg: '--color-bg',
  bgSecondary: '--color-bg-secondary',
  bgElevated: '--color-bg-elevated',
  text: '--color-text',
  textSecondary: '--color-text-secondary',
  textTertiary: '--color-text-tertiary',
  textInverse: '--color-text-inverse',
  border: '--color-border',
  borderHover: '--color-border-hover',
  borderLight: '--color-border-light',
  accent: '--color-accent',
  accentHover: '--color-accent-hover',
  accentLight: '--color-accent-light',
  accentText: '--color-accent-text',
  danger: '--color-danger',
  dangerHover: '--color-danger-hover',
  dangerLight: '--color-danger-light',
  success: '--color-success',
  successHover: '--color-success-hover',
  successLight: '--color-success-light',
  warning: '--color-warning',
  warningHover: '--color-warning-hover',
  warningLight: '--color-warning-light',
  overlay: '--color-overlay',
  ring: '--color-ring',
  shadow: '--color-shadow',
  shadowHover: '--color-shadow-hover',
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
