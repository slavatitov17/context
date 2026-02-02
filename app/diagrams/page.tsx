// Создаем страницу списка диаграмм с фильтрацией, поиском, сортировкой и управлением папками
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, diagrams as diagramsStorage, folders, type Diagram, type DiagramType, type Folder, type FolderType } from '@/lib/storage';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';

// Объединенный тип для диаграмм
type UnifiedDiagram = Diagram & { source: 'catalog' };

export default function DiagramsPage() {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const [diagrams, setDiagrams] = useState<UnifiedDiagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedDiagrams, setSelectedDiagrams] = useState<Set<string>>(new Set());
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
        // Загружаем диаграммы только при первом рендере
        if (!initialLoadDoneRef.current && !wasUserSet) {
          initialLoadDoneRef.current = true;
          if (currentFolderId) {
            loadDiagrams(currentUser.id, currentFolderId, true);
          } else {
            loadDiagrams(currentUser.id, null, true);
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
        const userFolders = folders.getAllByType(user.id, 'diagrams');
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
      loadDiagrams(user.id, currentFolderId, false);
    }
  }, [currentFolderId, user]);

  const loadDiagrams = (userId: string, folderId: string | null = null, showLoader: boolean = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      // Загружаем обычные диаграммы
      let catalogDiagrams = diagramsStorage.getAll(userId).map(d => ({ ...d, source: 'catalog' as const }));
      
      // Фильтруем по папке, если выбрана
      if (folderId) {
        catalogDiagrams = catalogDiagrams.filter(d => d.folder_id === folderId);
      } else {
        // Если папка не выбрана, показываем только элементы без папки
        catalogDiagrams = catalogDiagrams.filter(d => !d.folder_id);
      }
      
      // Сортируем по дате создания (новые первые)
      const allDiagrams = catalogDiagrams.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setDiagrams(allDiagrams);
    } catch (error) {
      console.error('Ошибка при загрузке диаграмм:', error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // Фильтрация и сортировка диаграмм и папок
  const filteredAndSortedItems = useMemo(() => {
    let filteredDiagrams = diagrams;
    let filteredFolders: Folder[] = [];

    // Загружаем папки только если мы в корне (currentFolderId === null)
    if (!currentFolderId && user) {
      filteredFolders = folders.getAllByType(user.id, 'diagrams');
    }

    // Фильтрация по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredDiagrams = filteredDiagrams.filter(diagram =>
        diagram.name.toLowerCase().includes(query)
      );
      filteredFolders = filteredFolders.filter(folder =>
        folder.name.toLowerCase().includes(query)
      );
    }

    // Сортировка
    const sortedDiagrams = [...filteredDiagrams];
    const sortedFolders = [...filteredFolders];
    
    if (sortBy === 'alphabet') {
      sortedDiagrams.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      sortedFolders.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else {
      sortedDiagrams.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      sortedFolders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return { diagrams: sortedDiagrams, folders: sortedFolders };
  }, [diagrams, searchQuery, sortBy, currentFolderId, user]);

  const handleDelete = (diagramId: string) => {
    if (!user) return;
    
    if (!confirm(language === 'ru' ? 'Вы уверены, что хотите удалить эту диаграмму?' : 'Are you sure you want to delete this diagram?')) {
      return;
    }

    try {
      const success = diagramsStorage.delete(diagramId, user.id);
      if (success) {
        setDiagrams(diagrams.filter(d => d.id !== diagramId));
        setSelectedDiagrams(prev => {
          const newSet = new Set(prev);
          newSet.delete(diagramId);
          return newSet;
        });
      } else {
        alert(language === 'ru' ? 'Не удалось удалить диаграмму. Попробуйте еще раз.' : 'Failed to delete diagram. Please try again.');
      }
    } catch (error) {
      console.error('Ошибка при удалении диаграммы:', error);
      alert(language === 'ru' ? 'Не удалось удалить диаграмму. Попробуйте еще раз.' : 'Failed to delete diagram. Please try again.');
    }
  };

  const handleBulkDelete = () => {
    if (!user || selectedDiagrams.size === 0) return;
    
    const count = selectedDiagrams.size;
    const confirmText = language === 'ru' 
      ? `Вы уверены, что хотите удалить ${count} ${count === 1 ? 'диаграмму' : count < 5 ? 'диаграммы' : 'диаграмм'}?`
      : `Are you sure you want to delete ${count} ${count === 1 ? 'diagram' : 'diagrams'}?`;
    if (!confirm(confirmText)) {
      return;
    }

    try {
      let successCount = 0;
      selectedDiagrams.forEach(diagramId => {
        const success = diagramsStorage.delete(diagramId, user.id);
        if (success) {
          successCount++;
        }
      });

      if (successCount > 0) {
        setDiagrams(diagrams.filter(d => !selectedDiagrams.has(d.id)));
        setSelectedDiagrams(new Set());
      }

      if (successCount < count) {
        alert(language === 'ru' ? `Удалено ${successCount} из ${count} диаграмм.` : `Deleted ${successCount} of ${count} diagrams.`);
      }
    } catch (error) {
      console.error('Ошибка при массовом удалении диаграмм:', error);
      alert(language === 'ru' ? 'Произошла ошибка при удалении диаграмм.' : 'An error occurred while deleting diagrams.');
    }
  };

  const handleEdit = () => {
    if (selectedDiagrams.size !== 1 || !user) return;
    const diagramId = Array.from(selectedDiagrams)[0];
    router.push(`/diagrams/${diagramId}/edit`);
  };

  const handleMoveToFolder = () => {
    if (selectedDiagrams.size === 0 || !user) return;
    setShowMoveToFolderModal(true);
  };

  const handleCreateFolder = () => {
    if (!user || !newFolderName.trim()) return;
    
    try {
      const newFolder = folders.create({
        name: newFolderName.trim(),
        user_id: user.id,
        type: 'diagrams',
      });
      setFoldersList(prev => [...prev, newFolder]);
      setSelectedFolderId(newFolder.id);
      
      // Автоматически перемещаем выбранные диаграммы в созданную папку
      if (selectedDiagrams.size > 0) {
        let successCount = 0;
        selectedDiagrams.forEach(diagramId => {
          const success = diagramsStorage.update(diagramId, user.id, { folder_id: newFolder.id });
          if (success) {
            successCount++;
          }
        });
        
        if (successCount > 0) {
          // Перезагружаем диаграммы после перемещения (без loader'а)
          if (currentFolderId) {
            loadDiagrams(user.id, currentFolderId, false);
          } else {
            loadDiagrams(user.id, null, false);
          }
          setSelectedDiagrams(new Set());
        }
      }
      
      setShowMoveToFolderModal(false);
      setShowCreateFolder(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Ошибка при создании папки:', error);
      alert(language === 'ru' ? 'Не удалось создать папку. Попробуйте еще раз.' : 'Failed to create folder. Please try again.');
    }
  };

  const handleMove = () => {
    if (selectedDiagrams.size === 0 || !user) return;
    
    try {
      let successCount = 0;
      selectedDiagrams.forEach(diagramId => {
        const success = diagramsStorage.update(diagramId, user.id, { folder_id: selectedFolderId || null });
        if (success) {
          successCount++;
        }
      });

      if (successCount > 0) {
        // Перезагружаем диаграммы после перемещения (без loader'а)
        if (currentFolderId) {
          loadDiagrams(user.id, currentFolderId, false);
        } else {
          loadDiagrams(user.id, null, false);
        }
        setSelectedDiagrams(new Set());
        setShowMoveToFolderModal(false);
      }
    } catch (error) {
      console.error('Ошибка при перемещении диаграмм:', error);
      alert(language === 'ru' ? 'Не удалось переместить диаграммы. Попробуйте еще раз.' : 'Failed to move diagrams. Please try again.');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedDiagrams.size === 0 || !user) return;
    
    const count = selectedDiagrams.size;
    const confirmText = language === 'ru' 
      ? `Вы уверены, что хотите удалить ${count} ${count === 1 ? 'диаграмму' : count < 5 ? 'диаграммы' : 'диаграмм'}?`
      : `Are you sure you want to delete ${count} ${count === 1 ? 'diagram' : 'diagrams'}?`;
    if (!confirm(confirmText)) {
      return;
    }

    handleBulkDelete();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDiagrams(new Set(filteredAndSortedItems.diagrams.map(d => d.id)));
    } else {
      setSelectedDiagrams(new Set());
    }
  };

  const handleSelectDiagram = (diagramId: string, checked: boolean) => {
    setSelectedDiagrams(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(diagramId);
      } else {
        newSet.delete(diagramId);
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

  // Функция для получения названия типа диаграммы
  const getDiagramTypeName = (diagram: UnifiedDiagram): string => {
    const diagramType = (diagram as Diagram).diagramType;
    if (!diagramType) return '—';
    
    const typeNames: Record<DiagramType, string> = {
      'UseCase': 'Use Case',
      'UseCasePlantUML': 'Use Case',
      'Object': 'Object',
      'ObjectPlantUML': 'Object',
      'MindMap2': 'MindMap',
      'MindMapMax': 'MindMap',
      'MindMapPlantUML': 'MindMap',
      'Sequence2': 'Sequence',
      'SequencePlantUML': 'Sequence',
      'Class2': 'Class',
      'ClassPlantUML': 'Class',
      'State2': 'Statechart',
      'StatechartPlantUML': 'Statechart',
      'Activity2': 'Activity',
      'ActivityMax': 'Activity',
      'ActivityPlantUML': 'Activity',
      'ComponentPlantUML': 'Component',
      'DeploymentPlantUML': 'Deployment',
      'Gantt2': 'Gantt',
      'GanttPlantUML': 'Gantt',
      'ER2': 'Entity-Relationships',
      'ERPlantUML': 'Entity-Relationships',
      'WBSPlantUML': 'WBS',
      'JSONPlantUML': 'JSON',
      'Architecture': 'Architecture',
      'C4': 'C4',
      'Git': 'Git',
      'Kanban': 'Kanban',
      'Pie': 'Pie',
      'Quadrant': 'Quadrant',
      'Radar': 'Radar',
      'UserJourney': 'User Journey',
      'XY': 'XY',
    };
    
    return typeNames[diagramType] || '—';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('diagrams.loading')}</div>
      </div>
    );
  }

  const hasDiagrams = (user && (diagrams.length > 0 || (!currentFolderId && folders.getAllByType(user.id, 'diagrams').length > 0))) || false;
  const allSelected = filteredAndSortedItems.diagrams.length > 0 && filteredAndSortedItems.diagrams.every(d => selectedDiagrams.has(d.id));
  const someSelected = selectedDiagrams.size > 0;

  return (
    <div>
      {/* Верхний блок: заголовок, описание и кнопки — на мобильных в столбец */}
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8 pb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="min-w-0">
          <h1 className={`text-2xl sm:text-3xl font-medium mb-2 break-words ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('diagrams.title')}</h1>
          <p className={`text-sm sm:text-base break-words ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('diagrams.description')}</p>
        </div>
        {hasDiagrams && (
          <div className="flex-shrink-0">
            <Link href="/diagrams/new">
              <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                {t('diagrams.selectType')}
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Контент: пустое состояние или таблица */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="min-w-0">
            <h2 className={`text-xl sm:text-2xl font-medium flex flex-wrap items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {currentFolder ? (
                <>
                  <button
                    onClick={() => setCurrentFolderId(null)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    {t('diagrams.myDiagrams')}
                  </button>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>›</span>
                  <span className="break-words">{currentFolder.name}</span>
                </>
              ) : (
                t('diagrams.myDiagrams')
              )}
            </h2>
          </div>
          
          {hasDiagrams && (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:gap-4">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('diagrams.search')}
                  className={`border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400' : 'border-gray-300 text-gray-900'}`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <i className={`fas fa-search ${isDark ? 'text-gray-500' : 'text-gray-400'}`}></i>
                </div>
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'alphabet' | 'date')}
                  className={`border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:min-w-[160px] appearance-none pr-10 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="date">{t('diagrams.sort.date')}</option>
                  <option value="alphabet">{t('diagrams.sort.alphabet')}</option>
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
        
        {!hasDiagrams ? (
          /* Пустое состояние */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6">
              <i className="fas fa-sitemap text-6xl text-gray-400"></i>
            </div>
            <h3 className={`text-xl font-medium mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('diagrams.empty.title')}
            </h3>
            <p className={`text-center max-w-md mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('diagrams.empty.description')}
            </p>
            <div className="flex gap-3">
              <Link href="/diagrams/new">
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  {t('diagrams.selectType')}
                </button>
              </Link>
            </div>
          </div>
        ) : (
          /* Таблица диаграмм */
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={handleEdit}
                disabled={selectedDiagrams.size !== 1}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm sm:text-base ${
                  selectedDiagrams.size === 1
                    ? isDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-[#f9fafb] text-gray-900 hover:bg-gray-100'
                    : isDark ? 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed' : 'bg-[#f9fafb] text-gray-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <i className="far fa-edit"></i>
                <span>{t('diagrams.edit')}</span>
              </button>
              <button
                onClick={handleMoveToFolder}
                disabled={selectedDiagrams.size === 0}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm sm:text-base ${
                  selectedDiagrams.size > 0
                    ? isDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-[#f9fafb] text-gray-900 hover:bg-gray-100'
                    : isDark ? 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed' : 'bg-[#f9fafb] text-gray-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <i className="far fa-folder"></i>
                <span>{t('diagrams.move')}</span>
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedDiagrams.size === 0}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm sm:text-base ${
                  selectedDiagrams.size > 0
                    ? isDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-[#f9fafb] text-gray-900 hover:bg-gray-100'
                    : isDark ? 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed' : 'bg-[#f9fafb] text-gray-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <i className="far fa-trash-alt"></i>
                <span>{t('diagrams.delete')}</span>
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
                    <th className={`text-left py-4 px-6 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('diagrams.table.name')}</th>
                    <th className={`text-left py-4 px-6 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('diagrams.table.type')}</th>
                    <th className={`text-left py-4 px-6 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('diagrams.table.date')}</th>
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
                  {/* Отображение диаграмм */}
                  {filteredAndSortedItems.diagrams.map((diagram) => (
                    <tr 
                      key={diagram.id} 
                      className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedDiagrams.has(diagram.id)}
                          onChange={(e) => handleSelectDiagram(diagram.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className={`py-4 px-6 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        <Link href={`/diagrams/${diagram.id}`} className="block w-full h-full hover:text-blue-600 transition-colors">
                          {diagram.name}
                        </Link>
                      </td>
                      <td className={`py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Link href={`/diagrams/${diagram.id}`} className="block w-full h-full">
                          {getDiagramTypeName(diagram)}
                        </Link>
                      </td>
                      <td className={`py-4 px-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        <Link href={`/diagrams/${diagram.id}`} className="block w-full h-full">
                          {formatDate(diagram.created_at)}
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
                {showCreateFolder ? t('diagrams.folder.create') : t('diagrams.folder.move')}
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
                    placeholder={t('diagrams.folder.name')}
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
                    {t('diagrams.folder.back')}
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
                    {t('diagrams.folder.createButton')}
                  </button>
                </div>
              </>
            ) : (
              /* Обычный режим - список папок */
              <>
                <div className="flex-1 overflow-y-auto mb-6">
                  {foldersList.length === 0 ? (
                    <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('diagrams.folder.empty')}</p>
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
                    {t('diagrams.folder.createNew')}
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
                    {t('diagrams.folder.moveButton')}
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
