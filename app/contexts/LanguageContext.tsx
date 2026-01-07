'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getLanguage, setLanguage as setLanguageStorage, type Language, getTranslations, type Translations } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');
  const [translations, setTranslations] = useState<Translations>(getTranslations('ru'));

  useEffect(() => {
    // Загружаем язык из localStorage при монтировании
    const savedLanguage = getLanguage();
    setLanguageState(savedLanguage);
    setTranslations(getTranslations(savedLanguage));

    // Слушаем изменения языка
    const handleLanguageChange = (e: CustomEvent<{ language: Language }>) => {
      const newLanguage = e.detail.language;
      setLanguageState(newLanguage);
      setTranslations(getTranslations(newLanguage));
    };

    window.addEventListener('languagechange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange as EventListener);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageStorage(lang);
    setLanguageState(lang);
    setTranslations(getTranslations(lang));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

