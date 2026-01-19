// Создаем обертку для LanguageProvider, чтобы использовать его в серверных компонентах
'use client';

import { LanguageProvider } from '@/app/contexts/LanguageContext';

export default function LanguageProviderWrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
