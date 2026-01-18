// Создаем страницу настроек приложения с возможностью изменения темы и языка интерфейса
'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('ru');

  return (
    <div className="max-w-2xl">
      {/* Верхний блок: заголовок, описание */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-medium mb-2">Настройки</h1>
        <p className="text-gray-600 text-base">
          Настройте параметры системы под свои предпочтения
        </p>
      </div>

      <div className="space-y-6">
        {/* Блок 1: Тема интерфейса */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">Тема интерфейса</h2>
              <p className="text-gray-500 text-base">
                Выберите светлую или тёмную тему оформления
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-base ${!darkMode ? 'text-gray-900' : 'text-gray-500'}`}>
                Светлая
              </span>
              <button
                onClick={() => setDarkMode(!darkMode)}
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
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">Язык интерфейса</h2>
              <p className="text-gray-500 text-base">
                Выберите язык отображения элементов системы
              </p>
            </div>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px] appearance-none pr-10 bg-white"
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

      {/* Кнопка сохранения */}
      <div className="mt-12">
        <button
          onClick={() => alert('Настройки сохранены (заглушка)')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Сохранить изменения
        </button>
      </div>
    </div>
  );
}