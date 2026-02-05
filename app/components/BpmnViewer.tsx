'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';

const XSI_NS = 'http://www.w3.org/2001/XMLSchema-instance';
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 4;
const ZOOM_STEP = 1.25;

/** Добавляет xmlns:xsi в definitions, если в XML есть xsi:type и нет объявления. */
function ensureXsiNamespace(xml: string): string {
  if (!/xsi:type\b/i.test(xml) || /xmlns:xsi\s*=/i.test(xml)) return xml;
  return xml.replace(
    /(<bpmn:definitions)(\s[^>]*)?>/i,
    (_, tag, rest) => `${tag}${rest || ''} xmlns:xsi="${XSI_NS}" >`
  );
}

export default function BpmnViewer({ bpmnXml, className = '' }: { bpmnXml: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<{ get: (name: string) => { zoom: (a?: number | 'fit-viewport', b?: { x: number; y: number }) => number } } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const getCanvas = useCallback(() => {
    const v = viewerRef.current;
    return v?.get?.('canvas');
  }, []);

  const zoomIn = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    const current = canvas.zoom();
    if (typeof current === 'number') {
      canvas.zoom(Math.min(ZOOM_MAX, current * ZOOM_STEP));
    }
  }, [getCanvas]);

  const zoomOut = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    const current = canvas.zoom();
    if (typeof current === 'number') {
      canvas.zoom(Math.max(ZOOM_MIN, current / ZOOM_STEP));
    }
  }, [getCanvas]);

  const zoomFit = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    canvas.zoom('fit-viewport');
  }, [getCanvas]);

  const zoom100 = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    canvas.zoom(1);
  }, [getCanvas]);

  useEffect(() => {
    if (!bpmnXml.trim() || !containerRef.current) return;

    const initViewer = async () => {
      setError(null);
      setReady(false);
      try {
        const normalizedXml = ensureXsiNamespace(bpmnXml);
        const { layoutProcess } = await import('bpmn-auto-layout');
        let xmlToImport = normalizedXml;
        try {
          xmlToImport = await layoutProcess(normalizedXml);
        } catch (_) {
          // Если auto-layout не сработал, импортируем исходный XML
        }

        const { default: NavigatedViewer } = await import('bpmn-js/lib/NavigatedViewer');
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
        const container = containerRef.current;
        if (!container) return;
        const viewer = new NavigatedViewer({ container });
        viewerRef.current = viewer as unknown as typeof viewerRef.current;
        await viewer.importXML(xmlToImport);
        const canvas = viewer.get('canvas') as { zoom: (value?: number | 'fit-viewport', center?: { x: number; y: number }) => number };
        if (canvas?.zoom) {
          canvas.zoom('fit-viewport');
        }
        setReady(true);
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
      setReady(false);
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
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm text-gray-500 mr-1">Масштаб:</span>
        <button
          type="button"
          onClick={zoomOut}
          disabled={!ready}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Уменьшить"
        >
          −
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={!ready}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Увеличить"
        >
          +
        </button>
        <button
          type="button"
          onClick={zoomFit}
          disabled={!ready}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Вписать в область"
        >
          Вписать
        </button>
        <button
          type="button"
          onClick={zoom100}
          disabled={!ready}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="100%"
        >
          100%
        </button>
        <span className="text-xs text-gray-400 ml-1">Колёсико мыши — масштаб, перетаскивание — перемещение</span>
      </div>
      <div
        ref={containerRef}
        className="rounded-lg border border-gray-200 bg-white overflow-hidden"
        style={{ minHeight: 360, height: 360 }}
      />
    </div>
  );
}
