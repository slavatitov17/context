'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, projects as projectsStorage, type Project } from '@/lib/storage';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp?: Date }>>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
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
    
    for (let i = 0; i < newFiles.length; i++) {
      const fileItem = newFiles[i];
      const file = Array.from(files)[i];
      
      // Проверяем формат файла
      const fileName = file.name.toLowerCase();
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      const supportedExtensions = ['.txt', '.md', '.markdown', '.pdf', '.docx', '.xlsx', '.xls', '.xlsm', '.csv'];
      
      if (!supportedExtensions.includes(extension)) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error' as const, progress: 100 } : f
        ));
        continue;
      }

      try {
        // Обновляем прогресс
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, progress: 30 } : f
        ));

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
        
        // Обновляем прогресс
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, progress: 100, status: 'success' as const } : f
        ));

        // Сохраняем обработанный документ
        processedDocuments.push({
          fileName: data.fileName,
          text: data.text,
          chunks: data.chunks,
        });
      } catch (error) {
        console.error(`Ошибка при обработке файла ${file.name}:`, error);
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
      text: `Загружено и обработано документов: ${processedDocuments.length} из ${newFiles.length} (${totalSizeKB} КБ)`,
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
      setIsProcessing(true);

      try {
        // Получаем обработанные документы из проекта
        const processedDocs = projectData?.processedDocuments || [];
        
        if (processedDocs.length === 0) {
          setMessages(prev => [...prev, {
            text: 'Пожалуйста, сначала загрузите документы для анализа.',
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
        
        setMessages(prev => [...prev, {
          text: data.answer || 'Не удалось получить ответ.',
          isUser: false,
          timestamp: new Date(),
        }]);
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        setMessages(prev => [...prev, {
          text: `Ошибка при обработке запроса: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
          isUser: false,
          timestamp: new Date(),
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

  if (!projectData) {
    return null;
  }

  const hasFiles = uploadedFiles.length > 0;
  const hasSuccessfulFiles = uploadedFiles.some(f => f.status === 'success');

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-medium mb-2">{projectData.name}</h1>
        {projectData.description && (
          <p className="text-gray-600">{projectData.description}</p>
        )}
      </div>
      
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Левая колонка: Боковое меню с файлами */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-gray-50 rounded-lg border border-gray-200 min-h-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-gray-900">
                Документы {hasFiles && `(${uploadedFiles.length})`}
              </h2>
            </div>
            <button
              onClick={handleButtonClick}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
            >
              <i className="fas fa-plus"></i>
              Добавить документы
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.csv,.md,.markdown,.pdf,.docx,.xlsx,.xls,.xlsm"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Область drag-n-drop для всего бокового меню */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 overflow-y-auto p-4 transition-colors ${
              isDragging ? 'bg-blue-50' : ''
            }`}
          >
            {!hasFiles ? (
              /* Пустое состояние */
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="mb-4">
                  <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                </div>
                <p className="text-base text-gray-500">
                  Перетащите файлы сюда<br />
                  или нажмите кнопку выше
                </p>
              </div>
            ) : (
              /* Список файлов - компактный */
              <div className="space-y-2">
                {uploadedFiles.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors group"
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
                            <p className="text-base font-medium text-gray-900 truncate" title={fileItem.name}>
                              {fileItem.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-500">
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
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
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
        </div>

        {/* Правая колонка: Чат */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {!hasSuccessfulFiles ? (
            /* Пустое состояние чата */
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 min-h-0">
              <div className="text-center">
                <i className="fas fa-comments text-6xl text-gray-400 mb-4"></i>
                <p className="text-gray-500 text-base">
                  Загрузите документы, чтобы начать работу с ними
                </p>
              </div>
            </div>
          ) : (
            /* Чат с сообщениями */
            <div className="flex-1 flex flex-col min-h-0">
              {/* История сообщений */}
              <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-6 mb-4 overflow-y-auto overflow-x-hidden min-h-0">
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const timestamp = msg.timestamp || new Date();
                    const dateStr = timestamp.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const timeStr = timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
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
                  placeholder="Введите сообщение..."
                  disabled={isProcessing}
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
    </div>
  );
}
