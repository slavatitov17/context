'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/storage';

export default function EditorDiagramViewPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const checkUser = () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        // Сразу редиректим на страницу редактирования
        router.push(`/editor/${params.id}/edit`);
      } else {
        router.push('/login');
      }
    };

    checkUser();
  }, [router, params.id]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Загрузка...</div>
    </div>
  );
}
