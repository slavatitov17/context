'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, projects as projectsStorage } from '@/lib/storage';
import { useParams } from 'next/navigation';

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!projectId) return;

    const loadProject = () => {
      try {
        setLoading(true);
        
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const project = projectsStorage.getById(projectId, currentUser.id);
        if (!project) {
          router.push('/projects');
          return;
        }

        setProjectName(project.name || '');
        setDescription(project.description || '');
      } catch (error) {
        console.error('Ошибка при загрузке проекта:', error);
        router.push('/projects');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, router]);

  const handleSave = () => {
    if (!projectName.trim() || !user) return;

    try {
      setSaving(true);
      const updated = projectsStorage.update(projectId, user.id, {
        name: projectName.trim(),
        description: description.trim(),
      });

      if (updated) {
        router.push('/projects');
      } else {
        throw new Error('Не удалось обновить проект');
      }
    } catch (error) {
      console.error('Ошибка при сохранении проекта:', error);
      alert('Не удалось сохранить изменения. Попробуйте еще раз.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/projects');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-medium mb-2">Редактирование проекта</h1>
        <p className="text-gray-600 text-base">Измените информацию о проекте</p>
      </div>

      <div className="space-y-6">
        {/* Информация о полях */}
        <p className="text-gray-500 text-base">* - обязательные поля</p>

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
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-900 mb-3">
            Краткое описание проекта
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Введите описание проекта..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={saving}
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-base font-medium"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!projectName.trim() || saving}
            className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base font-medium"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
