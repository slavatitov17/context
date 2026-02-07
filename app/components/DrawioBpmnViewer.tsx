'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface DrawioBpmnViewerProps {
  xml: string;
  className?: string;
}

const DRAWIO_EMBED_URL = 'https://embed.diagrams.net/?embed=1&proto=json&spin=1&noSaveBtn=1&noExitBtn=1';

export default function DrawioBpmnViewer({ xml, className = '' }: DrawioBpmnViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== 'https://embed.diagrams.net') return;
    const data = typeof event.data === 'string' ? (() => { try { return JSON.parse(event.data); } catch { return null; } })() : event.data;
    if (!data) return;
    if (data.event === 'init') {
      setReady(true);
      setLoadError(null);
    }
    if (data.event === 'load' && data.error) {
      setLoadError(data.error || 'Не удалось загрузить диаграмму');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    if (!xml || !ready || !iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ action: 'load', xml }),
        'https://embed.diagrams.net'
      );
    } catch {
      setLoadError('Ошибка отправки данных в draw.io');
    }
  }, [xml, ready]);

  if (loadError) {
    return (
      <div className={`rounded border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm ${className}`}>
        draw.io не смог отобразить этот XML. Переключитесь на «Код» для просмотра BPMN 2.0 или импортируйте файл в draw.io (Файл → Импорт).
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={DRAWIO_EMBED_URL}
      title="draw.io BPMN"
      className={`min-h-[400px] w-full rounded border border-gray-200 bg-white ${className}`}
      style={{ height: '500px' }}
      onLoad={() => setReady(true)}
    />
  );
}
