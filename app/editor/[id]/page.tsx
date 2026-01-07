'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { auth, editorDiagrams, type EditorDiagram } from '@/lib/storage';

export default function EditorDiagramViewPage() {
  const [diagram, setDiagram] = useState<EditorDiagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const checkUser = () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        loadDiagram(currentUser.id);
      } else {
        setLoading(false);
        router.push('/login');
      }
    };

    checkUser();
    const interval = setInterval(checkUser, 1000);
    return () => clearInterval(interval);
  }, [router, params.id]);

  const loadDiagram = (userId: string) => {
    try {
      setLoading(true);
      const diagramId = params.id as string;
      const foundDiagram = editorDiagrams.getById(diagramId, userId);
      
      if (!foundDiagram) {
        router.push('/editor');
        return;
      }
      
      setDiagram(foundDiagram);
    } catch (error) {
      console.error('Ошибка при загрузке диаграммы:', error);
      router.push('/editor');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getDiagramTypeName = (diagramType: string): string => {
    const typeNames: Record<string, string> = {
      'IDEF0': 'IDEF0',
      'DFD': 'DFD',
      'BPMN': 'BPMN',
      'Custom': 'Пользовательская',
    };
    return typeNames[diagramType] || diagramType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!diagram) {
    return null;
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-medium mb-2">{diagram.name}</h1>
          <p className="text-gray-600">{diagram.description || 'Без описания'}</p>
        </div>
        <Link href={`/editor/${diagram.id}/edit`}>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Редактировать
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Тип диаграммы:</span>
              <p className="font-medium text-gray-900">{getDiagramTypeName(diagram.diagramType)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Дата создания:</span>
              <p className="font-medium text-gray-900">{formatDate(diagram.created_at)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Дата обновления:</span>
              <p className="font-medium text-gray-900">{formatDate(diagram.updated_at)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Количество страниц:</span>
              <p className="font-medium text-gray-900">{diagram.pages.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <i className="fas fa-pen-ruler text-4xl mb-4"></i>
            <p>Для редактирования диаграммы нажмите кнопку "Редактировать"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
