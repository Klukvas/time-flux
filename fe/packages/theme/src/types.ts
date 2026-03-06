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
  /** Elevated surface background (cards, modals) */
  bgElevated: string;
  /** Primary text */
  text: string;
  /** Secondary / muted text */
  textSecondary: string;
  /** Tertiary / placeholder text */
  textTertiary: string;
  /** Inverse text (on colored backgrounds) */
  textInverse: string;
  /** Primary border color */
  border: string;
  /** Border hover state */
  borderHover: string;
  /** Subtle / light border */
  borderLight: string;
  /** Brand accent */
  accent: string;
  /** Accent hover / pressed */
  accentHover: string;
  /** Accent tinted background */
  accentLight: string;
  /** Text on accent backgrounds */
  accentText: string;
  /** Danger / destructive */
  danger: string;
  /** Danger hover */
  dangerHover: string;
  /** Danger tinted background */
  dangerLight: string;
  /** Success */
  success: string;
  /** Success hover */
  successHover: string;
  /** Success tinted background */
  successLight: string;
  /** Warning */
  warning: string;
  /** Warning hover */
  warningHover: string;
  /** Warning tinted background */
  warningLight: string;
  /** Overlay / backdrop */
  overlay: string;
  /** Focus ring */
  ring: string;
  /** Default shadow */
  shadow: string;
  /** Elevated shadow */
  shadowHover: string;
}

/** Full theme token set. */
export interface ThemeTokens {
  colors: SemanticColors;
}
