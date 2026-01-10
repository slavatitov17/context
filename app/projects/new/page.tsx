'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, projects as projectsStorage } from '@/lib/storage';

export default function NewProjectPage() {
  const router = useRouter();

  useEffect(() => {
    const createProject = () => {
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        // Получаем все проекты пользователя для определения номера
        const userProjects = projectsStorage.getAll(currentUser.id);
        const projectNumber = userProjects.length + 1;
        
        // Создаем проект с автоматическим названием
        const newProject = projectsStorage.create({
          name: `Проект ${projectNumber}`,
          description: '',
          user_id: currentUser.id,
          files: [],
          messages: [],
        });

        // Перенаправляем в чат проекта
        router.push(`/projects/${newProject.id}`);
      } catch (error) {
        console.error('Ошибка при создании проекта:', error);
        alert('Не удалось создать проект. Попробуйте еще раз.');
        router.push('/projects');
      }
    };

    createProject();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-gray-500 text-base">Создание проекта...</div>
      </div>
    </div>
  );
}
