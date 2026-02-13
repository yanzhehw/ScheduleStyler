import React, { createContext, useContext, useEffect, useState } from 'react';
import { currentTheme, injectTheme, SiteTheme, availableThemes } from './site_themes';

// Inject theme immediately at module load time to ensure CSS variables
// are available before the first React render
injectTheme(currentTheme);

interface ThemeContextType {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<SiteTheme>(() => {
    // Ensure theme is injected synchronously on first render
    injectTheme(currentTheme);
    return currentTheme;
  });

  useEffect(() => {
    // Re-inject on theme changes
    injectTheme(theme);
  }, [theme]);

  // Enable HMR for theme changes during development
  if (import.meta.hot) {
    import.meta.hot.accept('./site_themes', (newModule) => {
      if (newModule) {
        setTheme(newModule.currentTheme);
      }
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
