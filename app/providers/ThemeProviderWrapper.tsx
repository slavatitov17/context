// Создаем обертку для ThemeProvider, чтобы использовать его в серверных компонентах
'use client';

import { ThemeProvider } from '@/app/contexts/ThemeContext';

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
