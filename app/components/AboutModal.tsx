'use client';

import { useState, useRef, useEffect } from 'react';
import { auth } from '@/lib/storage';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; file: File; preview?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setMessage('');
      setAttachedFiles([]);
      setShowPrivacy(false);
      setShowVersion(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filesInfo = attachedFiles.map(f => f.file.name).join(', ');
    alert(`Сообщение отправлено (заглушка)\nEmail: ${email}\nСообщение: ${message}${filesInfo ? `\nФайлы: ${filesInfo}` : ''}`);
    setEmail('');
    setMessage('');
    setAttachedFiles([]);
  };

  const isFormValid = email.trim() !== '' && message.trim() !== '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Блюр фон */}
      <div 
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Модальное окно */}
      <div 
        className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-2xl w-full shadow-xl z-10 max-h-[90vh] overflow-y-auto hide-scrollbar" 
        onClick={(e) => e.stopPropagation()}
      >
        {(showPrivacy || showVersion) ? (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => {
                  setShowPrivacy(false);
                  setShowVersion(false);
                }}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group relative"
              >
                <i className="fas fa-arrow-left text-sm"></i>
                <span className="relative z-10">Назад</span>
                <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h2 className="text-xl font-medium text-gray-900">
              {showPrivacy ? 'Политика конфиденциальности' : 'Версия 1.0.0'}
            </h2>
          </div>
        ) : (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">
              О системе
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {!showPrivacy && !showVersion ? (
          <div className="space-y-6">
            {/* Блок 1: О системе */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Context (рус. Контекст)
              </h3>
              <div className="space-y-4">
                <p className="text-gray-700 text-base leading-relaxed">
                  Ответы на вопросы по загруженным документам, создание диаграмм
                  по предметной области. Используя систему Context, вы соглашаетесь{' '}
                  с{' '}
                  <button
                    onClick={() => setShowPrivacy(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Политикой конфиденциальности
                  </button>
                </p>
                <div>
                  <p className="text-xl font-medium text-gray-900 mb-1">Версия</p>
                  <button
                    onClick={() => setShowVersion(true)}
                    className="text-blue-600 hover:underline text-base"
                  >
                    1.0.0
                  </button>
                </div>
              </div>
            </div>

            {/* Блок 2: Форма поддержки */}
            <div className="bg-white border border-gray-200 rounded-xl p-6" ref={formRef}>
              <h3 className="text-xl font-medium text-gray-900 mb-4">Обратиться в поддержку</h3>
              
              <form onSubmit={handleSubmit}>
                {/* Поле Email */}
                <div className="mb-4">
                  <label className="block text-gray-900 font-medium mb-2">
                    Ваша электронная почта
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="example@mail.com"
                  />
                </div>

                {/* Поле Сообщение */}
                <div className="mb-6">
                  <label className="block text-gray-900 font-medium mb-2">
                    Ваше сообщение
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Опишите вашу проблему или вопрос..."
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-500 hover:text-gray-700 text-base font-medium flex items-center hover:text-blue-600 transition-colors"
                    >
                      <i className="fas fa-paperclip mr-2 text-lg"></i>
                      Прикрепить файл
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
                        <div key={fileData.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          {fileData.preview ? (
                            <img src={fileData.preview} alt={fileData.file.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <i className="fas fa-file text-gray-400"></i>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{fileData.file.name}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(fileData.file.size)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(fileData.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
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

                {/* Кнопка отправки */}
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    isFormValid
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Отправить
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Политика конфиденциальности */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                1. Общие положения
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>
                  Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сервиса Context (далее — «Сервис»). 
                  Используя Сервис, вы соглашаетесь с условиями настоящей Политики конфиденциальности.
                </p>
                <p>
                  Администрация Сервиса обязуется соблюдать конфиденциальность персональных данных пользователей в соответствии с действующим законодательством.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                2. Собираемые данные
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>При использовании Сервиса мы собираем следующую информацию:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Электронный адрес (email) для идентификации пользователя</li>
                  <li>Информация о проектах, созданных пользователем</li>
                  <li>Загруженные пользователем файлы и документы</li>
                  <li>Данные о взаимодействии с Сервисом (время использования, действия пользователя)</li>
                  <li>Техническая информация (IP-адрес, тип браузера, операционная система)</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                3. Цели использования данных
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>Собранные данные используются для следующих целей:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Предоставление доступа к функциям Сервиса</li>
                  <li>Идентификация и аутентификация пользователей</li>
                  <li>Обработка и анализ загруженных файлов для ответов на вопросы</li>
                  <li>Создание диаграмм на основе загруженных данных</li>
                  <li>Улучшение качества работы Сервиса</li>
                  <li>Обеспечение безопасности и предотвращение мошенничества</li>
                  <li>Информирование пользователей об изменениях в Сервисе</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                4. Защита персональных данных
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>
                  Администрация Сервиса принимает необходимые технические и организационные меры для защиты персональных данных от неправомерного доступа, 
                  уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий.
                </p>
                <p>
                  Все данные хранятся на защищенных серверах с использованием современных технологий шифрования. 
                  Доступ к персональным данным имеют только уполномоченные сотрудники, которые обязаны соблюдать конфиденциальность.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                5. Передача данных третьим лицам
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>
                  Администрация Сервиса не передает персональные данные третьим лицам, за исключением следующих случаев:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Пользователь дал согласие на такие действия</li>
                  <li>Передача предусмотрена законодательством в рамках установленной процедуры</li>
                  <li>Передача необходима для работы Сервиса или его функций (например, обработка файлов с использованием внешних сервисов)</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                6. Права пользователей
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>Пользователь имеет право:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Получать информацию о своих персональных данных, обрабатываемых Сервисом</li>
                  <li>Требовать уточнения, блокирования или уничтожения персональных данных</li>
                  <li>Отозвать согласие на обработку персональных данных</li>
                  <li>Удалить свой аккаунт и связанные с ним данные</li>
                </ul>
                <p>
                  Для реализации своих прав пользователь может обратиться к Администрации Сервиса через форму обратной связи на странице «О системе».
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                7. Использование Cookies
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>
                  Сервис использует технологию cookies для обеспечения удобства использования и улучшения функциональности. 
                  Cookies — это небольшие текстовые файлы, которые сохраняются на устройстве пользователя.
                </p>
                <p>
                  Пользователь может настроить свой браузер для отказа от cookies, однако это может ограничить доступ к некоторым функциям Сервиса.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                8. Изменения в Политике конфиденциальности
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>
                  Администрация Сервиса оставляет за собой право вносить изменения в настоящую Политику конфиденциальности. 
                  Актуальная версия всегда доступна на данной странице.
                </p>
                <p>
                  При внесении существенных изменений пользователи будут уведомлены через Сервис или по электронной почте.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                9. Обратиться в поддержку
              </h3>
              <div className="space-y-4 text-gray-700 text-base leading-relaxed">
                <p>
                  По всем вопросам, связанным с обработкой персональных данных, вы можете обратиться к Администрации Сервиса через форму обратной связи на странице «О системе».
                </p>
              </div>
            </div>
          </div>
        ) : showVersion ? (
          <div className="space-y-6">
            {/* Блок 1: Основные возможности */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Основные возможности
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>
                  Система Context позволяет работать с документами и создавать диаграммы по текстовому описанию.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Загрузка и обработка документов различных форматов</li>
                  <li>Анализ содержимого документов с помощью искусственного интеллекта</li>
                  <li>Создание диаграмм различных типов по описанию предметной области</li>
                  <li>Управление проектами и диаграммами</li>
                </ul>
              </div>
            </div>

            {/* Блок 2: Типы диаграмм */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Доступные типы диаграмм
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>
                  В текущей версии доступны следующие типы диаграмм:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Блок-схемы (Flowchart)</li>
                  <li>Диаграммы классов UML (UML Class Diagram)</li>
                  <li>Диаграммы последовательности UML (UML Sequence Diagram)</li>
                  <li>Диаграммы состояний UML (UML State Diagram)</li>
                  <li>Диаграммы ER (Entity Relationship)</li>
                  <li>Диаграммы DFD (Data Flow Diagram)</li>
                  <li>Диаграммы IDEF0</li>
                  <li>Диаграммы BPMN</li>
                </ul>
              </div>
            </div>

            {/* Блок 3: Форматы документов */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Поддерживаемые форматы документов
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>
                  Система поддерживает загрузку и обработку следующих типов файлов:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>PDF документы (.pdf)</li>
                  <li>Документы Microsoft Word (.docx)</li>
                  <li>Таблицы Microsoft Excel (.xlsx)</li>
                  <li>Текстовые файлы (.txt)</li>
                </ul>
              </div>
            </div>

            {/* Блок 4: Технические детали */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Технические детали
              </h3>
              <div className="space-y-3 text-gray-700 text-base leading-relaxed">
                <p>
                  Дата сборки: 01.12.2025
                </p>
                <p>
                  Система использует современные веб-технологии для обеспечения удобного и быстрого интерфейса.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
