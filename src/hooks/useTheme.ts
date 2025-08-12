import { useEffect, useLayoutEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Prefer saved theme
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch (e) {
      if (import.meta && import.meta.env && import.meta.env.DEV) {
        console.debug('Cannot read theme from localStorage:', e);
      }
    }

    // Fallback to OS preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' as Theme : 'light';
    }

    return 'light';
  });

  // Apply theme class ASAP to minimize flash
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      if (import.meta && import.meta.env && import.meta.env.DEV) {
        console.debug('Cannot write theme to localStorage:', e);
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
};