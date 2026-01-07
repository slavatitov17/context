'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, type User } from '@/lib/storage';
import Breadcrumbs from './Breadcrumbs';
import ProfileModal from './ProfileModal';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPrivacyPage = pathname === '/privacy';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    // Управляем overflow на html для страниц авторизации
    if (isAuthPage) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }

    return () => {
      // Восстанавливаем overflow при размонтировании
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isAuthPage]);

  useEffect(() => {
    // Проверяем текущего пользователя
    const checkUser = () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser && auth.hasSession()) {
        setUser(currentUser);
        setUserEmail(currentUser.email || '');
        setIsAuthenticated(true);
        
        // Загружаем фото профиля
        const savedProfile = localStorage.getItem(`userProfile_${currentUser.id}`);
        if (savedProfile) {
          try {
            const profile = JSON.parse(savedProfile);
            setProfilePhoto(profile.photo || null);
          } catch {
            setProfilePhoto(null);
          }
        } else {
          setProfilePhoto(null);
        }
      } else {
        setUser(null);
        setUserEmail('');
        setIsAuthenticated(false);
        setProfilePhoto(null);
        if (!isAuthPage && !isPrivacyPage) {
          router.push('/login');
        }
      }
    };

    checkUser();

    // Слушаем изменения в localStorage (для синхронизации между вкладками)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'context_user' || e.key === 'context_session') {
        checkUser();
      } else if (e.key && e.key.startsWith('userProfile_')) {
        // Обновляем фото профиля при изменении
        const currentUser = auth.getCurrentUser();
        if (currentUser && e.key === `userProfile_${currentUser.id}`) {
          try {
            const profile = JSON.parse(e.newValue || '{}');
            setProfilePhoto(profile.photo || null);
          } catch {
            setProfilePhoto(null);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthPage, isPrivacyPage, router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserEmail('');
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  const getDisplayName = (email: string) => {
    if (!email) return '';
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email;
    return email.substring(0, atIndex);
  };

  // На страницах авторизации и privacy (для неавторизованных) всегда показываем контент
  if (isAuthPage || (isPrivacyPage && isAuthenticated === false)) {
    return (
      <body className="flex h-screen bg-white font-sans tracking-tight overflow-hidden" style={{ backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <main className={`flex-1 bg-white text-gray-900 ${isAuthPage ? 'overflow-hidden flex items-center justify-center' : 'overflow-auto p-8'}`} style={isAuthPage ? { height: '100vh', overflow: 'hidden' } : {}}>
          {children}
        </main>
      </body>
    );
  }

  // Для защищенных страниц ждем загрузки состояния аутентификации
  if (isAuthenticated === null) {
    return (
      <body className="flex h-screen bg-white font-sans tracking-tight" style={{ backgroundColor: '#ffffff' }}>
        <main className="flex-1 p-8 overflow-auto bg-white text-gray-900 flex items-center justify-center">
          <div className="text-gray-500">Загрузка...</div>
        </main>
      </body>
    );
  }

  // Если не авторизован, показываем пустой контент (редирект уже произошел)
  if (!isAuthenticated) {
    return (
      <body className="flex h-screen bg-white font-sans tracking-tight" style={{ backgroundColor: '#ffffff' }}>
        <main className="flex-1 p-8 overflow-auto bg-white text-gray-900">
          {/* Редирект в процессе */}
        </main>
      </body>
    );
  }

  return (
    <body className="flex h-screen bg-white font-sans tracking-tight" style={{ backgroundColor: '#ffffff' }}>
      {/* Боковое меню - показывается только если не страница авторизации и пользователь авторизован */}
      {!isAuthPage && isAuthenticated && (
        <aside className="fixed left-4 top-4 w-64 bg-gray-50 text-gray-800 p-6 rounded-lg border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
          <div className="mb-10 flex items-center gap-3">
            {/* Логотип - диаграмма с узлами (уменьшен) */}
            <i className="fas fa-diagram-project text-2xl text-gray-900"></i>
            <h1 className="text-3xl font-medium text-gray-900 cursor-default">
              Context
            </h1>
          </div>
          <nav className="space-y-3">
            <Link
              href="/projects"
              className="flex items-center py-3.5 px-4 rounded-xl text-gray-800 hover:bg-blue-600 hover:text-white transition-all duration-200 group"
            >
              <i className="fas fa-folder mr-3 text-gray-600 group-hover:text-white transition-colors"></i>
              <span className="font-medium">Проекты</span>
            </Link>
            <Link
              href="/diagrams"
              className="flex items-center py-3.5 px-4 rounded-xl text-gray-800 hover:bg-blue-600 hover:text-white transition-all duration-200 group"
            >
              <i className="fas fa-sitemap mr-3 text-gray-600 group-hover:text-white transition-colors"></i>
              <span className="font-medium">Диаграммы</span>
            </Link>
            <Link
              href="/editor"
              className="flex items-center py-3.5 px-4 rounded-xl text-gray-800 hover:bg-blue-600 hover:text-white transition-all duration-200 group"
            >
              <i className="fas fa-pen-ruler mr-3 text-gray-600 group-hover:text-white transition-colors"></i>
              <span className="font-medium">Редактор</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center py-3.5 px-4 rounded-xl text-gray-800 hover:bg-blue-600 hover:text-white transition-all duration-200 group"
            >
              <i className="fas fa-cog mr-3 text-gray-600 group-hover:text-white transition-colors"></i>
              <span className="font-medium">Настройки</span>
            </Link>
            <Link
              href="/about"
              className="flex items-center py-3.5 px-4 rounded-xl text-gray-800 hover:bg-blue-600 hover:text-white transition-all duration-200 group"
            >
              <i className="fas fa-info-circle mr-3 text-gray-600 group-hover:text-white transition-colors"></i>
              <span className="font-medium">О системе</span>
            </Link>
          </nav>

          {/* Блок профиля внизу */}
          <div className="mt-auto pt-6">
            <button 
              onClick={() => setShowProfileModal(true)}
              className="w-full flex items-center py-3.5 px-4 rounded-xl text-gray-800 hover:bg-blue-600 hover:text-white transition-all duration-200 group"
              title={userEmail}
            >
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Фото профиля" 
                  className="mr-3 w-7 h-7 rounded-full object-cover flex-shrink-0 border-2 border-gray-300 group-hover:border-white transition-colors"
                />
              ) : (
                <i className="fas fa-user-circle mr-3 text-gray-600 group-hover:text-white transition-colors text-xl flex-shrink-0"></i>
              )}
              <span className="flex-1 font-medium min-w-0 truncate text-left">
                {getDisplayName(userEmail)}
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* Основное пространство - БЕЛОЕ, с отступом под меню только если меню видно */}
      <main className={`flex-1 overflow-y-auto bg-white text-gray-900 ${!isAuthPage ? 'ml-[calc(16rem+1rem)]' : ''}`} style={{ paddingTop: '2.5rem', paddingBottom: '1rem', paddingLeft: '2rem', paddingRight: '2rem', height: '100vh', overflowY: 'auto' }}>
        {/* Хлебные крошки - показываются только на страницах не первого уровня, включая privacy для авторизованных */}
        {!isAuthPage && isAuthenticated && <Breadcrumbs />}
        {children}
      </main>
      
      {/* Модальное окно профиля */}
      {isAuthenticated && (
        <ProfileModal 
          isOpen={showProfileModal} 
          onClose={() => {
            setShowProfileModal(false);
            // Обновляем фото профиля после закрытия модального окна
            const currentUser = auth.getCurrentUser();
            if (currentUser) {
              const savedProfile = localStorage.getItem(`userProfile_${currentUser.id}`);
              if (savedProfile) {
                try {
                  const profile = JSON.parse(savedProfile);
                  setProfilePhoto(profile.photo || null);
                } catch {
                  setProfilePhoto(null);
                }
              } else {
                setProfilePhoto(null);
              }
            }
          }} 
        />
      )}
    </body>
  );
}
