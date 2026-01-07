'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/storage';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Улучшенная валидация email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email.trim());
  const isValidPassword = password.length > 0;
  const isFormValid = isValidEmail && isValidPassword && privacyAgreed;

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    // Очищаем email от пробелов
    const trimmedEmail = email.trim();

    try {
      const { user, error: authError } = await auth.signIn(trimmedEmail, password);

      if (authError) {
        setError(authError.message || t.login.error);
        setLoading(false);
        return;
      }

      if (user) {
        router.push('/projects');
        router.refresh();
      } else {
        setError(t.login.error);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || t.login.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md">
        {/* Логотип и иконка Context */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <i className="fas fa-diagram-project text-4xl text-gray-900"></i>
          <h1 className="text-4xl font-medium text-gray-900">Context</h1>
        </div>

        {/* Приветствие */}
        <p className="text-gray-600 text-base mb-8 text-center">
          {t.login.welcome}
        </p>

        {/* Форма */}
        <div className="space-y-6">
          {/* Поле Email */}
          <div>
            <label className="block text-lg font-medium text-gray-900 mb-3">
              {t.login.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder={t.login.emailPlaceholder}
              className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          {/* Поле Пароль */}
          <div>
            <label className="block text-lg font-medium text-gray-900 mb-3">
              {t.login.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full border border-gray-300 rounded-lg p-4 pr-12 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-base">{error}</p>
            </div>
          )}

          {/* Чекбокс согласия */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="privacy"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              className="mt-1 mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="privacy" className="text-base text-gray-900">
              {t.login.privacyAgreement}{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                {t.login.privacyPolicy}
              </Link>
            </label>
          </div>

          {/* Кнопка Войти */}
          <button
            onClick={handleLogin}
            disabled={!isFormValid || loading}
            className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base font-medium"
          >
            {loading ? t.login.loggingIn : t.login.loginButton}
          </button>

          {/* Ссылка на регистрацию */}
          <p className="text-center text-base text-gray-600">
            {t.login.noAccount}{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              {t.login.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
