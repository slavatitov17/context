'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/storage';

export default function ProfilePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Удаляем все нецифровые символы
    let numbers = value.replace(/\D/g, '');
    
    // Если начинается с 8, заменяем на 7
    if (numbers.startsWith('8')) {
      numbers = '7' + numbers.substring(1);
    }
    
    // Ограничиваем до 11 цифр
    if (numbers.length > 11) {
      numbers = numbers.substring(0, 11);
    }
    
    // Форматируем номер
    if (numbers.length === 0) {
      return '';
    } else if (numbers.length <= 1) {
      return `+${numbers}`;
    } else if (numbers.length <= 4) {
      return `+${numbers.substring(0, 1)} (${numbers.substring(1)}`;
    } else if (numbers.length <= 7) {
      return `+${numbers.substring(0, 1)} (${numbers.substring(1, 4)}) ${numbers.substring(4)}`;
    } else if (numbers.length <= 9) {
      return `+${numbers.substring(0, 1)} (${numbers.substring(1, 4)}) ${numbers.substring(4, 7)}-${numbers.substring(7)}`;
    } else {
      return `+${numbers.substring(0, 1)} (${numbers.substring(1, 4)}) ${numbers.substring(4, 7)}-${numbers.substring(7, 9)}-${numbers.substring(9)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const getDisplayName = (email: string) => {
    if (!email) return '';
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email;
    return email.substring(0, atIndex);
  };

  useEffect(() => {
    // Загружаем данные пользователя
    const loadUser = () => {
      const user = auth.getCurrentUser();
      if (user) {
        setEmail(user.email || '');
        
        // Загружаем сохраненные данные профиля для этого пользователя
        const savedProfile = localStorage.getItem(`userProfile_${user.id}`);
        if (savedProfile) {
          try {
            const profile = JSON.parse(savedProfile);
            setFirstName(profile.firstName || '');
            setMiddleName(profile.middleName || '');
            setLastName(profile.lastName || '');
            setPhone(profile.phone || '');
            setBirthDate(profile.birthDate || '');
          } catch {
            // Игнорируем ошибки парсинга
          }
        }
      } else {
        router.push('/login');
      }
    };
    
    loadUser();
  }, [router]);

  useEffect(() => {
    // Проверяем, есть ли изменения
    const user = auth.getCurrentUser();
    if (!user) return;
    
    const savedProfile = localStorage.getItem(`userProfile_${user.id}`);
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setHasChanges(
          firstName !== (profile.firstName || '') ||
          middleName !== (profile.middleName || '') ||
          lastName !== (profile.lastName || '') ||
          phone !== (profile.phone || '') ||
          birthDate !== (profile.birthDate || '')
        );
      } catch {
        setHasChanges(true);
      }
    } else {
      setHasChanges(firstName !== '' || middleName !== '' || lastName !== '' || phone !== '' || birthDate !== '');
    }
  }, [firstName, middleName, lastName, phone, birthDate]);

  const handleSave = () => {
    const user = auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    const profile = {
      firstName,
      middleName,
      lastName,
      phone,
      birthDate,
    };
    // Сохраняем профиль привязанным к конкретному пользователю
    localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(profile));
    setHasChanges(false);
    alert('Профиль успешно сохранен');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Верхний блок: заголовок, описание */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-medium mb-2">Мой профиль</h1>
        <p className="text-gray-600 text-base">
          Проверьте свои личные данные
        </p>
      </div>

      {/* Блок: Личные данные */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6">Личные данные</h2>
        
        <div className="space-y-6">
          {/* Фамилия, Имя, Отчество в одну строку */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Фамилия
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Иванов"
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
                placeholder="Иван"
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
                placeholder="Иванович"
                className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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

          {/* Эл. почта */}
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

          {/* Телефон */}
          <div>
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Телефон
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+7 (999) 123-45-67"
              className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Кнопки сохранения и выхода */}
        <div className="mt-12 flex items-center gap-4">
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
    </div>
  );
}

