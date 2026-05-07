'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, diagrams as diagramsStorage } from '@/lib/storage';
import { useLanguage } from '@/app/contexts/LanguageContext';
import GraphicDiagramEditor from '@/app/components/mindmap-editor/GraphicDiagramEditor';

export default function DiagramGraphicEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const diagramId = params?.id as string;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!diagramId) {
      router.replace('/diagrams');
      return;
    }

    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const diagram = diagramsStorage.getById(diagramId, currentUser.id);
    if (!diagram) {
      router.replace('/diagrams');
      return;
    }

    if (diagram.diagramType !== 'MindMapCanva') {
      router.replace(`/diagrams/${diagramId}`);
      return;
    }

    setReady(true);
  }, [diagramId, router]);

  if (!ready) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center text-gray-500">
        {t('common.loading')}
      </div>
    );
  }

  return <GraphicDiagramEditor diagramId={diagramId} />;
}
