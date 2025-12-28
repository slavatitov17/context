'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDiagramPage() {
  const [diagramName, setDiagramName] = useState('');
  const router = useRouter();

  const handleCreate = () => {
    if (diagramName.trim()) {
      const diagramId = diagramName.toLowerCase().replace(/\s+/g, '-');
      router.push(`/diagrams/${diagramId}`);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-medium mb-2">Создание диаграммы</h1>
      <p className="text-gray-600 mb-8 text-base">Введите название для новой диаграммы</p>

      <div className="space-y-6">
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
          />
        </div>

        {/* Кнопка создания */}
        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleCreate}
            disabled={!diagramName.trim()}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-1 text-base font-medium"
          >
            Создать диаграмму
          </button>
        </div>

        {/* Информация о полях */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-gray-500 text-base">* - обязательные поля</p>
        </div>
      </div>
    </div>
  );
}