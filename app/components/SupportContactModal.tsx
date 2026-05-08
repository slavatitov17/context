'use client';

import { useEffect, useRef, useState } from 'react';
import { auth } from '@/lib/storage';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';

/** Модальное окно «Обратиться в поддержку» — тот же UI и поведение, что при «Сообщить об ошибке» на странице диаграммы. */
export default function SupportContactModal({
  isOpen,
  onClose,
  onSubmitSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}) {
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
      const user = auth.getCurrentUser();
      if (user?.email) {
        setEmail(user.email);
      }
    }
  }, [isOpen]);

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
            reader.onload = (ev) => {
              const id = `file-${Date.now()}-${Math.random()}`;
              setAttachedFiles((prev) => [
                ...prev,
                {
                  id,
                  file: new File([file], `screenshot-${Date.now()}.png`, { type: file.type }),
                  preview: ev.target?.result as string,
                },
              ]);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const id = `file-${Date.now()}-${Math.random()}`;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachedFiles((prev) => [...prev, { id, file, preview: e.target?.result as string }]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFiles((prev) => [...prev, { id, file }]);
      }
    });
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail('');
    setMessage('');
    setAttachedFiles([]);
    onClose();
    onSubmitSuccess?.();
  };

  const isFormValid = email.trim() !== '' && message.trim() !== '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}
        onClick={onClose}
        role="presentation"
      />

      <div
        className={`relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-xl hide-scrollbar ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-xl font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('diagram.contactSupport')}</h2>
          <button
            type="button"
            onClick={onClose}
            className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`mb-2 block font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('diagram.yourEmail')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full rounded-lg border p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder:text-gray-400'
                  : 'border-gray-300 text-gray-900'
              }`}
              placeholder="example@mail.com"
            />
          </div>

          <div className="mb-6">
            <label className={`mb-2 block font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('about.support.message')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className={`w-full resize-none rounded-lg border p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder:text-gray-400'
                  : 'border-gray-300 text-gray-900'
              }`}
              placeholder={t('about.support.placeholder.message')}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center text-base font-medium transition-colors ${
                  isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <i className="fas fa-paperclip mr-2 text-lg"></i>
                {t('about.support.attach')}
              </button>
              <input ref={fileInputRef} type="file" multiple onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
            </div>

            {attachedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachedFiles.map((fileData) => (
                  <div
                    key={fileData.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {fileData.preview ? (
                      <img src={fileData.preview} alt={fileData.file.name} className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className={`flex h-12 w-12 items-center justify-center rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <i className={`fas fa-file ${isDark ? 'text-gray-400' : 'text-gray-400'}`}></i>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{fileData.file.name}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatFileSize(fileData.file.size)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(fileData.id)}
                      className={`transition-colors ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className={`w-full rounded-lg py-3 font-medium transition-colors ${
              isFormValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : isDark
                  ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                  : 'cursor-not-allowed bg-gray-300 text-gray-500'
            }`}
          >
            {t('diagram.send')}
          </button>
        </form>
      </div>
    </div>
  );
}
