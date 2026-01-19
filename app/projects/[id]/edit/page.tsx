// Создаем страницу редактирования проекта с возможностью изменения названия и описания
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, projects as projectsStorage } from '@/lib/storage';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function EditProjectPage() {
  const { t } = useLanguage();
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
        <div className="text-gray-500">{t('project.loading')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-medium mb-2">{t('project.edit.title')}</h1>
        <p className="text-gray-600 text-base">{t('project.edit.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Информация о полях */}
        <p className="text-gray-500 text-base">{t('project.edit.requiredFields')}</p>

        <div>
          <label className="block text-lg font-medium text-gray-900 mb-3">
            {t('project.edit.name')} *
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={t('project.edit.namePlaceholder')}
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-900 mb-3">
            {t('project.edit.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('project.edit.descriptionPlaceholder')}
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
            {t('project.edit.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!projectName.trim() || saving}
            className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base font-medium"
          >
            {saving ? t('project.edit.saving') : t('project.edit.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
