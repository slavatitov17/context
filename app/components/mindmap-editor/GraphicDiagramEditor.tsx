'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';

type RibbonTab = 'file' | 'layout' | 'insert';

type Orientation = 'portrait' | 'landscape';

/** Дискретные уровни масштаба листа (целые проценты, шаг 10%). */
const ZOOM_LEVELS = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200] as const;

const DEFAULT_ZOOM_INDEX = ZOOM_LEVELS.indexOf(100);

function OrientationIcon({ mode, className }: { mode: Orientation; className?: string }) {
  if (mode === 'portrait') {
    return (
      <svg className={className} viewBox="0 0 24 32" width="22" height="28" aria-hidden>
        <rect x="1" y="1" width="22" height="30" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 32 24" width="28" height="22" aria-hidden>
      <rect x="1" y="1" width="30" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function RibbonGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block w-full text-center text-[11px] font-medium leading-tight text-gray-500 dark:text-gray-400">
      {children}
    </span>
  );
}

export default function GraphicDiagramEditor({ diagramId }: { diagramId: string }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [tab, setTab] = useState<RibbonTab>('file');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const editorRootRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const zoomPercent = ZOOM_LEVELS[zoomIndex];
  const zoomFactor = zoomPercent / 100;

  const sheetW = orientation === 'portrait' ? '21cm' : '29.7cm';
  const sheetH = orientation === 'portrait' ? '29.7cm' : '21cm';

  /** Блокируем масштабирование страницы браузером (Ctrl+колёсико); зум только листа в рабочей области. */
  useEffect(() => {
    const root = editorRootRef.current;
    if (!root) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const ws = workspaceRef.current;
      if (!ws || !ws.contains(e.target as Node)) return;
      setZoomIndex((i) => {
        if (e.deltaY < 0) return Math.min(ZOOM_LEVELS.length - 1, i + 1);
        return Math.max(0, i - 1);
      });
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, []);

  const zoomIn = useCallback(() => {
    setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomIndex((i) => Math.max(0, i - 1));
  }, []);

  const ribbonTopBar = isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50';
  const ribbonToolbar = isDark ? 'border-gray-700 bg-gray-800/90' : 'border-gray-200 bg-gray-50';
  const tabActive = isDark
    ? 'border border-gray-600 bg-gray-700 text-gray-100 shadow-sm'
    : 'border border-gray-200 bg-white text-gray-900 shadow-sm';
  const tabIdle = isDark
    ? 'text-gray-300 hover:bg-gray-700/80 hover:text-white'
    : 'text-gray-800 hover:bg-white/70';

  const divider = isDark ? 'bg-gray-600' : 'bg-gray-300';

  const toolBtnBase =
    'inline-flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors min-w-[4.5rem] sm:min-w-[5.25rem]';
  const toolBtnIdle = isDark
    ? 'border-gray-600 bg-gray-900 text-gray-100 hover:bg-gray-700 hover:border-gray-500'
    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50';
  const toolBtnActive = isDark
    ? 'border-blue-500 bg-gray-900 text-blue-200 ring-1 ring-blue-500/40'
    : 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500/30';

  const iconBtn =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-lg font-semibold leading-none transition-colors';
  const iconBtnIdle = isDark
    ? 'border-gray-600 bg-gray-900 text-gray-100 hover:bg-gray-700'
    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100';

  const placeholderToolbarH = 'min-h-[5.5rem]';

  return (
    <div
      ref={editorRootRef}
      className={`flex h-full min-h-0 flex-col ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}
      data-diagram-id={diagramId}
    >
      <header
        className={`z-50 flex w-full flex-shrink-0 flex-col border-b ${ribbonTopBar}`}
      >
        <div className="flex h-12 items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-1">
            {(['file', 'layout', 'insert'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
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
            className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isDark
                ? 'text-blue-400 hover:bg-gray-700 hover:text-blue-300'
                : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            {t('graphicEditor.exitEditor')}
          </button>
        </div>

        <div
          className={`flex border-t px-3 py-2 sm:px-4 ${ribbonToolbar}`}
          role="toolbar"
          aria-label={t('graphicEditor.ribbon.toolbar')}
        >
          {tab === 'file' && <div className={`w-full ${placeholderToolbarH}`} aria-hidden />}
          {tab === 'insert' && <div className={`w-full ${placeholderToolbarH}`} aria-hidden />}

          {tab === 'layout' && (
            <div className="flex min-h-[5.5rem] w-full items-stretch gap-0 sm:min-h-[6rem]">
              {/* Блок «Ориентация» */}
              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[200px]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`${toolBtnBase} ${orientation === 'portrait' ? toolBtnActive : toolBtnIdle}`}
                  >
                    <OrientationIcon mode="portrait" className="opacity-90" />
                    <span className="max-w-[5.5rem] text-center leading-snug">
                      {t('graphicEditor.orientation.portrait')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`${toolBtnBase} ${orientation === 'landscape' ? toolBtnActive : toolBtnIdle}`}
                  >
                    <OrientationIcon mode="landscape" className="opacity-90" />
                    <span className="max-w-[5.5rem] text-center leading-snug">
                      {t('graphicEditor.orientation.landscape')}
                    </span>
                  </button>
                </div>
                <RibbonGroupLabel>{t('graphicEditor.layout.orientation')}</RibbonGroupLabel>
              </div>

              <div className={`mx-2 sm:mx-3 w-px shrink-0 self-stretch ${divider}`} aria-hidden />

              {/* Блок «Масштаб» */}
              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[160px]">
                <div className="flex flex-1 items-center justify-center gap-2">
                  <button
                    type="button"
                    aria-label={t('graphicEditor.zoom.out')}
                    disabled={zoomIndex <= 0}
                    className={`${iconBtn} ${iconBtnIdle} disabled:cursor-not-allowed disabled:opacity-40`}
                    onClick={zoomOut}
                  >
                    −
                  </button>
                  <span
                    className={`min-w-[3.25rem] text-center text-sm font-semibold tabular-nums ${
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    }`}
                  >
                    {zoomPercent}%
                  </span>
                  <button
                    type="button"
                    aria-label={t('graphicEditor.zoom.in')}
                    disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
                    className={`${iconBtn} ${iconBtnIdle} disabled:cursor-not-allowed disabled:opacity-40`}
                    onClick={zoomIn}
                  >
                    +
                  </button>
                </div>
                <RibbonGroupLabel>{t('graphicEditor.layout.scale')}</RibbonGroupLabel>
              </div>
            </div>
          )}
        </div>
      </header>

      <div
        ref={workspaceRef}
        className={`relative min-h-0 flex-1 overflow-auto ${isDark ? 'bg-[#4b5563]' : 'bg-[#d1d5db]'}`}
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
              width: `calc(${sheetW} * ${zoomFactor})`,
              height: `calc(${sheetH} * ${zoomFactor})`,
            }}
          >
            <div
              className="bg-white"
              style={{
                width: sheetW,
                height: sheetH,
                transform: `scale(${zoomFactor})`,
                transformOrigin: 'top left',
                boxShadow: isDark ? '0 2px 16px rgba(0,0,0,.35)' : '0 2px 12px rgba(0,0,0,.12)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
