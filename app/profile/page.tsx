'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function ProfilePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Загружаем данные пользователя из хранилища
    const savedEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '';
    setEmail(savedEmail);
    
    // Загружаем сохраненные данные профиля (если есть)
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setFirstName(profile.firstName || '');
      setMiddleName(profile.middleName || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
      setBirthDate(profile.birthDate || '');
    }
  }, []);

  useEffect(() => {
    // Проверяем, есть ли изменения
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setHasChanges(
        firstName !== (profile.firstName || '') ||
        middleName !== (profile.middleName || '') ||
        lastName !== (profile.lastName || '') ||
        phone !== (profile.phone || '') ||
        birthDate !== (profile.birthDate || '')
      );
    } else {
      setHasChanges(firstName !== '' || middleName !== '' || lastName !== '' || phone !== '' || birthDate !== '');
    }
  }, [firstName, middleName, lastName, phone, birthDate]);

  const handleSave = () => {
    const profile = {
      firstName,
      middleName,
      lastName,
      phone,
      birthDate,
    };
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setHasChanges(false);
    alert('Профиль успешно сохранен');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Редирект произойдет автоматически через LayoutWrapper
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  return (
    <div>
      {/* Верхний блок: заголовок, описание */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-medium mb-2">Мой профиль</h1>
        <p className="text-gray-600 text-base">
          Проверьте свои личные данные
        </p>
      </div>

      <div className="space-y-6">
        {/* Блок 1: Основная информация */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-6">Основная информация</h2>
          
          <div className="space-y-6">
            {/* Фамилия, Имя и Отчество */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-3">
                  Фамилия
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Введите вашу фамилию"
                  className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-3">
                  Имя
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Введите ваше имя"
                  className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-3">
                  Отчество
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Введите ваше отчество"
                  className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email (только для чтения) */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Эл. почта
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full border border-gray-300 rounded-lg p-4 text-base bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Блок 2: Контактная информация */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-6">Контактная информация</h2>
          
          <div className="space-y-6">
            {/* Телефон */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Телефон
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Дата рождения */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Дата рождения
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки сохранения и выхода */}
      <div className="mt-12 flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Сохранить изменения
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors font-medium"
        >
          <i className="fas fa-sign-out-alt"></i>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

