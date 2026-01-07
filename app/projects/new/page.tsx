'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, projects as projectsStorage } from '@/lib/storage';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function NewProjectPage() {
  const { t } = useLanguage();
  const [projectName, setProjectName] = useState('');
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
    if (!projectName.trim() || !user) return;

    try {
      setLoading(true);
      
      const newProject = projectsStorage.create({
        name: projectName.trim(),
        description: description.trim(),
        user_id: user.id,
        files: [],
        messages: [],
      });

      router.push(`/projects/${newProject.id}`);
    } catch (error) {
      console.error('Ошибка при создании проекта:', error);
      alert(t.common.projectCreationError);
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-medium mb-2">{t.createProject.title}</h1>
        <p className="text-gray-600 text-base">{t.createProject.description}</p>
      </div>

      <div className="space-y-6">
        {/* Информация о полях */}
        <p className="text-gray-500 text-base">{t.common.requiredFields}</p>

        {/* Название проекта */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-3">
            {t.createProject.nameLabel} *
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={t.createProject.namePlaceholder}
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Описание проекта */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-3">
            {t.createProject.descriptionLabel}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.createProject.descriptionPlaceholder}
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {/* Кнопка создания */}
        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleCreate}
            disabled={!projectName.trim() || loading}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-1 text-base font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>{t.createProject.creating}</span>
              </>
            ) : (
              t.createProject.goToDocumentUpload
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
