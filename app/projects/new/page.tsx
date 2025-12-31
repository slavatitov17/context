'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, projects as projectsStorage } from '@/lib/storage';

export default function NewProjectPage() {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState('');
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
    if (!projectName.trim() || !user) return;

    try {
      setLoading(true);
      
      const newProject = projectsStorage.create({
        name: projectName.trim(),
        description: description.trim(),
        members: members.trim(),
        user_id: user.id,
        files: [],
        messages: [],
      });

      router.push(`/projects/${newProject.id}`);
    } catch (error) {
      console.error('Ошибка при создании проекта:', error);
      alert('Не удалось создать проект. Попробуйте еще раз.');
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
          <p className="text-gray-500 mt-2 text-base">Например: Иван Иванов, Петр Петров</p>
        </div>

        {/* Кнопка создания */}
        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleCreate}
            disabled={!projectName.trim() || loading}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-1 text-base font-medium"
          >
            {loading ? 'Создание...' : 'Перейти к загрузке документов'}
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
