// Создаем компонент кнопки "Назад" для навигации между страницами с автоматическим скрытием на страницах первого уровня
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Страницы первого уровня, где кнопка "Назад" не нужна
  const firstLevelPages = ['/projects', '/diagrams', '/editor', '/settings', '/about', '/profile', '/login', '/register'];

  // Если это страница первого уровня, не показываем кнопку
  if (firstLevelPages.includes(pathname)) {
    return null;
  }

  // Определяем путь для возврата
  const getBackPath = () => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Если это страница /privacy, возвращаемся на /login
    if (pathname === '/privacy') {
      return '/login';
    }
    
    // Если это страница редактирования (например, /diagrams/123/edit), возвращаемся на страницу объекта
    if (segments.length >= 3 && segments[2] === 'edit') {
      return `/${segments[0]}/${segments[1]}`;
    }
    
    // Если это страница с ID (например, /diagrams/123), возвращаемся на список
    if (segments.length >= 2 && segments[1] !== 'new') {
      return `/${segments[0]}`;
    }
    
    // Для страниц /new возвращаемся на список
    if (segments.length >= 2 && segments[1] === 'new') {
      return `/${segments[0]}`;
    }
    
    // По умолчанию возвращаемся назад в истории
    return null;
  };

  const backPath = getBackPath();

  const handleClick = (e: React.MouseEvent) => {
    if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  return (
    <nav className="mb-6" aria-label="Назад">
      {backPath ? (
        <Link
          href={backPath}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group relative"
        >
          <i className="fas fa-arrow-left text-sm"></i>
          <span className="relative z-10">Назад</span>
          {/* Подчеркивание при наведении */}
          <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
        </Link>
      ) : (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group relative"
        >
          <i className="fas fa-arrow-left text-sm"></i>
          <span className="relative z-10">Назад</span>
          {/* Подчеркивание при наведении */}
          <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
        </button>
      )}
    </nav>
  );
}
