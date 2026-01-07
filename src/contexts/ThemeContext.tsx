import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useOrganization } from './OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

interface ThemeContextType {
  themeColor: string;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Generate lighter/darker variants
function adjustLightness(h: number, s: number, l: number, amount: number): string {
  const newL = Math.max(0, Math.min(100, l + amount));
  return `${h} ${s}% ${newL}%`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { currentOrganization } = useOrganization();
  const [themeColor, setThemeColor] = useState('#2563EB');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTheme = async () => {
      if (!currentOrganization?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('theme_color')
          .eq('id', currentOrganization.id)
          .single();

        if (!error && data?.theme_color) {
          setThemeColor(data.theme_color);
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheme();
  }, [currentOrganization?.id]);

  // Apply theme color to CSS variables
  useEffect(() => {
    const hsl = hexToHsl(themeColor);
    if (!hsl) return;

    const root = document.documentElement;
    
    // Primary color
    root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    
    // Darker variant for dark backgrounds
    root.style.setProperty('--servire-blue', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty('--servire-blue-dark', adjustLightness(hsl.h, hsl.s, hsl.l, -15));
    root.style.setProperty('--servire-blue-light', adjustLightness(hsl.h, hsl.s, hsl.l, 10));
    
    // Sidebar colors
    root.style.setProperty('--sidebar-background', adjustLightness(hsl.h, hsl.s, hsl.l, -15));
    root.style.setProperty('--sidebar-accent', adjustLightness(hsl.h, hsl.s, hsl.l, -5));
    
    // Ring for focus states
    root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);

  }, [themeColor]);

  return (
    <ThemeContext.Provider value={{ themeColor, isLoading }}>
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
