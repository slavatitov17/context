'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { auth, diagrams as diagramsStorage } from '@/lib/storage';
import {
  buildExportBasename,
  downloadBlob,
  exportSheetDocxBlob,
  exportSheetPdfBlob,
  exportSheetPngBlob,
  type GridMode,
} from '@/lib/graphic-editor-export';

type RibbonTab = 'file' | 'layout' | 'insert';

type Orientation = 'portrait' | 'landscape';

const ZOOM_LEVELS = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200] as const;
const DEFAULT_ZOOM_INDEX = ZOOM_LEVELS.indexOf(100);
const TOTAL_SHEETS = 1;

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

function IconPdf({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM8 18v-2h8v2H8zm0-4v-2h8v2H8zm2-4V8h2v2h2v2h-4z"
      />
    </svg>
  );
}

function IconWord({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM8 11l1.5 6 2-4.5L13 17l1.5-6H8z"
      />
    </svg>
  );
}

function IconPng({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
      />
    </svg>
  );
}

function IconPrint({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 10H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V2z"
      />
    </svg>
  );
}

function IconSave({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"
      />
    </svg>
  );
}

function IconGridCells({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"
        opacity="0.9"
      />
    </svg>
  );
}

function IconGridDots({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      {[
        [4, 4],
        [12, 4],
        [20, 4],
        [4, 12],
        [12, 12],
        [20, 12],
        [4, 20],
        [12, 20],
        [20, 20],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.8" fill="currentColor" />
      ))}
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

type PrintModalProps = {
  open: boolean;
  isDark: boolean;
  t: (k: string) => string;
  onClose: () => void;
  onPrint: () => void;
};

function PrintModal({ open, isDark, t, onClose, onPrint }: PrintModalProps) {
  const [printer, setPrinter] = useState('default');
  const [mode, setMode] = useState<'all' | 'range'>('all');
  const [sheetInput, setSheetInput] = useState('1');
  const [sheetError, setSheetError] = useState<string | null>(null);

  const printers = [
    { id: 'default', label: t('graphicEditor.print.printerDefault') },
    { id: 'pdf', label: 'Microsoft Print to PDF' },
    { id: 'onenote', label: 'OneNote' },
  ];

  useEffect(() => {
    if (open) {
      setPrinter('default');
      setMode('all');
      setSheetInput('1');
      setSheetError(null);
    }
  }, [open]);

  if (!open) return null;

  const panel = isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900';
  const label = isDark ? 'text-gray-300' : 'text-gray-700';
  const inputCls = isDark
    ? 'rounded border border-gray-600 bg-gray-900 px-2 py-1.5 text-sm text-gray-100'
    : 'rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900';

  const validateAndPrint = () => {
    if (mode === 'range') {
      const n = parseInt(sheetInput.trim(), 10);
      if (Number.isNaN(n) || n < 1 || n > TOTAL_SHEETS) {
        setSheetError(t('graphicEditor.print.sheetsError').replace('{max}', String(TOTAL_SHEETS)));
        return;
      }
    }
    setSheetError(null);
    void printer;
    onPrint();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-md rounded-xl border p-5 shadow-xl ${panel}`}>
        <h2 className={`mb-4 text-left text-lg font-semibold ${label}`}>{t('graphicEditor.print.title')}</h2>

        <div className="mb-4">
          <label className={`mb-1 block text-sm font-medium ${label}`}>{t('graphicEditor.print.printer')}</label>
          <select
            className={`w-full ${inputCls}`}
            value={printer}
            onChange={(e) => setPrinter(e.target.value)}
          >
            {printers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{t('graphicEditor.print.printerHint')}</p>
        </div>

        <div className="mb-4 space-y-2">
          <label className={`flex cursor-pointer items-center gap-2 text-sm ${label}`}>
            <input
              type="radio"
              name="printMode"
              checked={mode === 'all'}
              onChange={() => {
                setMode('all');
                setSheetError(null);
              }}
            />
            {t('graphicEditor.print.printAll')}
          </label>
          <div className={`flex flex-wrap items-center gap-2 text-sm ${label}`}>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="printMode"
                checked={mode === 'range'}
                onChange={() => setMode('range')}
              />
              {t('graphicEditor.print.printSheets')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={mode === 'all'}
              aria-label={t('graphicEditor.print.sheetsInputAria')}
              className={`w-16 ${inputCls} ${mode === 'all' ? 'cursor-not-allowed opacity-50' : ''}`}
              value={sheetInput}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '');
                setSheetInput(v === '' ? '' : v);
                setSheetError(null);
              }}
            />
          </div>
          {sheetError && <p className="text-sm text-red-500">{sheetError}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg border px-4 py-2 text-sm font-medium ${
              isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}
          >
            {t('graphicEditor.print.cancel')}
          </button>
          <button
            type="button"
            onClick={validateAndPrint}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('graphicEditor.print.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GraphicDiagramEditor({ diagramId }: { diagramId: string }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const lang = language === 'ru' ? 'ru' : 'en';

  const [diagramName, setDiagramName] = useState('');
  const [tab, setTab] = useState<RibbonTab>('file');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [gridMode, setGridMode] = useState<GridMode>('none');
  const [printOpen, setPrintOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editorRootRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const zoomPercent = ZOOM_LEVELS[zoomIndex];
  const zoomFactor = zoomPercent / 100;
  const sheetW = orientation === 'portrait' ? '21cm' : '29.7cm';
  const sheetH = orientation === 'portrait' ? '29.7cm' : '21cm';
  const typeLabel = t('graphicEditor.diagramTypeName');

  useEffect(() => {
    const u = auth.getCurrentUser();
    if (!u) return;
    const d = diagramsStorage.getById(diagramId, u.id);
    if (d?.name) setDiagramName(d.name);
  }, [diagramId]);

  useEffect(() => {
    const id = 'mindmap-editor-print-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @media print {
        .mindmap-editor-print-root .mindmap-no-print { display: none !important; }
        .mindmap-editor-print-root .mindmap-workspace {
          background: #fff !important;
          overflow: visible !important;
        }
        .mindmap-editor-print-root .mindmap-workspace > div {
          padding: 12mm !important;
          min-height: 0 !important;
        }
      }
    `;
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, []);

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

  useEffect(() => {
    if (!saveToast) return;
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = setTimeout(() => setSaveToast(false), 2000);
    return () => {
      if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    };
  }, [saveToast]);

  const zoomIn = useCallback(() => {
    setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
  }, []);
  const zoomOut = useCallback(() => {
    setZoomIndex((i) => Math.max(0, i - 1));
  }, []);

  const toggleCells = () => {
    setGridMode((g) => (g === 'cells' ? 'none' : 'cells'));
  };
  const toggleDots = () => {
    setGridMode((g) => (g === 'dots' ? 'none' : 'dots'));
  };

  const baseName = buildExportBasename(diagramName || (lang === 'ru' ? 'Без названия' : 'Untitled'), typeLabel, lang);

  const runExport = async (kind: 'png' | 'pdf' | 'docx') => {
    try {
      let blob: Blob;
      let ext: string;
      if (kind === 'png') {
        blob = await exportSheetPngBlob(orientation, gridMode);
        ext = '.png';
      } else if (kind === 'pdf') {
        blob = await exportSheetPdfBlob(orientation, gridMode);
        ext = '.pdf';
      } else {
        blob = await exportSheetDocxBlob(orientation, gridMode);
        ext = '.docx';
      }
      downloadBlob(blob, `${baseName}${ext}`);
    } catch (e) {
      console.error(e);
      alert(lang === 'ru' ? 'Не удалось выполнить экспорт.' : 'Export failed.');
    }
  };

  const handleSave = () => {
    setSaveToast(true);
  };

  const handlePrintDialog = () => {
    requestAnimationFrame(() => window.print());
  };

  const ribbonTopBar = isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50';
  const ribbonToolbar = isDark ? 'border-gray-700 bg-gray-800/90' : 'border-gray-200 bg-gray-50';
  const titleBar = isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white';
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

  const fileToolBtn =
    'inline-flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors min-w-[4.25rem] sm:min-w-[4.75rem]';
  const fileToolIdle = toolBtnIdle;
  const fileToolActive = toolBtnActive;

  const placeholderToolbarH = 'min-h-[5.5rem]';

  const titleText = `${lang === 'ru' ? 'Диаграмма' : 'Diagram'} ${diagramName || (lang === 'ru' ? 'Без названия' : 'Untitled')} (${typeLabel})`;

  return (
    <div
      ref={editorRootRef}
      className={`mindmap-editor-print-root flex h-full min-h-0 flex-col ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}
      data-diagram-id={diagramId}
    >
      <header className={`z-50 flex w-full flex-shrink-0 flex-col border-b ${ribbonTopBar}`}>
        {/* Ряд заголовка */}
        <div
          className={`mindmap-no-print flex min-h-[2.75rem] items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4 ${titleBar}`}
        >
          <h1 className={`min-w-0 flex-1 truncate text-left text-base font-bold sm:text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {titleText}
          </h1>
          <button
            type="button"
            onClick={() => router.push('/diagrams')}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-normal transition-colors ${
              isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-100'
            }`}
          >
            {t('graphicEditor.closeDiagram')}
          </button>
        </div>

        <div className="mindmap-no-print flex h-12 items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-1">
            {(['file', 'layout', 'insert'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === key ? tabActive : tabIdle}`}
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
          className={`mindmap-no-print flex border-t px-3 py-2 sm:px-4 ${ribbonToolbar}`}
          role="toolbar"
          aria-label={t('graphicEditor.ribbon.toolbar')}
        >
          {tab === 'insert' && <div className={`w-full ${placeholderToolbarH}`} aria-hidden />}

          {tab === 'file' && (
            <div className="flex min-h-[5.5rem] w-full flex-wrap items-stretch gap-0 sm:min-h-[6rem]">
              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[220px]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    className={`${fileToolBtn} ${fileToolIdle}`}
                    onClick={() => runExport('pdf')}
                  >
                    <IconPdf className="opacity-90" />
                    <span>{t('graphicEditor.export.pdf')}</span>
                  </button>
                  <button
                    type="button"
                    className={`${fileToolBtn} ${fileToolIdle}`}
                    onClick={() => runExport('docx')}
                  >
                    <IconWord className="opacity-90" />
                    <span>{t('graphicEditor.export.word')}</span>
                  </button>
                  <button
                    type="button"
                    className={`${fileToolBtn} ${fileToolIdle}`}
                    onClick={() => runExport('png')}
                  >
                    <IconPng className="opacity-90" />
                    <span>{t('graphicEditor.export.png')}</span>
                  </button>
                </div>
                <RibbonGroupLabel>{t('graphicEditor.file.export')}</RibbonGroupLabel>
              </div>

              <div className={`mx-2 sm:mx-3 w-px shrink-0 self-stretch ${divider}`} aria-hidden />

              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[180px]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    className={`${fileToolBtn} ${fileToolIdle}`}
                    onClick={() => setPrintOpen(true)}
                  >
                    <IconPrint className="opacity-90" />
                    <span>{t('graphicEditor.other.print')}</span>
                  </button>
                  <button type="button" className={`${fileToolBtn} ${fileToolIdle}`} onClick={handleSave}>
                    <IconSave className="opacity-90" />
                    <span>{t('graphicEditor.other.save')}</span>
                  </button>
                </div>
                <RibbonGroupLabel>{t('graphicEditor.file.other')}</RibbonGroupLabel>
              </div>
            </div>
          )}

          {tab === 'layout' && (
            <div className="flex min-h-[5.5rem] w-full flex-wrap items-stretch gap-0 sm:min-h-[6rem]">
              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[200px]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`${toolBtnBase} ${orientation === 'portrait' ? toolBtnActive : toolBtnIdle}`}
                  >
                    <OrientationIcon mode="portrait" className="opacity-90" />
                    <span className="max-w-[5.5rem] text-center leading-snug">{t('graphicEditor.orientation.portrait')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`${toolBtnBase} ${orientation === 'landscape' ? toolBtnActive : toolBtnIdle}`}
                  >
                    <OrientationIcon mode="landscape" className="opacity-90" />
                    <span className="max-w-[5.5rem] text-center leading-snug">{t('graphicEditor.orientation.landscape')}</span>
                  </button>
                </div>
                <RibbonGroupLabel>{t('graphicEditor.layout.orientation')}</RibbonGroupLabel>
              </div>

              <div className={`mx-2 sm:mx-3 w-px shrink-0 self-stretch ${divider}`} aria-hidden />

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

              <div className={`mx-2 sm:mx-3 w-px shrink-0 self-stretch ${divider}`} aria-hidden />

              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[200px]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCells}
                    className={`${toolBtnBase} ${gridMode === 'cells' ? toolBtnActive : toolBtnIdle}`}
                  >
                    <IconGridCells className="opacity-90" />
                    <span>{t('graphicEditor.grid.cells')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleDots}
                    className={`${toolBtnBase} ${gridMode === 'dots' ? toolBtnActive : toolBtnIdle}`}
                  >
                    <IconGridDots className="opacity-90" />
                    <span>{t('graphicEditor.grid.dots')}</span>
                  </button>
                </div>
                <RibbonGroupLabel>{t('graphicEditor.layout.grid')}</RibbonGroupLabel>
              </div>
            </div>
          )}
        </div>
      </header>

      <div
        ref={workspaceRef}
        className={`mindmap-workspace relative min-h-0 flex-1 overflow-auto ${isDark ? 'bg-[#4b5563]' : 'bg-[#d1d5db]'}`}
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
              id="mindmap-sheet-print"
              className="relative bg-white"
              style={{
                width: sheetW,
                height: sheetH,
                transform: `scale(${zoomFactor})`,
                transformOrigin: 'top left',
                boxShadow: isDark ? '0 2px 16px rgba(0,0,0,.35)' : '0 2px 12px rgba(0,0,0,.12)',
              }}
            >
              {gridMode === 'cells' && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgb(230 230 230) 1px, transparent 1px), linear-gradient(to bottom, rgb(230 230 230) 1px, transparent 1px)`,
                    backgroundSize: '8px 8px',
                  }}
                />
              )}
              {gridMode === 'dots' && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgb(200 200 200) 0.65px, transparent 1.1px)',
                    backgroundSize: '10px 10px',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <PrintModal
        open={printOpen}
        isDark={isDark}
        t={t}
        onClose={() => setPrintOpen(false)}
        onPrint={handlePrintDialog}
      />

      {saveToast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[220] -translate-x-1/2 px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-lg">
            <span>{t('graphicEditor.save.toast')}</span>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-800"
              aria-label={t('supportSent.close')}
              onClick={() => setSaveToast(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
