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
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Создание проекта...</div>
    </div>
  );
}
