// Модальное окно подтверждения удаления (проекты, диаграммы, папки)
'use client';

import { useTheme } from '@/app/contexts/ThemeContext';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onBack: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  backLabel?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  message,
  onBack,
  onConfirm,
  confirmLabel = 'Удалить',
  backLabel = 'Назад',
}: DeleteConfirmModalProps) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}
        onClick={onBack}
        aria-hidden
      />
      <div
        className={`relative rounded-xl p-6 max-w-md w-full shadow-xl z-10 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`text-xl font-medium mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {title}
        </h2>
        <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            {backLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
