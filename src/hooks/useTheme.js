import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export function useTheme() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await storage.get('theme_isDark');
      if (stored !== null) {
        setIsDark(stored);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storage.set('theme_isDark', isDark);
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return { isDark, toggleTheme };
}
