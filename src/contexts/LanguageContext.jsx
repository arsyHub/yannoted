import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  return useContext(LanguageContext);
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('id'); // Default is Indonesian

  useEffect(() => {
    // Load saved language from electron store if available
    const loadLanguage = async () => {
      if (window.api && window.api.store) {
        const savedLang = await window.api.store.get('app_language');
        if (savedLang) {
          setLanguage(savedLang);
        }
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    if (window.api && window.api.store) {
      window.api.store.set('app_language', lang);
    }
  };

  const t = (key, params = {}) => {
    let text = translations[language]?.[key] || translations['id']?.[key] || key;
    
    // Simple templating engine for params like {min}
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
