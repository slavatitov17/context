// Создаем страницу списка проектов с фильтрацией, поиском, сортировкой и управлением папками
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, projects as projectsStorage, folders, type Project, type Folder, type FolderType } from '@/lib/storage';
import { useTheme } from '@/app/contexts/ThemeContext';

export default function ProjectsPage() {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabet' | 'date'>('date');
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const [foldersList, setFoldersList] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const modalWasOpenRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Проверяем текущего пользователя
    const checkUser = () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        const wasUserSet = !!user;
        setUser(currentUser);
        // Загружаем проекты только при первом рендере
        if (!initialLoadDoneRef.current && !wasUserSet) {
          initialLoadDoneRef.current = true;
          if (currentFolderId) {
            loadProjects(currentUser.id, currentFolderId, true);
          } else {
            loadProjects(currentUser.id, null, true);
          }
        }
      } else {
        setLoading(false);
        initialLoadDoneRef.current = false;
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

  // Загрузка папок при открытии модального окна (только при первом открытии)
  useEffect(() => {
    if (showMoveToFolderModal && user && !showCreateFolder) {
      // Сбрасываем selectedFolderId только при первом открытии модального окна
      if (!modalWasOpenRef.current) {
        const userFolders = folders.getAllByType(user.id, 'projects');
        setFoldersList(userFolders);
        setSelectedFolderId(null);
        setNewFolderName('');
        modalWasOpenRef.current = true;
      }
    } else if (!showMoveToFolderModal) {
      modalWasOpenRef.current = false;
    }
  }, [showMoveToFolderModal, user, showCreateFolder]);

  // Загрузка текущей папки и данных при изменении папки
  useEffect(() => {
    if (user && initialLoadDoneRef.current) {
      if (currentFolderId) {
        const folder = folders.getById(currentFolderId, user.id);
        setCurrentFolder(folder);
      } else {
        setCurrentFolder(null);
      }
      // Загружаем данные без показа loader'а при навигации по папкам
      loadProjects(user.id, currentFolderId, false);
    }
  }, [currentFolderId, user]);

  const loadProjects = (userId: string, folderId: string | null = null, showLoader: boolean = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      let userProjects = projectsStorage.getAll(userId);
      
      // Фильтруем по папке, если выбрана
      if (folderId) {
        userProjects = userProjects.filter(p => p.folder_id === folderId);
      } else {
        // Если папка не выбрана, показываем только элементы без папки
        userProjects = userProjects.filter(p => !p.folder_id);
      }
      
      // Сортируем по дате создания (новые первые)
      userProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProjects(userProjects);
    } catch (error) {
      console.error('Ошибка при загрузке проектов:', error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // Фильтрация и сортировка проектов и папок
  const filteredAndSortedItems = useMemo(() => {
    let filteredProjects = projects;
    let filteredFolders: Folder[] = [];

    // Загружаем папки только если мы в корне (currentFolderId === null)
    if (!currentFolderId && user) {
      filteredFolders = folders.getAllByType(user.id, 'projects');
    }

    // Фильтрация по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredProjects = filteredProjects.filter(project =>
        project.name.toLowerCase().includes(query)
      );
      filteredFolders = filteredFolders.filter(folder =>
        folder.name.toLowerCase().includes(query)
      );
    }

    // Сортировка
    const sortedProjects = [...filteredProjects];
    const sortedFolders = [...filteredFolders];
    
    if (sortBy === 'alphabet') {
      sortedProjects.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      sortedFolders.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else {
      sortedProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      sortedFolders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return { projects: sortedProjects, folders: sortedFolders };
  }, [projects, searchQuery, sortBy, currentFolderId, user]);

  const handleDelete = (projectId: string) => {
    if (!user) return;
    
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) {
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
      } else {
        alert('Не удалось удалить проект. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка при удалении проекта:', error);
      alert('Не удалось удалить проект. Попробуйте еще раз.');
    }
  };

  const handleBulkDelete = () => {
    if (!user || selectedProjects.size === 0) return;
    
    const count = selectedProjects.size;
    if (!confirm(`Вы уверены, что хотите удалить ${count} ${count === 1 ? 'проект' : count < 5 ? 'проекта' : 'проектов'}?`)) {
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
        alert(`Удалено ${successCount} из ${count} проектов.`);
      }
    } catch (error) {
      console.error('Ошибка при массовом удалении проектов:', error);
      alert('Произошла ошибка при удалении проектов.');
    }
  };

  const handleEdit = () => {
    if (selectedProjects.size !== 1 || !user) return;
    const projectId = Array.from(selectedProjects)[0];
    router.push(`/projects/${projectId}/edit`);
  };

  const handleMoveToFolder = () => {
    if (selectedProjects.size === 0 || !user) return;
    setShowMoveToFolderModal(true);
  };

  const handleCreateFolder = () => {
    if (!user || !newFolderName.trim()) return;
    
    try {
      const newFolder = folders.create({
        name: newFolderName.trim(),
        user_id: user.id,
        type: 'projects',
      });
      setFoldersList(prev => [...prev, newFolder]);
      setSelectedFolderId(newFolder.id);
      
      // Автоматически перемещаем выбранные проекты в созданную папку
      if (selectedProjects.size > 0) {
        let successCount = 0;
        selectedProjects.forEach(projectId => {
          const success = projectsStorage.update(projectId, user.id, { folder_id: newFolder.id });
          if (success) {
            successCount++;
          }
        });
        
        if (successCount > 0) {
          // Перезагружаем проекты после перемещения (без loader'а)
          if (currentFolderId) {
            loadProjects(user.id, currentFolderId, false);
          } else {
            loadProjects(user.id, null, false);
          }
          setSelectedProjects(new Set());
        }
      }
      
      setShowMoveToFolderModal(false);
      setShowCreateFolder(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Ошибка при создании папки:', error);
      alert('Не удалось создать папку. Попробуйте еще раз.');
    }
  };

  const handleMove = () => {
    if (selectedProjects.size === 0 || !user) return;
    
    try {
      let successCount = 0;
      selectedProjects.forEach(projectId => {
        const success = projectsStorage.update(projectId, user.id, { folder_id: selectedFolderId || null });
        if (success) {
          successCount++;
        }
      });

      if (successCount > 0) {
        // Перезагружаем проекты после перемещения (без loader'а)
        if (currentFolderId) {
          loadProjects(user.id, currentFolderId, false);
        } else {
          loadProjects(user.id, null, false);
        }
        setSelectedProjects(new Set());
        setShowMoveToFolderModal(false);
      }
    } catch (error) {
      console.error('Ошибка при перемещении проектов:', error);
      alert('Не удалось переместить проекты. Попробуйте еще раз.');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedProjects.size === 0 || !user) return;
    
    const count = selectedProjects.size;
    if (!confirm(`Вы уверены, что хотите удалить ${count} ${count === 1 ? 'проект' : count < 5 ? 'проекта' : 'проектов'}?`)) {
      return;
    }

    handleBulkDelete();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(new Set(filteredAndSortedItems.projects.map(p => p.id)));
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

  const hasProjects = (user && (projects.length > 0 || (!currentFolderId && folders.getAllByType(user.id, 'projects').length > 0))) || false;
  const allSelected = filteredAndSortedItems.projects.length > 0 && filteredAndSortedItems.projects.every(p => selectedProjects.has(p.id));
  const someSelected = selectedProjects.size > 0;

  return (
    <div>
      {/* Верхний блок: заголовок, описание и кнопка */}
      <div className={`flex items-start justify-between mb-8 pb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div>
          <h1 className={`text-3xl font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Проекты</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Загружайте документы и получайте ответы на вопросы по ним</p>
        </div>
        {hasProjects && (
          <Link href="/projects/new">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Создать проект
            </button>
          </Link>
        )}
      </div>

      {/* Контент: пустое состояние или таблица */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-medium flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {currentFolder ? (
                <>
                  <button
                    onClick={() => setCurrentFolderId(null)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    Мои проекты
                  </button>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>›</span>
                  <span>{currentFolder.name}</span>
                </>
              ) : (
                'Мои проекты'
              )}
            </h2>
          </div>
          
          {hasProjects && (
            <div className="flex items-center gap-4">
              {/* Поиск */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию..."
                  className={`border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400' : 'border-gray-300 text-gray-900'}`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <i className={`fas fa-search ${isDark ? 'text-gray-500' : 'text-gray-400'}`}></i>
                </div>
              </div>
              
              {/* Сортировка */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'alphabet' | 'date')}
                  className={`border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px] appearance-none pr-10 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="date">По дате создания</option>
                  <option value="alphabet">По алфавиту</option>
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
            <h3 className={`text-xl font-medium mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Проекты отсутствуют...
            </h3>
            <p className={`text-center max-w-md mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Создайте свой первый проект, загрузите документы и получите ответы на вопросы по ним
            </p>
            <Link href="/projects/new">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Создать проект
              </button>
            </Link>
          </div>
        ) : (
          /* Таблица проектов */
          <div>
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={handleEdit}
                disabled={selectedProjects.size !== 1}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-base ${
                  selectedProjects.size === 1
                    ? isDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-[#f9fafb] text-gray-900 hover:bg-gray-100'
                    : isDark ? 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed' : 'bg-[#f9fafb] text-gray-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <i className="far fa-edit"></i>
                <span>Редактировать</span>
              </button>
              <button
                onClick={handleMoveToFolder}
                disabled={selectedProjects.size === 0}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-base ${
                  selectedProjects.size > 0
                    ? isDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-[#f9fafb] text-gray-900 hover:bg-gray-100'
                    : isDark ? 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed' : 'bg-[#f9fafb] text-gray-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <i className="far fa-folder"></i>
                <span>Перенести в папку</span>
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedProjects.size === 0}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-base ${
                  selectedProjects.size > 0
                    ? isDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-[#f9fafb] text-gray-900 hover:bg-gray-100'
                    : isDark ? 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed' : 'bg-[#f9fafb] text-gray-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <i className="far fa-trash-alt"></i>
                <span>Удалить</span>
              </button>
            </div>
            
            <div className={`border rounded-lg overflow-x-auto overflow-y-visible ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <table className="w-full">
                <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`text-left py-4 px-6 font-medium w-12 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className={`text-left py-4 px-6 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Название</th>
                    <th className={`text-left py-4 px-6 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Краткое описание</th>
                    <th className={`text-left py-4 px-6 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Дата создания</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Отображение папок (только если мы в корне) */}
                  {!currentFolderId && filteredAndSortedItems.folders.map((folder) => (
                    <tr 
                      key={folder.id} 
                      className={`border-b transition-colors cursor-pointer ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}
                      onClick={() => {
                        setCurrentFolderId(folder.id);
                      }}
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className={`py-4 px-6 font-medium flex items-center gap-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        <i className="far fa-folder text-blue-600 text-xl"></i>
                        <span className="hover:text-blue-600 transition-colors">{folder.name}</span>
                      </td>
                      <td className={`py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span></span>
                      </td>
                      <td className={`py-4 px-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {formatDate(folder.created_at)}
                      </td>
                    </tr>
                  ))}
                  {/* Отображение проектов */}
                  {filteredAndSortedItems.projects.map((project) => (
                    <tr 
                      key={project.id} 
                      className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}
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
                      <td className={`py-4 px-6 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        <Link href={`/projects/${project.id}`} className="block w-full h-full hover:text-blue-600 transition-colors">
                          {project.name}
                        </Link>
                      </td>
                      <td className={`py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Link href={`/projects/${project.id}`} className="block w-full h-full">
                          {project.description || ''}
                        </Link>
                      </td>
                      <td className={`py-4 px-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        <Link href={`/projects/${project.id}`} className="block w-full h-full">
                          {formatDate(project.created_at)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно для перемещения в папку */}
      {showMoveToFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Блюр фон */}
          <div 
            className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}
            onClick={() => {
              if (!showCreateFolder) {
                setShowMoveToFolderModal(false);
                setShowCreateFolder(false);
                setNewFolderName('');
              }
            }}
          />
          
          {/* Модальное окно */}
          <div className={`relative rounded-xl p-6 max-w-lg w-full shadow-xl z-10 max-h-[90vh] flex flex-col ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {showCreateFolder ? 'Создание папки' : 'Перенести в папку'}
              </h2>
              {!showCreateFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoveToFolderModal(false);
                    setShowCreateFolder(false);
                    setNewFolderName('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {showCreateFolder ? (
              /* Режим создания папки */
              <>
                <div className="flex-1 mb-6">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Название папки"
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400' : 'border-gray-300 text-gray-900'}`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFolderName.trim()) {
                        handleCreateFolder();
                      } else if (e.key === 'Escape') {
                        setShowCreateFolder(false);
                        setNewFolderName('');
                      }
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreateFolder(false);
                      setNewFolderName('');
                    }}
                    className={`flex-1 px-6 py-3 border rounded-lg transition-colors font-medium ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Назад
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFolder();
                    }}
                    disabled={!newFolderName.trim()}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      newFolderName.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Создать папку
                  </button>
                </div>
              </>
            ) : (
              /* Обычный режим - список папок */
              <>
                <div className="flex-1 overflow-y-auto mb-6">
                  {foldersList.length === 0 ? (
                    <p className="text-gray-500 text-base">Папки отсутствуют</p>
                  ) : (
                    <div className="space-y-2">
                      {foldersList.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => setSelectedFolderId(folder.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ${
                            selectedFolderId === folder.id
                              ? isDark ? 'border-blue-600 bg-blue-900/30' : 'border-blue-600 bg-blue-50'
                              : isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <i className="far fa-folder text-blue-600 text-xl"></i>
                          <span className={`text-base ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{folder.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreateFolder(true);
                    }}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      foldersList.length === 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    Создать новую папку
                  </button>
                  <button
                    onClick={handleMove}
                    disabled={foldersList.length === 0 || (!selectedFolderId && foldersList.length > 0)}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      foldersList.length === 0
                        ? 'bg-white border border-gray-300 text-gray-400 opacity-50 cursor-not-allowed'
                        : selectedFolderId
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    Переместить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
