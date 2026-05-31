import { useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const useI18n = () => {
  const { language, t, changeLanguage, getAvailableLanguages } = useLanguage();

  const translateArray = useCallback((keys) => {
    return keys.map(key => t(key));
  }, [t]);

  const translateObject = useCallback((obj) => {
    const result = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        result[key] = t(obj[key]);
      } else if (typeof obj[key] === 'object') {
        result[key] = translateObject(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }, [t]);

  const formatMessage = useCallback((key, params = {}) => {
    let message = t(key);
    Object.keys(params).forEach(param => {
      message = message.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
    });
    return message;
  }, [t]);

  const pluralize = useCallback((key, count, params = {}) => {
    const pluralKey = count === 1 ? `${key}_one` : `${key}_other`;
    return formatMessage(pluralKey, { ...params, count });
  }, [formatMessage]);

  return useMemo(() => ({
    language,
    t,
    changeLanguage,
    getAvailableLanguages,
    translateArray,
    translateObject,
    formatMessage,
    pluralize,
  }), [
    language,
    t,
    changeLanguage,
    getAvailableLanguages,
    translateArray,
    translateObject,
    formatMessage,
    pluralize,
  ]);
};

export default useI18n;
