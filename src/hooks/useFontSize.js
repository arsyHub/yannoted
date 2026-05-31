import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export function useFontSize() {
  const [fontSize, setFontSize] = useState(14); // default 14px

  useEffect(() => {
    const loadFontSize = async () => {
      const stored = await storage.get('editor_fontSize');
      if (stored) {
        setFontSize(stored);
      }
    };
    loadFontSize();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
    storage.set('editor_fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          // Scroll up -> Zoom In
          setFontSize(prev => Math.min(prev + 1, 32));
        } else {
          // Scroll down -> Zoom Out
          setFontSize(prev => Math.max(prev - 1, 10));
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return { fontSize, setFontSize };
}
