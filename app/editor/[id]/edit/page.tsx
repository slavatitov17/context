'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, editorDiagrams, type EditorDiagram, type EditorPage, type EditorElement } from '@/lib/storage';
import EditorCanvas from '@/app/components/EditorCanvas';

export default function EditorEditPage() {
  const [diagram, setDiagram] = useState<EditorDiagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<EditorPage | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      
      // Устанавливаем текущую страницу
      const pageId = foundDiagram.currentPageId || foundDiagram.pages[0]?.id;
      const page = foundDiagram.pages.find(p => p.id === pageId) || foundDiagram.pages[0];
      if (page) {
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Ошибка при загрузке диаграммы:', error);
      router.push('/editor');
    } finally {
      setLoading(false);
    }
  };

  const saveDiagram = useCallback(() => {
    if (!diagram || !user) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Сохраняем сразу, без задержки, чтобы элементы не исчезали
    try {
      editorDiagrams.update(diagram.id, user.id, {
        pages: diagram.pages,
        currentPageId: currentPage?.id,
      });
    } catch (error) {
      console.error('Ошибка при сохранении диаграммы:', error);
    }
  }, [diagram, user, currentPage]);

  const updatePage = useCallback((updatedPage: EditorPage) => {
    if (!diagram) return;

    const updatedPages = diagram.pages.map(p => 
      p.id === updatedPage.id ? updatedPage : p
    );

    setDiagram({
      ...diagram,
      pages: updatedPages,
    });

    if (currentPage?.id === updatedPage.id) {
      setCurrentPage(updatedPage);
    }

    saveDiagram();
  }, [diagram, currentPage, saveDiagram]);

  const addElement = useCallback((element: EditorElement) => {
    if (!currentPage) return;

    const updatedPage: EditorPage = {
      ...currentPage,
      elements: [...currentPage.elements, element],
    };

    updatePage(updatedPage);
  }, [currentPage, updatePage]);

  const updateElement = useCallback((elementId: string, updates: Partial<EditorElement>) => {
    if (!currentPage) return;

    const updatedElements = currentPage.elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );

    const updatedPage: EditorPage = {
      ...currentPage,
      elements: updatedElements,
    };

    updatePage(updatedPage);
  }, [currentPage, updatePage]);

  const deleteElement = useCallback((elementId: string) => {
    if (!currentPage) return;

    const updatedPage: EditorPage = {
      ...currentPage,
      elements: currentPage.elements.filter(el => el.id !== elementId),
    };

    updatePage(updatedPage);
    setSelectedElementId(null);
  }, [currentPage, updatePage]);

  const addPage = useCallback(() => {
    if (!diagram) return;

    const newPage: EditorPage = {
      id: `page_${Date.now()}`,
      name: `Страница ${diagram.pages.length + 1}`,
      elements: [],
      width: 1920,
      height: 1080,
      background: '#ffffff',
    };

    setDiagram({
      ...diagram,
      pages: [...diagram.pages, newPage],
      currentPageId: newPage.id,
    });

    setCurrentPage(newPage);
    setSelectedElementId(null);
    saveDiagram();
  }, [diagram, saveDiagram]);

  const switchPage = useCallback((pageId: string) => {
    if (!diagram) return;

    const page = diagram.pages.find(p => p.id === pageId);
    if (page) {
      setCurrentPage(page);
      setDiagram({
        ...diagram,
        currentPageId: pageId,
      });
      setSelectedElementId(null);
      saveDiagram();
    }
  }, [diagram, saveDiagram]);

  const updatePageName = useCallback((pageId: string, name: string) => {
    if (!diagram) return;

    const updatedPages = diagram.pages.map(p =>
      p.id === pageId ? { ...p, name } : p
    );

    setDiagram({
      ...diagram,
      pages: updatedPages,
    });

    if (currentPage?.id === pageId) {
      setCurrentPage({ ...currentPage, name });
    }

    saveDiagram();
  }, [diagram, currentPage, saveDiagram]);

  const deletePage = useCallback((pageId: string) => {
    if (!diagram || diagram.pages.length <= 1) return;

    const updatedPages = diagram.pages.filter(p => p.id !== pageId);
    const newCurrentPage = updatedPages[0];

    setDiagram({
      ...diagram,
      pages: updatedPages,
      currentPageId: newCurrentPage.id,
    });

    setCurrentPage(newCurrentPage);
    setSelectedElementId(null);
    saveDiagram();
  }, [diagram, saveDiagram]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!diagram || !currentPage) {
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <EditorCanvas
        diagram={diagram}
        currentPage={currentPage}
        selectedElementId={selectedElementId}
        onSelectElement={setSelectedElementId}
        onUpdatePage={updatePage}
        onAddElement={addElement}
        onUpdateElement={updateElement}
        onDeleteElement={deleteElement}
        onAddPage={addPage}
        onSwitchPage={switchPage}
        onDeletePage={deletePage}
        onUpdatePageName={updatePageName}
        onBack={() => router.push('/editor')}
      />
    </div>
  );
}
