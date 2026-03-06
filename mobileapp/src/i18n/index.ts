/**
 * i18n Configuration
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import de from './de';
import en from './en';

const resources = {
  de: { translation: de },
  en: { translation: en },
};

export const initI18n = async () => {
  // Get saved language from storage, default to German
  let savedLang = 'de';
  try {
    const stored = await AsyncStorage.getItem('lang');
    if (stored) savedLang = stored;
  } catch (e) {
    // Use default
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLang,
      fallbackLng: 'de',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v3',
    });
};

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem('lang', lang);
  } catch (e) {
    // Ignore storage errors
  }
};

export default i18n;
