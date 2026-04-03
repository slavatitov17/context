// Создаем страницу входа пользователя с валидацией формы и аутентификацией
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/storage';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Улучшенная валидация email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email.trim());
  const isValidPassword = password.length > 0;
  const isFormValid = isValidEmail && isValidPassword;

  const handleLogin = async () => {
    // Очищаем email от пробелов
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Заполните все поля');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError('Введите корректный email адрес (например: user@example.com)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { user, error: authError } = await auth.signIn(trimmedEmail, password);

      if (authError) {
        setError(authError.message || 'Ошибка при входе. Проверьте email и пароль');
        setLoading(false);
        return;
      }

      if (user) {
        router.push('/projects');
        router.refresh();
      } else {
        setError('Не удалось войти. Попробуйте еще раз');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при входе. Попробуйте еще раз');
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
          Войдите в систему для продолжения работы
        </p>

        {/* Форма */}
        <div className="space-y-6">
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
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-base">{error}</p>
            </div>
          )}

          {/* Кнопка Войти */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base font-medium"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          {/* Ссылка на регистрацию */}
          <p className="text-center text-base text-gray-600">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
