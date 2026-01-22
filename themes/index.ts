/**
 * Structured Theme System for CalendarCanvas
 *
 * Parent themes: Default, Glass, Matt, Acrylic
 * Each parent has Light and Dark variants
 * Each theme family has its own curated color palette
 */

import { CalendarCanvasTheme } from '../types';

// Import texture for Vite to handle properly
import acrylicTextureUrl from '../assets/Texture_Acrylic.png';
// Import background image for acrylic theme
import acrylicBackgroundUrl from '../assets/backgrounds/3.png';

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
  /** Theme-specific color palette for event blocks */
  colors: string[];
}

// =============================================================================
// COLOR PALETTES - Curated colors for each theme family
// =============================================================================

/** Default theme colors - Vibrant and saturated */
const DEFAULT_COLORS = [
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
];

/** Glass theme colors - Semi-transparent, ethereal */
const GLASS_COLORS = [
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
];

/** Matt theme colors - Muted, earthy tones */
const MATT_COLORS = [
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
];

/** Acrylic theme colors for LIGHT variant - Brighter, vibrant frosted colors */
const ACRYLIC_COLORS_LIGHT = [
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
];

/** Acrylic theme colors for DARK variant - Deep, muted frosted colors */
const ACRYLIC_COLORS_DARK = [
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
];

/** Legacy: Default acrylic colors (light variant) */
const ACRYLIC_COLORS = ACRYLIC_COLORS_LIGHT;

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
  colors: DEFAULT_COLORS,
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
  colors: GLASS_COLORS,
};

// =============================================================================
// MIDNIGHT SLATE THEME - Dark Only (based on Glass Light styling)
// =============================================================================

/** Midnight Slate colors - Deep, moody slate tones */
const MIDNIGHT_SLATE_COLORS = [
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
];

const MIDNIGHT_SLATE_DARK: CalendarCanvasTheme = {
  id: 'midnight-slate-dark',
  name: 'Midnight Slate',
  variant: 'dark',
  canvas: {
    background: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '20px',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    padding: '32px',
    backdropFilter: 'blur(16px)',
  },
  header: {
    textColor: '#e2e8f0',
    fontWeight: '600',
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
    opacity: 0.9,
  },
  timeColumn: {
    textColor: 'rgba(148, 163, 184, 0.6)',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: 'rgba(148, 163, 184, 0.1)',
    dividerColor: 'rgba(148, 163, 184, 0.1)',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    shadow: '0 4px 16px rgba(0,0,0,0.2)',
    padding: '8px',
    marginX: '4px',
    backgroundOpacity: 0.8,
    titleColor: '#f1f5f9',
    subtitleColor: 'rgba(226, 232, 240, 0.9)',
    detailsColor: 'rgba(203, 213, 225, 0.8)',
    titleFontWeight: '700',
    hoverBrightness: 1.08,
    hoverShadow: '0 8px 24px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(8px)',
  },
  footer: {
    textColor: 'rgba(148, 163, 184, 0.6)',
    fontSize: '0.75rem',
    opacity: 0.6,
  },
};

export const THEME_MIDNIGHT_SLATE: ThemeFamily = {
  id: 'midnight-slate',
  name: 'Midnight Slate',
  description: 'Deep slate glassmorphism (dark only)',
  variants: {
    // Both variants point to dark - this theme is dark only
    light: MIDNIGHT_SLATE_DARK,
    dark: MIDNIGHT_SLATE_DARK,
  },
  colors: MIDNIGHT_SLATE_COLORS,
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
  colors: MATT_COLORS,
};

// =============================================================================
// ACRYLIC THEME FAMILY - Frosted Glass Effect
// =============================================================================

/**
 * Acrylic/Frosted Glass Theme System
 * 
 * Effect achieved through:
 * - Base color with opacity
 * - Noise/grain texture overlay (Texture_Acrylic.png)
 * - Subtle gradients for depth
 * - Backdrop blur effect (15px)
 * - Layered shadows for floating glass effect
 * - Soft borders relying on shadows for definition
 * - Higher letter-spacing for airy aesthetic
 * 
 * CSS technique from Figma:
 * background: url(texture.png), gradient, gradient, base-color;
 * background-blend-mode: overlay, normal, normal, overlay;
 * backdrop-filter: blur(15px);
 */

// Texture path for acrylic noise effect (imported for Vite bundling)
const ACRYLIC_TEXTURE = acrylicTextureUrl;
// Background image for acrylic theme canvas
const ACRYLIC_BACKGROUND = acrylicBackgroundUrl;

// Dark 1 - Deep Charcoal Slate
const ACRYLIC_DARK_SLATE: CalendarCanvasTheme = {
  id: 'acrylic-dark-slate',
  name: 'Acrylic Dark Slate',
  variant: 'dark',
  canvas: {
    background: `url('${ACRYLIC_BACKGROUND}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
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

// Dark 2 - Deep Navy
const ACRYLIC_DARK_NAVY: CalendarCanvasTheme = {
  id: 'acrylic-dark-navy',
  name: 'Acrylic Dark Navy',
  variant: 'dark',
  canvas: {
    background: `url('${ACRYLIC_TEXTURE}'), linear-gradient(180deg, rgba(30, 41, 59, 0.2) 0%, rgba(15, 23, 42, 0.2) 100%), linear-gradient(0deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.05)), rgba(30, 41, 59, 0.9)`,
    border: '1px solid rgba(99, 102, 241, 0.1)',
    borderRadius: '24px',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(15, 23, 42, 0.3), inset 0 1px 0 rgba(99, 102, 241, 0.08)',
    padding: '32px',
    backdropFilter: 'blur(15px)',
  },
  header: {
    textColor: 'rgba(226, 232, 240, 0.95)',
    fontWeight: '500',
    fontSize: '0.85rem',
    letterSpacing: '0.12em',
    opacity: 0.85,
  },
  timeColumn: {
    textColor: 'rgba(148, 163, 184, 0.6)',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: 'rgba(148, 163, 184, 0.08)',
    dividerColor: 'rgba(148, 163, 184, 0.1)',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '14px',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    shadow: '0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 4px rgba(15, 23, 42, 0.2)',
    padding: '10px',
    marginX: '4px',
    backgroundOpacity: 0.7,
    titleColor: 'rgba(241, 245, 249, 0.95)',
    subtitleColor: 'rgba(226, 232, 240, 0.8)',
    detailsColor: 'rgba(203, 213, 225, 0.65)',
    titleFontWeight: '600',
    hoverBrightness: 1.1,
    hoverShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)',
  },
  footer: {
    textColor: 'rgba(148, 163, 184, 0.5)',
    fontSize: '0.75rem',
    opacity: 0.5,
  },
};

// Light 1 - Frosted White
const ACRYLIC_LIGHT_FROST: CalendarCanvasTheme = {
  id: 'acrylic-light-frost',
  name: 'Acrylic Light Frost',
  variant: 'light',
  canvas: {
    background: `url('${ACRYLIC_BACKGROUND}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
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
    backgroundOpacity: 1, // Not used when acrylicBackground is set
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

// Light 2 - Silk White with warm tint
const ACRYLIC_LIGHT_SILK: CalendarCanvasTheme = {
  id: 'acrylic-light-silk',
  name: 'Acrylic Light Silk',
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

// Color 1 - Purple Dusk (purple-blue gradient)
const ACRYLIC_PURPLE_DUSK: CalendarCanvasTheme = {
  id: 'acrylic-purple-dusk',
  name: 'Acrylic Purple Dusk',
  variant: 'dark',
  canvas: {
    background: `url('${ACRYLIC_TEXTURE}'), linear-gradient(135deg, rgba(124, 111, 184, 0.25) 0%, rgba(90, 143, 184, 0.25) 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)), rgba(107, 124, 158, 0.8)`,
    border: '1px solid rgba(167, 139, 250, 0.15)',
    borderRadius: '24px',
    shadow: '0 8px 32px rgba(88, 80, 140, 0.3), 0 2px 8px rgba(88, 80, 140, 0.15), inset 0 1px 0 rgba(167, 139, 250, 0.1)',
    padding: '32px',
    backdropFilter: 'blur(15px)',
  },
  header: {
    textColor: 'rgba(245, 243, 255, 0.95)',
    fontWeight: '500',
    fontSize: '0.85rem',
    letterSpacing: '0.12em',
    opacity: 0.9,
  },
  timeColumn: {
    textColor: 'rgba(196, 181, 253, 0.55)',
    fontSize: '0.75rem',
    width: '48px',
  },
  grid: {
    lineColor: 'rgba(196, 181, 253, 0.08)',
    dividerColor: 'rgba(196, 181, 253, 0.12)',
    lineWidth: '1px',
  },
  eventBlock: {
    borderRadius: '14px',
    border: '1px solid rgba(196, 181, 253, 0.15)',
    shadow: '0 4px 16px rgba(88, 80, 140, 0.25), 0 1px 4px rgba(88, 80, 140, 0.12)',
    padding: '10px',
    marginX: '4px',
    backgroundOpacity: 0.7,
    gradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(129, 140, 248, 0.1) 100%)',
    titleColor: 'rgba(245, 243, 255, 0.95)',
    subtitleColor: 'rgba(221, 214, 254, 0.85)',
    detailsColor: 'rgba(196, 181, 253, 0.7)',
    titleFontWeight: '600',
    hoverBrightness: 1.1,
    hoverShadow: '0 8px 24px rgba(88, 80, 140, 0.35)',
    backdropFilter: 'blur(8px)',
  },
  footer: {
    textColor: 'rgba(196, 181, 253, 0.5)',
    fontSize: '0.75rem',
    opacity: 0.5,
  },
};

// Color 2 - Ocean Mist (slate-blue oceanic)
const ACRYLIC_OCEAN_MIST: CalendarCanvasTheme = {
  id: 'acrylic-ocean-mist',
  name: 'Acrylic Ocean Mist',
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

export const THEME_ACRYLIC: ThemeFamily = {
  id: 'acrylic',
  name: 'Acrylic',
  description: 'Frosted glass effect with noise texture and blur',
  variants: {
    light: ACRYLIC_LIGHT_FROST,
    dark: ACRYLIC_DARK_SLATE,
  },
  colors: ACRYLIC_COLORS,
};

// =============================================================================
// THEME REGISTRY
// =============================================================================

/** All theme families indexed by ID */
export const THEME_FAMILIES: Record<string, ThemeFamily> = {
  default: THEME_DEFAULT,
  glass: THEME_GLASS,
  'midnight-slate': THEME_MIDNIGHT_SLATE,
  matt: THEME_MATT,
  acrylic: THEME_ACRYLIC,
};

/** Ordered list of theme families for UI iteration */
export const THEME_FAMILY_LIST: ThemeFamily[] = [
  THEME_DEFAULT,
  THEME_GLASS,
  THEME_MIDNIGHT_SLATE,
  THEME_MATT,
  THEME_ACRYLIC,
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
  'midnight-slate-light': MIDNIGHT_SLATE_DARK, // Dark only theme
  'midnight-slate-dark': MIDNIGHT_SLATE_DARK,
  'matt-light': MATT_LIGHT,
  'matt-dark': MATT_DARK,
  // Acrylic themes (primary light/dark)
  'acrylic-light': ACRYLIC_LIGHT_FROST,
  'acrylic-dark': ACRYLIC_DARK_SLATE,
  // Acrylic variants (all 6 themes)
  'acrylic-dark-slate': ACRYLIC_DARK_SLATE,
  'acrylic-dark-navy': ACRYLIC_DARK_NAVY,
  'acrylic-light-frost': ACRYLIC_LIGHT_FROST,
  'acrylic-light-silk': ACRYLIC_LIGHT_SILK,
  'acrylic-purple-dusk': ACRYLIC_PURPLE_DUSK,
  'acrylic-ocean-mist': ACRYLIC_OCEAN_MIST,
};

/** Helper to get theme by ID with fallback */
export const getCanvasTheme = (themeId: string): CalendarCanvasTheme => {
  return CANVAS_THEMES[themeId] ?? DEFAULT_DARK;
};

/** Get colors for a theme family, with variant support for acrylic */
export const getThemeColors = (familyId: string, variant?: ThemeVariant): string[] => {
  // Special handling for acrylic theme - different colors for light/dark
  if (familyId === 'acrylic') {
    return variant === 'dark' ? ACRYLIC_COLORS_DARK : ACRYLIC_COLORS_LIGHT;
  }
  const family = THEME_FAMILIES[familyId];
  return family?.colors ?? DEFAULT_COLORS;
};

/** Export color palettes for external use */
export { DEFAULT_COLORS, GLASS_COLORS, MIDNIGHT_SLATE_COLORS, MATT_COLORS, ACRYLIC_COLORS, ACRYLIC_COLORS_LIGHT, ACRYLIC_COLORS_DARK };
