'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, projects as projectsStorage, type Project } from '@/lib/storage';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
}

interface ProcessedDocument {
  fileName: string;
  text: string;
  chunks: string[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp?: Date }>>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
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

        // Загружаем обработанные документы
        if (projectData.processedDocuments && Array.isArray(projectData.processedDocuments)) {
          setProcessedDocuments(projectData.processedDocuments);
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

  // Сохранение файлов и обработанных документов
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
          processedDocuments: processedDocuments as any,
        });
      }, 1000); // Debounce на 1 секунду
      return () => clearTimeout(timer);
    }
  }, [uploadedFiles, processedDocuments, loading, projectData, saveProject]);

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

    // Обрабатываем каждый файл
    const processedDocs: ProcessedDocument[] = [];
    
    for (const fileItem of newFiles) {
      try {
        // Обновляем статус на обработку
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'processing' as const, progress: 50 } : f
        ));

        // Отправляем файл на обработку
        const formData = new FormData();
        const file = Array.from(files).find(f => f.name === fileItem.name);
        if (!file) continue;
        
        formData.append('file', file);
        
        const response = await fetch('/api/documents/process', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Ошибка при обработке файла');
        }

        const data = await response.json();
        
        if (!data.success || !data.text || data.text.trim().length === 0) {
          throw new Error('Не удалось извлечь текст из файла. Возможно, файл поврежден или содержит только изображения.');
        }
        
        processedDocs.push({
          fileName: fileItem.name,
          text: data.text,
          chunks: data.chunks,
        });

        // Обновляем статус на успех
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'success' as const, progress: 100 } : f
        ));
      } catch (error: any) {
        console.error('Ошибка при обработке файла:', error);
        const errorMessage = error?.message || 'Ошибка при обработке файла';
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error' as const } : f
        ));
        // Показываем сообщение об ошибке пользователю
        setMessages(prev => [...prev, {
          text: `Ошибка при обработке файла "${fileItem.name}": ${errorMessage}`,
          isUser: false,
          timestamp: new Date(),
        }]);
      }
    }

    // Сохраняем обработанные документы
    setProcessedDocuments(prev => [...prev, ...processedDocs]);

    // Генерируем краткое описание документов
    if (processedDocs.length > 0) {
      try {
        const allDocs = [...processedDocuments, ...processedDocs];
        const summarizeResponse = await fetch('/api/documents/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents: allDocs }),
        });

        if (summarizeResponse.ok) {
          const summaryData = await summarizeResponse.json();
          
          // Добавляем сообщение с описанием документов
          setMessages(prev => [...prev, {
            text: summaryData.generalSummary,
            isUser: false,
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        console.error('Ошибка при создании описания:', error);
        // Fallback сообщение
        setMessages(prev => [...prev, {
          text: `Загружено ${processedDocs.length} документов. Система готова отвечать на вопросы по их содержимому.`,
          isUser: false,
          timestamp: new Date(),
        }]);
      }
    }

    setIsProcessing(false);
  }, [processedDocuments]);

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
    const fileToRemove = uploadedFiles.find(f => f.id === fileId);
    if (fileToRemove) {
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      setProcessedDocuments(prev => prev.filter(d => d.fileName !== fileToRemove.name));
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
      'pdf': 'fa-file-pdf',
      'doc': 'fa-file-word',
      'docx': 'fa-file-word',
      'txt': 'fa-file-alt',
      'odt': 'fa-file-alt',
      'rtf': 'fa-file-alt',
      'csv': 'fa-file-csv',
      'xls': 'fa-file-excel',
      'xlsx': 'fa-file-excel',
    };
    return iconMap[ext || ''] || 'fa-file';
  };

  const handleSendMessage = async () => {
    if (message.trim() && !isAnswering && processedDocuments.length > 0) {
      const question = message.trim();
      const newMessage = {
        text: question,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      setIsAnswering(true);

      try {
        // Проверяем, что есть обработанные документы
        if (!processedDocuments || processedDocuments.length === 0) {
          setMessages(prev => [...prev, {
            text: 'Нет загруженных документов для анализа. Пожалуйста, сначала загрузите документы.',
            isUser: false,
            timestamp: new Date(),
          }]);
          setIsAnswering(false);
          return;
        }

        // Отправляем запрос в RAG-систему
        const response = await fetch('/api/rag/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            documents: processedDocuments,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Ошибка при поиске ответа');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Не удалось получить ответ');
        }
        
        // Добавляем ответ системы
        setMessages(prev => [...prev, {
          text: data.answer || 'Не удалось сгенерировать ответ. Попробуйте переформулировать вопрос.',
          isUser: false,
          timestamp: new Date(),
        }]);
      } catch (error: any) {
        console.error('Ошибка при поиске ответа:', error);
        const errorMessage = error?.message || 'Произошла ошибка при обработке вашего вопроса';
        setMessages(prev => [...prev, {
          text: `${errorMessage}. Пожалуйста, попробуйте еще раз или переформулируйте вопрос.`,
          isUser: false,
          timestamp: new Date(),
        }]);
      } finally {
        setIsAnswering(false);
      }
    } else if (processedDocuments.length === 0) {
      // Если документы не загружены
      setMessages(prev => [...prev, {
        text: 'Пожалуйста, сначала загрузите документы для анализа.',
        isUser: false,
        timestamp: new Date(),
      }]);
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
        <div className="w-64 flex-shrink-0 flex flex-col bg-gray-50 rounded-lg border border-gray-200 min-h-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-gray-900">
                Источники {hasFiles && `(${uploadedFiles.length})`}
              </h2>
            </div>
            <button
              onClick={handleButtonClick}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <i className="fas fa-plus"></i>
              Добавить источники
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.odt,.rtf"
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
                <p className="text-sm text-gray-500 mb-2">
                  Перетащите файлы сюда
                </p>
                <p className="text-xs text-gray-400">
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
                            <p className="text-sm font-medium text-gray-900 truncate" title={fileItem.name}>
                              {fileItem.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {formatFileSize(fileItem.size)}
                              </p>
                              {/* Статус */}
                              {fileItem.status === 'uploading' && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-blue-600">{fileItem.progress}%</span>
                                </div>
                              )}
                              {fileItem.status === 'processing' && (
                                <div className="flex items-center gap-1">
                                  <i className="fas fa-spinner fa-spin text-blue-500 text-xs"></i>
                                  <span className="text-xs text-blue-600">Обработка...</span>
                                </div>
                              )}
                              {fileItem.status === 'success' && (
                                <i className="fas fa-check-circle text-green-500 text-xs"></i>
                              )}
                              {fileItem.status === 'error' && (
                                <i className="fas fa-exclamation-circle text-red-500 text-xs"></i>
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
                <i className="fas fa-comments text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg">
                  Загрузите файлы, чтобы начать задавать вопросы
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
                        <div className="text-xs text-gray-500 mb-1 px-1">
                          {dateStr} {timeStr}
                        </div>
                        <div className={`max-w-[75%] rounded-2xl p-4 ${
                          msg.isUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                        }`}>
                          <p className={`text-sm break-words ${msg.isUser ? 'text-white' : 'text-gray-900'}`}>{msg.text}</p>
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
                  placeholder="Задайте вопрос по источникам..."
                  disabled={isAnswering || isProcessing}
                  className="w-full bg-transparent border-0 rounded-lg px-4 py-3 pr-16 focus:ring-0 focus:outline-none resize-none overflow-y-auto text-sm text-gray-900 placeholder:text-gray-500 leading-relaxed disabled:opacity-50"
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
                    disabled={!message.trim() || isAnswering || isProcessing}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-8 h-8"
                    title="Отправить"
                  >
                    {isAnswering ? (
                      <i className="fas fa-spinner fa-spin text-xs"></i>
                    ) : (
                      <i className="fas fa-paper-plane text-xs"></i>
                    )}
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
