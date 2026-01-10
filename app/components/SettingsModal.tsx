'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('ru');

  useEffect(() => {
    if (!isOpen) return;

    // Загружаем сохраненные настройки из localStorage
    const savedTheme = localStorage.getItem('theme');
    const savedLanguage = localStorage.getItem('language');
    
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
    
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, [isOpen]);

  const handleThemeChange = (newDarkMode: boolean) => {
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    // Здесь можно добавить реальную логику применения темы
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    // Здесь можно добавить реальную логику переключения языка
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Блюр фон */}
      <div 
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Модальное окно */}
      <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-2xl w-full shadow-xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900">Настройки</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Блок 1: Тема интерфейса */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-[96px] flex items-center">
            <div className="flex items-center justify-between w-full">
              <span className="text-base text-gray-900">
                Тема интерфейса
              </span>
              <div className="flex items-center gap-4">
                <span className={`text-base ${!darkMode ? 'text-gray-900' : 'text-gray-500'}`}>
                  Светлая
                </span>
                <button
                  onClick={() => handleThemeChange(!darkMode)}
                  className={`w-14 h-7 flex items-center rounded-full p-1 transition-all duration-300 ${darkMode ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'}`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                </button>
                <span className={`text-base ${darkMode ? 'text-gray-900' : 'text-gray-500'}`}>
                  Тёмная
                </span>
              </div>
            </div>
          </div>

          {/* Блок 2: Язык интерфейса */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-[96px] flex items-center">
            <div className="flex items-center justify-between w-full">
              <span className="text-base text-gray-900">
                Язык интерфейса
              </span>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px] appearance-none pr-10 bg-white h-[48px]"
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
                {/* Кастомная стрелочка */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
