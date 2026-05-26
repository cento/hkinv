import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import it from './it.json';
import en from './en.json';

const savedLang = localStorage.getItem('app-language') || navigator.language.split('-')[0] || 'it';

i18n.use(initReactI18next).init({
  resources: {
    it: { translation: it },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function changeLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem('app-language', lang);
}

export default i18n;
