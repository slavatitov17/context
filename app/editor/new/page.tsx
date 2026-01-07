'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, editorDiagrams, type EditorDiagramType } from '@/lib/storage';
import { createIDEF0Template, createDFDTemplate, createBPMNTemplate } from '@/lib/editor-templates';

export default function NewEditorDiagramPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [diagramType, setDiagramType] = useState<EditorDiagramType>('Custom');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
    };

    checkUser();
    const interval = setInterval(checkUser, 1000);
    return () => clearInterval(interval);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !name.trim()) {
      alert('Заполните название диаграммы');
      return;
    }

    setLoading(true);
    try {
      let initialPage;
      if (diagramType === 'IDEF0') {
        initialPage = createIDEF0Template();
      } else if (diagramType === 'DFD') {
        initialPage = createDFDTemplate();
      } else if (diagramType === 'BPMN') {
        initialPage = createBPMNTemplate();
      }

      const newDiagram = editorDiagrams.create({
        name: name.trim(),
        description: description.trim(),
        user_id: user.id,
        diagramType,
        pages: initialPage ? [initialPage] : [],
      });

      router.push(`/editor/${newDiagram.id}/edit`);
    } catch (error) {
      console.error('Ошибка при создании диаграммы:', error);
      alert('Не удалось создать диаграмму. Попробуйте еще раз.');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-medium mb-2">Создание диаграммы</h1>
        <p className="text-gray-600 text-base">Заполните основную информацию о диаграмме</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Информация о полях */}
        <p className="text-gray-500 text-base">* - обязательные поля</p>

        {/* Название диаграммы */}
        <div>
          <label htmlFor="name" className="block text-lg font-medium text-gray-900 mb-3">
            Название диаграммы *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите название диаграммы..."
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            required
          />
        </div>

        {/* Описание диаграммы */}
        <div>
          <label htmlFor="description" className="block text-lg font-medium text-gray-900 mb-3">
            Краткое описание диаграммы
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Введите описание диаграммы..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {/* Тип диаграммы */}
        <div>
          <label htmlFor="diagramType" className="block text-lg font-medium text-gray-900 mb-3">
            Тип диаграммы
          </label>
          <select
            id="diagramType"
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as EditorDiagramType)}
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
            disabled={loading}
          >
            <option value="Custom">Пользовательская</option>
            <option value="IDEF0">IDEF0</option>
            <option value="DFD">DFD (Data Flow Diagram)</option>
            <option value="BPMN">BPMN (Business Process Model and Notation)</option>
          </select>
        </div>

        {/* Кнопка создания */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-1 text-base font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>Создание диаграммы...</span>
              </>
            ) : (
              'Создать диаграмму'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
