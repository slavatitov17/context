'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { auth, projects as projectsStorage, diagrams as diagramsStorage, type Project, type Diagram, type DiagramType } from '@/lib/storage';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}

export default function DiagramDetailPage({ params }: { params: { id: string } }) {
  const routeParams = useParams();
  const diagramId = routeParams?.id as string;
  const [diagramData, setDiagramData] = useState<Diagram | null>(null);
  const [selectedOption, setSelectedOption] = useState<'projects' | 'scratch' | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedProjectData, setSelectedProjectData] = useState<Project | null>(null);
  const [diagramType, setDiagramType] = useState<DiagramType | null>(null);
  const [showDiagram, setShowDiagram] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; type?: 'diagram' | 'table' | 'code'; plantUmlCode?: string; diagramImageUrl?: string; glossary?: Array<{ element: string; description: string }>; timestamp?: Date }>>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка диаграммы
  useEffect(() => {
    const loadDiagram = () => {
      if (!diagramId) return;

      try {
        setLoading(true);
        
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Загружаем диаграмму
        const diagram = diagramsStorage.getById(diagramId, currentUser.id);
        
        if (!diagram) {
          setLoading(false);
          return;
        }

        setDiagramData(diagram);

        // Загружаем проекты
        loadProjects(currentUser.id);

        // Восстанавливаем состояние диаграммы
        if (diagram.selectedOption) {
          setSelectedOption(diagram.selectedOption);
        }
        
        if (diagram.diagramType) {
          setDiagramType(diagram.diagramType);
        }
        
        if (diagram.selectedProject) {
          setSelectedProject(diagram.selectedProject);
          
          // Загружаем данные проекта
          const projectData = projectsStorage.getById(diagram.selectedProject, currentUser.id);
          if (projectData) {
            setSelectedProjectData(projectData);
            
            // Загружаем файлы из проекта
            if (projectData.files && Array.isArray(projectData.files) && projectData.files.length > 0) {
              setUploadedFiles(projectData.files.map((file: any) => ({
                id: file.id || `file-${Date.now()}`,
                name: file.name || 'Неизвестный файл',
                size: file.size || 0,
                status: 'success' as const,
                progress: 100,
              })));
            }
          }
        }

        // Загружаем файлы диаграммы (если есть)
        if (diagram.files && Array.isArray(diagram.files) && diagram.files.length > 0) {
          setUploadedFiles(prev => {
            const existingIds = new Set(prev.map(f => f.id));
            const newFiles = diagram.files!.map((file: any) => ({
              id: file.id || `file-${Date.now()}`,
              name: file.name || 'Неизвестный файл',
              size: file.size || 0,
              status: 'success' as const,
              progress: 100,
            })).filter(f => !existingIds.has(f.id));
            return [...prev, ...newFiles];
          });
        }

        // Загружаем сообщения
        if (diagram.messages && Array.isArray(diagram.messages) && diagram.messages.length > 0) {
          setMessages(diagram.messages.map((msg: any) => ({
            text: msg.text || '',
            isUser: msg.isUser || false,
            type: msg.type,
            plantUmlCode: msg.plantUmlCode,
            diagramImageUrl: msg.diagramImageUrl,
            glossary: msg.glossary,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          })));
        } else if (diagram.selectedOption === 'scratch') {
          // Если создание с нуля и нет сообщений, показываем приветственное
          setMessages([{
            text: "Опишите предметную область и конкретный объект, диаграмму которого нужно будет построить",
            isUser: false,
            timestamp: new Date()
          }]);
        } else if (diagram.selectedProject) {
          // Если выбран проект и нет сообщений, показываем приветственное
          const projectData = projectsStorage.getById(diagram.selectedProject, currentUser.id);
          if (projectData && projectData.files && Array.isArray(projectData.files) && projectData.files.length > 0) {
            const filesList = projectData.files.map((file: any) => {
              const sizeKB = Math.round((file.size || 0) / 1024);
              return `${file.name || 'Неизвестный файл'} (${sizeKB} KB)`;
            }).join(', ');
            setMessages([{
              text: `Обработаны документы: ${filesList}. Теперь можно выбрать объект, по которому будет построена диаграмма.`,
              isUser: false,
              timestamp: new Date()
            }]);
          } else {
            setMessages([{
              text: "Теперь можно выбрать объект, по которому будет построена диаграмма.",
              isUser: false,
              timestamp: new Date()
            }]);
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке диаграммы:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDiagram();
  }, [diagramId]);

  useEffect(() => {
    const checkUser = () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        loadProjects(currentUser.id);
      }
    };

    checkUser();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Заглушка для Mermaid диаграммы
  const mermaidCode = `graph TD
    A[Основной объект] --> B[Подобъект 1]
    A --> C[Подобъект 2]
    B --> D[Элемент 1.1]
    B --> E[Элемент 1.2]
    C --> F[Элемент 2.1]
    C --> G[Элемент 2.2]`;

  // Автоматическое сохранение изменений
  const saveDiagram = useCallback((updates: Partial<Diagram>) => {
    if (!diagramId || !diagramData) return;

    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    try {
      const updated = diagramsStorage.update(diagramId, currentUser.id, updates);
      if (updated) {
        setDiagramData(updated);
      }
    } catch (error) {
      console.error('Ошибка при сохранении диаграммы:', error);
    }
  }, [diagramId, diagramData]);

  // Сохранение файлов
  useEffect(() => {
    if (uploadedFiles.length > 0 && !loading && diagramData) {
      const timer = setTimeout(() => {
        const filesData = uploadedFiles.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
        }));
        saveDiagram({ 
          files: filesData as any,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [uploadedFiles, loading, diagramData, saveDiagram]);

        // Сохранение сообщений
  useEffect(() => {
    if (messages.length > 0 && !loading && diagramData) {
      const timer = setTimeout(() => {
        const messagesData = messages.map(msg => ({
          text: msg.text,
          isUser: msg.isUser,
          type: msg.type,
          plantUmlCode: msg.plantUmlCode,
          diagramImageUrl: msg.diagramImageUrl,
          glossary: msg.glossary,
          timestamp: msg.timestamp || new Date(),
        }));
        saveDiagram({ messages: messagesData as any });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, loading, diagramData, saveDiagram]);

  const handleDiagramTypeSelect = (type: DiagramType) => {
    setDiagramType(type);
    
    const currentUser = auth.getCurrentUser();
    if (currentUser && diagramId) {
      saveDiagram({ diagramType: type });
    }
  };

  const handleOptionSelect = (option: 'projects' | 'scratch') => {
    setSelectedOption(option);
    
    const currentUser = auth.getCurrentUser();
    if (currentUser && diagramId) {
      saveDiagram({ selectedOption: option });
    }
    
    if (option === 'scratch') {
      // Для создания с нуля сразу переходим в чат
      setMessages([{
        text: "Опишите предметную область и конкретный объект, диаграмму которого нужно будет построить",
        isUser: false,
        timestamp: new Date()
      }]);
      setUploadedFiles([]);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    
    const currentUser = auth.getCurrentUser();
    if (currentUser && diagramId) {
      saveDiagram({ selectedProject: projectId });
    }
    
    // Загружаем данные проекта
    if (currentUser) {
      const projectData = projectsStorage.getById(projectId, currentUser.id);
      if (projectData) {
        setSelectedProjectData(projectData);
        
        // Загружаем файлы из проекта
        if (projectData.files && Array.isArray(projectData.files) && projectData.files.length > 0) {
          setUploadedFiles(projectData.files.map((file: any) => ({
            id: file.id || `file-${Date.now()}`,
            name: file.name || 'Неизвестный файл',
            size: file.size || 0,
            status: 'success' as const,
            progress: 100,
          })));
          
          // Формируем сообщение со списком документов
          const filesList = projectData.files.map((file: any) => {
            const sizeKB = Math.round((file.size || 0) / 1024);
            return `${file.name || 'Неизвестный файл'} (${sizeKB} KB)`;
          }).join(', ');
          
          setMessages([{
            text: `Обработаны документы: ${filesList}. Теперь можно выбрать объект, по которому будет построена диаграмма.`,
            isUser: false,
            timestamp: new Date()
          }]);
        } else {
          setUploadedFiles([]);
          setMessages([{
            text: "Теперь можно выбрать объект, по которому будет построена диаграмма.",
            isUser: false,
            timestamp: new Date()
          }]);
        }
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'txt': 'fa-file-alt',
      'csv': 'fa-file-csv',
      'md': 'fa-file-alt',
      'markdown': 'fa-file-alt',
      'pdf': 'fa-file-pdf',
      'docx': 'fa-file-word',
      'xlsx': 'fa-file-excel',
      'xls': 'fa-file-excel',
      'xlsm': 'fa-file-excel',
    };
    return iconMap[ext || ''] || 'fa-file';
  };

  // Функция для анимации прогресс-бара
  const animateProgress = useCallback((fileId: string, startProgress: number, targetProgress: number, onComplete?: () => void) => {
    let currentProgress = startProgress;
    const interval = setInterval(() => {
      currentProgress += 2; // Увеличиваем на 2% за раз для плавной анимации
      
      if (currentProgress >= targetProgress) {
        currentProgress = targetProgress;
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
      
      setUploadedFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { ...f, progress: currentProgress };
        }
        return f;
      }));
    }, 50); // Обновляем каждые 50мс для плавной анимации
    
    return interval;
  }, []);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      status: 'uploading' as const,
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Обрабатываем каждый файл через API
    const processedDocuments: any[] = [];
    const progressIntervals = new Map<string, NodeJS.Timeout>();
    
    for (let i = 0; i < newFiles.length; i++) {
      const fileItem = newFiles[i];
      const file = Array.from(files)[i];
      
      // Проверяем формат файла
      const fileName = file.name.toLowerCase();
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      const supportedExtensions = ['.txt', '.md', '.markdown', '.pdf', '.docx', '.xlsx', '.xls', '.xlsm', '.csv'];
      
      if (!supportedExtensions.includes(extension)) {
        // Для неподдерживаемых файлов сразу показываем ошибку
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error' as const, progress: 100 } : f
        ));
        continue;
      }

      // Запускаем анимацию прогресса от 0 до 90% (будет продолжаться во время загрузки)
      const interval = animateProgress(fileItem.id, 0, 90);
      progressIntervals.set(fileItem.id, interval);

      try {
        // Отправляем файл на обработку
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/documents/process', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Ошибка обработки файла: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Останавливаем предыдущую анимацию
        const currentInterval = progressIntervals.get(fileItem.id);
        if (currentInterval) {
          clearInterval(currentInterval);
          progressIntervals.delete(fileItem.id);
        }
        
        // Получаем текущий прогресс из состояния через функциональное обновление
        setUploadedFiles(prevFiles => {
          const currentFile = prevFiles.find(f => f.id === fileItem.id);
          const currentProgress = currentFile?.progress || 90;
          
          // Запускаем анимацию от текущего значения до 100%
          const newInterval = animateProgress(fileItem.id, currentProgress, 100, () => {
            // После достижения 100% показываем галочку
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { ...f, status: 'success' as const, progress: 100 } : f
            ));
          });
          progressIntervals.set(fileItem.id, newInterval);
          
          return prevFiles;
        });

        // Сохраняем обработанный документ
        processedDocuments.push({
          fileName: data.fileName,
          text: data.text,
          chunks: data.chunks,
        });
      } catch (error) {
        console.error(`Ошибка при обработке файла ${file.name}:`, error);
        // Останавливаем анимацию и показываем ошибку
        const currentInterval = progressIntervals.get(fileItem.id);
        if (currentInterval) {
          clearInterval(currentInterval);
          progressIntervals.delete(fileItem.id);
        }
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error' as const, progress: 100 } : f
        ));
      }
    }

    // Сохраняем файлы в диаграмму
    if (newFiles.length > 0 && diagramId) {
      const currentFiles = uploadedFiles.filter(f => f.status === 'success');
      const allFiles = [...currentFiles, ...newFiles.filter(f => f.status === 'success')];
      const filesData = allFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
      }));
      
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        saveDiagram({ files: filesData as any });
      }
    }

    // Вычисляем общий размер файлов в КБ
    const totalSizeBytes = newFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeKB = Math.round(totalSizeBytes / 1024);

    // Добавляем сообщение о загрузке документов
    if (processedDocuments.length > 0) {
      setMessages(prev => [...prev, {
        text: `Загружено и обработано документов: ${processedDocuments.length} из ${newFiles.length} (${totalSizeKB} КБ)`,
        isUser: false,
        timestamp: new Date(),
      }]);
    }
    
    setIsProcessing(false);
  }, [animateProgress, diagramId, uploadedFiles, saveDiagram]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSendMessage = async () => {
    if (message.trim() && !isProcessing && diagramType) {
      const objectDescription = message.trim();
      const newMessage = {
        text: objectDescription,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      setIsProcessing(true);

      try {
        // Собираем документы из проекта (если есть)
        let documents: any[] = [];
        if (selectedOption === 'projects' && selectedProjectData && selectedProjectData.processedDocuments) {
          documents = selectedProjectData.processedDocuments;
        }

        // Вызываем API для генерации PlantUML кода
        const generateResponse = await fetch('/api/diagrams/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            diagramType,
            objectDescription,
            documents,
            isFromProject: selectedOption === 'projects',
          }),
        });

        if (!generateResponse.ok) {
          throw new Error('Ошибка при генерации диаграммы');
        }

        const { plantUmlCode, glossary } = await generateResponse.json();

        // Вызываем API для рендеринга диаграммы
        const renderResponse = await fetch('/api/diagrams/render', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plantUmlCode,
          }),
        });

        if (!renderResponse.ok) {
          throw new Error('Ошибка при рендеринге диаграммы');
        }

        const { imageUrl } = await renderResponse.json();

        // Сохраняем данные в диаграмму
        const currentUser = auth.getCurrentUser();
        if (currentUser && diagramId) {
          saveDiagram({
            diagramType,
            selectedObject: objectDescription,
            plantUmlCode,
            diagramImageUrl: imageUrl,
            glossary,
          });
        }

        // Добавляем сообщения с результатами
        setMessages(prev => [
          ...prev,
          {
            text: "Диаграмма построена:",
            isUser: false,
            timestamp: new Date()
          },
          {
            text: plantUmlCode,
            isUser: false,
            type: 'code',
            plantUmlCode,
            diagramImageUrl: imageUrl,
            timestamp: new Date()
          },
          {
            text: "Глоссарий элементов диаграммы:",
            isUser: false,
            type: 'table',
            glossary,
            timestamp: new Date()
          }
        ]);
        setShowDiagram(true);
      } catch (error) {
        console.error('Ошибка при создании диаграммы:', error);
        setMessages(prev => [...prev, {
          text: `Ошибка при создании диаграммы: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
          isUser: false,
          timestamp: new Date()
        }]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!diagramData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Диаграмма не найдена</div>
      </div>
    );
  }

  // Определяем порядок шагов: тип диаграммы -> способ создания -> проект/чат
  const diagramTypeNames: Record<DiagramType, string> = {
    'Class': 'UML диаграмма классов',
    'Sequence': 'UML диаграмма последовательности',
    'Activity': 'UML диаграмма активности',
    'State': 'UML диаграмма состояний',
    'Component': 'UML диаграмма компонентов',
    'UseCase': 'UML диаграмма прецедентов',
    'Object': 'UML диаграмма объектов',
    'ER': 'ER диаграмма (Entity-Relationship)',
    'Gantt': 'Диаграмма Ганта',
    'MindMap': 'Интеллект-карта',
    'Network': 'Сетевая диаграмма',
    'Archimate': 'ArchiMate диаграмма',
    'Timing': 'Диаграмма временных зависимостей',
    'WBS': 'WBS диаграмма',
    'JSON': 'JSON диаграмма',
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-medium mb-2">{diagramData.name}</h1>
      <p className="text-gray-600 mb-8 text-base">{diagramData.description || ''}</p>
      {!diagramType ? (
        /* Выбор типа диаграммы */
        <div>
          <h2 className="text-2xl font-medium mb-6">Выберите тип диаграммы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(['Class', 'Sequence', 'Activity', 'State', 'Component', 'UseCase', 'Object', 'ER', 'Gantt', 'MindMap', 'Network', 'Archimate', 'Timing', 'WBS', 'JSON'] as DiagramType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleDiagramTypeSelect(type)}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">{type}</h3>
                <p className="text-gray-600 text-sm">
                  {diagramTypeNames[type]}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : !selectedOption ? (
        /* Выбор источника данных */
        <div className="max-w-2xl space-y-6">
          {/* Блок 1: Выбрать из проектов */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">Выбрать из моих проектов</h2>
                <p className="text-gray-500 text-base">
                  Использовать данные из существующего проекта
                </p>
              </div>
              <button
                onClick={() => handleOptionSelect('projects')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 min-w-[180px] justify-center"
              >
                Выбрать проект
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* Блок 2: Создать с нуля */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">Создать с нуля</h2>
                <p className="text-gray-500 text-base">
                  Опишите предметную область вручную
                </p>
              </div>
              <button
                onClick={() => handleOptionSelect('scratch')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 min-w-[180px] justify-center"
              >
                Ввести данные
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      ) : selectedOption === 'projects' && !selectedProject ? (
        /* Таблица проектов */
        <div>
          <h2 className="text-2xl font-medium mb-6">Выберите проект</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Загрузка...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">У вас пока нет проектов</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Название</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Краткое описание</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Дата создания</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr 
                      key={project.id} 
                      onClick={() => handleProjectSelect(project.id)}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6 text-gray-900 font-medium">
                        {project.name}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {project.description || ''}
                      </td>
                      <td className="py-4 px-6 text-gray-500">
                        {formatDate(project.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Область чата */
        <div className="flex flex-col h-full">
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Чат */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {/* История сообщений */}
              <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-6 mb-4 overflow-y-auto overflow-x-hidden min-h-0">
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const timestamp = msg.timestamp || new Date();
                    const dateStr = timestamp.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const timeStr = timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    
                    if (msg.type === 'code') {
                      return (
                        <div key={index} className="flex flex-col items-start">
                          <div className="text-base text-gray-500 mb-1 px-1">
                            {dateStr} {timeStr}
                          </div>
                          <div className="max-w-full w-full">
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium text-lg">PlantUML диаграмма</h3>
                                <div className="flex space-x-2">
                                  {msg.diagramImageUrl && (
                                    <>
                                      <a
                                        href={msg.diagramImageUrl}
                                        download
                                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                      >
                                        Скачать PNG
                                      </a>
                                    </>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (msg.plantUmlCode) {
                                        navigator.clipboard.writeText(msg.plantUmlCode);
                                        alert('Код скопирован в буфер обмена');
                                      }
                                    }}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                  >
                                    Копировать код
                                  </button>
                                </div>
                              </div>
                              {msg.diagramImageUrl && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                  <img
                                    src={msg.diagramImageUrl}
                                    alt="PlantUML диаграмма"
                                    className="max-w-full h-auto mx-auto"
                                  />
                                </div>
                              )}
                              <div className="bg-gray-900 text-gray-100 font-mono text-xs p-4 rounded overflow-x-auto">
                                <pre className="whitespace-pre-wrap">{msg.plantUmlCode || msg.text}</pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (msg.type === 'table' && msg.glossary) {
                      return (
                        <div key={index} className="flex flex-col items-start">
                          <div className="text-base text-gray-500 mb-1 px-1">
                            {dateStr} {timeStr}
                          </div>
                          <div className="max-w-full w-full">
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h4 className="font-medium text-lg mb-4">{msg.text || 'Глоссарий элементов диаграммы'}</h4>
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 font-medium text-gray-900">Элемент</th>
                                    <th className="text-left py-2 font-medium text-gray-900">Описание</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {msg.glossary.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                      <td className="py-3 text-gray-900 font-medium">{item.element}</td>
                                      <td className="py-3 text-gray-600">{item.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={index} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                        <div className="text-base text-gray-500 mb-1 px-1">
                          {dateStr} {timeStr}
                        </div>
                        <div className={`max-w-[75%] rounded-2xl p-4 ${
                          msg.isUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                        }`}>
                          <p className={`text-base break-words ${msg.isUser ? 'text-white' : 'text-gray-900'}`}>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Поле ввода */}
              <div className="relative flex-shrink-0 bg-white rounded-lg border border-gray-200 focus-within:border-blue-500 transition-all">
                {/* Textarea */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={diagramType ? (selectedOption === 'projects' ? "Введите название объекта или процесса для диаграммы..." : "Опишите предметную область и конкретный объект...") : "Сначала выберите тип диаграммы..."}
                  disabled={isProcessing || !diagramType}
                  className="w-full bg-transparent border-0 rounded-lg px-4 py-3 pr-16 focus:ring-0 focus:outline-none resize-none overflow-y-auto text-base text-gray-900 placeholder:text-gray-500 leading-relaxed disabled:opacity-50"
                  style={{
                    minHeight: '6.5rem',
                    maxHeight: '6.5rem',
                    lineHeight: '1.5',
                  }}
                />

                {/* Кнопка отправки */}
                <div className="absolute right-3 bottom-3 z-10">
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isProcessing || !diagramType}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-8 h-8"
                    title="Отправить"
                  >
                    <i className="fas fa-paper-plane text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}