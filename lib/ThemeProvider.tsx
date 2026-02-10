import React, { createContext, useContext, useEffect, useState } from 'react';
import { currentTheme, injectTheme, SiteTheme, availableThemes } from './site_themes';

interface ThemeContextType {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<SiteTheme>(currentTheme);

  useEffect(() => {
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
