import { describe, it, expect } from 'vitest';
import {
  hexToRgba,
  isLightColor,
  contrastTextColor,
  generateShades,
  COLOR_PALETTE,
  BASE_COLORS,
} from './colors';

// ---------------------------------------------------------------------------
// hexToRgba
// ---------------------------------------------------------------------------
describe('hexToRgba', () => {
  it('converts white with full opacity', () => {
    expect(hexToRgba('#FFFFFF', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('converts black with full opacity', () => {
    expect(hexToRgba('#000000', 1)).toBe('rgba(0, 0, 0, 1)');
  });

  it('converts with fractional opacity', () => {
    expect(hexToRgba('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('converts with zero opacity', () => {
    expect(hexToRgba('#00FF00', 0)).toBe('rgba(0, 255, 0, 0)');
  });

  it('handles mixed color', () => {
    expect(hexToRgba('#4285F4', 0.8)).toBe('rgba(66, 133, 244, 0.8)');
  });

  it('handles lowercase hex', () => {
    expect(hexToRgba('#ff5722', 1)).toBe('rgba(255, 87, 34, 1)');
  });
});

// ---------------------------------------------------------------------------
// isLightColor
// ---------------------------------------------------------------------------
describe('isLightColor', () => {
  it('identifies white as light', () => {
    expect(isLightColor('#FFFFFF')).toBe(true);
  });

  it('identifies black as dark', () => {
    expect(isLightColor('#000000')).toBe(false);
  });

  it('identifies pure red as dark', () => {
    // Red luminance: (0.299 * 255) / 255 = 0.299 < 0.5
    expect(isLightColor('#FF0000')).toBe(false);
  });

  it('identifies pure green as light', () => {
    // Green luminance: (0.587 * 255) / 255 = 0.587 > 0.5
    expect(isLightColor('#00FF00')).toBe(true);
  });

  it('identifies pure blue as dark', () => {
    // Blue luminance: (0.114 * 255) / 255 = 0.114 < 0.5
    expect(isLightColor('#0000FF')).toBe(false);
  });

  it('identifies yellow as light', () => {
    // Yellow = R+G luminance: (0.299 + 0.587) = 0.886 > 0.5
    expect(isLightColor('#FFFF00')).toBe(true);
  });

  it('identifies a mid-gray correctly', () => {
    // #808080 luminance: (0.299*128 + 0.587*128 + 0.114*128)/255 ≈ 0.502
    expect(isLightColor('#808080')).toBe(true);
  });

  it('identifies a dark gray as dark', () => {
    // #333333 luminance: 51 * 1.0 / 255 ≈ 0.2
    expect(isLightColor('#333333')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// contrastTextColor
// ---------------------------------------------------------------------------
describe('contrastTextColor', () => {
  it('returns black for white background', () => {
    expect(contrastTextColor('#FFFFFF')).toBe('#000000');
  });

  it('returns white for black background', () => {
    expect(contrastTextColor('#000000')).toBe('#FFFFFF');
  });

  it('returns black for yellow background', () => {
    expect(contrastTextColor('#FFFF00')).toBe('#000000');
  });

  it('returns white for dark blue background', () => {
    expect(contrastTextColor('#00008B')).toBe('#FFFFFF');
  });

  it('returns white for red background', () => {
    expect(contrastTextColor('#FF0000')).toBe('#FFFFFF');
  });

  it('is consistent with isLightColor', () => {
    const hex = '#4285F4';
    const expected = isLightColor(hex) ? '#000000' : '#FFFFFF';
    expect(contrastTextColor(hex)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// generateShades
// ---------------------------------------------------------------------------
describe('generateShades', () => {
  it('returns exactly 5 shades', () => {
    expect(generateShades('#EF4444')).toHaveLength(5);
  });

  it('third shade (index 2) is the base color uppercased', () => {
    const shades = generateShades('#ef4444');
    expect(shades[2]).toBe('#EF4444');
  });

  it('lighter shades have higher RGB values than the base', () => {
    const shades = generateShades('#3B82F6');
    // Parse the lighter shade and compare to base
    const parseHex = (h: string) => [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16),
    ];
    const lighter = parseHex(shades[0]!);
    const base = parseHex(shades[2]!);
    // Each lighter channel should be >= base channel
    expect(lighter[0]! >= base[0]!).toBe(true);
    expect(lighter[1]! >= base[1]!).toBe(true);
    expect(lighter[2]! >= base[2]!).toBe(true);
  });

  it('darker shades have lower RGB values than the base', () => {
    const shades = generateShades('#3B82F6');
    const parseHex = (h: string) => [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16),
    ];
    const darker = parseHex(shades[4]!);
    const base = parseHex(shades[2]!);
    expect(darker[0]! <= base[0]!).toBe(true);
    expect(darker[1]! <= base[1]!).toBe(true);
    expect(darker[2]! <= base[2]!).toBe(true);
  });

  it('all shades are valid 7-char hex strings', () => {
    const shades = generateShades('#22C55E');
    for (const shade of shades) {
      expect(shade).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('shades are ordered from lightest to darkest', () => {
    const shades = generateShades('#6366F1');
    const luminance = (h: string) => {
      const r = parseInt(h.slice(1, 3), 16);
      const g = parseInt(h.slice(3, 5), 16);
      const b = parseInt(h.slice(5, 7), 16);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    for (let i = 0; i < shades.length - 1; i++) {
      expect(luminance(shades[i]!)).toBeGreaterThanOrEqual(
        luminance(shades[i + 1]!),
      );
    }
  });

  it('produces white-ish lighter shade for white input', () => {
    const shades = generateShades('#FFFFFF');
    // Lightening white should still be white
    expect(shades[0]).toBe('#FFFFFF');
    expect(shades[1]).toBe('#FFFFFF');
    expect(shades[2]).toBe('#FFFFFF');
  });

  it('produces black-ish darker shade for black input', () => {
    const shades = generateShades('#000000');
    // Darkening black should still be black
    expect(shades[3]).toBe('#000000');
    expect(shades[4]).toBe('#000000');
  });
});

// ---------------------------------------------------------------------------
// COLOR_PALETTE
// ---------------------------------------------------------------------------
describe('COLOR_PALETTE', () => {
  it('contains 20 colors', () => {
    expect(COLOR_PALETTE).toHaveLength(20);
  });

  it('all entries are valid hex colors', () => {
    for (const color of COLOR_PALETTE) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// BASE_COLORS
// ---------------------------------------------------------------------------
describe('BASE_COLORS', () => {
  it('contains 10 base colors', () => {
    expect(BASE_COLORS).toHaveLength(10);
  });

  it('each entry has a labelKey and hex', () => {
    for (const color of BASE_COLORS) {
      expect(color).toHaveProperty('labelKey');
      expect(color).toHaveProperty('hex');
      expect(color.labelKey).toMatch(/^colors\.\w+$/);
      expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
