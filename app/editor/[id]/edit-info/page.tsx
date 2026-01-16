'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, editorDiagrams } from '@/lib/storage';
import { useParams } from 'next/navigation';

export default function EditEditorDiagramPage() {
  const params = useParams();
  const diagramId = params?.id as string;
  const [diagramName, setDiagramName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!diagramId) return;

    const loadDiagram = () => {
      try {
        setLoading(true);
        
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const diagram = editorDiagrams.getById(diagramId, currentUser.id);
        if (!diagram) {
          router.push('/diagrams');
          return;
        }

        setDiagramName(diagram.name || '');
        setDescription(diagram.description || '');
      } catch (error) {
        console.error('Ошибка при загрузке диаграммы:', error);
        router.push('/diagrams');
      } finally {
        setLoading(false);
      }
    };

    loadDiagram();
  }, [diagramId, router]);

  const handleSave = () => {
    if (!diagramName.trim() || !user) return;

    try {
      setSaving(true);
      const updated = editorDiagrams.update(diagramId, user.id, {
        name: diagramName.trim(),
        description: description.trim(),
      });

      if (updated !== null) {
        router.push('/diagrams');
      } else {
        throw new Error('Не удалось обновить диаграмму');
      }
    } catch (error) {
      console.error('Ошибка при сохранении диаграммы:', error);
      alert('Не удалось сохранить изменения. Попробуйте еще раз.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/diagrams');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-medium mb-2">Редактирование диаграммы</h1>
        <p className="text-gray-600 text-base">Измените информацию о диаграмме</p>
      </div>

      <div className="space-y-6">
        {/* Информация о полях */}
        <p className="text-gray-500 text-base">* - обязательные поля</p>

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
            disabled={saving}
          />
        </div>

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
            disabled={!diagramName.trim() || saving}
            className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base font-medium"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
