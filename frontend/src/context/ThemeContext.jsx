import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'careerlens-theme';

/**
 * ThemeProvider
 *
 * Manages 'light' | 'dark' state.
 *
 * Priority order:
 *   1. Explicit user preference stored in localStorage (careerlens-theme)
 *   2. System preference via window.matchMedia('(prefers-color-scheme: dark)')
 *
 * Applies theme by toggling a `dark` class on <html> (document.documentElement).
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Read on first render — FOUC is already prevented by the inline script
    // in index.html; this just sets React state to match.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light') return 'light';
      if (stored === 'dark') return 'dark';
    } catch {
      // localStorage not available (private browsing edge cases)
    }
    // Default to dark theme for high-aesthetic presentation
    return 'dark';
  });

  // Apply class to <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  // Listen for OS-level preference changes (only if no explicit user override)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        // Only follow OS change if the user hasn't explicitly chosen a theme
        if (!stored) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      } catch {
        // ignore
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export default ThemeContext;
