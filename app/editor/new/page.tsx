'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, editorDiagrams, diagrams as diagramsStorage } from '@/lib/storage';

export default function NewEditorDiagramPage() {
  const router = useRouter();

  useEffect(() => {
    const createDiagram = () => {
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        // Получаем все диаграммы (каталог + редактор) для определения номера
        const catalogDiagrams = diagramsStorage.getAll(currentUser.id);
        const editorDiagramsList = editorDiagrams.getAll(currentUser.id);
        const totalDiagrams = catalogDiagrams.length + editorDiagramsList.length;
        const diagramNumber = totalDiagrams + 1;
        
        // Создаем редакторскую диаграмму с автоматическим названием
        const newDiagram = editorDiagrams.create({
          name: `Диаграмма ${diagramNumber}`,
          description: '',
          user_id: currentUser.id,
          diagramType: 'Custom',
          pages: [],
        });

        // Перенаправляем в редактор
        router.push(`/editor/${newDiagram.id}/edit`);
      } catch (error) {
        console.error('Ошибка при создании диаграммы:', error);
        alert('Не удалось создать диаграмму. Попробуйте еще раз.');
        router.push('/diagrams');
      }
    };

    createDiagram();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Создание диаграммы...</div>
    </div>
  );
}
