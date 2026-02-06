/**
 * Centralized Site Theme Configuration
 *
 * This file contains all the accent colors and theme variables used throughout the app.
 * To A/B test different color schemes, simply modify the values in the active theme.
 *
 * Usage:
 * - CSS classes in index.css reference these via CSS variables
 * - Components can import `currentTheme` for dynamic access
 */

export interface SiteTheme {
  name: string;

  // Primary accent colors (buttons, toggles, active states)
  accent: {
    primary: string;      // Main accent color
    secondary: string;    // Lighter accent for gradients
    glow: string;         // Color for glow effects (can be different, e.g., purple)
  };

  // Surface/background colors
  surface: {
    app: string;          // Main app background
    card: string;         // Card/panel backgrounds
    elevated: string;     // Elevated elements (popovers, modals)
    input: string;        // Input field backgrounds
    inputBorder: string;  // Input border color
  };

  // Panel/sidebar colors
  panel: {
    background: string;   // Sidebar and panel backgrounds
    border: string;       // Panel borders
    headerBg: string;     // Panel header background
  };

  // Highlight section (e.g., "Add Course" section)
  highlight: {
    gradientFrom: string; // Gradient start (with opacity)
    gradientTo: string;   // Gradient end (with opacity)
    border: string;       // Highlight section border
  };

  // Dropzone/upload area
  dropzone: {
    background: string;   // Dropzone background
    border: string;       // Default border
    hoverBorder: string;  // Border on hover
    hoverBackground: string; // Background on hover
  };

  // Text colors
  text: {
    primary: string;      // Main text
    secondary: string;    // Secondary/muted text
    muted: string;        // Very muted text
    onAccent: string;     // Text on accent-colored backgrounds
  };

  // Semantic colors
  semantic: {
    error: string;
    errorMuted: string;
    warning: string;
    success: string;
    successMuted: string;
    info: string;
  };

  // Border colors
  border: {
    default: string;
    muted: string;
    accent: string;
  };

  // Toolbar/floating UI (zoom controls, floating panels)
  toolbar: {
    background: string;   // Toolbar background
    border: string;       // Toolbar border
    buttonBg: string;     // Button background within toolbar
    buttonHoverBg: string; // Button hover background
  };

  // Card sections within panels (e.g., "Content Display" section)
  cardSection: {
    background: string;   // Semi-transparent section background
    border: string;       // Section border
  };

  // Feature pills and small UI elements
  pill: {
    background: string;   // Pill background
    border: string;       // Pill border
  };

  // Calendar card default background
  calendarCard: {
    background: string;   // Default calendar card background
  };

  // Toggle switch
  toggle: {
    offBg: string;        // Background when toggle is off
  };

  // Modal/popup windows
  modal: {
    background: string;   // Modal background (e.g., bg-gray-900)
    border: string;       // Modal border
    overlay: string;      // Overlay behind modal
  };

  // Slider/range input
  slider: {
    track: string;        // Slider track background
  };

  // Button variants
  button: {
    ghost: string;        // Ghost button background
    ghostHover: string;   // Ghost button hover background
  };

  // Tab button states
  tab: {
    activeBg: string;     // Active tab background
    inactiveText: string; // Inactive tab text color
    hoverText: string;    // Tab text color on hover
  };
}

// Default blue theme (current)
export const blueTheme: SiteTheme = {
  name: 'Blue',

  accent: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    glow: '#8b5cf6',
  },

  surface: {
    app: '#0f172a',
    card: '#1e293b',
    elevated: '#334155',
    input: '#1f2937',
    inputBorder: '#374151',
  },

  panel: {
    background: '#111827',
    border: '#1f2937',
    headerBg: '#111827',
  },

  highlight: {
    gradientFrom: 'rgba(30, 58, 138, 0.3)',  // blue-900/30
    gradientTo: 'rgba(30, 64, 175, 0.2)',    // blue-800/20
    border: 'rgba(29, 78, 216, 0.5)',        // blue-700/50
  },

  dropzone: {
    background: '#111827',
    border: '#4b5563',                        // gray-600
    hoverBorder: '#60a5fa',                   // blue-400
    hoverBackground: '#1f2937',               // gray-800
  },

  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#64748b',
    onAccent: '#ffffff',
  },

  semantic: {
    error: '#ef4444',
    errorMuted: '#fecaca',
    warning: '#f59e0b',
    success: '#22c55e',
    successMuted: '#bbf7d0',
    info: '#3b82f6',
  },

  border: {
    default: '#374151',
    muted: '#1f2937',
    accent: '#3b82f6',
  },

  toolbar: {
    background: 'rgba(15, 23, 42, 0.7)',      // slate-900/70
    border: 'rgba(71, 85, 105, 0.7)',          // slate-600/70
    buttonBg: 'rgba(30, 41, 59, 0.8)',         // slate-800/80
    buttonHoverBg: 'rgba(51, 65, 85, 0.8)',    // slate-700/80
  },

  cardSection: {
    background: 'rgba(31, 41, 55, 0.5)',      // gray-800/50
    border: '#374151',                         // gray-700
  },

  pill: {
    background: 'rgba(31, 41, 55, 0.5)',      // gray-800/50
    border: '#374151',                         // gray-700
  },

  calendarCard: {
    background: '#1e293b',                     // slate-800
  },

  toggle: {
    offBg: '#374151',                          // gray-700
  },

  modal: {
    background: '#111827',                     // gray-900
    border: '#374151',                         // gray-700
    overlay: 'rgba(0, 0, 0, 0.55)',            // black/55
  },

  slider: {
    track: '#374151',                          // gray-700
  },

  button: {
    ghost: '#374151',                          // gray-700
    ghostHover: '#4b5563',                     // gray-600
  },

  tab: {
    activeBg: '#1e293b',                       // slate-800
    inactiveText: '#94a3b8',                   // slate-400
    hoverText: '#e2e8f0',                      // slate-200
  },
};

// Alternative purple theme for A/B testing
export const purpleTheme: SiteTheme = {
  name: 'Purple',

  accent: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: '#c084fc',
  },

  surface: {
    app: '#0f0a1a',
    card: '#1a1425',
    elevated: '#2d2440',
    input: '#1f1a2e',
    inputBorder: '#3d3456',
  },

  panel: {
    background: '#120d1e',
    border: '#1f1a2e',
    headerBg: '#120d1e',
  },

  highlight: {
    gradientFrom: 'rgba(88, 28, 135, 0.3)',  // purple-900/30
    gradientTo: 'rgba(107, 33, 168, 0.2)',    // purple-800/20
    border: 'rgba(126, 34, 206, 0.5)',        // purple-700/50
  },

  dropzone: {
    background: '#120d1e',
    border: '#4b5563',                        // gray-600
    hoverBorder: '#a78bfa',                   // purple-400
    hoverBackground: '#1f1a2e',
  },

  text: {
    primary: '#f8fafc',
    secondary: '#a5a0b8',
    muted: '#6b6280',
    onAccent: '#ffffff',
  },

  semantic: {
    error: '#ef4444',
    errorMuted: '#fecaca',
    warning: '#f59e0b',
    success: '#22c55e',
    successMuted: '#bbf7d0',
    info: '#8b5cf6',
  },

  border: {
    default: '#3d3456',
    muted: '#2d2440',
    accent: '#8b5cf6',
  },

  toolbar: {
    background: 'rgba(18, 13, 30, 0.7)',      // purple-dark/70
    border: 'rgba(61, 52, 86, 0.7)',           // purple-border/70
    buttonBg: 'rgba(31, 26, 46, 0.8)',         // purple-input/80
    buttonHoverBg: 'rgba(45, 36, 64, 0.8)',    // purple-elevated/80
  },

  cardSection: {
    background: 'rgba(31, 26, 46, 0.5)',      // purple-input/50
    border: '#3d3456',
  },

  pill: {
    background: 'rgba(31, 26, 46, 0.5)',      // purple-input/50
    border: '#3d3456',
  },

  calendarCard: {
    background: '#1a1425',                     // purple-card
  },

  toggle: {
    offBg: '#3d3456',                          // purple-border
  },

  modal: {
    background: '#120d1e',                     // purple-panel
    border: '#3d3456',                         // purple-border
    overlay: 'rgba(0, 0, 0, 0.55)',
  },

  slider: {
    track: '#3d3456',                          // purple-border
  },

  button: {
    ghost: '#3d3456',                          // purple-border
    ghostHover: '#4b4264',                     // lighter purple
  },

  tab: {
    activeBg: '#1f1a2e',                       // purple-input
    inactiveText: '#a5a0b8',                   // purple-secondary
    hoverText: '#e2e8f0',
  },
};

// Alternative teal theme for A/B testing
export const tealTheme: SiteTheme = {
  name: 'Teal',

  accent: {
    primary: '#126b60',
    secondary: '#44bfad',
    glow: '#2dd4bf',
  },

  surface: {
    app: '#08080F',
    card: '#142525',
    elevated: '#1f3d3d',
    input: '#1a2e2e',
    inputBorder: '#2d4a4a',
  },

  panel: {
    background: '#0d1a1a',
    border: '#1a2e2e',
    headerBg: '#0d1a1a',
  },

  highlight: {
    gradientFrom: 'rgba(13, 78, 72, 0.3)',   // teal-900/30
    gradientTo: 'rgba(17, 94, 89, 0.2)',     // teal-800/20
    border: 'rgba(20, 115, 108, 0.5)',       // teal-700/50
  },

  dropzone: {
    background: '#0d1a1a',
    border: '#4b5563',                        // gray-600
    hoverBorder: '#2dd4bf',                   // teal-400
    hoverBackground: '#1a2e2e',
  },

  text: {
    primary: '#f8fafc',
    secondary: '#94b8b8',
    muted: '#648080',
    onAccent: '#ffffff',
  },

  semantic: {
    error: '#ef4444',
    errorMuted: '#fecaca',
    warning: '#f59e0b',
    success: '#22c55e',
    successMuted: '#bbf7d0',
    info: '#14b8a6',
  },

  border: {
    default: '#2d4a4a',
    muted: '#1f3d3d',
    accent: '#14b8a6',
  },

  toolbar: {
    background: 'rgba(13, 26, 26, 0.7)',       // teal-dark/70
    border: 'rgba(45, 74, 74, 0.7)',           // teal-border/70
    buttonBg: 'rgba(26, 46, 46, 0.8)',         // teal-input/80
    buttonHoverBg: 'rgba(31, 61, 61, 0.8)',    // teal-elevated/80
  },

  cardSection: {
    background: 'rgba(26, 46, 46, 0.5)',      // teal-input/50
    border: '#2d4a4a',
  },

  pill: {
    background: 'rgba(26, 46, 46, 0.5)',      // teal-input/50
    border: '#2d4a4a',
  },

  calendarCard: {
    background: '#121212',                     // teal-card
  },

  toggle: {
    offBg: '#2d4a4a',                          // teal-border
  },

  modal: {
    background: '#0d1a1a',                     // teal-panel
    border: '#2d4a4a',                         // teal-border
    overlay: 'rgba(0, 0, 0, 0.55)',
  },

  slider: {
    track: '#2d4a4a',                          // teal-border
  },

  button: {
    ghost: '#2d4a4a',                          // teal-border
    ghostHover: '#3d5a5a',                     // lighter teal
  },

  tab: {
    activeBg: '#1a2e2e',                       // teal-input
    inactiveText: '#94b8b8',                   // teal-secondary
    hoverText: '#e2e8f0',
  },
};

// ============================================
// ACTIVE THEME - Change this to switch themes
// ============================================
export const currentTheme: SiteTheme = tealTheme;

/**
 * Generates CSS custom properties from the current theme
 * These are injected into :root in index.css
 */
export function getThemeCSSVariables(theme: SiteTheme = currentTheme): string {
  return `
  /* Accent Colors */
  --accent-primary: ${theme.accent.primary};
  --accent-secondary: ${theme.accent.secondary};
  --accent-glow: ${theme.accent.glow};

  /* Accent RGB values for rgba() usage */
  --accent-primary-rgb: ${hexToRgb(theme.accent.primary)};
  --accent-secondary-rgb: ${hexToRgb(theme.accent.secondary)};
  --accent-glow-rgb: ${hexToRgb(theme.accent.glow)};

  /* Surface Colors */
  --surface-app: ${theme.surface.app};
  --surface-card: ${theme.surface.card};
  --surface-elevated: ${theme.surface.elevated};
  --surface-input: ${theme.surface.input};
  --surface-input-border: ${theme.surface.inputBorder};

  /* Text Colors */
  --text-primary: ${theme.text.primary};
  --text-secondary: ${theme.text.secondary};
  --text-muted: ${theme.text.muted};
  --text-on-accent: ${theme.text.onAccent};

  /* Semantic Colors */
  --color-error: ${theme.semantic.error};
  --color-error-muted: ${theme.semantic.errorMuted};
  --color-warning: ${theme.semantic.warning};
  --color-success: ${theme.semantic.success};
  --color-success-muted: ${theme.semantic.successMuted};
  --color-info: ${theme.semantic.info};

  /* Border Colors */
  --border-default: ${theme.border.default};
  --border-muted: ${theme.border.muted};
  --border-accent: ${theme.border.accent};
  `.trim();
}

/**
 * Converts hex color to RGB values (for use with rgba())
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

/**
 * All available themes for A/B testing selection
 */
export const availableThemes: SiteTheme[] = [
  blueTheme,
  purpleTheme,
  tealTheme,
];

/**
 * Injects theme CSS variables into the document root.
 * Call this once when the app initializes.
 *
 * @param theme - The theme to apply (defaults to currentTheme)
 */
export function injectTheme(theme: SiteTheme = currentTheme): void {
  const root = document.documentElement;

  // Accent colors
  root.style.setProperty('--accent-primary', theme.accent.primary);
  root.style.setProperty('--accent-secondary', theme.accent.secondary);
  root.style.setProperty('--accent-glow', theme.accent.glow);

  // Accent RGB values
  root.style.setProperty('--accent-primary-rgb', hexToRgb(theme.accent.primary));
  root.style.setProperty('--accent-secondary-rgb', hexToRgb(theme.accent.secondary));
  root.style.setProperty('--accent-glow-rgb', hexToRgb(theme.accent.glow));

  // Surface colors
  root.style.setProperty('--surface-app', theme.surface.app);
  root.style.setProperty('--surface-card', theme.surface.card);
  root.style.setProperty('--surface-elevated', theme.surface.elevated);
  root.style.setProperty('--surface-input', theme.surface.input);
  root.style.setProperty('--surface-input-border', theme.surface.inputBorder);

  // Panel colors
  root.style.setProperty('--panel-background', theme.panel.background);
  root.style.setProperty('--panel-border', theme.panel.border);
  root.style.setProperty('--panel-header-bg', theme.panel.headerBg);

  // Highlight section colors
  root.style.setProperty('--highlight-gradient-from', theme.highlight.gradientFrom);
  root.style.setProperty('--highlight-gradient-to', theme.highlight.gradientTo);
  root.style.setProperty('--highlight-border', theme.highlight.border);

  // Dropzone colors
  root.style.setProperty('--dropzone-background', theme.dropzone.background);
  root.style.setProperty('--dropzone-border', theme.dropzone.border);
  root.style.setProperty('--dropzone-hover-border', theme.dropzone.hoverBorder);
  root.style.setProperty('--dropzone-hover-background', theme.dropzone.hoverBackground);

  // Text colors
  root.style.setProperty('--text-primary', theme.text.primary);
  root.style.setProperty('--text-secondary', theme.text.secondary);
  root.style.setProperty('--text-muted', theme.text.muted);
  root.style.setProperty('--text-on-accent', theme.text.onAccent);

  // Semantic colors
  root.style.setProperty('--color-error', theme.semantic.error);
  root.style.setProperty('--color-error-muted', theme.semantic.errorMuted);
  root.style.setProperty('--color-warning', theme.semantic.warning);
  root.style.setProperty('--color-success', theme.semantic.success);
  root.style.setProperty('--color-success-muted', theme.semantic.successMuted);
  root.style.setProperty('--color-info', theme.semantic.info);

  // Border colors
  root.style.setProperty('--border-default', theme.border.default);
  root.style.setProperty('--border-muted', theme.border.muted);
  root.style.setProperty('--border-accent', theme.border.accent);

  // Toolbar colors
  root.style.setProperty('--toolbar-background', theme.toolbar.background);
  root.style.setProperty('--toolbar-border', theme.toolbar.border);
  root.style.setProperty('--toolbar-button-bg', theme.toolbar.buttonBg);
  root.style.setProperty('--toolbar-button-hover-bg', theme.toolbar.buttonHoverBg);

  // Card section colors
  root.style.setProperty('--card-section-background', theme.cardSection.background);
  root.style.setProperty('--card-section-border', theme.cardSection.border);

  // Pill colors
  root.style.setProperty('--pill-background', theme.pill.background);
  root.style.setProperty('--pill-border', theme.pill.border);

  // Calendar card colors
  root.style.setProperty('--calendar-card-background', theme.calendarCard.background);

  // Toggle colors
  root.style.setProperty('--toggle-off-bg', theme.toggle.offBg);

  // Modal colors
  root.style.setProperty('--modal-background', theme.modal.background);
  root.style.setProperty('--modal-border', theme.modal.border);
  root.style.setProperty('--modal-overlay', theme.modal.overlay);

  // Slider colors
  root.style.setProperty('--slider-track', theme.slider.track);

  // Button colors
  root.style.setProperty('--button-ghost', theme.button.ghost);
  root.style.setProperty('--button-ghost-hover', theme.button.ghostHover);

  // Tab colors
  root.style.setProperty('--tab-active-bg', theme.tab.activeBg);
  root.style.setProperty('--tab-inactive-text', theme.tab.inactiveText);
  root.style.setProperty('--tab-hover-text', theme.tab.hoverText);

  console.log(`[Theme] Applied: ${theme.name}`);
}
