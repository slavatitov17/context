// Модальное окно подтверждения отправки сообщения в поддержку (наш дизайн)
'use client';

import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface SupportSentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportSentModal({ isOpen, onClose }: SupportSentModalProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative rounded-xl p-6 max-w-md w-full shadow-xl z-10 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`text-xl font-medium mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {t('supportSent.title')}
        </h2>
        <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('supportSent.message')}
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
          >
            {t('supportSent.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
