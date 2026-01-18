export type ClassType = 'Lecture' | 'Tutorial' | 'Lab' | 'Seminar' | 'Custom' | 'Unknown';

// =============================================================================
// Calendar Canvas Theme System
// =============================================================================

/** CSS shadow value (e.g., "0 4px 6px rgba(0,0,0,0.1)") */
type CSSBoxShadow = string;

/** CSS color value (hex, rgb, rgba, hsl, etc.) */
type CSSColor = string;

/** CSS border radius value (e.g., "8px", "0.5rem") */
type CSSBorderRadius = string;

/** CSS spacing value (e.g., "4px", "0.5rem") */
type CSSSpacing = string;

/** CSS border value (e.g., "1px solid rgba(0,0,0,0.1)") */
type CSSBorder = string;

/**
 * Theme configuration for the calendar canvas container
 */
export interface CanvasTheme {
  background: CSSColor;
  /** Optional background size (e.g., "cover", "contain") */
  backgroundSize?: string;
  /** Optional background position (e.g., "center", "top left") */
  backgroundPosition?: string;
  border: CSSBorder;
  borderRadius: CSSBorderRadius;
  shadow: CSSBoxShadow;
  padding: CSSSpacing;
  /** Optional backdrop filter (e.g., "blur(12px)") */
  backdropFilter?: string;
}

/**
 * Theme configuration for the day header row (MON, TUE, etc.)
 */
export interface HeaderTheme {
  textColor: CSSColor;
  fontWeight: string;
  fontSize: string;
  letterSpacing: string;
  opacity: number;
}

/**
 * Theme configuration for the time column (8:00, 9:00, etc.)
 */
export interface TimeColumnTheme {
  textColor: CSSColor;
  fontSize: string;
  width: CSSSpacing;
}

/**
 * Theme configuration for the grid lines
 */
export interface GridTheme {
  lineColor: CSSColor;
  dividerColor: CSSColor;
  lineWidth: string;
}

/**
 * Theme configuration for individual event blocks
 */
export interface EventBlockTheme {
  borderRadius: CSSBorderRadius;
  border: CSSBorder;
  shadow: CSSBoxShadow;
  padding: CSSSpacing;
  marginX: CSSSpacing;
  /** Opacity modifier for background (0-1), useful for glass effects */
  backgroundOpacity: number;
  /** Title text color */
  titleColor: CSSColor;
  /** Subtitle/class type text color */
  subtitleColor: CSSColor;
  /** Details text color (time, location, notes) */
  detailsColor: CSSColor;
  titleFontWeight: string;
  /** Hover brightness multiplier (e.g., 1.1 = 110%) */
  hoverBrightness: number;
  hoverShadow: CSSBoxShadow;
  /** Optional gradient overlay */
  gradient?: string;
  /** Optional backdrop filter for glass effect */
  backdropFilter?: string;
  /** Optional acrylic-style layered background with texture */
  acrylicBackground?: string;
  /** Optional background blend mode for acrylic effect */
  backgroundBlendMode?: string;
}

/**
 * Theme configuration for the footer branding
 */
export interface FooterTheme {
  textColor: CSSColor;
  fontSize: string;
  opacity: number;
}

/**
 * Complete theme definition for CalendarCanvas
 */
export interface CalendarCanvasTheme {
  id: string;
  name: string;
  variant: 'light' | 'dark';

  canvas: CanvasTheme;
  header: HeaderTheme;
  timeColumn: TimeColumnTheme;
  grid: GridTheme;
  eventBlock: EventBlockTheme;
  footer: FooterTheme;
}

// =============================================================================
// Built-in Themes
// =============================================================================

export const THEME_DARK: CalendarCanvasTheme = {
  id: 'dark',
  name: 'Dark Mode',
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

export const THEME_LIGHT: CalendarCanvasTheme = {
  id: 'light',
  name: 'Light Mode',
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

export const THEME_GLASS: CalendarCanvasTheme = {
  id: 'glass',
  name: 'Glass',
  variant: 'dark',
  canvas: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '16px',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    padding: '32px',
    backdropFilter: 'blur(12px)',
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
    borderRadius: '8px',
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

/** All available built-in themes */
export const CANVAS_THEMES: Record<string, CalendarCanvasTheme> = {
  dark: THEME_DARK,
  light: THEME_LIGHT,
  glass: THEME_GLASS,
};

/** Helper to get theme by ID with fallback */
export const getCanvasTheme = (themeId: string): CalendarCanvasTheme => {
  return CANVAS_THEMES[themeId] ?? THEME_DARK;
};

export interface CalendarEvent {
  id: string;
  title: string; // This is the Course Code/Name (e.g. "CS 101 - 001")
  displayTitle: string; //This is the Title being displayed, without the section number (e.g. "CS 101")
  classSection: number; // This is the section number that represents the classType
  startTime: string; // HH:mm 24h format
  endTime: string;   // HH:mm 24h format
  dayIndex: number;  // 0 = Monday, 6 = Sunday
  
  // New specific fields
  classType: ClassType;
  customClassType?: string; // If classType is Custom
  
  // Staging area for extra info (CRN, duration strings, etc)
  metadata: string[]; 
  
  category: string; // Kept for backward compatibility or grouping
  location?: string;
  notes?: string;
  color?: string;    // Hex code
  isConfidenceLow?: boolean;
  includeNotes?: boolean; // Per-event override for showing notes (undefined = use global setting)
}

export interface Category {
  id: string;
  name: string;
  color: string;
  keywords: string[];
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  EDIT = 'EDIT',
  EXPORT = 'EXPORT',
}

/** Theme family type */
export type ThemeFamilyId = 'default' | 'glass' | 'matt' | 'acrylic';

/** Theme variant type */
export type ThemeVariantId = 'light' | 'dark';

/** Combined theme ID (family-variant) */
export type ThemeId = `${ThemeFamilyId}-${ThemeVariantId}` | 'light' | 'dark' | 'glass';

export interface TemplateConfig {
  id: string;
  name: string;
  fontScale: number;
  showNotes: boolean;
  compact: boolean;

  /** Theme family (default, glass, matt) */
  themeFamily: ThemeFamilyId;

  /** Theme variant (light, dark) */
  themeVariant: ThemeVariantId;

  /** Legacy theme field for backward compatibility */
  theme: ThemeId;

  /** Optional: Full theme override (takes precedence over theme ID) */
  customTheme?: CalendarCanvasTheme;

  primaryColor: string;
  borderRadius: string;

  // Toggles
  showTime: boolean;
  showLocation: boolean;
  showGrid: boolean;
  showClassType: boolean;
  viewMode: 'desktop' | 'mobile';

  // Aspect ratio slider (0 = 16:9 landscape, 1 = 9:16 portrait, ~0.6 = natural content)
  aspectRatio: number;

  /** Differentiate Labs/Tutorials with different colors */
  differentiateTypes: boolean;
}

export interface ProcessedData {
  events: CalendarEvent[];
  categories: Category[];
}

// Fixed set of nice looking colors for categories
export const CATEGORY_COLORS = [
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
  '#2dd4bf', // Teal
  '#c084fc', // Violet
  '#f97316', // Deep Orange
  '#84cc16', // Lime
];
