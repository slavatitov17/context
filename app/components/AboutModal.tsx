// Создаем модальное окно "О системе" с информацией о приложении, политикой конфиденциальности и формой обратной связи
'use client';

import { useState, useRef, useEffect } from 'react';
import { auth } from '@/lib/storage';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import SupportSentModal from '@/app/components/SupportSentModal';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; file: File; preview?: string }>>([]);
  const [showSupportSentModal, setShowSupportSentModal] = useState(false);
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
    setEmail('');
    setMessage('');
    setAttachedFiles([]);
    setShowSupportSentModal(true);
  };

  const isFormValid = email.trim() !== '' && message.trim() !== '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Блюр фон */}
      <div 
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}
        onClick={onClose}
      />
      
      {/* Модальное окно */}
      <div 
        className={`relative rounded-xl p-6 max-w-2xl w-full shadow-xl z-10 max-h-[90vh] overflow-y-auto hide-scrollbar ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
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
                <span className="relative z-10">{t('about.back')}</span>
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
            <h2 className={`text-xl font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {showPrivacy ? t('about.privacy') : t('about.version')}
            </h2>
          </div>
        ) : (
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('about.title')}
            </h2>
            <button
              onClick={onClose}
              className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
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
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('about.context')}
              </h3>
              <div className="space-y-4">
                <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('about.description')}{' '}
                  <button
                    onClick={() => setShowPrivacy(true)}
                    className="text-blue-600 hover:underline"
                  >
                    {t('about.privacyLink')}
                  </button>
                </p>
                <div>
                  <p className={`text-xl font-medium mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('about.versionLabel')}</p>
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
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} ref={formRef}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('about.support')}</h3>
              
              <form onSubmit={handleSubmit}>
                {/* Поле Email */}
                <div className="mb-4">
                  <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {t('about.support.email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder:text-gray-400' : 'border-gray-300 text-gray-900 placeholder:text-gray-500'}`}
                    placeholder={t('about.support.placeholder.email')}
                  />
                </div>

                {/* Поле Сообщение */}
                <div className="mb-6">
                  <label className={`block font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {t('about.support.message')}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={3}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${isDark ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder:text-gray-400' : 'border-gray-300 text-gray-900 placeholder:text-gray-500'}`}
                    placeholder={t('about.support.placeholder.message')}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`text-base font-medium flex items-center hover:text-blue-600 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
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
                        <div key={fileData.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'}`}>
                          {fileData.preview ? (
                            <img src={fileData.preview} alt={fileData.file.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className={`w-12 h-12 rounded flex items-center justify-center ${isDark ? 'bg-gray-500' : 'bg-gray-200'}`}>
                              <i className={`fas fa-file ${isDark ? 'text-gray-300' : 'text-gray-400'}`}></i>
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
                  {t('about.support.send')}
                </button>
              </form>
            </div>
          </div>
        ) : showPrivacy ? (
          <div className="space-y-6">
            {/* Политика конфиденциальности */}
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('privacy.section1.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  {t('privacy.section1.text1')}
                </p>
                <p>
                  {t('privacy.section1.text2')}
                </p>
              </div>
            </div>

            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('privacy.section2.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>{t('privacy.section2.text1')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.section2.item1')}</li>
                  <li>{t('privacy.section2.item2')}</li>
                  <li>{t('privacy.section2.item3')}</li>
                  <li>{t('privacy.section2.item4')}</li>
                </ul>
              </div>
            </div>

            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('privacy.section3.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>{t('privacy.section3.text1')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.section3.item1')}</li>
                  <li>{t('privacy.section3.item2')}</li>
                  <li>{t('privacy.section3.item3')}</li>
                  <li>{t('privacy.section3.item4')}</li>
                  <li>{t('privacy.section3.item5')}</li>
                  <li>{t('privacy.section3.item6')}</li>
                  <li>{t('privacy.section3.item7')}</li>
                </ul>
              </div>
            </div>

            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('privacy.section4.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  {t('privacy.section4.text1')}
                </p>
              </div>
            </div>

            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('privacy.section5.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  {t('privacy.section5.text1')}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.section5.item1')}</li>
                  <li>{t('privacy.section5.item2')}</li>
                  <li>{t('privacy.section5.item3')}</li>
                </ul>
              </div>
            </div>

            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('privacy.section6.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>{t('privacy.section6.text1')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.section6.item1')}</li>
                  <li>{t('privacy.section6.item2')}</li>
                  <li>{t('privacy.section6.item3')}</li>
                </ul>
                <p>
                  {t('privacy.section6.text2')}
                </p>
              </div>
            </div>

            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('privacy.section7.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  {t('privacy.section7.text1')}
                </p>
                <p>
                  {t('privacy.section7.text2')}
                </p>
              </div>
            </div>

            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('privacy.section8.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  {t('privacy.section8.text1')}
                </p>
                <p>
                  {t('privacy.section8.text2')}
                </p>
              </div>
            </div>

            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('privacy.section9.title')}
              </h3>
              <div className={`space-y-4 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  {t('privacy.section9.text1')}
                </p>
              </div>
            </div>
          </div>
        ) : showVersion ? (
          <div className="space-y-6">
            {/* Блок 1: Основные возможности */}
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('version.features.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  {t('version.features.text1')}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('version.features.item1')}</li>
                  <li>{t('version.features.item2')}</li>
                  <li>{t('version.features.item3')}</li>
                  <li>{t('version.features.item4')}</li>
                </ul>
              </div>
            </div>

            {/* Блок 2: Типы диаграмм */}
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('version.diagrams.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  {t('version.diagrams.text1')}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('version.diagrams.item1')}</li>
                  <li>{t('version.diagrams.item2')}</li>
                  <li>{t('version.diagrams.item3')}</li>
                  <li>{t('version.diagrams.item4')}</li>
                  <li>{t('version.diagrams.item5')}</li>
                  <li>{t('version.diagrams.item6')}</li>
                </ul>
              </div>
            </div>

            {/* Блок 3: Форматы документов */}
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('version.formats.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  {t('version.formats.text1')}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('version.formats.item1')}</li>
                  <li>{t('version.formats.item2')}</li>
                  <li>{t('version.formats.item3')}</li>
                  <li>{t('version.formats.item4')}</li>
                </ul>
              </div>
            </div>

            {/* Блок 4: Технические детали */}
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('version.technical.title')}
              </h3>
              <div className={`space-y-3 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  {t('version.technical.text1')}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('version.technical.item1')}</li>
                  <li>{t('version.technical.item2')}</li>
                  <li>{t('version.technical.item3')}</li>
                  <li>{t('version.technical.item4')}</li>
                  <li>{t('version.technical.item5')}</li>
                  <li>{t('version.technical.item6')}</li>
                  <li>{t('version.technical.item8')}</li>
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <SupportSentModal isOpen={showSupportSentModal} onClose={() => setShowSupportSentModal(false)} />
    </div>
  );
}
