'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState('');
  const router = useRouter();

  const handleCreate = () => {
    if (projectName.trim()) {
      const projectId = projectName.toLowerCase().replace(/\s+/g, '-');
      router.push(`/projects/${projectId}`);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-medium mb-2">Создание проекта</h1>
      <p className="text-gray-600 mb-8 text-base">Заполните основную информацию о проекте</p>

      <div className="space-y-6">
        {/* Название проекта */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-3">
            Название проекта *
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Введите название проекта..."
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Описание проекта */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-3">
            Краткое описание проекта
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите цель проекта..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Участники проекта */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-3">
            Участники проекта
          </label>
          <input
            type="text"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            placeholder="Введите имена участников через запятую..."
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-gray-500 mt-2 text-base">Например: Иван Иванов, Петр Петров</p>
        </div>

        {/* Кнопка создания */}
        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleCreate}
            disabled={!projectName.trim()}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-1 text-base font-medium"
          >
            Загрузить файлы
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