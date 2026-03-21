'use client';

import { useState, useRef, useEffect } from 'react';

const COPIED_MS = 2500;

type Props = {
  defaultLabel: string;
  copiedLabel: string;
  onCopy: () => void | Promise<void>;
  isDark?: boolean;
  disabled?: boolean;
  /** toolbar = серая кнопка как «Скачать PNG»; projectPrimary = синяя заливка как старая «Сообщить об ошибке» */
  variant?: 'toolbar' | 'projectPrimary';
};

export function FeedbackCopyButton({
  defaultLabel,
  copiedLabel,
  onCopy,
  isDark = false,
  disabled = false,
  variant = 'toolbar',
}: Props) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const handleClick = async () => {
    if (disabled || copied) return;
    try {
      await Promise.resolve(onCopy());
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch (e) {
      console.error(e);
    }
  };

  if (copied) {
    return (
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
          isDark
            ? 'bg-green-900/35 text-green-300 border-green-700'
            : 'bg-green-100 text-green-800 border-green-200'
        }`}
        role="status"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {copiedLabel}
      </span>
    );
  }

  const toolbar = isDark
    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  const projectPrimary = isDark
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-blue-600 text-white hover:bg-blue-700';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
        variant === 'projectPrimary' ? projectPrimary : toolbar
      }`}
    >
      {defaultLabel}
    </button>
  );
}
