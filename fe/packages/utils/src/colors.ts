/** Convert hex color to rgba with opacity. */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Determine if a color is light (for choosing text color). */
export function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/** Get a contrasting text color (black or white) for a given background hex. */
export function contrastTextColor(hex: string): string {
  return isLightColor(hex) ? '#000000' : '#FFFFFF';
}

/** Preset color palette for picking category/day-state colors. */
export const COLOR_PALETTE = [
  '#4285F4', '#EA4335', '#E91E63', '#4CAF50',
  '#FF9800', '#00BCD4', '#9C27B0', '#607D8B',
  '#F44336', '#8BC34A', '#FFC107', '#03A9F4',
  '#FF5722', '#009688', '#673AB7', '#795548',
  '#2196F3', '#CDDC39', '#FF4081', '#00E5FF',
];

// ---------------------------------------------------------------------------
// Base colors & shade generation for the expanded color picker
// ---------------------------------------------------------------------------

/** Curated base colors for the shade picker (10 hues). */
export const BASE_COLORS = [
  { label: 'Red',    hex: '#EF4444' },
  { label: 'Orange', hex: '#F97316' },
  { label: 'Amber',  hex: '#F59E0B' },
  { label: 'Green',  hex: '#22C55E' },
  { label: 'Teal',   hex: '#14B8A6' },
  { label: 'Blue',   hex: '#3B82F6' },
  { label: 'Indigo', hex: '#6366F1' },
  { label: 'Purple', hex: '#A855F7' },
  { label: 'Pink',   hex: '#EC4899' },
  { label: 'Slate',  hex: '#64748B' },
] as const;

export type BaseColor = (typeof BASE_COLORS)[number];

/** Parse a hex string into r, g, b (0-255). */
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/** Convert r, g, b (0-255) back to a 6-digit hex string. */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/**
 * Mix a color with white (tint) or black (shade).
 * `factor` in [-1, 1]: positive → lighten, negative → darken.
 */
function mixColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = factor > 0 ? 255 : 0;
  const t = Math.abs(factor);
  return rgbToHex(
    r + (target - r) * t,
    g + (target - g) * t,
    b + (target - b) * t,
  );
}

/**
 * Generate 5 shades from a base hex color:
 *   [lighter, light, base, dark, darker]
 *
 * Pure function — no side effects.
 */
export function generateShades(baseHex: string): string[] {
  return [
    mixColor(baseHex, 0.45),  // lighter
    mixColor(baseHex, 0.2),   // light
    baseHex.toUpperCase(),     // base
    mixColor(baseHex, -0.2),  // dark
    mixColor(baseHex, -0.4),  // darker
  ];
}
