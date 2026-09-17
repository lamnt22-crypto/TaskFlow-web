import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-sm"
      aria-label="Toggle Language"
    >
      <span className={i18n.language === 'en' ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-50'}>EN</span>
      <span className="opacity-30">|</span>
      <span className={i18n.language === 'vi' ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-50'}>VI</span>
    </button>
  );
};

export default LanguageToggle;
