'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/config';

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error || !data) {
          router.push('/projects');
          return;
        }

        if (data.user_id !== currentUser.id) {
          router.push('/projects');
          return;
        }

        setProjectName(data.name || '');
        setDescription(data.description || '');
        setMembers(data.members || '');
      } catch (error) {
        console.error('Ошибка при загрузке проекта:', error);
        router.push('/projects');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [params.id, router]);

  const handleSave = async () => {
    if (!projectName.trim() || !user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('projects')
        .update({
          name: projectName.trim(),
          description: description.trim(),
          members: members.trim(),
        })
        .eq('id', params.id);

      if (error) {
        throw error;
      }

      router.push(`/projects/${params.id}`);
    } catch (error) {
      console.error('Ошибка при сохранении проекта:', error);
      alert('Не удалось сохранить изменения. Попробуйте еще раз.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/projects/${params.id}`);
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
      <h1 className="text-3xl font-medium mb-2">Редактирование проекта</h1>
      <p className="text-gray-600 mb-8 text-base">Измените информацию о проекте</p>

      <div className="space-y-6">
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
            placeholder="Опишите цель проекта..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={saving}
          />
        </div>

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
            disabled={saving}
          />
          <p className="text-gray-500 mt-2 text-base">Например: Иван Иванов, Петр Петров</p>
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

        <div className="border-t border-gray-200 pt-4">
          <p className="text-gray-500 text-base">* - обязательные поля</p>
        </div>
      </div>
    </div>
  );
}
