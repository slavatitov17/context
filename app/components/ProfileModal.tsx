'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPhoneNumber = (value: string) => {
    let numbers = value.replace(/\D/g, '');
    
    if (numbers.startsWith('8')) {
      numbers = '7' + numbers.substring(1);
    }
    
    if (numbers.length > 11) {
      numbers = numbers.substring(0, 11);
    }
    
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

  useEffect(() => {
    if (!isOpen) return;

    const loadUser = () => {
      const user = auth.getCurrentUser();
      if (user) {
        setEmail(user.email || '');
        
        const savedProfile = localStorage.getItem(`userProfile_${user.id}`);
        if (savedProfile) {
          try {
            const profile = JSON.parse(savedProfile);
            setFirstName(profile.firstName || '');
            setMiddleName(profile.middleName || '');
            setLastName(profile.lastName || '');
            setPhone(profile.phone || '');
            setBirthDate(profile.birthDate || '');
            setProfilePhoto(profile.photo || null);
          } catch {
            // Игнорируем ошибки парсинга
          }
        }
      }
    };
    
    loadUser();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

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
          birthDate !== (profile.birthDate || '') ||
          profilePhoto !== (profile.photo || null)
        );
      } catch {
        setHasChanges(true);
      }
    } else {
      setHasChanges(firstName !== '' || middleName !== '' || lastName !== '' || phone !== '' || birthDate !== '' || profilePhoto !== null);
    }
  }, [firstName, middleName, lastName, phone, birthDate, profilePhoto, isOpen]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfilePhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      photo: profilePhoto,
    };
    localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(profile));
    // Триггерим событие для обновления фото в LayoutWrapper
    window.dispatchEvent(new StorageEvent('storage', {
      key: `userProfile_${user.id}`,
      newValue: JSON.stringify(profile),
    }));
    setHasChanges(false);
    alert('Профиль успешно сохранен');
    onClose();
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      onClose();
      router.push('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
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
          <h2 className="text-xl font-medium text-gray-900">Мой профиль</h2>
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
          {/* Загрузка фото профиля */}
          <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
            <div className="flex-shrink-0">
              {profilePhoto ? (
                <div className="relative">
                  <img 
                    src={profilePhoto} 
                    alt="Фото профиля" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Удалить фото"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  <i className="fas fa-user-circle text-4xl text-gray-400"></i>
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-gray-900 font-medium mb-2">
                Фото профиля
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Загрузите ваше фото. Рекомендуемый размер: 200x200 пикселей. Максимальный размер файла: 5 МБ.
              </p>
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="profile-photo-input"
                />
                <label
                  htmlFor="profile-photo-input"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                >
                  <i className="fas fa-upload"></i>
                  {profilePhoto ? 'Изменить фото' : 'Загрузить фото'}
                </label>
                {profilePhoto && (
                  <button
                    onClick={handleRemovePhoto}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Личные данные */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Личные данные</h3>
            
            <div className="space-y-4">
              {/* Фамилия, Имя, Отчество в одну строку */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-900 font-medium mb-2">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Иванов"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 font-medium mb-2">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Иван"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 font-medium mb-2">
                    Отчество
                  </label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Иванович"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Дата рождения */}
              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  Дата рождения
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Эл. почта */}
              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  Эл. почта
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Телефон */}
              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (999) 123-45-67"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Кнопки сохранения и выхода */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
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
    </div>
  );
}

