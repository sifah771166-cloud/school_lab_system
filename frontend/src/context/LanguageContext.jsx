import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, defaultLanguage, getTranslation, getNestedTranslation } from '../i18n/index';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or use default
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || defaultLanguage;
  });

  useEffect(() => {
    // Save language to localStorage when it changes
    localStorage.setItem('language', language);
    // Set document language attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = (key, params = {}) => {
    const value = getTranslation(language, key);
    
    // Replace parameters in translation string
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }
    
    return value;
  };

  const changeLanguage = (newLanguage) => {
    if (newLanguage in translations) {
      setLanguage(newLanguage);
    }
  };

  const value = {
    language,
    changeLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  return useLanguage();
};
