'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/storage';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function PrivacyPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = () => {
      const user = auth.getCurrentUser();
      setIsAuthenticated(!!user && auth.hasSession());
    };
    checkAuth();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`${t.privacy.messageSent}\nEmail: ${email}\n${t.privacy.yourMessage}: ${message}`);
    setEmail('');
    setMessage('');
  };

  const isFormValid = email.trim() !== '' && message.trim() !== '';

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className={isAuthenticated ? 'max-w-2xl' : 'max-w-2xl mx-auto'}>
      {/* Верхний блок: заголовок, описание */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        {!isAuthenticated && (
          <button
            onClick={() => router.push('/login')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            <span className="text-base">{t.privacy.back}</span>
          </button>
        )}
        <h1 className="text-3xl font-medium mb-2">{t.privacy.title}</h1>
        <p className="text-gray-600 text-base">
          {t.privacy.description}
        </p>
      </div>

      <div className="space-y-6">
        {/* Блок 1: Общие положения */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {t.privacy.section1Title}
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              {t.privacy.section1Content1}
            </p>
            <p>
              {t.privacy.section1Content2}
            </p>
          </div>
        </div>

        {/* Блок 2: Собираемые данные */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {t.privacy.section2Title}
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>{t.privacy.section2Intro}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t.privacy.section2Item1}</li>
              <li>{t.privacy.section2Item2}</li>
              <li>{t.privacy.section2Item3}</li>
              <li>{t.privacy.section2Item4}</li>
              <li>{t.privacy.section2Item5}</li>
            </ul>
          </div>
        </div>

        {/* Блок 3: Цели использования данных */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {t.privacy.section3Title}
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>{t.privacy.section3Intro}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t.privacy.section3Item1}</li>
              <li>{t.privacy.section3Item2}</li>
              <li>{t.privacy.section3Item3}</li>
              <li>{t.privacy.section3Item4}</li>
              <li>{t.privacy.section3Item5}</li>
              <li>{t.privacy.section3Item6}</li>
              <li>{t.privacy.section3Item7}</li>
            </ul>
          </div>
        </div>

        {/* Блок 4: Защита данных */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {t.privacy.section4Title}
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              {t.privacy.section4Content1}
            </p>
            <p>
              {t.privacy.section4Content2}
            </p>
          </div>
        </div>

        {/* Блок 5: Передача данных третьим лицам */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {t.privacy.section5Title}
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              {t.privacy.section5Intro}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t.privacy.section5Item1}</li>
              <li>{t.privacy.section5Item2}</li>
              <li>{t.privacy.section5Item3}</li>
            </ul>
          </div>
        </div>

        {/* Блок 6: Права пользователей */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {t.privacy.section6Title}
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>{t.privacy.section6Intro}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t.privacy.section6Item1}</li>
              <li>{t.privacy.section6Item2}</li>
              <li>{t.privacy.section6Item3}</li>
              <li>{t.privacy.section6Item4}</li>
            </ul>
            <p>
              {t.privacy.section6Content}
            </p>
          </div>
        </div>

        {/* Блок 7: Cookies */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {t.privacy.section7Title}
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              {t.privacy.section7Content1}
            </p>
            <p>
              {t.privacy.section7Content2}
            </p>
          </div>
        </div>

        {/* Блок 8: Изменения в политике */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {t.privacy.section8Title}
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              {t.privacy.section8Content1}
            </p>
            <p>
              {t.privacy.section8Content2}
            </p>
          </div>
        </div>

        {/* Блок 9: Контакты */}
        <div className="bg-white border border-gray-200 rounded-xl p-6" ref={formRef}>
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {t.privacy.section9Title}
          </h2>
          <div className="space-y-4 text-gray-700 text-base leading-relaxed">
            <p>
              {t.privacy.section9Intro}
            </p>
            
            {/* Форма обратной связи */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <form onSubmit={handleSubmit}>
                {/* Поле Email */}
                <div className="mb-4">
                  <label className="block text-gray-900 font-medium mb-2">
                    {t.privacy.yourEmail}
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
                    {t.privacy.yourMessage}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder={t.privacy.messagePlaceholder}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700 text-base font-medium flex items-center hover:text-blue-600 transition-colors"
                      onClick={() => alert(t.privacy.attachFileStub)}
                    >
                      <i className="fas fa-paperclip mr-2 text-lg"></i>
                      {t.privacy.attachFile}
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
                  {t.privacy.send}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

