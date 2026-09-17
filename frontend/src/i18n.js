import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationVI from './locales/vi/translation.json';

// Get language from localStorage, default to 'en' if not found
const savedLanguage = localStorage.getItem('i18nextLng') || 'en';

const resources = {
  en: {
    translation: translationEN
  },
  vi: {
    translation: translationVI
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // initial language
    fallbackLng: 'en', // if translation not found, use english
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

// Listen to language changes to update localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
