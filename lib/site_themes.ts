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
    ghost: string;        // Ghost button background
    ghostHover: string;   // Ghost button hover background
  };

  // Surface/background colors
  surface: {
    app: string;          // Main app background
    header: string;       // Header background
    card: string;         // Card/panel backgrounds
    elevated: string;     // Elevated elements (popovers, modals)
    input: string;        // Input field backgrounds
    inputBorder: string;  // Input border color
    calendarCard: string; // Calendar card default background
  };

  // Sidebar colors
  sidebar: {
    background: string;   // Sidebar and panel backgrounds
    border: string;       // Sidebar borders
    headerBg: string;     // Sidebar header background
    // Card sections within sidebar (e.g., "Content Display" section)
    cardSection: {
      background: string;   // Semi-transparent section background
      border: string;       // Section border
    };
  };

  // Upload box area
  uploadBox: {
    background: string;   // Upload box background
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
    daySelector: string;
  };

  // Zoom controls/floating UI
  zoomControls: {
    background: string;   // Zoom controls background
    border: string;       // Zoom controls border
    buttonBg: string;     // Button background within zoom controls
    buttonHoverBg: string; // Button hover background
  };

  // Feature pills and small UI elements
  pill: {
    background: string;   // Pill background
    border: string;       // Pill border
    // Selected/tab states within pills
    selected: {
      activeBg: string;     // Active/selected background
      inactiveText: string; // Inactive text color
      hoverText: string;    // Text color on hover
    };
  };

  // Popup windows
  popup: {
    background: string;   // Popup background (e.g., bg-gray-900)
    border: string;       // Popup border
    overlay: string;      // Overlay behind popup
  };

  // Widget controls (toggles, sliders)
  widget: {
    background: string;   // Background for toggle off state and slider track
  };

  // Empty slot "add" button (hover-to-add on calendar grid)
  addSlot: {
    background: string;
    borderColor: string;
    boxShadow: string;
    textColor: string;
  };
}

export const darkTheme: SiteTheme = {
  name: "Dark",

  // Primary accent colors - that vibrant lime/chartreuse
  // Radio glider blends: accent.primary (33% opacity) → accent.secondary (gradient)
  accent: {
    primary: "#8cfbb2",      // Bright lime green
    secondary: "#61f193",    // Lighter lime for gradients
    glow: "#d9ff5019",       // Same lime for glow effects
    ghost: "transparent",
    ghostHover: "rgba(212, 255, 58, 0.1)",
  },

  // Surface/background colors
  surface: {
    app: "#1e1e1e",          // Very dark background
    header: "#141414cc",     // Header background (semi-transparent)
    card: "#2a2a2a",         // Card backgrounds (slightly lighter)
    elevated: "#101010",     // Elevated elements
    input: "#1e1e1e",        // Input fields
    inputBorder: "#2b2b2b",  // Input borders
    calendarCard: "#1e1e1e",
  },

  // Sidebar colors
  sidebar: {
    background: "#141414",   // Sidebar background
    border: "#2a2a2a",       // Sidebar borders
    headerBg: "#1a1a1a",     // Sidebar headers
    cardSection: {
      background: "#2a2a2a",
      border: "#252525",
    },
  },

  // Upload box area
  uploadBox: {
    background: "#1a1a1a",
    border: "#333333",
    hoverBorder: "#fffa78",  // Lime on hover
    hoverBackground: "#487d5b2e",
  },

  // Text colors
  text: {
    primary: "#ffffff",      // White text
    secondary: "#a0a0a0",    // Gray text
    muted: "#666666",        // Muted gray
    onAccent: "#1e1e1e",     // Black text on lime background
  },

  // Semantic colors
  semantic: {
    error: "#ff4444",
    errorMuted: "#ff444440",
    warning: "#ffaa00",
    success: "#44ff88",
    successMuted: "#44ff8840",
    info: "#4488ff",
  },

  // Border colors
  border: {
    default: "#2a2a2a",
    muted: "#1e1e1e",
    accent: "#d4ff3a",
    daySelector: '#2a2a2a',
  },

  // Zoom controls/floating UI
  zoomControls: {
    background: "#1a1a1a",
    border: "#333333",
    buttonBg: "#252525",
    buttonHoverBg: "#303030",
  },

  // Feature pills
  pill: {
    background: "#252525",
    border: "#333333",
    selected: {
      activeBg: "#151515",
      inactiveText: "#808080",
      hoverText: "#cccccc",
    },
  },

  // Popup windows
  popup: {
    background: "#1a1a1a",
    border: "#333333",
    overlay: "rgba(0, 0, 0, 0.75)",
  },

  // Widget controls (toggles, sliders)
  widget: {
    background: "#333333",
  },

  addSlot: {
    background: 'rgba(15,23,42,0.4)',
    borderColor: 'rgba(148,163,184,0.25)',
    boxShadow: 'inset 4px 4px 10px rgba(0,0,0,0.55), inset -4px -4px 10px rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.28)',
    textColor: '#e2e8f0',
  },
};

// Default blue theme (current)
export const blueTheme: SiteTheme = {
  name: 'Blue',

  accent: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    glow: '#8b5cf6',
    ghost: '#374151',                          // gray-700
    ghostHover: '#4b5563',                     // gray-600
  },

  surface: {
    app: '#0f172a',
    header: 'rgba(17, 24, 39, 0.5)',          // gray-900/50
    card: '#1e293b',
    elevated: '#334155',
    input: '#1f2937',
    inputBorder: '#374151',
    calendarCard: '#1e293b',                   // slate-800
  },

  sidebar: {
    background: '#111827',
    border: '#1f2937',
    headerBg: '#111827',
    cardSection: {
      background: 'rgba(31, 41, 55, 0.5)',      // gray-800/50
      border: '#374151',                         // gray-700
    },
  },

  uploadBox: {
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
    daySelector: '#374151',
  },

  zoomControls: {
    background: 'rgba(15, 23, 42, 0.7)',      // slate-900/70
    border: 'rgba(71, 85, 105, 0.7)',          // slate-600/70
    buttonBg: 'rgba(30, 41, 59, 0.8)',         // slate-800/80
    buttonHoverBg: 'rgba(51, 65, 85, 0.8)',    // slate-700/80
  },

  pill: {
    background: 'rgba(31, 41, 55, 0.5)',      // gray-800/50
    border: '#374151',                         // gray-700
    selected: {
      activeBg: '#26344a',                     // slate-800
      inactiveText: '#94a3b8',                 // slate-400
      hoverText: '#e2e8f0',                    // slate-200
    },
  },

  popup: {
    background: '#111827',                     // gray-900
    border: '#374151',                         // gray-700
    overlay: 'rgba(0, 0, 0, 0.55)',            // black/55
  },

  widget: {
    background: '#374151',                     // gray-700
  },

  addSlot: {
    background: 'rgba(15,23,42,0.4)',
    borderColor: 'rgba(148,163,184,0.25)',
    boxShadow: 'inset 4px 4px 10px rgba(0,0,0,0.55), inset -4px -4px 10px rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.28)',
    textColor: '#e2e8f0',
  },
};

// Alternative purple theme for A/B testing
export const purpleTheme: SiteTheme = {
  name: 'Purple',

  accent: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: '#c084fc',
    ghost: '#3d3456',                          // purple-border
    ghostHover: '#4b4264',                     // lighter purple
  },

  surface: {
    app: '#0f0a1a',
    header: 'rgba(18, 13, 30, 0.5)',          // purple-panel/50
    card: '#1a1425',
    elevated: '#2d2440',
    input: '#1f1a2e',
    inputBorder: '#3d3456',
    calendarCard: '#1a1425',                   // purple-card
  },

  sidebar: {
    background: '#120d1e',
    border: '#1f1a2e',
    headerBg: '#120d1e',
    cardSection: {
      background: 'rgba(31, 26, 46, 0.5)',      // purple-input/50
      border: '#3d3456',
    },
  },

  uploadBox: {
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
    daySelector: '#3d3456',
  },

  zoomControls: {
    background: 'rgba(18, 13, 30, 0.7)',      // purple-dark/70
    border: 'rgba(61, 52, 86, 0.7)',           // purple-border/70
    buttonBg: 'rgba(31, 26, 46, 0.8)',         // purple-input/80
    buttonHoverBg: 'rgba(45, 36, 64, 0.8)',    // purple-elevated/80
  },

  pill: {
    background: 'rgba(31, 26, 46, 0.5)',      // purple-input/50
    border: '#3d3456',
    selected: {
      activeBg: '#1f1a2e',                     // purple-input
      inactiveText: '#a5a0b8',                 // purple-secondary
      hoverText: '#e2e8f0',
    },
  },

  popup: {
    background: '#120d1e',                     // purple-panel
    border: '#3d3456',                         // purple-border
    overlay: 'rgba(0, 0, 0, 0.55)',
  },

  widget: {
    background: '#3d3456',                     // purple-border
  },

  addSlot: {
    background: 'rgba(15,23,42,0.4)',
    borderColor: 'rgba(148,163,184,0.25)',
    boxShadow: 'inset 4px 4px 10px rgba(0,0,0,0.55), inset -4px -4px 10px rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.28)',
    textColor: '#e2e8f0',
  },
};

// Alternative teal theme for A/B testing
export const tealTheme: SiteTheme = {
  name: 'Teal',

  accent: {
    primary: '#126b60',
    secondary: '#44bfad',
    glow: '#2dd4bf',
    ghost: '#2d4a4a',                          // teal-border
    ghostHover: '#3d5a5a',                     // lighter teal
  },

  surface: {
    app: '#08080F',
    header: 'rgba(13, 26, 26, 0.5)',          // teal-panel/50
    card: '#142525',
    elevated: '#1f3d3d',
    input: '#1a2e2e',
    inputBorder: '#2d4a4a',
    calendarCard: '#121212',                   // teal-card
  },

  sidebar: {
    background: '#0d1a1a',
    border: '#1a2e2e',
    headerBg: '#0d1a1a',
    cardSection: {
      background: 'rgba(26, 46, 46, 0.5)',      // teal-input/50
      border: '#2d4a4a',
    },
  },

  uploadBox: {
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
    daySelector: '#2d4a4a',
  },

  zoomControls: {
    background: 'rgba(13, 26, 26, 0.7)',       // teal-dark/70
    border: 'rgba(45, 74, 74, 0.7)',           // teal-border/70
    buttonBg: 'rgba(26, 46, 46, 0.8)',         // teal-input/80
    buttonHoverBg: 'rgba(31, 61, 61, 0.8)',    // teal-elevated/80
  },

  pill: {
    background: 'rgba(26, 46, 46, 0.5)',      // teal-input/50
    border: '#2d4a4a',
    selected: {
      activeBg: '#1a2e2e',                     // teal-input
      inactiveText: '#94b8b8',                 // teal-secondary
      hoverText: '#e2e8f0',
    },
  },

  popup: {
    background: '#0d1a1a',                     // teal-panel
    border: '#2d4a4a',                         // teal-border
    overlay: 'rgba(0, 0, 0, 0.55)',
  },

  widget: {
    background: '#2d4a4a',                     // teal-border
  },

  addSlot: {
    background: 'rgba(15,23,42,0.4)',
    borderColor: 'rgba(148,163,184,0.25)',
    boxShadow: 'inset 4px 4px 10px rgba(0,0,0,0.55), inset -4px -4px 10px rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.28)',
    textColor: '#e2e8f0',
  },
};

//Dark 1 Theme
export const dark1Theme: SiteTheme = {
  name: 'Dark1',

  accent: {
    primary: '#dcdcdc',
    secondary: '#a1c1e9',
    glow: '#f8d9a481',
    ghost: '#39393999',
    ghostHover: '#383e48',
  },

  surface: {
    app: '#090909',
    header: '#0d0d0d',
    card: '#151515', //also scorllbar 
    elevated: '#242424',
    input: '#192626',
    inputBorder: '#37415100',
    calendarCard: '#151515',
  },

  sidebar: {
    background: '#0d0d0d',
    border: '#1f2937',
    headerBg: '#0d0d0d',
    cardSection: {
      background: '#151515',
      border: '#FFFFFF00',
    },
  },

  uploadBox: {
    background: '#0d0d0d',
    border: '#4b5563',
    hoverBorder: '#b7e4fb',
    hoverBackground: '#ffffff10',
  },

  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#64748b',
    onAccent: '#09090b',
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
    default: '#1f1f1f',
    muted: '#1f1f1f',
    accent: '#4e8ff8',
    daySelector: '#4a4747',
  },

  zoomControls: {
    background: 'rgba(22, 22, 22, 0.53)',      // slate-900/70
    border: '#1f1f1f',          // slate-600/70
    buttonBg: 'rgba(30, 30, 30, 0.89)',         // slate-800/80
    buttonHoverBg: 'rgba(45, 45, 45, 0.8)',    // slate-700/80
  },

  pill: {
    background: '#161618',
    border: '#373737',
    selected: {
      activeBg: '#263a40',
      inactiveText: '#80999f',
      hoverText: '#e2e8f0',
    },
  },

  popup: {
    background: '#141414',
    border: '#1e2425',
    overlay: 'rgba(0, 0, 0, 0.55)',
  },

  widget: {
    background: '#292c30',
  },

  addSlot: {
    background: 'rgba(40,40,42,0.4)',
    borderColor: '#99a6b940',
    boxShadow: 'inset 4px 4px 10px rgba(0,0,0,0.55), inset -4px -4px 10px rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.28)',
    textColor: '#e2e8f0',
  },
};
// ============================================
// ACTIVE THEME - Change this to switch themes
// ============================================
export const currentTheme: SiteTheme = dark1Theme;  // Default theme is blue. Change to purpleTheme or tealTheme for A/B testing.

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
  darkTheme,
  dark1Theme,
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
  root.style.setProperty('--surface-header', theme.surface.header);
  root.style.setProperty('--surface-card', theme.surface.card);
  root.style.setProperty('--surface-elevated', theme.surface.elevated);
  root.style.setProperty('--surface-input', theme.surface.input);
  root.style.setProperty('--surface-input-border', theme.surface.inputBorder);
  root.style.setProperty('--calendar-card-background', theme.surface.calendarCard);

  // Sidebar colors
  root.style.setProperty('--sidebar-background', theme.sidebar.background);
  root.style.setProperty('--panel-background', theme.sidebar.background);
  root.style.setProperty('--sidebar-border', theme.sidebar.border);
  root.style.setProperty('--sidebar-header-bg', theme.sidebar.headerBg);

  // Upload box colors
  root.style.setProperty('--upload-box-background', theme.uploadBox.background);
  root.style.setProperty('--upload-box-border', theme.uploadBox.border);
  root.style.setProperty('--upload-box-hover-border', theme.uploadBox.hoverBorder);
  root.style.setProperty('--upload-box-hover-background', theme.uploadBox.hoverBackground);

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
  root.style.setProperty('--panel-border', theme.border.default);
  root.style.setProperty('--border-day-selector', theme.border.daySelector);

  // Zoom controls colors
  root.style.setProperty('--toolbar-background', theme.zoomControls.background);
  root.style.setProperty('--toolbar-border', theme.zoomControls.border);
  root.style.setProperty('--toolbar-button-bg', theme.zoomControls.buttonBg);
  root.style.setProperty('--toolbar-button-hover-bg', theme.zoomControls.buttonHoverBg);

  // Card section colors (within sidebar)
  root.style.setProperty('--card-section-background', theme.sidebar.cardSection.background);
  root.style.setProperty('--card-section-border', theme.sidebar.cardSection.border);

  // Pill colors
  root.style.setProperty('--pill-background', theme.pill.background);
  root.style.setProperty('--pill-border', theme.pill.border);

  // Selected/tab colors (within pill)
  root.style.setProperty('--tab-active-bg', theme.pill.selected.activeBg);
  root.style.setProperty('--tab-inactive-text', theme.pill.selected.inactiveText);
  root.style.setProperty('--tab-hover-text', theme.pill.selected.hoverText);

  // Popup colors
  root.style.setProperty('--popup-background', theme.popup.background);
  root.style.setProperty('--popup-border', theme.popup.border);
  root.style.setProperty('--popup-overlay', theme.popup.overlay);

  // Widget colors (toggle, slider)
  root.style.setProperty('--toggle-off-bg', theme.widget.background);
  root.style.setProperty('--slider-track', theme.widget.background);

  // Ghost button colors (from accent)
  root.style.setProperty('--button-ghost', theme.accent.ghost);
  root.style.setProperty('--button-ghost-hover', theme.accent.ghostHover);

  // Add slot (empty slot hover-to-add on calendar grid)
  root.style.setProperty('--add-slot-background', theme.addSlot.background);
  root.style.setProperty('--add-slot-border-color', theme.addSlot.borderColor);
  root.style.setProperty('--add-slot-box-shadow', theme.addSlot.boxShadow);
  root.style.setProperty('--add-slot-text-color', theme.addSlot.textColor);

}
