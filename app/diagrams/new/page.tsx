'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, diagrams as diagramsStorage } from '@/lib/storage';

export default function NewDiagramPage() {
  const [diagramName, setDiagramName] = useState('');
  const [description, setDescription] = useState('');
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
  }, [router]);

  const handleCreate = () => {
    if (!diagramName.trim() || !user) return;

    try {
      setLoading(true);
      
      const newDiagram = diagramsStorage.create({
        name: diagramName.trim(),
        description: description.trim(),
        user_id: user.id,
      });

      router.push(`/diagrams/${newDiagram.id}`);
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

      <div className="space-y-6">
        {/* Информация о полях */}
        <p className="text-gray-500 text-base">* - обязательные поля</p>

        {/* Название диаграммы */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-3">
            Название диаграммы *
          </label>
          <input
            type="text"
            value={diagramName}
            onChange={(e) => setDiagramName(e.target.value)}
            placeholder="Введите название диаграммы..."
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Описание диаграммы */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-3">
            Краткое описание диаграммы
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Введите описание диаграммы..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {/* Кнопка создания */}
        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleCreate}
            disabled={!diagramName.trim() || loading}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-1 text-base font-medium"
          >
            {loading ? 'Создание...' : 'Создать диаграмму'}
          </button>
        </div>
      </div>
    </div>
  );
}
