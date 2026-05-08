'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { auth, diagrams as diagramsStorage } from '@/lib/storage';
import SupportContactModal from '@/app/components/SupportContactModal';
import SupportSentModal from '@/app/components/SupportSentModal';
import SheetEditorCanvas, {
  fontStack,
  type SheetConnection,
  type SheetFontId,
  type SheetItem,
  type SheetItemKind,
} from '@/app/components/mindmap-editor/SheetEditorCanvas';
import {
  buildExportBasename,
  downloadBlob,
  exportSheetDocxBlob,
  exportSheetPdfBlob,
  exportSheetPngBlob,
  type GridMode,
} from '@/lib/graphic-editor-export';
import { clampItemToSheet, clampItemsToSheet } from '@/lib/sheet-editor-geometry';

type RibbonTab = 'file' | 'layout' | 'insert' | 'format';

type Orientation = 'portrait' | 'landscape';

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

function IconPdf({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 18H8V4h5v5h5v11z"
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

/** Solid U-turn arrow (Heroicons-style) for undo. */
function IconUndo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5h-3a.75.75 0 0 1 0-1.5h3a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
      />
    </svg>
  );
}

function IconRedo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <g transform="translate(24 0) scale(-1 1)">
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5h-3a.75.75 0 0 1 0-1.5h3a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
        />
      </g>
    </svg>
  );
}

function IconHelp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
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

function IconInsertElement({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <rect x="3.5" y="5" width="17" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="5" r="1.35" fill="currentColor" />
      <circle cx="19" cy="12" r="1.35" fill="currentColor" />
      <circle cx="12" cy="19" r="1.35" fill="currentColor" />
      <circle cx="5" cy="12" r="1.35" fill="currentColor" />
    </svg>
  );
}

function IconInsertText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path fill="currentColor" d="M5 5h14v3h-5.25v11h-3.5V8H5V5z" />
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
  const { t, language } = useLanguage();
  const lang = language === 'ru' ? 'ru' : 'en';

  const [diagramName, setDiagramName] = useState('');
  const [tab, setTab] = useState<RibbonTab>('file');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [gridMode, setGridMode] = useState<GridMode>('none');
  const [items, setItems] = useState<SheetItem[]>([]);
  const [connections, setConnections] = useState<SheetConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSentOpen, setSupportSentOpen] = useState(false);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgColorInputRef = useRef<HTMLInputElement>(null);
  const textColorInputRef = useRef<HTMLInputElement>(null);
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  const connectionsRef = useRef(connections);
  itemsRef.current = items;
  connectionsRef.current = connections;

  type SheetSnap = { items: SheetItem[]; connections: SheetConnection[] };
  const historyRef = useRef<SheetSnap[]>([{ items: [], connections: [] }]);
  const historyIndexRef = useRef(0);
  const skipHistoryCommitRef = useRef(false);
  const [, histTick] = useState(0);
  const bumpHist = () => histTick((n) => n + 1);

  const editorRootRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const zoomPercent = ZOOM_LEVELS[zoomIndex];
  const zoomFactor = zoomPercent / 100;
  const sheetW = orientation === 'portrait' ? '21cm' : '29.7cm';
  const sheetH = orientation === 'portrait' ? '29.7cm' : '21cm';
  const typeLabel = t('graphicEditor.diagramTypeName');

  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) ?? null : null;

  const getSheetPx = useCallback(() => {
    const el = sheetContainerRef.current;
    return { w: el?.offsetWidth ?? 1200, h: el?.offsetHeight ?? 1600 };
  }, []);

  const appendHistory = useCallback((itemsSnap: SheetItem[], consSnap: SheetConnection[]) => {
    if (skipHistoryCommitRef.current) return;
    const base = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current = [...base, { items: structuredClone(itemsSnap), connections: structuredClone(consSnap) }].slice(-100);
    historyIndexRef.current = historyRef.current.length - 1;
    bumpHist();
  }, []);

  const pushSnapshotWithData = useCallback(
    (nextItems: SheetItem[], nextCons: SheetConnection[]) => {
      if (skipHistoryCommitRef.current) return;
      const { w, h } = getSheetPx();
      const clamped = clampItemsToSheet(nextItems, w, h);
      flushSync(() => {
        setItems(clamped);
        setConnections(nextCons);
      });
      const base = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current = [...base, { items: structuredClone(clamped), connections: structuredClone(nextCons) }].slice(-100);
      historyIndexRef.current = historyRef.current.length - 1;
      bumpHist();
    },
    [getSheetPx]
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    skipHistoryCommitRef.current = true;
    historyIndexRef.current -= 1;
    const snap = historyRef.current[historyIndexRef.current];
    flushSync(() => {
      setItems(structuredClone(snap.items));
      setConnections(structuredClone(snap.connections));
    });
    skipHistoryCommitRef.current = false;
    setSelectedId((sid) => (sid && snap.items.some((i) => i.id === sid) ? sid : null));
    setEditingId(null);
    bumpHist();
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    skipHistoryCommitRef.current = true;
    historyIndexRef.current += 1;
    const snap = historyRef.current[historyIndexRef.current];
    flushSync(() => {
      setItems(structuredClone(snap.items));
      setConnections(structuredClone(snap.connections));
    });
    skipHistoryCommitRef.current = false;
    setSelectedId((sid) => (sid && snap.items.some((i) => i.id === sid) ? sid : null));
    setEditingId(null);
    bumpHist();
  }, []);

  const patchSelected = useCallback(
    (patch: Partial<SheetItem>) => {
      if (!selectedId) return;
      let out: SheetItem[] = [];
      flushSync(() => {
        setItems((prev) => {
          const { w, h } = getSheetPx();
          out = prev.map((it) => (it.id === selectedId ? clampItemToSheet({ ...it, ...patch }, w, h) : it));
          return out;
        });
      });
      appendHistory(out, connectionsRef.current);
    },
    [appendHistory, getSheetPx, selectedId]
  );

  const onCanvasCommit = useCallback(
    (nextItems: SheetItem[], nextCons: SheetConnection[]) => {
      pushSnapshotWithData(nextItems, nextCons);
    },
    [pushSnapshotWithData]
  );

  const onTextEditCommit = useCallback(() => {
    appendHistory(itemsRef.current, connectionsRef.current);
  }, [appendHistory]);

  const addSheetItem = useCallback(
    (kind: SheetItemKind) => {
      const id = `sh-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const scatter = items.length * 14;
      const baseX = 88 + (scatter % 200);
      const baseY = 64 + (scatter % 160);
      const fontId: SheetFontId = 'sans';
      const textColor = isDark ? '#f8fafc' : '#0f172a';
      let newItem: SheetItem;
      if (kind === 'element') {
        newItem = {
          id,
          kind: 'element',
          x: baseX,
          y: baseY,
          width: 200,
          height: 90,
          text: '',
          fontId,
          color: textColor,
          backgroundColor: '#e2e8f0',
          fontSize: 14,
        };
      } else {
        newItem = {
          id,
          kind: 'text',
          x: baseX,
          y: baseY,
          width: 220,
          height: 44,
          text: '',
          fontId,
          color: textColor,
          backgroundColor: 'transparent',
          fontSize: 12,
        };
      }
      let out: SheetItem[] = [];
      flushSync(() => {
        setItems((prev) => {
          out = [...prev, newItem];
          return out;
        });
      });
      pushSnapshotWithData(out, connections);
      setSelectedId(id);
      setEditingId(null);
    },
    [connections, isDark, items.length, pushSnapshotWithData]
  );

  useEffect(() => {
    const u = auth.getCurrentUser();
    if (!u) return;
    const d = diagramsStorage.getById(diagramId, u.id);
    if (d?.name) setDiagramName(d.name);
  }, [diagramId]);

  useEffect(() => {
    if (!selectedId) {
      setTab((c) => (c === 'format' ? 'insert' : c));
      return;
    }
    setTab('format');
  }, [selectedId]);

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

  const baseName = buildExportBasename(diagramName, typeLabel, lang);

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

  const formatDimInput = isDark
    ? 'min-w-[3.5rem] w-14 rounded border border-gray-600 bg-gray-900 px-1 py-0.5 text-center text-[11px] text-gray-100 tabular-nums'
    : 'min-w-[3.5rem] w-14 rounded border border-gray-300 bg-white px-1 py-0.5 text-center text-[11px] text-gray-900 tabular-nums';

  const commitDimOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    (e.target as HTMLInputElement).blur();
  };

  const displayName = diagramName.trim() || (lang === 'ru' ? 'Без названия' : 'Untitled');
  const titleText = `${displayName} - ${typeLabel}`;
  void histTick;
  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;
  const headerIconBtn =
    'rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100';

  const ribbonTabs: RibbonTab[] = ['file', 'layout', 'insert', ...(selectedId ? (['format'] as const) : [])];

  return (
    <div
      ref={editorRootRef}
      className={`mindmap-editor-print-root flex h-full min-h-0 flex-col ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}
      data-diagram-id={diagramId}
    >
      <header className={`z-50 flex w-full flex-shrink-0 flex-col border-b ${ribbonTopBar}`}>
        <div className={`mindmap-no-print relative flex min-h-[2.75rem] items-center border-b px-2 py-2.5 sm:px-4 ${titleBar}`}>
          <div className="z-10 flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button type="button" className={headerIconBtn} onClick={handleSave} aria-label={t('graphicEditor.other.save')}>
              <IconSave className="h-5 w-5" />
            </button>
            <button type="button" className={headerIconBtn} onClick={() => setSupportOpen(true)} aria-label={t('diagram.contactSupport')}>
              <IconHelp className="h-5 w-5" />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-20 sm:px-32">
            <span className={`max-w-full truncate text-center text-sm font-normal ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {titleText}
            </span>
          </div>
          <div className="z-10 ml-auto flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => router.push('/diagrams')}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-normal transition-colors sm:px-3 ${
                isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{t('graphicEditor.close')}</span>
            </button>
          </div>
        </div>

        <div className="mindmap-no-print flex h-12 items-center px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-1">
            {ribbonTabs.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === key ? tabActive : tabIdle}`}
              >
                {key === 'file' && t('graphicEditor.ribbon.file')}
                {key === 'layout' && t('graphicEditor.ribbon.layout')}
                {key === 'insert' && t('graphicEditor.ribbon.insert')}
                {key === 'format' && t('graphicEditor.ribbon.format')}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`mindmap-no-print flex border-t px-3 py-2 sm:px-4 ${ribbonToolbar}`}
          role="toolbar"
          aria-label={t('graphicEditor.ribbon.toolbar')}
        >
          {tab === 'insert' && (
            <div className="flex min-h-[5.5rem] w-full flex-wrap items-stretch gap-0 sm:min-h-[6rem]">
              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[220px]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    className={`${fileToolBtn} ${fileToolIdle}`}
                    onClick={() => addSheetItem('element')}
                  >
                    <IconInsertElement className="opacity-90" />
                    <span>{t('graphicEditor.insert.element')}</span>
                  </button>
                  <button
                    type="button"
                    className={`${fileToolBtn} ${fileToolIdle}`}
                    onClick={() => addSheetItem('text')}
                  >
                    <IconInsertText className="opacity-90" />
                    <span>{t('graphicEditor.insert.text')}</span>
                  </button>
                </div>
                <RibbonGroupLabel>{t('graphicEditor.collection')}</RibbonGroupLabel>
              </div>
            </div>
          )}

          {tab === 'format' && selectedItem && (
            <div className="flex min-h-[5.5rem] w-full flex-wrap items-stretch gap-0 sm:min-h-[6rem]">
              <input
                ref={bgColorInputRef}
                type="color"
                className="sr-only"
                tabIndex={-1}
                value={selectedItem.kind === 'element' ? selectedItem.backgroundColor : '#e2e8f0'}
                onChange={(e) => patchSelected({ backgroundColor: e.target.value })}
              />
              <input
                ref={textColorInputRef}
                type="color"
                className="sr-only"
                tabIndex={-1}
                value={selectedItem.color}
                onChange={(e) => patchSelected({ color: e.target.value })}
              />

              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[200px]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={selectedItem.kind !== 'element'}
                    className={`${fileToolBtn} ${
                      selectedItem.kind === 'element' ? fileToolIdle : `${fileToolIdle} cursor-not-allowed opacity-45`
                    } flex min-h-[5.75rem] flex-col justify-between`}
                    onClick={() => selectedItem.kind === 'element' && bgColorInputRef.current?.click()}
                  >
                    <span
                      className="mb-0.5 h-7 w-10 flex-shrink-0 rounded border border-gray-400 dark:border-gray-500"
                      style={{
                        backgroundColor:
                          selectedItem.kind === 'element' ? selectedItem.backgroundColor : 'rgb(241 245 249)',
                      }}
                      aria-hidden
                    />
                    <span>{t('graphicEditor.format.bgColor')}</span>
                  </button>
                  <button
                    type="button"
                    className={`${fileToolBtn} ${fileToolIdle} flex min-h-[5.75rem] flex-col justify-between`}
                    onClick={() => textColorInputRef.current?.click()}
                  >
                    <span
                      className="mb-0.5 h-7 w-10 flex-shrink-0 rounded border border-gray-400 dark:border-gray-500"
                      style={{ backgroundColor: selectedItem.color }}
                      aria-hidden
                    />
                    <span>{t('graphicEditor.format.textColorBtn')}</span>
                  </button>
                </div>
                <RibbonGroupLabel>{t('graphicEditor.format.color')}</RibbonGroupLabel>
              </div>

              <div className={`mx-2 sm:mx-3 w-px shrink-0 self-stretch ${divider}`} aria-hidden />

              {selectedItem.kind === 'element' && (
                <>
                  <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[140px]">
                    <div className="flex flex-1 items-center justify-center gap-1">
                      <button
                        type="button"
                        aria-label={t('graphicEditor.zoom.out')}
                        className={`${iconBtn} ${iconBtnIdle}`}
                        onClick={() => patchSelected({ width: Math.max(20, selectedItem.width - 5) })}
                      >
                        −
                      </button>
                      <input
                        key={`fw-${selectedItem.id}-${selectedItem.width}`}
                        type="number"
                        min={20}
                        defaultValue={Math.round(selectedItem.width)}
                        className={formatDimInput}
                        onKeyDown={commitDimOnEnter}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isFinite(n)) return;
                          patchSelected({ width: n });
                        }}
                      />
                      <button
                        type="button"
                        aria-label={t('graphicEditor.zoom.in')}
                        className={`${iconBtn} ${iconBtnIdle}`}
                        onClick={() => patchSelected({ width: selectedItem.width + 5 })}
                      >
                        +
                      </button>
                    </div>
                    <RibbonGroupLabel>{t('graphicEditor.format.width')}</RibbonGroupLabel>
                  </div>

                  <div className={`mx-2 sm:mx-3 w-px shrink-0 self-stretch ${divider}`} aria-hidden />

                  <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[140px]">
                    <div className="flex flex-1 items-center justify-center gap-1">
                      <button
                        type="button"
                        aria-label={t('graphicEditor.zoom.out')}
                        className={`${iconBtn} ${iconBtnIdle}`}
                        onClick={() => patchSelected({ height: Math.max(16, selectedItem.height - 5) })}
                      >
                        −
                      </button>
                      <input
                        key={`fh-${selectedItem.id}-${selectedItem.height}`}
                        type="number"
                        min={16}
                        defaultValue={Math.round(selectedItem.height)}
                        className={formatDimInput}
                        onKeyDown={commitDimOnEnter}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isFinite(n)) return;
                          patchSelected({ height: n });
                        }}
                      />
                      <button
                        type="button"
                        aria-label={t('graphicEditor.zoom.in')}
                        className={`${iconBtn} ${iconBtnIdle}`}
                        onClick={() => patchSelected({ height: selectedItem.height + 5 })}
                      >
                        +
                      </button>
                    </div>
                    <RibbonGroupLabel>{t('graphicEditor.format.height')}</RibbonGroupLabel>
                  </div>

                  <div className={`mx-2 sm:mx-3 w-px shrink-0 self-stretch ${divider}`} aria-hidden />
                </>
              )}

              {selectedItem.kind === 'text' && (
                <>
                  <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[160px]">
                    <div className="flex flex-1 items-center justify-center gap-1">
                      <button
                        type="button"
                        aria-label={t('graphicEditor.zoom.out')}
                        className={`${iconBtn} ${iconBtnIdle}`}
                        onClick={() => patchSelected({ fontSize: Math.max(8, selectedItem.fontSize - 1) })}
                      >
                        −
                      </button>
                      <input
                        key={`fs-${selectedItem.id}-${selectedItem.fontSize}`}
                        type="number"
                        min={8}
                        defaultValue={Math.round(selectedItem.fontSize)}
                        className={formatDimInput}
                        onKeyDown={commitDimOnEnter}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isFinite(n)) return;
                          patchSelected({ fontSize: n });
                        }}
                      />
                      <button
                        type="button"
                        aria-label={t('graphicEditor.zoom.in')}
                        className={`${iconBtn} ${iconBtnIdle}`}
                        onClick={() => patchSelected({ fontSize: selectedItem.fontSize + 1 })}
                      >
                        +
                      </button>
                    </div>
                    <RibbonGroupLabel>{t('graphicEditor.format.sizeLabel')}</RibbonGroupLabel>
                  </div>

                  <div className={`mx-2 sm:mx-3 w-px shrink-0 self-stretch ${divider}`} aria-hidden />
                </>
              )}

              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[280px]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                  {(['sans', 'serif', 'mono'] as const).map((fid) => (
                    <button
                      key={fid}
                      type="button"
                      className={`${fileToolBtn} ${selectedItem.fontId === fid ? fileToolActive : fileToolIdle}`}
                      onClick={() => patchSelected({ fontId: fid })}
                    >
                      <span
                        className="text-2xl font-semibold leading-none tracking-tight"
                        style={{ fontFamily: fontStack(fid) }}
                        aria-hidden
                      >
                        Aa
                      </span>
                      <span className="max-w-[5.5rem] text-center leading-tight">{t(`graphicEditor.font.${fid}`)}</span>
                    </button>
                  ))}
                </div>
                <RibbonGroupLabel>{t('graphicEditor.format.font')}</RibbonGroupLabel>
              </div>
            </div>
          )}

          {tab === 'file' && (
            <div className="flex min-h-[5.5rem] w-full flex-wrap items-stretch gap-0 sm:min-h-[6rem]">
              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[140px]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={!canUndo}
                    aria-label={t('graphicEditor.changes.undo')}
                    className={`${fileToolBtn} ${canUndo ? fileToolIdle : `${fileToolIdle} cursor-not-allowed opacity-40`}`}
                    onClick={() => undo()}
                  >
                    <IconUndo className="opacity-90" />
                    <span>{t('graphicEditor.changes.undo')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canRedo}
                    aria-label={t('graphicEditor.changes.redo')}
                    className={`${fileToolBtn} ${canRedo ? fileToolIdle : `${fileToolIdle} cursor-not-allowed opacity-40`}`}
                    onClick={() => redo()}
                  >
                    <IconRedo className="opacity-90" />
                    <span>{t('graphicEditor.changes.redo')}</span>
                  </button>
                </div>
                <RibbonGroupLabel>{t('graphicEditor.file.changes')}</RibbonGroupLabel>
              </div>

              <div className={`mx-2 sm:mx-3 w-px shrink-0 self-stretch ${divider}`} aria-hidden />

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

              <div className="flex flex-1 flex-col items-center justify-between py-1 sm:flex-none sm:min-w-[120px]">
                <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                  <button type="button" className={`${fileToolBtn} ${fileToolIdle}`} onClick={handlePrintDialog}>
                    <IconPrint className="opacity-90" />
                    <span>{t('graphicEditor.other.print')}</span>
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
              ref={sheetContainerRef}
              className="relative bg-white"
              style={{
                width: sheetW,
                height: sheetH,
                transform: `scale(${zoomFactor})`,
                transformOrigin: 'top left',
                boxShadow: isDark ? '0 2px 16px rgba(0,0,0,.35)' : '0 2px 12px rgba(0,0,0,.12)',
              }}
            >
              <SheetEditorCanvas
                gridMode={gridMode}
                items={items}
                setItems={setItems}
                connections={connections}
                setConnections={setConnections}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                editingId={editingId}
                setEditingId={setEditingId}
                isDark={isDark}
                newElementLabel={t('graphicEditor.insert.newElement')}
                elementTextareaPlaceholder={t('graphicEditor.insert.elementTextareaPlaceholder')}
                textPlaceholder={t('graphicEditor.insert.textPlaceholder')}
                onSheetInteractionCommit={onCanvasCommit}
                onTextEditCommit={onTextEditCommit}
              />
            </div>
          </div>
        </div>
      </div>

      <SupportContactModal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
        onSubmitSuccess={() => setSupportSentOpen(true)}
      />
      <SupportSentModal isOpen={supportSentOpen} onClose={() => setSupportSentOpen(false)} />

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
