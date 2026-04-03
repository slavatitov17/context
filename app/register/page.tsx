// Создаем страницу регистрации нового пользователя с валидацией формы и проверкой паролей
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/storage';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
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
  const isValidPassword = password.length >= 6;
  const isFormValid = isValidEmail && isValidPassword && privacyAgreed && firstName.trim().length > 0;

  const handleRegister = async () => {
    const trimmedFirstName = firstName.trim();
    // Очищаем email от пробелов
    const trimmedEmail = email.trim();

    if (!trimmedFirstName) {
      setError('Введите имя пользователя');
      return;
    }

    if (!trimmedEmail) {
      setError('Введите эл. почту');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError('Введите корректный email адрес (например: user@example.com)');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (!privacyAgreed) {
      setError('Необходимо согласиться с Политикой конфиденциальности');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { user, error: authError } = await auth.signUp(trimmedEmail, password);

      if (authError) {
        setError(authError.message || 'Ошибка при регистрации');
        setLoading(false);
        return;
      }

      if (user) {
        try {
          const existingProfileStr = localStorage.getItem(`userProfile_${user.id}`);
          const existingProfile = existingProfileStr ? JSON.parse(existingProfileStr) : {};
          const updatedProfile = {
            ...existingProfile,
            firstName: trimmedFirstName,
          };
          localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(updatedProfile));
        } catch {
          // игнорируем ошибки работы с профилем, чтобы не мешать регистрации
        }

        router.push('/projects');
        router.refresh();
      } else {
        setError('Не удалось создать пользователя. Попробуйте еще раз');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при регистрации. Попробуйте еще раз');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full relative">
      {/* Тост с ошибкой */}
      {error && (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-md transition ease-in duration-150">
            <span className="mt-0.5">
              <i className="fas fa-exclamation-circle"></i>
            </span>
            <span className="text-sm">{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700 transition-colors"
              aria-label="Закрыть уведомление"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
      <div className="w-full max-w-md">
        {/* Логотип и иконка Context */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <i className="fas fa-diagram-project text-4xl text-gray-900"></i>
          <h1 className="text-4xl font-medium text-gray-900">Context</h1>
        </div>

        {/* Приветствие */}
        <p className="text-gray-600 text-base mb-8 text-center">
          Создайте аккаунт для начала работы
        </p>

        {/* Форма */}
        <div className="space-y-6">
          {/* Поле Имя пользователя */}
          <div>
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Имя пользователя
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setError('');
              }}
              placeholder="Иван"
              className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          {/* Поле Email */}
          <div>
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Эл. почта
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="test@mail.ru"
              className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          {/* Поле Пароль */}
          <div>
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Пароль
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
                <i className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">Минимум 6 символов</p>
          </div>

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
              Я согласен с{' '}
              <Link href="/privacy?from=register" className="text-blue-600 hover:underline">
                Политикой конфиденциальности
              </Link>
            </label>
          </div>

          {/* Кнопка Зарегистрироваться */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base font-medium"
          >
            {loading ? 'Регистрация...' : 'Создать аккаунт'}
          </button>

          {/* Ссылка на вход */}
          <p className="text-center text-base text-gray-600">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
