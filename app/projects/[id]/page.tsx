'use client';

import { useState, useRef, useCallback } from 'react';

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      status: 'uploading' as const,
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Имитация загрузки файлов
    newFiles.forEach((fileItem) => {
      // Симуляция прогресса загрузки
      const interval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === fileItem.id) {
            const newProgress = Math.min(f.progress + 10, 100);
            if (newProgress === 100) {
              clearInterval(interval);
              return { ...f, progress: 100, status: 'success' as const };
            }
            return { ...f, progress: newProgress };
          }
          return f;
        }));
      }, 100);
    });

    // Если это первые файлы, показываем сообщение
    if (uploadedFiles.length === 0) {
      setTimeout(() => {
        setMessages([{
          text: "Документы проанализированы. Теперь можно задавать вопросы по их содержимому.",
          isUser: false
        }]);
      }, 2000);
    }
  }, [uploadedFiles.length]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Сбрасываем значение, чтобы можно было загрузить тот же файл снова
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

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, { text: message, isUser: true }]);
      setMessage('');

      // Имитация ответа системы
      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: "На основе загруженных документов доступна следующая информация...",
          isUser: false
        }]);
      }, 1000);
    }
  };

  const hasFiles = uploadedFiles.length > 0;
  const hasSuccessfulFiles = uploadedFiles.some(f => f.status === 'success');

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-medium mb-6">Загрузка файлов</h1>
      
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Левая колонка: Боковое меню с файлами */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-gray-50 rounded-lg border border-gray-200">
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
            accept=".pdf,.doc,.docx,.txt,.odt,.rtf,.csv,.xls,.xlsx"
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
                        <i className={`fas ${getFileIcon(fileItem.file.name)} text-blue-600 text-sm`}></i>
                      </div>

                      {/* Информация о файле - компактная */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" title={fileItem.file.name}>
                              {fileItem.file.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {formatFileSize(fileItem.file.size)}
                              </p>
                              {/* Статус */}
                              {fileItem.status === 'uploading' && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-blue-600">{fileItem.progress}%</span>
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
        <div className="flex-1 flex flex-col min-w-0">
          {!hasSuccessfulFiles ? (
            /* Пустое состояние чата */
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
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
              <div className="flex-1 bg-gray-50 rounded-lg p-6 mb-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl p-4 ${
                        msg.isUser
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Поле ввода */}
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Спрашивайте по источникам..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}