'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { projects as projectsStorage, diagrams as diagramsStorage } from '@/lib/storage';
import { auth } from '@/lib/storage';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Страницы первого уровня, где хлебные крошки не нужны
  const firstLevelPages = ['/projects', '/diagrams', '/settings', '/about', '/profile'];

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      // Если это страница первого уровня, не показываем хлебные крошки
      if (firstLevelPages.includes(pathname)) {
        setBreadcrumbs([]);
        setIsLoading(false);
        return;
      }

      const segments = pathname.split('/').filter(Boolean);
      const items: BreadcrumbItem[] = [];

      // Добавляем корневой элемент (если не на главной)
      if (segments.length > 0) {
        // Определяем тип страницы (projects или diagrams)
        if (segments[0] === 'projects') {
          items.push({ label: 'Проекты', href: '/projects' });
        } else if (segments[0] === 'diagrams') {
          items.push({ label: 'Диаграммы', href: '/diagrams' });
        }

        // Обрабатываем остальные сегменты
        if (segments.length > 1) {
          if (segments[1] === 'new') {
            // Страница создания
            if (segments[0] === 'projects') {
              items.push({ label: 'Создание проекта', href: '/projects/new' });
            } else if (segments[0] === 'diagrams') {
              items.push({ label: 'Создание диаграммы', href: '/diagrams/new' });
            }
          } else if (segments[1] && segments[1] !== 'new') {
            // Страница с ID (детальная страница или редактирование)
            const id = segments[1];
            const currentUser = auth.getCurrentUser();
            
            if (currentUser) {
              try {
                if (segments[0] === 'projects') {
                  const project = projectsStorage.getById(id, currentUser.id);
                  if (project) {
                    items.push({ 
                      label: project.name || 'Проект', 
                      href: `/projects/${id}` 
                    });
                  } else {
                    items.push({ label: 'Проект', href: `/projects/${id}` });
                  }
                } else if (segments[0] === 'diagrams') {
                  const diagram = diagramsStorage.getById(id, currentUser.id);
                  if (diagram) {
                    items.push({ 
                      label: diagram.name || 'Диаграмма', 
                      href: `/diagrams/${id}` 
                    });
                  } else {
                    items.push({ label: 'Диаграмма', href: `/diagrams/${id}` });
                  }
                }
              } catch (error) {
                console.error('Ошибка при загрузке данных для хлебных крошек:', error);
                // Используем дефолтные значения
                if (segments[0] === 'projects') {
                  items.push({ label: 'Проект', href: `/projects/${id}` });
                } else if (segments[0] === 'diagrams') {
                  items.push({ label: 'Диаграмма', href: `/diagrams/${id}` });
                }
              }
            } else {
              // Если пользователь не загружен, используем дефолтные значения
              if (segments[0] === 'projects') {
                items.push({ label: 'Проект', href: `/projects/${id}` });
              } else if (segments[0] === 'diagrams') {
                items.push({ label: 'Диаграмма', href: `/diagrams/${id}` });
              }
            }

            // Если есть третий сегмент (например, edit)
            if (segments.length > 2 && segments[2] === 'edit') {
              items.push({ label: 'Редактирование', href: `${pathname}` });
            }
          }
        }
      }

      setBreadcrumbs(items);
      setIsLoading(false);
    };

    generateBreadcrumbs();
  }, [pathname]);

  // Не показываем хлебные крошки на страницах первого уровня или если они пустые
  if (firstLevelPages.includes(pathname) || breadcrumbs.length === 0 || isLoading) {
    return null;
  }

  return (
    <nav className="mb-6" aria-label="Хлебные крошки">
      <ol className="flex items-center gap-2 flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={item.href} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-gray-400 mx-1 select-none" aria-hidden="true">
                  <i className="fas fa-chevron-right text-xs"></i>
                </span>
              )}
              {isLast ? (
                <span 
                  className="text-gray-900 font-medium text-sm px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 transition-all duration-200"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-blue-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group relative"
                >
                  <span className="relative z-10">{item.label}</span>
                  {/* Подчеркивание при наведении */}
                  <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

