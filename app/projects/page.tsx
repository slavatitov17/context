'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, projects as projectsStorage, type Project } from '@/lib/storage';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function ProjectsPage() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabet' | 'date'>('date');
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

  // Фильтрация и сортировка проектов
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    // Фильтрация по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query)
      );
    }

    // Сортировка
    const sorted = [...filtered];
    if (sortBy === 'alphabet') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return sorted;
  }, [projects, searchQuery, sortBy]);

  const handleDelete = (projectId: string) => {
    if (!user) return;
    
    if (!confirm(t.projects.confirmDelete)) {
      return;
    }

    try {
      const success = projectsStorage.delete(projectId, user.id);
      if (success) {
        setProjects(projects.filter(p => p.id !== projectId));
        setSelectedProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
        setOpenMenuId(null);
      } else {
        alert(t.projects.deleteFailed);
      }
    } catch (error) {
      console.error('Ошибка при удалении проекта:', error);
      alert('Не удалось удалить проект. Попробуйте еще раз.');
    }
  };

  const handleBulkDelete = () => {
    if (!user || selectedProjects.size === 0) return;
    
    const count = selectedProjects.size;
    if (!confirm(t.projects.confirmDelete)) {
      return;
    }

    try {
      let successCount = 0;
      selectedProjects.forEach(projectId => {
        const success = projectsStorage.delete(projectId, user.id);
        if (success) {
          successCount++;
        }
      });

      if (successCount > 0) {
        setProjects(projects.filter(p => !selectedProjects.has(p.id)));
        setSelectedProjects(new Set());
      }

      if (successCount < count) {
        alert(t.projects.bulkDeleteSuccess.replace('{count}', successCount.toString()).replace('{total}', count.toString()));
      }
    } catch (error) {
      console.error('Ошибка при массовом удалении проектов:', error);
      alert(t.projects.bulkDeleteFailed);
    }
  };

  const handleEdit = (projectId: string) => {
    setOpenMenuId(null);
    router.push(`/projects/${projectId}/edit`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(new Set(filteredAndSortedProjects.map(p => p.id)));
    } else {
      setSelectedProjects(new Set());
    }
  };

  const handleSelectProject = (projectId: string, checked: boolean) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(projectId);
      } else {
        newSet.delete(projectId);
      }
      return newSet;
    });
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
  const allSelected = filteredAndSortedProjects.length > 0 && filteredAndSortedProjects.every(p => selectedProjects.has(p.id));
  const someSelected = selectedProjects.size > 0;

  return (
    <div>
      {/* Верхний блок: заголовок, описание и кнопка */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-medium mb-2">{t.projects.title}</h1>
          <p className="text-gray-600">{t.projects.description}</p>
        </div>
        {hasProjects && (
          <Link href="/projects/new">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              {t.projects.createProject}
            </button>
          </Link>
        )}
      </div>

      {/* Контент: пустое состояние или таблица */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium">{t.projects.myProjects}</h2>
          
          {hasProjects && (
            <div className="flex items-center gap-4">
              {/* Поиск */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.projects.searchPlaceholder}
                  className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
              </div>
              
              {/* Сортировка */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'alphabet' | 'date')}
                  className="border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px] appearance-none pr-10 bg-white"
                >
                  <option value="date">{t.projects.sortByDate}</option>
                  <option value="alphabet">{t.projects.sortByAlphabet}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {!hasProjects ? (
          /* Пустое состояние */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6">
              <i className="fas fa-folder-plus text-6xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              {t.projects.noProjects}
            </h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              {t.projects.noProjectsDescription}
            </p>
            <Link href="/projects/new">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                {t.projects.createProject}
              </button>
            </Link>
          </div>
        ) : (
          /* Таблица проектов */
          <div>
            {someSelected && (
              <div className="mb-4 flex items-center gap-4">
                  <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <i className="fas fa-trash"></i>
                  <span>{t.projects.deleteSelected} ({selectedProjects.size})</span>
                </button>
              </div>
            )}
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-900 w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">{t.projects.name}</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">{t.projects.shortDescription}</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">{t.projects.creationDate}</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedProjects.map((project) => (
                    <tr 
                      key={project.id} 
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedProjects.has(project.id)}
                          onChange={(e) => handleSelectProject(project.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
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
                                <span className="text-sm">{t.common.edit}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(project.id);
                                }}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 transition-all duration-150 flex items-center gap-2 rounded"
                                title={t.common.delete}
                              >
                                <i className="fas fa-trash text-red-600 text-sm"></i>
                                <span className="text-sm">{t.common.delete}</span>
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
          </div>
        )}
      </div>
    </div>
  );
}
