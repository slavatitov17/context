// Создаем модальное окно профиля пользователя с возможностью редактирования личных данных
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/storage';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
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
      alert(language === 'ru' ? 'Пожалуйста, выберите изображение' : 'Please select an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'ru' ? 'Размер файла не должен превышать 5 МБ' : 'File size must not exceed 5 MB');
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
    alert(language === 'ru' ? 'Профиль успешно сохранен' : 'Profile saved successfully');
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
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}
        onClick={onClose}
      />
      
      {/* Модальное окно */}
      <div className={`relative rounded-xl p-6 max-w-2xl w-full shadow-xl z-10 max-h-[90vh] overflow-y-auto hide-scrollbar ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('profile.title')}</h2>
          <button
            onClick={onClose}
            className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Загрузка фото профиля */}
          <div className={`flex items-center gap-6 pb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex-shrink-0">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Фото профиля" 
                  className={`w-24 h-24 rounded-full object-cover border-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                />
              ) : (
                <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                  <i className={`fas fa-user-circle text-4xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`}></i>
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('profile.photo')}
              </label>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('profile.photo.upload')}
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
                  <i className="fas fa-pencil-alt"></i>
                  {profilePhoto ? t('profile.photo.change') : t('profile.photo.uploadButton')}
                </label>
                {profilePhoto && (
                  <button
                    onClick={handleRemovePhoto}
                    className={`px-4 py-2 border rounded-lg transition-colors font-medium ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {t('profile.photo.remove')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Личные данные */}
          <div>
            <div className="space-y-4">
              {/* Фамилия, Имя, Отчество в одну строку */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {t('profile.lastName')}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={language === 'ru' ? 'Иванов' : 'Smith'}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div>
                  <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {t('profile.firstName')}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={language === 'ru' ? 'Иван' : 'John'}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div>
                  <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {t('profile.middleName')}
                  </label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder={language === 'ru' ? 'Иванович' : 'Michael'}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'border-gray-300 text-gray-900'}`}
                  />
                </div>
              </div>

              {/* Дата рождения */}
              <div>
                <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {t('profile.birthDate')}
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300 text-gray-900'}`}
                />
              </div>

              {/* Эл. почта */}
              <div>
                <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {t('profile.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className={`w-full border rounded-lg p-3 cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
                />
              </div>

              {/* Телефон */}
              <div>
                <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {t('profile.phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (999) 123-45-67"
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'border-gray-300 text-gray-900'}`}
                />
              </div>
            </div>
          </div>

          {/* Кнопки сохранения и выхода */}
          <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {t('profile.save')}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors font-medium"
            >
              <i className="fas fa-sign-out-alt"></i>
              {t('profile.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

