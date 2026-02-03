// Создаем страницу автоматического создания новой диаграммы с перенаправлением на страницу диаграммы
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, diagrams as diagramsStorage } from '@/lib/storage';

export default function NewDiagramPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProject = searchParams.get('fromProject');

  useEffect(() => {
    const createDiagram = () => {
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        // Получаем все диаграммы для определения номера
        const catalogDiagrams = diagramsStorage.getAll(currentUser.id);
        const totalDiagrams = catalogDiagrams.length;
        const diagramNumber = totalDiagrams + 1;
        
        // Создаем диаграмму с автоматическим названием
        const newDiagram = diagramsStorage.create({
          name: `Диаграмма ${diagramNumber}`,
          description: '',
          user_id: currentUser.id,
        });

        // Перенаправляем в каталог типов диаграмм (с fromProject при переходе из проекта)
        const query = fromProject ? `?fromProject=${fromProject}` : '';
        router.push(`/diagrams/${newDiagram.id}${query}`);
      } catch (error) {
        console.error('Ошибка при создании диаграммы:', error);
        alert('Не удалось создать диаграмму. Попробуйте еще раз.');
        router.push('/diagrams');
      }
    };

    createDiagram();
  }, [router, fromProject]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
}
