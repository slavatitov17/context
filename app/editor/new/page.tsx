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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-medium mb-8">Создать новую диаграмму</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Название диаграммы *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите название диаграммы"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите описание диаграммы"
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="diagramType" className="block text-sm font-medium text-gray-700 mb-2">
            Тип диаграммы
          </label>
          <select
            id="diagramType"
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as EditorDiagramType)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Custom">Пользовательская</option>
            <option value="IDEF0">IDEF0</option>
            <option value="DFD">DFD (Data Flow Diagram)</option>
            <option value="BPMN">BPMN (Business Process Model and Notation)</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Создание...' : 'Создать диаграмму'}
          </button>
        </div>
      </form>
    </div>
  );
}
