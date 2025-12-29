'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, projects as projectsStorage, type Project } from '@/lib/storage';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Проверяем текущего пользователя
    const checkUser = () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        loadProjects(currentUser.id);
      } else {
        setLoading(false);
        router.push('/login');
      }
    };

    checkUser();

    // Проверяем изменения каждую секунду
    const interval = setInterval(checkUser, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [router]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProjects = (userId: string) => {
    try {
      setLoading(true);
      const userProjects = projectsStorage.getAll(userId);
      // Сортируем по дате создания (новые первые)
      userProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProjects(userProjects);
    } catch (error) {
      console.error('Ошибка при загрузке проектов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (projectId: string) => {
    if (!user) return;
    
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) {
      return;
    }

    try {
      const success = projectsStorage.delete(projectId, user.id);
      if (success) {
        setProjects(projects.filter(p => p.id !== projectId));
        setOpenMenuId(null);
      } else {
        alert('Не удалось удалить проект. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка при удалении проекта:', error);
      alert('Не удалось удалить проект. Попробуйте еще раз.');
    }
  };

  const handleEdit = (projectId: string) => {
    setOpenMenuId(null);
    router.push(`/projects/${projectId}/edit`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  const hasProjects = projects.length > 0;

  return (
    <div>
      {/* Верхний блок: заголовок, описание и кнопка */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-medium mb-2">Проекты</h1>
          <p className="text-gray-600">Создавайте проекты и получайте ответы на вопросы по ним</p>
        </div>
        {hasProjects && (
          <Link href="/projects/new">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              + Создать проект
            </button>
          </Link>
        )}
      </div>

      {/* Контент: пустое состояние или таблица */}
      <div>
        <h2 className="text-2xl font-medium mb-6">Мои проекты</h2>
        
        {!hasProjects ? (
          /* Пустое состояние */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6">
              <i className="fas fa-folder-plus text-6xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              Проекты отсутствуют...
            </h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Создайте свой первый проект, загрузите файлы и получите ответы на вопросы по ним
            </p>
            <Link href="/projects/new">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Создать проект
              </button>
            </Link>
          </div>
        ) : (
          /* Таблица проектов */
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Название</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Краткое описание</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Дата создания</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr 
                    key={project.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-gray-900 font-medium">
                      <Link href={`/projects/${project.id}`} className="block w-full h-full hover:text-blue-600 transition-colors">
                        {project.name}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      <Link href={`/projects/${project.id}`} className="block w-full h-full">
                        {project.description || ''}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      <Link href={`/projects/${project.id}`} className="block w-full h-full">
                        {formatDate(project.created_at)}
                      </Link>
                    </td>
                    <td className="py-4 px-6 relative">
                      <div className="relative" ref={openMenuId === project.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === project.id ? null : project.id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-105"
                          title="Действия"
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                        
                        {openMenuId === project.id && (
                          <div className="absolute right-full top-0 mr-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 px-1 transition-all duration-200 flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(project.id);
                              }}
                              className="px-3 py-2 text-gray-700 hover:bg-gray-50 transition-all duration-150 flex items-center gap-2 rounded"
                              title="Редактировать"
                            >
                              <i className="fas fa-edit text-gray-500 text-sm"></i>
                              <span className="text-sm">Редактировать</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(project.id);
                              }}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 transition-all duration-150 flex items-center gap-2 rounded"
                              title="Удалить"
                            >
                              <i className="fas fa-trash text-red-600 text-sm"></i>
                              <span className="text-sm">Удалить</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
