// Создаем модальное окно настроек приложения с возможностью изменения темы и языка интерфейса
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'ru' | 'en');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Блюр фон */}
      <div 
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}
        onClick={onClose}
      />
      
      {/* Модальное окно */}
      <div className={`relative rounded-xl p-6 max-w-2xl w-full shadow-xl z-10 max-h-[90vh] overflow-y-auto hide-scrollbar ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Блок 1: Тема интерфейса — на мобильных в столбец */}
          <div className={`rounded-xl p-4 sm:p-6 min-h-[72px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
            <span className={`text-base font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('settings.theme')}
            </span>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className={`text-base ${!isDark ? (isDark ? 'text-gray-100' : 'text-gray-900') : 'text-gray-500'}`}>
                {t('settings.light')}
              </span>
              <button
                onClick={toggleTheme}
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-all duration-300 ${isDark ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
              </button>
              <span className={`text-base ${isDark ? 'text-gray-100' : 'text-gray-500'}`}>
                {t('settings.dark')}
              </span>
            </div>
          </div>

          {/* Блок 2: Язык интерфейса — на мобильных в столбец */}
          <div className={`rounded-xl p-4 sm:p-6 min-h-[72px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
            <span className={`text-base font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('settings.language')}
            </span>
            <div className="relative w-full sm:w-auto">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={`border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:min-w-[160px] appearance-none pr-10 h-[48px] ${isDark ? 'bg-gray-600 border-gray-500 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
