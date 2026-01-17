/**
 * Structured Theme System for CalendarCanvas
 *
 * Parent themes: Default, Glass, Matt
 * Each parent has Light and Dark variants
 */

import { CalendarCanvasTheme } from '../types';

// =============================================================================
// Theme Variant Type
// =============================================================================

export type ThemeVariant = 'light' | 'dark';

export interface ThemeFamily {
  id: string;
  name: string;
  description: string;
  variants: {
    light: CalendarCanvasTheme;
    dark: CalendarCanvasTheme;
  };
}

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
// MATT (MATTE) THEME FAMILY
// =============================================================================

const MATT_LIGHT: CalendarCanvasTheme = {
  id: 'matt-light',
  name: 'Matt Light',
  variant: 'light',
  canvas: {
    background: '#f5f5f4',
    border: 'none',
    borderRadius: '12px',
    shadow: 'none',
    padding: '28px',
  },
  header: {
    textColor: '#44403c',
    fontWeight: '500',
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    opacity: 0.7,
  },
  timeColumn: {
    textColor: '#a8a29e',
    fontSize: '0.7rem',
    width: '44px',
  },
  grid: {
    lineColor: '#e7e5e4',
    dividerColor: '#d6d3d1',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '4px',
    border: 'none',
    shadow: 'none',
    padding: '6px 8px',
    marginX: '3px',
    backgroundOpacity: 0.9,
    titleColor: '#1c1917',
    subtitleColor: '#57534e',
    detailsColor: '#78716c',
    titleFontWeight: '600',
    hoverBrightness: 1.02,
    hoverShadow: 'none',
  },
  footer: {
    textColor: '#a8a29e',
    fontSize: '0.65rem',
    opacity: 0.6,
  },
};

const MATT_DARK: CalendarCanvasTheme = {
  id: 'matt-dark',
  name: 'Matt Dark',
  variant: 'dark',
  canvas: {
    background: '#1c1917',
    border: 'none',
    borderRadius: '12px',
    shadow: 'none',
    padding: '28px',
  },
  header: {
    textColor: '#d6d3d1',
    fontWeight: '500',
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    opacity: 0.7,
  },
  timeColumn: {
    textColor: '#78716c',
    fontSize: '0.7rem',
    width: '44px',
  },
  grid: {
    lineColor: '#292524',
    dividerColor: '#44403c',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '4px',
    border: 'none',
    shadow: 'none',
    padding: '6px 8px',
    marginX: '3px',
    backgroundOpacity: 0.9,
    titleColor: '#fafaf9',
    subtitleColor: '#d6d3d1',
    detailsColor: '#a8a29e',
    titleFontWeight: '600',
    hoverBrightness: 1.08,
    hoverShadow: 'none',
  },
  footer: {
    textColor: '#78716c',
    fontSize: '0.65rem',
    opacity: 0.6,
  },
};

export const THEME_MATT: ThemeFamily = {
  id: 'matt',
  name: 'Matt',
  description: 'Flat matte finish, no shadows',
  variants: {
    light: MATT_LIGHT,
    dark: MATT_DARK,
  },
};

// =============================================================================
// THEME REGISTRY
// =============================================================================

/** All theme families indexed by ID */
export const THEME_FAMILIES: Record<string, ThemeFamily> = {
  default: THEME_DEFAULT,
  glass: THEME_GLASS,
  matt: THEME_MATT,
};

/** Ordered list of theme families for UI iteration */
export const THEME_FAMILY_LIST: ThemeFamily[] = [
  THEME_DEFAULT,
  THEME_GLASS,
  THEME_MATT,
];

/** Get a specific theme by family ID and variant */
export const getTheme = (familyId: string, variant: ThemeVariant): CalendarCanvasTheme => {
  const family = THEME_FAMILIES[familyId];
  if (!family) {
    return THEME_DEFAULT.variants[variant];
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
  'matt-light': MATT_LIGHT,
  'matt-dark': MATT_DARK,
};

/** Helper to get theme by ID with fallback */
export const getCanvasTheme = (themeId: string): CalendarCanvasTheme => {
  return CANVAS_THEMES[themeId] ?? DEFAULT_DARK;
};
