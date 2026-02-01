/**
 * Structured Theme System for CalendarCanvas
 *
 * Themes: Default, Glass, Acrylic
 * Each theme has Light and Dark variants
 * Acrylic has additional Thin/Thick variants
 *
 * Palettes: Separate color palettes that can be used with any theme
 */

import { CalendarCanvasTheme } from '../types';

// Import texture for Vite to handle properly
import acrylicTextureUrl from '../assets/Texture_Acrylic.png';

// =============================================================================
// Theme Variant Type
// =============================================================================

export type ThemeVariant = 'light' | 'dark';

/** Extended variant for families with more than just light/dark */
export interface ThemeVariantOption {
  id: string;
  name: string;
  baseVariant: ThemeVariant;
  theme: CalendarCanvasTheme;
}

export interface ThemeFamily {
  id: string;
  name: string;
  description: string;
  variants: {
    light: CalendarCanvasTheme;
    dark: CalendarCanvasTheme;
  };
  /** Extended variants for families with more than light/dark (e.g., Acrylic) */
  extendedVariants?: ThemeVariantOption[];
}

// =============================================================================
// COLOR PALETTES - Universal palettes usable with any theme
// =============================================================================

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

/** Saturated - Vibrant and saturated colors (from Default theme) */
const PALETTE_SATURATED: ColorPalette = {
  id: 'saturated',
  name: 'Saturated',
  colors: [
    '#f87171', // Red
    '#fb923c', // Orange
    '#facc15', // Yellow
    '#4ade80', // Green
    '#22d3ee', // Cyan
    '#60a5fa', // Blue
    '#a78bfa', // Purple
    '#f472b6', // Pink
    '#34d399', // Emerald
    '#fbbf24', // Amber
    '#818cf8', // Indigo
    '#fb7185', // Rose
  ],
};

/** Fresh Tint - Semi-transparent, ethereal (from Glass theme) */
const PALETTE_FRESH_TINT: ColorPalette = {
  id: 'fresh-tint',
  name: 'Fresh Tint',
  colors: [
    '#94a3b8', // Slate
    '#7dd3fc', // Sky
    '#c4b5fd', // Violet
    '#fda4af', // Rose
    '#86efac', // Green
    '#fcd34d', // Amber
    '#a5b4fc', // Indigo
    '#f0abfc', // Fuchsia
    '#67e8f9', // Cyan
    '#fdba74', // Orange
    '#d8b4fe', // Purple
    '#bef264', // Lime
  ],
};

/** Morandi - Muted, earthy tones (from Matt theme) */
const PALETTE_MORANDI: ColorPalette = {
  id: 'morandi',
  name: 'Morandi',
  colors: [
    '#a8a29e', // Stone
    '#d4a574', // Tan
    '#8b9dc3', // Slate Blue
    '#c9a9a6', // Dusty Rose
    '#87a889', // Sage
    '#b8a9c9', // Lavender
    '#9eb8a8', // Sea Green
    '#c4a77d', // Sand
    '#a3b1c6', // Cool Gray
    '#d4b5b0', // Blush
    '#8ea8b8', // Steel Blue
    '#c9c4a6', // Khaki
  ],
};

/** Midnight Slate - Deep, moody slate tones */
const PALETTE_MIDNIGHT_SLATE: ColorPalette = {
  id: 'midnight-slate',
  name: 'Midnight Slate',
  colors: [
    '#64748b', // Slate
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f43f5e', // Rose
    '#06b6d4', // Cyan
    '#a855f7', // Purple
    '#84cc16', // Lime
  ],
};

/** Light Silk - Brighter, vibrant frosted colors */
const PALETTE_LIGHT_SILK: ColorPalette = {
  id: 'light-silk',
  name: 'Light Silk',
  colors: [
    '#94a3b8', // Frosted Slate
    '#a78bfa', // Frosted Violet
    '#7dd3fc', // Frosted Sky
    '#f0abfc', // Frosted Magenta
    '#86efac', // Frosted Mint
    '#fcd34d', // Frosted Amber
    '#fda4af', // Frosted Rose
    '#67e8f9', // Frosted Cyan
    '#c4b5fd', // Frosted Lavender
    '#fdba74', // Frosted Peach
    '#a5f3fc', // Frosted Aqua
    '#d8b4fe', // Frosted Purple
  ],
};

/** Dark Slate - Deep, muted frosted colors */
const PALETTE_DARK_SLATE: ColorPalette = {
  id: 'dark-slate',
  name: 'Dark Slate',
  colors: [
    '#0e1526', // Deep Navy
    '#1e1b4b', // Deep Indigo
    '#134e4a', // Deep Teal
    '#3f3f46', // Deep Zinc
    '#1c1917', // Deep Stone
    '#422006', // Deep Amber
    '#4a044e', // Deep Fuchsia
    '#083344', // Deep Cyan
    '#365314', // Deep Lime
    '#7f1d1d', // Deep Red
    '#312e81', // Deep Violet
    '#1e3a5f', // Deep Slate Blue
  ],
};

/** Ocean Mist - Oceanic blue-slate tones */
const PALETTE_OCEAN_MIST: ColorPalette = {
  id: 'ocean-mist',
  name: 'Ocean Mist',
  colors: [
    '#0ea5e9', // Sky Blue
    '#06b6d4', // Cyan
    '#14b8a6', // Teal
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#0891b2', // Dark Cyan
    '#0284c7', // Light Blue
    '#2563eb', // Royal Blue
    '#4f46e5', // Dark Indigo
    '#7c3aed', // Purple
    '#059669', // Emerald
  ],
};

/** Light Forest - Natural green tones */
const PALETTE_LIGHT_FOREST: ColorPalette = {
  id: 'light-forest',
  name: 'Light Forest',
  colors: [
    '#86efac', // Mint
    '#4ade80', // Green
    '#22c55e', // Emerald
    '#10b981', // Teal Green
    '#34d399', // Light Emerald
    '#a3e635', // Lime
    '#84cc16', // Yellow Green
    '#65a30d', // Olive
    '#15803d', // Forest
    '#059669', // Dark Emerald
    '#047857', // Dark Teal
    '#6ee7b7', // Aquamarine
  ],
};

/** All available color palettes */
export const COLOR_PALETTES: ColorPalette[] = [
  PALETTE_SATURATED,
  PALETTE_FRESH_TINT,
  PALETTE_LIGHT_SILK,
  PALETTE_OCEAN_MIST,
  PALETTE_LIGHT_FOREST,
  PALETTE_MORANDI,
  PALETTE_MIDNIGHT_SLATE,
  PALETTE_DARK_SLATE,
];

/** Get palette by ID */
export const getPalette = (paletteId: string): ColorPalette => {
  return COLOR_PALETTES.find(p => p.id === paletteId) || PALETTE_SATURATED;
};

/** Get default palette ID for a theme variant */
export const getDefaultPaletteForVariant = (variant: ThemeVariant): string => {
  return variant === 'light' ? 'saturated' : 'saturated';
};

// =============================================================================
// DEFAULT THEME FAMILY
// =============================================================================

const DEFAULT_LIGHT: CalendarCanvasTheme = {
  id: 'default-light',
  name: 'Default Light',
  variant: 'light',
  canvas: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    padding: '32px',
  },
  header: {
    textColor: '#111827',
    fontWeight: '600',
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
    opacity: 0.8,
  },
  timeColumn: {
    textColor: '#9ca3af',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: '#f3f4f6',
    dividerColor: '#f3f4f6',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '6px',
    border: '1px solid rgba(0,0,0,0.05)',
    shadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '8px',
    marginX: '4px',
    backgroundOpacity: 1,
    titleColor: '#1f2937',
    subtitleColor: '#374151',
    detailsColor: '#4b5563',
    titleFontWeight: '700',
    hoverBrightness: 1.05,
    hoverShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  footer: {
    textColor: '#6b7280',
    fontSize: '0.75rem',
    opacity: 0.5,
  },
};

const DEFAULT_DARK: CalendarCanvasTheme = {
  id: 'default-dark',
  name: 'Default Dark',
  variant: 'dark',
  canvas: {
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: '16px',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    padding: '32px',
  },
  header: {
    textColor: '#f3f4f6',
    fontWeight: '600',
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
    opacity: 0.8,
  },
  timeColumn: {
    textColor: '#6b7280',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: '#1f2937',
    dividerColor: '#1f2937',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '6px',
    border: '1px solid rgba(0,0,0,0.1)',
    shadow: '0 1px 3px rgba(0,0,0,0.2)',
    padding: '8px',
    marginX: '4px',
    backgroundOpacity: 1,
    titleColor: '#1f2937',
    subtitleColor: '#1f2937',
    detailsColor: '#374151',
    titleFontWeight: '700',
    hoverBrightness: 1.1,
    hoverShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  footer: {
    textColor: '#9ca3af',
    fontSize: '0.75rem',
    opacity: 0.5,
  },
};

export const THEME_DEFAULT: ThemeFamily = {
  id: 'default',
  name: 'Default',
  description: 'Clean and modern design',
  variants: {
    light: DEFAULT_LIGHT,
    dark: DEFAULT_DARK,
  },
};

// =============================================================================
// GLASS THEME FAMILY
// =============================================================================

const GLASS_LIGHT: CalendarCanvasTheme = {
  id: 'glass-light',
  name: 'Glass Light',
  variant: 'light',
  canvas: {
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.8)',
    borderRadius: '20px',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    padding: '32px',
    backdropFilter: 'blur(16px)',
  },
  header: {
    textColor: '#1f2937',
    fontWeight: '600',
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
    opacity: 0.9,
  },
  timeColumn: {
    textColor: 'rgba(31,41,55,0.6)',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: 'rgba(0,0,0,0.08)',
    dividerColor: 'rgba(0,0,0,0.08)',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.6)',
    shadow: '0 4px 16px rgba(0,0,0,0.08)',
    padding: '8px',
    marginX: '4px',
    backgroundOpacity: 0.8,
    titleColor: '#1f2937',
    subtitleColor: '#374151',
    detailsColor: '#4b5563',
    titleFontWeight: '700',
    hoverBrightness: 1.05,
    hoverShadow: '0 8px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(8px)',
  },
  footer: {
    textColor: 'rgba(31,41,55,0.6)',
    fontSize: '0.75rem',
    opacity: 0.6,
  },
};

const GLASS_DARK: CalendarCanvasTheme = {
  id: 'glass-dark',
  name: 'Glass Dark',
  variant: 'dark',
  canvas: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '20px',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    padding: '32px',
    backdropFilter: 'blur(16px)',
  },
  header: {
    textColor: '#ffffff',
    fontWeight: '600',
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
    opacity: 0.9,
  },
  timeColumn: {
    textColor: 'rgba(255,255,255,0.6)',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: 'rgba(255,255,255,0.1)',
    dividerColor: 'rgba(255,255,255,0.1)',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.2)',
    shadow: '0 4px 16px rgba(0,0,0,0.2)',
    padding: '8px',
    marginX: '4px',
    backgroundOpacity: 0.85,
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255,255,255,0.9)',
    detailsColor: 'rgba(255,255,255,0.8)',
    titleFontWeight: '700',
    hoverBrightness: 1.15,
    hoverShadow: '0 8px 24px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(8px)',
  },
  footer: {
    textColor: 'rgba(255,255,255,0.7)',
    fontSize: '0.75rem',
    opacity: 0.5,
  },
};

export const THEME_GLASS: ThemeFamily = {
  id: 'glass',
  name: 'Glass',
  description: 'Translucent glassmorphism effect',
  variants: {
    light: GLASS_LIGHT,
    dark: GLASS_DARK,
  },
};

// =============================================================================
// ACRYLIC THEME FAMILY - Frosted Glass Effect (Thin/Thick variants)
// =============================================================================

// Texture path for acrylic noise effect (imported for Vite bundling)
const ACRYLIC_TEXTURE = acrylicTextureUrl;

// Thin Dark (minimal frosted effect)
const ACRYLIC_THIN_DARK: CalendarCanvasTheme = {
  id: 'acrylic-thin-dark',
  name: 'Acrylic Thin Dark',
  variant: 'dark',
  canvas: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    padding: '32px',
  },
  header: {
    textColor: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    fontSize: '0.85rem',
    letterSpacing: '0.12em',
    opacity: 0.85,
  },
  timeColumn: {
    textColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: 'rgba(255, 255, 255, 0.06)',
    dividerColor: 'rgba(255, 255, 255, 0.08)',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    shadow: '0px 10px 14px rgba(0, 0, 0, 0.25)',
    padding: '10px',
    marginX: '4px',
    backgroundOpacity: 1,
    titleColor: 'rgba(255, 255, 255, 0.95)',
    subtitleColor: 'rgba(255, 255, 255, 0.75)',
    detailsColor: 'rgba(255, 255, 255, 0.6)',
    titleFontWeight: '600',
    hoverBrightness: 1.08,
    hoverShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    backdropFilter: 'blur(30px)',
    acrylicBackground: `rgba(255, 255, 255, 0.35)`,
    backgroundBlendMode: 'normal',
  },
  footer: {
    textColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.75rem',
    opacity: 0.5,
  },
};

// Thin Light (minimal frosted effect)
const ACRYLIC_THIN_LIGHT: CalendarCanvasTheme = {
  id: 'acrylic-thin-light',
  name: 'Acrylic Thin Light',
  variant: 'light',
  canvas: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: '24px',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    padding: '32px',
  },
  header: {
    textColor: 'rgba(55, 65, 81, 0.9)',
    fontWeight: '500',
    fontSize: '0.85rem',
    letterSpacing: '0.12em',
    opacity: 0.85,
  },
  timeColumn: {
    textColor: 'rgba(107, 114, 128, 0.6)',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: 'rgba(0, 0, 0, 0.04)',
    dividerColor: 'rgba(0, 0, 0, 0.06)',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    shadow: '0px 10px 14px rgba(0, 0, 0, 0.25)',
    padding: '10px',
    marginX: '4px',
    backgroundOpacity: 1,
    titleColor: '#111827',
    subtitleColor: '#1f2937',
    detailsColor: '#374151',
    titleFontWeight: '600',
    hoverBrightness: 1.02,
    hoverShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(30px)',
    acrylicBackground: `rgba(255, 255, 255, 0.35)`,
    backgroundBlendMode: 'normal',
  },
  footer: {
    textColor: 'rgba(107, 114, 128, 0.6)',
    fontSize: '0.75rem',
    opacity: 0.5,
  },
};

// Thick Dark (more prominent frosted effect with texture)
const ACRYLIC_THICK_DARK: CalendarCanvasTheme = {
  id: 'acrylic-thick-dark',
  name: 'Acrylic Thick Dark',
  variant: 'dark',
  canvas: {
    background: `url('${ACRYLIC_TEXTURE}'), linear-gradient(180deg, rgba(74, 95, 127, 0.2) 0%, rgba(56, 89, 122, 0.2) 100%), linear-gradient(0deg, rgba(147, 197, 253, 0.08), rgba(147, 197, 253, 0.08)), rgba(74, 95, 127, 0.75)`,
    border: '1px solid rgba(147, 197, 253, 0.12)',
    borderRadius: '24px',
    shadow: '0 8px 32px rgba(30, 58, 95, 0.35), 0 2px 8px rgba(30, 58, 95, 0.18), inset 0 1px 0 rgba(147, 197, 253, 0.08)',
    padding: '32px',
    backdropFilter: 'blur(15px)',
  },
  header: {
    textColor: 'rgba(224, 242, 254, 0.95)',
    fontWeight: '500',
    fontSize: '0.85rem',
    letterSpacing: '0.12em',
    opacity: 0.9,
  },
  timeColumn: {
    textColor: 'rgba(147, 197, 253, 0.5)',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: 'rgba(147, 197, 253, 0.08)',
    dividerColor: 'rgba(147, 197, 253, 0.1)',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '14px',
    border: '1px solid rgba(147, 197, 253, 0.12)',
    shadow: '0 4px 16px rgba(30, 58, 95, 0.25), 0 1px 4px rgba(30, 58, 95, 0.12)',
    padding: '10px',
    marginX: '4px',
    backgroundOpacity: 0.7,
    gradient: 'linear-gradient(180deg, rgba(147, 197, 253, 0.08) 0%, rgba(96, 165, 250, 0.08) 100%)',
    titleColor: 'rgba(240, 249, 255, 0.95)',
    subtitleColor: 'rgba(186, 230, 253, 0.85)',
    detailsColor: 'rgba(147, 197, 253, 0.7)',
    titleFontWeight: '600',
    hoverBrightness: 1.1,
    hoverShadow: '0 8px 24px rgba(30, 58, 95, 0.35)',
    backdropFilter: 'blur(8px)',
  },
  footer: {
    textColor: 'rgba(147, 197, 253, 0.5)',
    fontSize: '0.75rem',
    opacity: 0.5,
  },
};

// Thick Light (more prominent frosted effect with warm tint)
const ACRYLIC_THICK_LIGHT: CalendarCanvasTheme = {
  id: 'acrylic-thick-light',
  name: 'Acrylic Thick Light',
  variant: 'light',
  canvas: {
    background: `url('${ACRYLIC_TEXTURE}'), linear-gradient(180deg, rgba(253, 251, 247, 0.2) 0%, rgba(239, 235, 230, 0.2) 100%), linear-gradient(0deg, rgba(255, 253, 250, 0.3), rgba(255, 253, 250, 0.3)), rgba(250, 248, 245, 0.6)`,
    border: '1px solid rgba(255, 253, 250, 0.7)',
    borderRadius: '24px',
    shadow: '0 8px 32px rgba(120, 100, 80, 0.06), 0 2px 8px rgba(120, 100, 80, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    padding: '32px',
    backdropFilter: 'blur(15px)',
  },
  header: {
    textColor: 'rgba(68, 64, 60, 0.9)',
    fontWeight: '500',
    fontSize: '0.85rem',
    letterSpacing: '0.12em',
    opacity: 0.85,
  },
  timeColumn: {
    textColor: 'rgba(120, 113, 108, 0.6)',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: 'rgba(68, 64, 60, 0.04)',
    dividerColor: 'rgba(68, 64, 60, 0.06)',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '14px',
    border: '1px solid rgba(255, 253, 250, 0.8)',
    shadow: '0 4px 16px rgba(120, 100, 80, 0.05), 0 1px 4px rgba(120, 100, 80, 0.02)',
    padding: '10px',
    marginX: '4px',
    backgroundOpacity: 0.75,
    titleColor: '#111827',
    subtitleColor: '#1f2937',
    detailsColor: '#374151',
    titleFontWeight: '600',
    hoverBrightness: 1.02,
    hoverShadow: '0 8px 24px rgba(120, 100, 80, 0.08)',
    backdropFilter: 'blur(8px)',
  },
  footer: {
    textColor: 'rgba(120, 113, 108, 0.6)',
    fontSize: '0.75rem',
    opacity: 0.5,
  },
};

export const THEME_ACRYLIC: ThemeFamily = {
  id: 'acrylic',
  name: 'Acrylic',
  description: 'Frosted glass effect with noise texture and blur',
  variants: {
    light: ACRYLIC_THIN_LIGHT,
    dark: ACRYLIC_THIN_DARK,
  },
  extendedVariants: [
    { id: 'thin', name: 'Thin', baseVariant: 'dark', theme: ACRYLIC_THIN_DARK },
    { id: 'thick', name: 'Thick', baseVariant: 'dark', theme: ACRYLIC_THICK_DARK },
    { id: 'thin-light', name: 'Thin', baseVariant: 'light', theme: ACRYLIC_THIN_LIGHT },
    { id: 'thick-light', name: 'Thick', baseVariant: 'light', theme: ACRYLIC_THICK_LIGHT },
  ],
};

// =============================================================================
// THEME REGISTRY
// =============================================================================

/** All theme families indexed by ID */
export const THEME_FAMILIES: Record<string, ThemeFamily> = {
  default: THEME_DEFAULT,
  glass: THEME_GLASS,
  acrylic: THEME_ACRYLIC,
};

/** Ordered list of theme families for UI iteration */
export const THEME_FAMILY_LIST: ThemeFamily[] = [
  THEME_DEFAULT,
  THEME_GLASS,
  THEME_ACRYLIC,
];

/** Get a specific theme by family ID, variant, and optional sub-variant */
export const getTheme = (familyId: string, variant: ThemeVariant, subVariant?: string): CalendarCanvasTheme => {
  const family = THEME_FAMILIES[familyId];
  if (!family) {
    return THEME_DEFAULT.variants[variant];
  }
  // Check extended variants first
  if (subVariant && family.extendedVariants) {
    const extended = family.extendedVariants.find(v => v.id === subVariant);
    if (extended) return extended.theme;
  }
  return family.variants[variant];
};

/** Get all flat themes (for backward compatibility) */
export const getAllThemes = (): CalendarCanvasTheme[] => {
  return THEME_FAMILY_LIST.flatMap(family => [
    family.variants.light,
    family.variants.dark,
  ]);
};

/** Legacy theme map for backward compatibility */
export const CANVAS_THEMES: Record<string, CalendarCanvasTheme> = {
  'light': DEFAULT_LIGHT,
  'dark': DEFAULT_DARK,
  'glass': GLASS_DARK,
  // New structured IDs
  'default-light': DEFAULT_LIGHT,
  'default-dark': DEFAULT_DARK,
  'glass-light': GLASS_LIGHT,
  'glass-dark': GLASS_DARK,
  // Acrylic themes
  'acrylic-light': ACRYLIC_THIN_LIGHT,
  'acrylic-dark': ACRYLIC_THIN_DARK,
  'acrylic-thin-dark': ACRYLIC_THIN_DARK,
  'acrylic-thin-light': ACRYLIC_THIN_LIGHT,
  'acrylic-thick-dark': ACRYLIC_THICK_DARK,
  'acrylic-thick-light': ACRYLIC_THICK_LIGHT,
  // Legacy acrylic variant names (for backward compatibility)
  'acrylic-dark-slate': ACRYLIC_THIN_DARK,
  'acrylic-light-frost': ACRYLIC_THIN_LIGHT,
  'acrylic-light-silk': ACRYLIC_THICK_LIGHT,
  'acrylic-ocean-mist': ACRYLIC_THICK_DARK,
};

/** Helper to get theme by ID with fallback */
export const getCanvasTheme = (themeId: string): CalendarCanvasTheme => {
  return CANVAS_THEMES[themeId] ?? DEFAULT_DARK;
};

/** Get colors for a palette by ID */
export const getPaletteColors = (paletteId: string): string[] => {
  const palette = COLOR_PALETTES.find(p => p.id === paletteId);
  return palette?.colors ?? PALETTE_SATURATED.colors;
};

/**
 * Get theme colors - now takes optional paletteId
 * Falls back to default palette if not specified
 */
export const getThemeColors = (familyId: string, variant?: ThemeVariant, paletteId?: string): string[] => {
  // If palette specified, use it
  if (paletteId) {
    return getPaletteColors(paletteId);
  }
  // Default palettes based on theme/variant
  if (familyId === 'acrylic') {
    return variant === 'dark' ? PALETTE_DARK_SLATE.colors : PALETTE_LIGHT_SILK.colors;
  }
  if (familyId === 'glass') {
    return PALETTE_FRESH_TINT.colors;
  }
  return PALETTE_SATURATED.colors;
};

// Export individual palettes for direct access
export const DEFAULT_COLORS = PALETTE_SATURATED.colors;
export const GLASS_COLORS = PALETTE_FRESH_TINT.colors;
export const MATT_COLORS = PALETTE_MORANDI.colors;
export const MIDNIGHT_SLATE_COLORS = PALETTE_MIDNIGHT_SLATE.colors;
export const ACRYLIC_COLORS = PALETTE_LIGHT_SILK.colors;
export const ACRYLIC_COLORS_LIGHT = PALETTE_LIGHT_SILK.colors;
export const ACRYLIC_COLORS_DARK = PALETTE_DARK_SLATE.colors;
