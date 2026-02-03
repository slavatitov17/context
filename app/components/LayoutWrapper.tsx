// Создаем обертку для layout приложения с навигацией, модальными окнами и управлением аутентификацией
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, type User } from '@/lib/storage';
import BackButton from './BackButton';
import ProfileModal from './ProfileModal';
import AboutModal from './AboutModal';
import SettingsModal from './SettingsModal';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPrivacyPage = pathname === '/privacy';
  const isEditorPage = pathname?.startsWith('/editor/') && pathname?.includes('/edit') && !pathname?.includes('/new');
  const isDiagramTypeCatalog = pathname?.startsWith('/diagrams/') && !pathname?.includes('/edit') && !pathname?.includes('/new');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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
          router.push('/register');
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
          <div className="text-gray-500">{t('common.loading')}</div>
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

  const sidebarContent = (
    <>
      <div className="mb-10 flex items-center gap-3">
        <i className={`fas fa-diagram-project text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}></i>
        <h1 className={`text-3xl font-medium cursor-default ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Context
        </h1>
      </div>
      <nav className="space-y-3">
        <Link href="/projects" className={`flex items-center py-3.5 px-4 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200 group ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          <i className={`fas fa-folder mr-3 group-hover:text-white transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
          <span className="font-medium">{t('sidebar.projects')}</span>
        </Link>
        <Link href="/diagrams" className={`flex items-center py-3.5 px-4 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200 group ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          <i className={`fas fa-sitemap mr-3 group-hover:text-white transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
          <span className="font-medium">{t('sidebar.diagrams')}</span>
        </Link>
        <button onClick={() => setShowSettingsModal(true)} className={`w-full flex items-center py-3.5 px-4 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200 group ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          <i className={`fas fa-cog mr-3 group-hover:text-white transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
          <span className="font-medium">{t('sidebar.settings')}</span>
        </button>
        <button onClick={() => setShowAboutModal(true)} data-about-button className={`w-full flex items-center py-3.5 px-4 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200 group ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          <i className={`fas fa-info-circle mr-3 group-hover:text-white transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
          <span className="font-medium">{t('sidebar.about')}</span>
        </button>
      </nav>
      <div className="mt-auto pt-6">
        <button onClick={() => setShowProfileModal(true)} className={`w-full flex items-center py-3.5 px-4 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200 group ${isDark ? 'text-gray-100' : 'text-gray-800'}`} title={userEmail}>
          {profilePhoto ? (
            <img src={profilePhoto} alt="Фото профиля" className={`mr-3 w-7 h-7 rounded-full object-cover flex-shrink-0 border-2 group-hover:border-white transition-colors ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />
          ) : (
            <i className={`fas fa-user-circle mr-3 group-hover:text-white transition-colors text-xl flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
          )}
          <span className="flex-1 font-medium min-w-0 truncate text-left">{getDisplayName(userEmail)}</span>
        </button>
      </div>
    </>
  );

  return (
    <body className={`flex h-screen font-sans tracking-tight ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`} style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}>
      {/* Боковое меню: только на десктопе (md+) */}
      {!isAuthPage && !isEditorPage && isAuthenticated && (
        <aside
          className={`hidden md:flex fixed left-4 top-4 z-40 w-64 h-[calc(100vh-2rem)] p-6 rounded-lg border flex-col ${isDark ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-gray-50 text-gray-800 border-gray-200'}`}
        >
          {sidebarContent}
        </aside>
      )}

      {/* Основное пространство: на мобильных — отступ снизу под нижнее меню */}
      <main
        className={`flex-1 overflow-y-auto ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} ${!isAuthPage && !isEditorPage ? 'ml-0 md:ml-[calc(16rem+1rem)]' : ''} ${isDiagramTypeCatalog ? 'hide-scrollbar' : ''} ${!isEditorPage ? 'px-4 pt-4 pb-24 md:px-8 md:pt-10 md:pb-4' : ''}`}
        style={{ height: '100vh', overflowY: isEditorPage ? 'hidden' : 'auto' }}
      >
        {/* Мобильная шапка: логотип (ссылка на Проекты) слева, аватар (профиль) справа */}
        {!isAuthPage && !isEditorPage && isAuthenticated && (
          <div className="flex items-center justify-between gap-3 mb-4 md:hidden">
            <Link href="/projects" className="flex items-center gap-3 min-w-0">
              <i className={`fas fa-diagram-project text-xl flex-shrink-0 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} />
              <span className={`text-lg font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Context</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className={`flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
              style={{ width: 40, height: 40 }}
              aria-label={t('profile.title')}
              title={userEmail}
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <i className={`fas fa-user-circle text-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              )}
            </button>
          </div>
        )}
        {!isAuthPage && !isEditorPage && !isPrivacyPage && isAuthenticated && <BackButton />}
        {children}
      </main>

      {/* Нижнее фиксированное меню — только на мобильных */}
      {!isAuthPage && !isEditorPage && isAuthenticated && (
        <nav
          className={`fixed bottom-0 left-0 right-0 z-40 border-t md:hidden flex items-stretch justify-around py-2 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
          aria-label="Основное меню"
        >
          <Link href="/projects" className={`flex flex-col items-center justify-center flex-1 py-1 min-w-0 ${pathname === '/projects' ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
            <i className="fas fa-folder text-lg mb-0.5" />
            <span className="text-xs font-medium truncate max-w-full">{t('sidebar.projects')}</span>
          </Link>
          <Link href="/diagrams" className={`flex flex-col items-center justify-center flex-1 py-1 min-w-0 ${pathname?.startsWith('/diagrams') ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
            <i className="fas fa-sitemap text-lg mb-0.5" />
            <span className="text-xs font-medium truncate max-w-full">{t('sidebar.diagrams')}</span>
          </Link>
          <button type="button" onClick={() => setShowSettingsModal(true)} className={`flex flex-col items-center justify-center flex-1 py-1 min-w-0 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className="fas fa-cog text-lg mb-0.5" />
            <span className="text-xs font-medium">{t('sidebar.settings')}</span>
          </button>
          <button type="button" onClick={() => setShowAboutModal(true)} data-about-button className={`flex flex-col items-center justify-center flex-1 py-1 min-w-0 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className="fas fa-info-circle text-lg mb-0.5" />
            <span className="text-xs font-medium">{t('sidebar.about')}</span>
          </button>
        </nav>
      )}
      
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
      
      {/* Модальное окно "О системе" */}
      {isAuthenticated && (
        <AboutModal 
          isOpen={showAboutModal} 
          onClose={() => setShowAboutModal(false)} 
        />
      )}
      
      {/* Модальное окно "Настройки" */}
      {isAuthenticated && (
        <SettingsModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)} 
        />
      )}
    </body>
  );
}
