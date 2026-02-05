'use client';

import { useEffect, useRef, useState } from 'react';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';

export default function BpmnViewer({ bpmnXml, className = '' }: { bpmnXml: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bpmnXml.trim() || !containerRef.current) return;

    const initViewer = async () => {
      setError(null);
      try {
        const BpmnViewerClass = (await import('bpmn-js')).default;
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
        const container = containerRef.current;
        if (!container) return;
        const viewer = new BpmnViewerClass({ container });
        viewerRef.current = viewer;
        await viewer.importXML(bpmnXml);
        const canvas = viewer.get('canvas') as { zoom?: (value: string) => void } | undefined;
        if (canvas?.zoom) {
          canvas.zoom('fit-viewport');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      }
    };

    initViewer();
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [bpmnXml]);

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 ${className}`}>
        <p className="font-medium">Ошибка отображения BPMN</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 320, height: 320 }}
    />
  );
}
