export interface ColorTokens {
  primary: string;        // Main accent color (RGB format: '255 213 15')
  primaryHover: string;   // Hover state for primary (RGB format)
  secondary: string;      // Secondary accent (RGB format)

  // Semantic colors
  primaryBg: string;      // For buttons, active states (RGB format)
  primaryText: string;    // Text on primary backgrounds (RGB format)

  // Visual adjustments
  luminosityFactor: number; // Opacity multiplier for gradients (1.0 = baseline, higher = more visible)
}

export type ColorPalette = 'yellow' | 'blue' | 'purple' | 'green' | 'pink';

export const COLOR_PALETTES: Record<ColorPalette, ColorTokens> = {
  yellow: {
    primary: '255 213 15',
    primaryHover: '253 118 91',
    secondary: '253 118 91',
    primaryBg: '255 213 15',
    primaryText: '0 0 0',
    luminosityFactor: 1.0,
  },
  blue: {
    primary: '59 130 246',
    primaryHover: '37 99 235',
    secondary: '6 182 212',
    primaryBg: '59 130 246',
    primaryText: '255 255 255',
    luminosityFactor: 1.6,
  },
  purple: {
    primary: '168 85 247',
    primaryHover: '147 51 234',
    secondary: '236 72 153',
    primaryBg: '168 85 247',
    primaryText: '255 255 255',
    luminosityFactor: 1.4,
  },
  green: {
    primary: '16 185 129',
    primaryHover: '5 150 105',
    secondary: '20 184 166',
    primaryBg: '16 185 129',
    primaryText: '255 255 255',
    luminosityFactor: 1.5,
  },
  pink: {
    primary: '236 72 153',
    primaryHover: '219 39 119',
    secondary: '244 114 182',
    primaryBg: '236 72 153',
    primaryText: '255 255 255',
    luminosityFactor: 1.3,
  },
};

export const PALETTE_METADATA: Record<ColorPalette, { name: string; icon: string }> = {
  yellow: { name: 'Sunburst', icon: '☀️' },
  blue: { name: 'Ocean', icon: '🌊' },
  purple: { name: 'Galaxy', icon: '🌌' },
  green: { name: 'Forest', icon: '🌲' },
  pink: { name: 'Blossom', icon: '🌸' },
};
