import './globals.css';
import LayoutWrapper from './components/LayoutWrapper';
import { LanguageProvider } from './contexts/LanguageContext';

export const metadata = {
  title: 'Context: анализ файлов и создание диаграмм',
  description: 'Анализ файлов и создание диаграмм',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <LanguageProvider>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </LanguageProvider>
    </html>
  );
}