'use client';

import { useEffect, useRef, useState } from 'react';

interface BpmnViewerProps {
  xml: string;
  className?: string;
}

export default function BpmnViewer({ xml, className = '' }: BpmnViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!xml || !containerRef.current) return;

    let viewer: import('bpmn-js').default | null = null;

    const init = async () => {
      try {
        const BpmnJS = (await import('bpmn-js')).default;
        viewer = new BpmnJS({
          container: containerRef.current!,
        });
        await viewer.importXML(xml);
        (viewer as any).get('canvas').zoom('fit-viewport');
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка отображения BPMN');
      }
    };

    init();
    return () => {
      if (viewer) viewer.destroy();
    };
  }, [xml]);

  if (error) {
    return (
      <div className={`rounded border border-red-200 bg-red-50 p-4 text-red-700 ${className}`}>
        Не удалось отобразить BPMN: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`bpmn-viewer min-h-[400px] rounded border border-gray-200 bg-white ${className}`}
    />
  );
}
