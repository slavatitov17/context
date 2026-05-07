'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';

type RibbonTab = 'file' | 'layout' | 'insert';

type Orientation = 'portrait' | 'landscape';

function clampZoom(z: number) {
  return Math.min(3, Math.max(0.25, Math.round(z * 100) / 100));
}

function OrientationIcon({ mode, className }: { mode: Orientation; className?: string }) {
  if (mode === 'portrait') {
    return (
      <svg className={className} viewBox="0 0 24 32" width="20" height="26" aria-hidden>
        <rect x="1" y="1" width="22" height="30" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 32 24" width="26" height="20" aria-hidden>
      <rect x="1" y="1" width="30" height="22" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function GraphicDiagramEditor({ diagramId }: { diagramId: string }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [tab, setTab] = useState<RibbonTab>('file');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [orientationOpen, setOrientationOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const orientationWrapRef = useRef<HTMLDivElement>(null);

  const sheetW = orientation === 'portrait' ? '21cm' : '29.7cm';
  const sheetH = orientation === 'portrait' ? '29.7cm' : '21cm';
  const zoomSafe = clampZoom(zoom);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!orientationOpen) return;
      const el = orientationWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOrientationOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [orientationOpen]);

  const onWorkspaceWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    setZoom((z) => clampZoom(z * factor));
  }, []);

  const ribbonTop = isDark ? 'bg-gray-900 border-gray-700' : 'bg-[#f3f3f3] border-gray-300';
  const ribbonBottom = isDark ? 'bg-gray-800/95 border-gray-700' : 'bg-[#fafafa] border-gray-200';
  const tabActive = isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm';
  const tabIdle = isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-800 hover:bg-white/60';

  return (
    <div
      className={`flex h-full min-h-0 flex-col ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}
      data-diagram-id={diagramId}
    >
      <header
        className={`z-50 flex w-full flex-shrink-0 flex-col border-b shadow-sm ${ribbonTop}`}
        style={{ boxShadow: '0 1px 0 rgba(0,0,0,.06)' }}
      >
        <div className="flex h-11 items-center justify-between gap-3 px-2 sm:px-3">
          <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
            {(['file', 'layout', 'insert'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === key ? tabActive : tabIdle
                }`}
              >
                {key === 'file' && t('graphicEditor.ribbon.file')}
                {key === 'layout' && t('graphicEditor.ribbon.layout')}
                {key === 'insert' && t('graphicEditor.ribbon.insert')}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => router.push('/diagrams')}
            className={`flex-shrink-0 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              isDark
                ? 'text-blue-300 hover:bg-gray-800 hover:text-blue-200'
                : 'text-blue-700 hover:bg-white hover:text-blue-800'
            }`}
          >
            {t('graphicEditor.exitEditor')}
          </button>
        </div>

        <div
          className={`flex min-h-[52px] items-center border-t px-2 py-2 sm:px-3 ${ribbonBottom}`}
          role="toolbar"
          aria-label={t('graphicEditor.ribbon.toolbar')}
        >
          {tab === 'file' && <div className="h-9 w-full" aria-hidden />}
          {tab === 'layout' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative" ref={orientationWrapRef}>
                <button
                  type="button"
                  onClick={() => setOrientationOpen((o) => !o)}
                  className={`inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-medium transition-colors ${
                    isDark
                      ? 'border-gray-600 bg-gray-900 text-gray-100 hover:bg-gray-800'
                      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {t('graphicEditor.layout.orientation')}
                  <span className="text-xs opacity-70">▾</span>
                </button>
                {orientationOpen && (
                  <div
                    className={`absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded border py-1 shadow-lg ${
                      isDark ? 'border-gray-600 bg-gray-900' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ${
                        orientation === 'portrait'
                          ? isDark
                            ? 'bg-gray-800'
                            : 'bg-blue-50'
                          : isDark
                            ? 'hover:bg-gray-800'
                            : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setOrientation('portrait');
                        setOrientationOpen(false);
                      }}
                    >
                      <OrientationIcon mode="portrait" className="flex-shrink-0 opacity-80" />
                      <span>{t('graphicEditor.orientation.portrait')}</span>
                    </button>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ${
                        orientation === 'landscape'
                          ? isDark
                            ? 'bg-gray-800'
                            : 'bg-blue-50'
                          : isDark
                            ? 'hover:bg-gray-800'
                            : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setOrientation('landscape');
                        setOrientationOpen(false);
                      }}
                    >
                      <OrientationIcon mode="landscape" className="flex-shrink-0 opacity-80" />
                      <span>{t('graphicEditor.orientation.landscape')}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className={`hidden h-8 w-px sm:block ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={t('graphicEditor.zoom.out')}
                  className={`rounded border px-2.5 py-1.5 text-lg leading-none ${
                    isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'
                  }`}
                  onClick={() => setZoom((z) => clampZoom(z / 1.15))}
                >
                  −
                </button>
                <span className="min-w-[3.5rem] text-center text-sm tabular-nums">
                  {Math.round(zoomSafe * 100)}%
                </span>
                <button
                  type="button"
                  aria-label={t('graphicEditor.zoom.in')}
                  className={`rounded border px-2.5 py-1.5 text-lg leading-none ${
                    isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'
                  }`}
                  onClick={() => setZoom((z) => clampZoom(z * 1.15))}
                >
                  +
                </button>
                <span
                  className={`hidden text-xs sm:inline ${isDark ? 'text-gray-500' : 'text-gray-500'} max-w-[200px]`}
                  title={t('graphicEditor.zoom.hint')}
                >
                  {t('graphicEditor.zoom.hint')}
                </span>
              </div>
            </div>
          )}
          {tab === 'insert' && <div className="h-9 w-full" aria-hidden />}
        </div>
      </header>

      <div
        className={`relative min-h-0 flex-1 overflow-auto ${isDark ? 'bg-[#5a5a5a]' : 'bg-[#d9d9d9]'}`}
        onWheel={onWorkspaceWheel}
      >
        <div
          className="flex items-center justify-center"
          style={{
            minWidth: '100%',
            minHeight: '100%',
            padding: '40px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: `calc(${sheetW} * ${zoomSafe})`,
              height: `calc(${sheetH} * ${zoomSafe})`,
            }}
          >
            <div
              className={`shadow-md ${isDark ? 'bg-white' : 'bg-white'}`}
              style={{
                width: sheetW,
                height: sheetH,
                transform: `scale(${zoomSafe})`,
                transformOrigin: 'top left',
                boxShadow: '0 2px 12px rgba(0,0,0,.12)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
