// Создаем страницу с информацией о версии приложения и доступном функционале
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/storage';

export default function VersionPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const user = auth.getCurrentUser();
      setIsAuthenticated(!!user && auth.hasSession());
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={isAuthenticated ? 'max-w-2xl' : 'max-w-2xl mx-auto'}>
      {/* Верхний блок: заголовок, описание */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        {!isAuthenticated && (
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group relative mb-6"
          >
            <i className="fas fa-arrow-left text-sm"></i>
            <span className="relative z-10">Назад</span>
            {/* Подчеркивание при наведении */}
            <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
          </button>
        )}
        <h1 className="text-3xl font-medium mb-2">Версия 1.0.0</h1>
        <p className="text-gray-600 text-base">
          Описание доступного функционала
        </p>
      </div>

      <div className="space-y-6">
        {/* Блок 1: Основные возможности */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Основные возможности
          </h2>
          <div className="space-y-3 text-gray-700 text-base leading-relaxed">
            <p>
              CASE-средство Context позволяет быстрее анализировать документы и создавать диаграммы по текстовому описанию. Возможности:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Загрузка документов различных форматов (PDF, DOCX и другие)</li>
              <li>Анализ и выдача ответов на вопросы по загруженным документам</li>
              <li>Создание и экспорт диаграмм различных типов (UML, ER и другие)</li>
              <li>Создание глоссария и кода (PlantUML) диаграмм различных типов</li>
            </ul>
          </div>
        </div>

        {/* Блок 2: Типы диаграмм */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Доступные типы диаграмм
          </h2>
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
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Поддерживаемые форматы документов
          </h2>
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
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Технические детали
          </h2>
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
    </div>
  );
}
