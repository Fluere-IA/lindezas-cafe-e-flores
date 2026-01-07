import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  themeColor: string;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default Servire blue color
const DEFAULT_THEME_COLOR = '#2563EB';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ themeColor: DEFAULT_THEME_COLOR, isLoading: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
