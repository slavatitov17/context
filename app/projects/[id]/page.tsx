'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { auth, projects as projectsStorage, type Project } from '@/lib/storage';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}

function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; file: File; preview?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setMessage('');
      setAttachedFiles([]);
    } else {
      // Автоматическое подтягивание почты для авторизованного пользователя
      const user = auth.getCurrentUser();
      if (user && user.email) {
        setEmail(user.email);
      }
    }
  }, [isOpen]);

  // Обработка Ctrl+V для вставки изображений из буфера обмена
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const id = `file-${Date.now()}-${Math.random()}`;
              setAttachedFiles(prev => [...prev, {
                id,
                file: new File([file], `screenshot-${Date.now()}.png`, { type: file.type }),
                preview: e.target?.result as string
              }]);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const id = `file-${Date.now()}-${Math.random()}`;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachedFiles(prev => [...prev, {
            id,
            file,
            preview: e.target?.result as string
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFiles(prev => [...prev, { id, file }]);
      }
    });
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filesInfo = attachedFiles.map(f => f.file.name).join(', ');
    alert(`Сообщение отправлено (заглушка)\nEmail: ${email}\nСообщение: ${message}${filesInfo ? `\nФайлы: ${filesInfo}` : ''}`);
    setEmail('');
    setMessage('');
    setAttachedFiles([]);
    onClose();
  };

  const isFormValid = email.trim() !== '' && message.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Блюр фон */}
      <div 
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}
        onClick={onClose}
      />
      
      {/* Модальное окно */}
      <div className={`relative rounded-xl p-6 max-w-lg w-full shadow-xl z-10 max-h-[90vh] overflow-y-auto hide-scrollbar border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('diagram.contactSupport')}</h2>
          <button
            onClick={onClose}
            className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('diagram.yourEmail')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
                  : 'border-gray-300 text-gray-900'
              }`}
              placeholder="example@mail.com"
            />
          </div>

          <div className="mb-6">
            <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('about.support.message')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
                  : 'border-gray-300 text-gray-900'
              }`}
              placeholder={t('about.support.placeholder.message')}
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`text-base font-medium flex items-center transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-blue-400'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <i className="fas fa-paperclip mr-2 text-lg"></i>
                {t('about.support.attach')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
            
            {/* Список прикрепленных файлов */}
            {attachedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachedFiles.map((fileData) => (
                  <div key={fileData.id} className={`flex items-center gap-3 p-3 border rounded-lg ${
                    isDark
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    {fileData.preview ? (
                      <img src={fileData.preview} alt={fileData.file.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className={`w-12 h-12 rounded flex items-center justify-center ${
                        isDark ? 'bg-gray-600' : 'bg-gray-200'
                      }`}>
                        <i className={`fas fa-file ${isDark ? 'text-gray-400' : 'text-gray-400'}`}></i>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{fileData.file.name}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatFileSize(fileData.file.size)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(fileData.id)}
                      className={`transition-colors ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              isFormValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : isDark
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {t('diagram.send')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const params = useParams();
  const projectId = params?.id as string;
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp?: Date; generationTime?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'processing' | 'generating' | 'creating'>('processing');
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [documentsCollapsed, setDocumentsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Загрузка проекта
  useEffect(() => {
    const loadProject = () => {
      // Проверяем наличие ID
      if (!projectId) {
        router.replace('/projects');
        return;
      }

      try {
        setLoading(true);
        
        // Проверяем пользователя
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        // Загружаем проект
        const projectData = projectsStorage.getById(projectId, currentUser.id);
        
        if (!projectData) {
          router.replace('/projects');
          return;
        }

        setProjectData(projectData);

        // Загружаем файлы
        if (projectData.files && Array.isArray(projectData.files) && projectData.files.length > 0) {
          setUploadedFiles(projectData.files.map((file: any) => ({
            id: file.id || `file-${Date.now()}`,
            name: file.name || 'Неизвестный файл',
            size: file.size || 0,
            status: 'success' as const,
            progress: 100,
          })));
        }

        // Загружаем сообщения
        if (projectData.messages && Array.isArray(projectData.messages) && projectData.messages.length > 0) {
          setMessages(projectData.messages.map((msg: any) => ({
            text: msg.text || '',
            isUser: msg.isUser || false,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            generationTime: msg.generationTime,
          })));
        }
      } catch (error) {
        console.error('Ошибка при загрузке проекта:', error);
        router.push('/projects');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, router]);

  // Автоматическое сохранение изменений
  const saveProject = useCallback((updates: Partial<Project>) => {
    if (!user || !projectData) return;

    try {
      projectsStorage.update(projectId, user.id, updates);
    } catch (error) {
      console.error('Ошибка при сохранении проекта:', error);
    }
  }, [user, projectData, projectId]);

  // Сохранение файлов
  useEffect(() => {
    if (uploadedFiles.length > 0 && !loading && projectData) {
      const timer = setTimeout(() => {
        const filesData = uploadedFiles.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
        }));
        saveProject({ 
          files: filesData as any,
        });
      }, 1000); // Debounce на 1 секунду
      return () => clearTimeout(timer);
    }
  }, [uploadedFiles, loading, projectData, saveProject]);

  // Сохранение сообщений
  useEffect(() => {
    if (messages.length > 0 && !loading && projectData) {
      const timer = setTimeout(() => {
        const messagesData = messages.map(msg => ({
          text: msg.text,
          isUser: msg.isUser,
          timestamp: msg.timestamp || new Date(),
        }));
        saveProject({ messages: messagesData as any });
      }, 1000); // Debounce на 1 секунду
      return () => clearTimeout(timer);
    }
  }, [messages, loading, projectData, saveProject]);

  // Управление этапами загрузки и таймером (только для чата, не для загрузки файлов)
  useEffect(() => {
    // Проверяем, что это обработка запроса в чате, а не загрузка файлов
    // isProcessing может быть true и при загрузке файлов, поэтому проверяем наличие сообщений в процессе
    if (!isProcessing) {
      setLoadingStage('processing');
      setLoadingStartTime(null);
      setElapsedSeconds(0);
      setLoadingMessages([]);
      return;
    }

    // Запускаем таймер только если это обработка запроса в чате
    // (не загрузка файлов - там isProcessing используется для другого)
    const startTime = Date.now();
    setLoadingStartTime(startTime);
    setElapsedSeconds(0);
    
    // Список статусов загрузки (каждый отображается 3 секунды, последний до конца)
    const statusMessages = [
      'Обработка запроса...',
      'Поиск информации...',
      'Формирование ответа...',
      'Проверка ответа...',
    ];
    setLoadingMessages(statusMessages);
    setLoadingStage('processing');

    // Обновляем таймер каждую секунду
    const timerInterval = setInterval(() => {
      if (isProcessing) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }
    }, 1000);

    // Меняем статус каждые 3 секунды (последний остается до конца)
    let statusIndex = 0;
    const statusInterval = setInterval(() => {
      if (isProcessing && statusMessages.length > 0) {
        if (statusIndex < statusMessages.length - 1) {
          statusIndex++;
          // Обновляем loadingStage для совместимости
          if (statusIndex < 2) {
            setLoadingStage('processing');
          } else if (statusIndex < 3) {
            setLoadingStage('generating');
          } else {
            setLoadingStage('creating');
          }
        }
      }
    }, 3000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(statusInterval);
    };
  }, [isProcessing]);

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
          // Не устанавливаем Content-Type - браузер установит автоматически с boundary для FormData
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

    // Сохраняем обработанные документы в проект
    if (processedDocuments.length > 0 && projectData) {
      const currentProcessed = projectData.processedDocuments || [];
      const updatedProcessed = [...currentProcessed, ...processedDocuments];
      
      // Сохраняем в проект
      saveProject({ 
        processedDocuments: updatedProcessed 
      });
      
      // Обновляем локальное состояние projectData, чтобы документы были доступны сразу
      setProjectData(prev => prev ? {
        ...prev,
        processedDocuments: updatedProcessed
      } : null);
    }

    // Вычисляем общий размер файлов в КБ
    const totalSizeBytes = newFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeKB = Math.round(totalSizeBytes / 1024);

    // Добавляем сообщение о загрузке документов
    setMessages(prev => [...prev, {
      text: `${t('project.uploadedProcessed')} ${processedDocuments.length} ${t('project.of')} ${newFiles.length} (${totalSizeKB} КБ)`,
      isUser: false,
      timestamp: new Date(),
    }]);
    
    setIsProcessing(false);
  }, [projectData, saveProject]);

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

  const handleSendMessage = async () => {
    if (message.trim() && !isProcessing) {
      const question = message.trim();
      const newMessage = {
        text: question,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      // Сохраняем время начала генерации ПЕРЕД началом обработки
      const generationStartTime = Date.now();
      setIsProcessing(true);
      setLoadingStage('processing');

      try {
        // Получаем обработанные документы из проекта
        const processedDocs = projectData?.processedDocuments || [];
        
        if (processedDocs.length === 0) {
          setMessages(prev => [...prev, {
            text: t('project.pleaseUpload'),
            isUser: false,
            timestamp: new Date(),
          }]);
          setIsProcessing(false);
          return;
        }

        // Отправляем запрос в RAG API
        const response = await fetch('/api/rag/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: question,
            documents: processedDocs,
          }),
        });

        if (!response.ok) {
          throw new Error(`Ошибка при обработке запроса: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Сохраняем время генерации (минимум 3 секунды)
        const finalElapsedSeconds = Math.max(3, Math.floor((Date.now() - generationStartTime) / 1000));
        
        setMessages(prev => [...prev, {
          text: data.answer || t('project.failedToGetAnswer'),
          isUser: false,
          timestamp: new Date(),
          generationTime: finalElapsedSeconds,
        }]);
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        const finalElapsedSeconds = Math.max(3, Math.floor((Date.now() - generationStartTime) / 1000));
        setMessages(prev => [...prev, {
          text: `${t('project.errorProcessing')} ${error instanceof Error ? error.message : t('project.unknownError')}`,
          isUser: false,
          timestamp: new Date(),
          generationTime: finalElapsedSeconds,
        }]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('project.loading')}</div>
      </div>
    );
  }

  if (!projectData) {
    return null;
  }

  const hasFiles = uploadedFiles.length > 0;
  const hasSuccessfulFiles = uploadedFiles.some(f => f.status === 'success');

  return (
    <div className="flex flex-col min-h-0" style={{ height: 'calc(100vh - 1rem - 2.5rem - 4rem)', maxHeight: 'calc(100vh - 1rem - 2.5rem - 4rem)' }}>
      
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Левая колонка: на мобильных сверху с ограничением высоты, на md+ — боковая панель */}
        <div className={`w-full md:w-80 flex-shrink-0 flex flex-col rounded-lg border min-h-0 max-h-[45vh] md:max-h-none ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          {/* Заголовок: на мобильных — кнопка Скрыть/Показать */}
          <div className={`p-4 border-b flex items-center justify-between gap-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('project.documents')} {hasFiles && `(${uploadedFiles.length})`}
            </h2>
            <div className="flex-shrink-0 md:hidden">
              {documentsCollapsed ? (
                <button
                  type="button"
                  onClick={() => setDocumentsCollapsed(false)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'}`}
                >
                  {t('project.documentsShow')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDocumentsCollapsed(true)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'}`}
                >
                  {t('project.documentsHide')}
                </button>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.csv,.md,.markdown,.pdf,.docx,.xlsx,.xls,.xlsm"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Область drag-n-drop: на мобильных скрыта при свёрнутом блоке */}
          <div
            className={`flex-1 flex flex-col min-h-0 ${documentsCollapsed ? 'hidden md:flex' : ''}`}
          >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 overflow-y-auto p-4 transition-colors ${
              isDragging ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') : ''
            }`}
          >
            {!hasFiles ? (
              /* Пустое состояние */
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="mb-4">
                  <i className={`fas fa-download text-4xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`}></i>
                </div>
                <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('project.dragFiles')}<br />
                  {t('project.orClickButton')}
                </p>
              </div>
            ) : (
              /* Список файлов - компактный */
              <div className="space-y-2">
                {uploadedFiles.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className={`rounded-lg p-3 transition-colors group border ${isDark ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Иконка файла - компактная */}
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                        <i className={`fas ${getFileIcon(fileItem.name)} text-blue-600 text-sm`}></i>
                      </div>

                      {/* Информация о файле - компактная */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-base font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`} title={fileItem.name}>
                              {fileItem.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formatFileSize(fileItem.size)}
                              </p>
                              {/* Статус */}
                              {fileItem.status === 'uploading' && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm text-blue-600">{fileItem.progress}%</span>
                                </div>
                              )}
                              {fileItem.status === 'success' && (
                                <i className="fas fa-check-circle text-green-500 text-sm"></i>
                              )}
                              {fileItem.status === 'error' && (
                                <i className="fas fa-exclamation-circle text-red-500 text-sm"></i>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(fileItem.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                            title="Удалить файл"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>

                        {/* Прогресс загрузки - компактный */}
                        {fileItem.status === 'uploading' && (
                          <div className="mt-2">
                            <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${fileItem.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Бордер и кнопка внизу */}
          <div className={`p-4 border-t flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={handleButtonClick}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
            >
              <i className="fas fa-plus"></i>
              {t('project.addDocuments')}
            </button>
          </div>
          </div>
        </div>

        {/* Правая колонка: Чат — на мобильных занимает оставшееся место */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {!hasSuccessfulFiles ? (
            /* Пустое состояние чата */
            <div className={`flex-1 flex items-center justify-center rounded-lg border min-h-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-center">
                <i className={`fas fa-comments text-6xl mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}></i>
                <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('project.uploadDocuments')}
                </p>
              </div>
            </div>
          ) : (
            /* Чат с сообщениями */
            <div className="flex-1 flex flex-col min-h-0">
              {/* История сообщений */}
              <div className={`flex-1 rounded-lg border p-6 mb-2 overflow-y-auto overflow-x-hidden min-h-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const timestamp = msg.timestamp || new Date();
                    const dateStr = timestamp.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const timeStr = timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    
                    // Если это ответ системы с generationTime: дата/время сверху, сообщение, затем таймер и кнопка снизу
                    if (!msg.isUser && msg.generationTime !== undefined) {
                      return (
                        <div key={index} className="flex flex-col items-start w-full">
                          <div className={`text-base mb-1 px-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {dateStr} {timeStr}
                          </div>
                          <div className="max-w-[75%] w-full">
                            {/* Ответ системы */}
                            <div className={`rounded-2xl p-4 rounded-bl-none shadow-sm prose prose-sm max-w-none border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                              <div className={`text-base break-words markdown-content ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                <ReactMarkdown
                                  components={{
                                    h1: (props) => <h1 className={`text-2xl font-bold mt-4 mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    h2: (props) => <h2 className={`text-xl font-bold mt-3 mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    h3: (props) => <h3 className={`text-lg font-bold mt-3 mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    h4: (props) => <h4 className={`text-base font-bold mt-2 mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    p: (props) => <p className={`mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    ul: (props) => <ul className={`list-disc list-inside mb-2 space-y-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    ol: (props) => <ol className={`list-decimal list-inside mb-2 space-y-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    li: (props) => <li className={isDark ? 'text-gray-100' : 'text-gray-900'} {...props} />,
                                    strong: (props) => <strong className={`font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    em: (props) => <em className={`italic ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    code: (props) => <code className={`px-1 py-0.5 rounded text-sm font-mono ${isDark ? 'bg-gray-600 text-gray-100' : 'bg-gray-100 text-gray-900'}`} {...props} />,
                                    pre: (props) => <pre className={`p-3 rounded overflow-x-auto mb-2 text-sm ${isDark ? 'bg-gray-600 text-gray-100' : 'bg-gray-100 text-gray-900'}`} {...props} />,
                                    blockquote: (props) => <blockquote className={`border-l-4 pl-4 italic mb-2 ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`} {...props} />,
                                  }}
                                >
                                  {msg.text}
                                </ReactMarkdown>
                              </div>
                            </div>
                            {/* Таймер и кнопка "Сообщить об ошибке" — под сообщением */}
                            <div className="flex items-center gap-3 mt-3">
                              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <svg className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className={`text-sm font-mono font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                  {Math.floor(msg.generationTime / 60)}:{(msg.generationTime % 60).toString().padStart(2, '0')}
                                </span>
                              </div>
                              <button
                                onClick={() => setShowSupportModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                {t('diagram.reportError')}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Обычные сообщения (пользователь и старые сообщения системы)
                    return (
                      <div key={index} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                        <div className={`text-base mb-1 px-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {dateStr} {timeStr}
                        </div>
                        <div className={`max-w-[75%] rounded-2xl p-4 ${
                          msg.isUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : isDark ? 'bg-gray-700 border border-gray-600 rounded-bl-none shadow-sm' : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                        }`}>
                          {msg.isUser ? (
                            <p className="text-base break-words text-white whitespace-pre-wrap">{msg.text}</p>
                          ) : (
                            <div className="prose prose-sm max-w-none">
                              <div className={`text-base break-words markdown-content ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                <ReactMarkdown
                                  components={{
                                    h1: (props) => <h1 className={`text-2xl font-bold mt-4 mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    h2: (props) => <h2 className={`text-xl font-bold mt-3 mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    h3: (props) => <h3 className={`text-lg font-bold mt-3 mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    h4: (props) => <h4 className={`text-base font-bold mt-2 mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    p: (props) => <p className={`mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    ul: (props) => <ul className={`list-disc list-inside mb-2 space-y-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    ol: (props) => <ol className={`list-decimal list-inside mb-2 space-y-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    li: (props) => <li className={isDark ? 'text-gray-100' : 'text-gray-900'} {...props} />,
                                    strong: (props) => <strong className={`font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    em: (props) => <em className={`italic ${isDark ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                                    code: (props) => <code className={`px-1 py-0.5 rounded text-sm font-mono ${isDark ? 'bg-gray-600 text-gray-100' : 'bg-gray-100 text-gray-900'}`} {...props} />,
                                    pre: (props) => <pre className={`p-3 rounded overflow-x-auto mb-2 text-sm ${isDark ? 'bg-gray-600 text-gray-100' : 'bg-gray-100 text-gray-900'}`} {...props} />,
                                    blockquote: (props) => <blockquote className={`border-l-4 pl-4 italic mb-2 ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`} {...props} />,
                                  }}
                                >
                                  {msg.text}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Индикатор загрузки ответа с таймером */}
                  {isProcessing && (
                    <div className="flex flex-col items-start">
                      <div className={`max-w-[75%] rounded-2xl p-4 rounded-bl-none shadow-sm border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          {/* Таймер */}
                          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            <svg className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className={`text-sm font-mono font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                              {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          {/* Текущее сообщение */}
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {loadingMessages.length > 0 
                              ? loadingMessages[Math.min(Math.floor(elapsedSeconds / 3), loadingMessages.length - 1)]
                              : (loadingStage === 'processing' ? 'Обработка запроса...' : 
                                 loadingStage === 'generating' ? 'Формирование ответа...' : 
                                 'Проверка ответа...')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Поле ввода */}
              <div className={`relative flex-shrink-0 rounded-lg border focus-within:border-blue-500 transition-all ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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
                  placeholder={t('project.enterMessage')}
                  disabled={isProcessing}
                  className={`w-full bg-transparent border-0 rounded-lg px-4 py-3 pr-16 focus:ring-0 focus:outline-none resize-none overflow-y-auto text-base leading-relaxed disabled:opacity-50 ${isDark ? 'text-gray-100 placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-500'}`}
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
                    disabled={!message.trim() || isProcessing}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-8 h-8"
                    title="Отправить"
                  >
                    <i className="fas fa-paper-plane text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
    </div>
  );
}
