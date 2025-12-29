'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, type User } from '@/lib/storage';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/privacy';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Проверяем текущего пользователя
    const checkUser = () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser && auth.hasSession()) {
        setUser(currentUser);
        setUserEmail(currentUser.email || '');
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setUserEmail('');
        setIsAuthenticated(false);
        if (!isAuthPage) {
          router.push('/login');
        }
      }
    };

    checkUser();

    // Слушаем изменения в localStorage (для синхронизации между вкладками)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'context_user' || e.key === 'context_session') {
        checkUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthPage, router]);

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

  // На страницах авторизации всегда показываем контент
  if (isAuthPage) {
    return (
      <body className="flex h-screen bg-white font-sans tracking-tight" style={{ backgroundColor: '#ffffff' }}>
        <main className="flex-1 p-8 overflow-auto bg-white text-gray-900">
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
      {/* Боковое меню - показывается только если не страница авторизации */}
      {!isAuthPage && (
        <aside className="fixed left-4 top-4 w-64 bg-[#F6F8FA] text-gray-800 p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
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
            <Link 
              href="/profile" 
              className="flex items-center py-3.5 px-4 rounded-xl text-gray-800 hover:bg-blue-600 hover:text-white transition-all duration-200 group"
              title={userEmail}
            >
              <i className="fas fa-user-circle mr-3 text-gray-600 group-hover:text-white transition-colors text-xl flex-shrink-0"></i>
              <span className="flex-1 font-medium min-w-0 truncate">
                {getDisplayName(userEmail)}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="ml-2 text-red-500 group-hover:text-white transition-colors flex-shrink-0"
                title="Выйти из аккаунта"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </Link>
          </div>
        </aside>
      )}

      {/* Основное пространство - БЕЛОЕ, с отступом под меню только если меню видно */}
      <main className={`flex-1 p-8 overflow-auto bg-white text-gray-900 ${!isAuthPage ? 'ml-[calc(16rem+2rem)]' : ''}`}>
        {children}
      </main>
    </body>
  );
}
