'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  auth,
  diagrams as diagramsStorage,
  projects as projectsStorage,
  type ProcessedDocument,
} from '@/lib/storage';
import { useLanguage } from '@/app/contexts/LanguageContext';
import GraphicDiagramEditor, {
  type GraphicEditorProjectFile,
} from '@/app/components/mindmap-editor/GraphicDiagramEditor';

export default function DiagramGraphicEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const diagramId = params?.id as string;
  const fromProject = searchParams.get('fromProject');
  const [ready, setReady] = useState(false);
  const [projectFiles, setProjectFiles] = useState<GraphicEditorProjectFile[]>([]);
  const [projectDocuments, setProjectDocuments] = useState<ProcessedDocument[]>([]);

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

    const projectId = fromProject || diagram.selectedProject || null;
    if (projectId) {
      const project = projectsStorage.getById(projectId, currentUser.id);
      if (project) {
        const files: GraphicEditorProjectFile[] = Array.isArray(project.files)
          ? project.files.map((f: any) => ({
              name: typeof f?.name === 'string' ? f.name : 'Документ',
              size: typeof f?.size === 'number' ? f.size : 0,
            }))
          : [];
        setProjectFiles(files);
        setProjectDocuments(
          Array.isArray(project.processedDocuments) ? project.processedDocuments : []
        );
      }
    }

    setReady(true);
  }, [diagramId, fromProject, router]);

  if (!ready) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center text-gray-500">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <GraphicDiagramEditor
      diagramId={diagramId}
      projectFiles={projectFiles}
      projectDocuments={projectDocuments}
    />
  );
}
