'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Сообщение отправлено (заглушка)\nEmail: ${email}\nСообщение: ${message}`);
    setEmail('');
    setMessage('');
  };

  const isFormValid = email.trim() !== '' && message.trim() !== '';

  return (
    <div className="max-w-2xl">
      {/* Верхний блок: заголовок, описание */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-medium mb-2">{t.about.title}</h1>
        <p className="text-gray-600 text-base">
          {t.about.description}
        </p>
      </div>

      <div className="space-y-6">
        {/* Блок 1: Основная информация */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Context (рус. Контекст)
            </h2>
            <p className="text-gray-500 text-base">
              Ответы на вопросы по загруженным документам, автоматическое создание диаграмм. Используя Context, вы соглашаетесь с{' '}
              <Link
                href="/privacy"
                className="text-blue-600 hover:underline"
              >
                Политикой конфиденциальности
              </Link>
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xl font-medium text-gray-900 mb-1">{t.about.version}</p>
              <p className="text-gray-500 text-base">1.0.0</p>
            </div>
            <div>
              <p className="text-xl font-medium text-gray-900 mb-1">{t.about.buildDate}</p>
              <p className="text-gray-500 text-base">01.12.2025</p>
            </div>
          </div>
        </div>

        {/* Блок 2: Форма поддержки (вместо кнопки) */}
        <div className="bg-white border border-gray-200 rounded-xl p-6" ref={formRef}>
          <h2 className="text-xl font-medium text-gray-900 mb-4">{t.about.contactSupport}</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Поле Email */}
            <div className="mb-4">
              <label className="block text-gray-900 font-medium mb-2">
                {t.about.yourEmail}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@mail.com"
              />
            </div>

            {/* Поле Сообщение */}
            <div className="mb-6">
              <label className="block text-gray-900 font-medium mb-2">
                {t.about.yourMessage}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={t.about.messagePlaceholder}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 text-base font-medium flex items-center hover:text-blue-600 transition-colors"
                  onClick={() => alert('Функция прикрепления файла (заглушка)')}
                >
                  <i className="fas fa-paperclip mr-2 text-lg"></i>
                  {t.about.attachFile}
                </button>
              </div>
            </div>

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isFormValid
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t.about.send}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}