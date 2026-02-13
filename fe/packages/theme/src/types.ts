/** User preference: light, dark, or follow system. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** Resolved (actual) theme applied to UI — never 'system'. */
export type ResolvedTheme = 'light' | 'dark';

/** Semantic color tokens used by both web and mobile. */
export interface SemanticColors {
  /** Primary background */
  bg: string;
  /** Secondary / subtle background */
  bgSecondary: string;
  /** Card / elevated surface background */
  bgCard: string;
  /** Primary text */
  text: string;
  /** Secondary / muted text */
  textSecondary: string;
  /** Tertiary / placeholder text */
  textTertiary: string;
  /** Primary border color */
  border: string;
  /** Subtle / light border */
  borderLight: string;
  /** Brand accent */
  accent: string;
  /** Accent hover / pressed */
  accentHover: string;
  /** Text on accent backgrounds */
  accentText: string;
  /** Danger / destructive */
  danger: string;
  /** Danger hover */
  dangerHover: string;
  /** Success */
  success: string;
  /** Overlay / backdrop */
  overlay: string;
  /** Focus ring */
  ring: string;
}

/** Full theme token set. */
export interface ThemeTokens {
  colors: SemanticColors;
}
