import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { ReactNode, createContext, useContext } from 'react';

interface ThemeContextType {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  isDark: boolean;
  themeColor: string;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default Servire blue color
const DEFAULT_THEME_COLOR = '#2563EB';

function ThemeContextProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  
  const value: ThemeContextType = {
    theme,
    setTheme,
    isDark: resolvedTheme === 'dark',
    themeColor: DEFAULT_THEME_COLOR,
    isLoading: false,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem
      disableTransitionOnChange
    >
      <ThemeContextProvider>
        {children}
      </ThemeContextProvider>
    </NextThemesProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
