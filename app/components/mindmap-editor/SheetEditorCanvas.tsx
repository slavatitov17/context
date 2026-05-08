'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SheetItemKind = 'element' | 'text';
export type SheetFontId = 'sans' | 'serif' | 'mono';

export type SheetItem = {
  id: string;
  kind: SheetItemKind;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontId: SheetFontId;
  color: string;
  backgroundColor: string;
  fontSize: number;
};

export type SheetConnection = {
  id: string;
  fromId: string;
  fromHandle: 0 | 1 | 2 | 3;
  toId: string;
  toHandle: 0 | 1 | 2 | 3;
};

export function fontStack(id: SheetFontId): string {
  if (id === 'serif') return 'Georgia, "Times New Roman", serif';
  if (id === 'mono') return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  return 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
}

/** Handles: 0 top center, 1 right center, 2 bottom center, 3 left center. */
export function handleCenter(item: SheetItem, hi: 0 | 1 | 2 | 3): { x: number; y: number } {
  const { x, y, width: w, height: h } = item;
  switch (hi) {
    case 0:
      return { x: x + w / 2, y };
    case 1:
      return { x: x + w, y: y + h / 2 };
    case 2:
      return { x: x + w / 2, y: y + h };
    case 3:
      return { x, y: y + h / 2 };
    default:
      return { x, y };
  }
}

export default function SheetEditorCanvas({
  gridMode,
  items,
  setItems,
  connections,
  setConnections,
  selectedId,
  setSelectedId,
  editingId,
  setEditingId,
  isDark,
  newElementLabel,
  elementTextareaPlaceholder,
  textPlaceholder,
}: {
  gridMode: 'none' | 'cells' | 'dots';
  items: SheetItem[];
  setItems: React.Dispatch<React.SetStateAction<SheetItem[]>>;
  connections: SheetConnection[];
  setConnections: React.Dispatch<React.SetStateAction<SheetConnection[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  isDark: boolean;
  /** Centered label on empty element (e.g. «Новый элемент»). */
  newElementLabel: string;
  /** Textarea `placeholder` while editing element (e.g. «Новый текст»). */
  elementTextareaPlaceholder: string;
  /** Placeholder for empty text item + textarea. */
  textPlaceholder: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; grabX: number; grabY: number } | null>(null);
  const connectRef = useRef<{ fromId: string; fromHandle: 0 | 1 | 2 | 3; x: number; y: number } | null>(null);

  const [pointerLine, setPointerLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const sheetCoords = useCallback((clientX: number, clientY: number) => {
    const sheet = sheetRef.current;
    if (!sheet) return { x: 0, y: 0 };
    const r = sheet.getBoundingClientRect();
    const w = sheet.offsetWidth || 1;
    const h = sheet.offsetHeight || 1;
    return {
      x: ((clientX - r.left) / r.width) * w,
      y: ((clientY - r.top) / r.height) * h,
    };
  }, []);

  const onItemMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (editingId) return;
      if ((e.target as HTMLElement).closest('[data-handle]')) return;
      e.stopPropagation();
      setSelectedId(id);
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const { x: sx, y: sy } = sheetCoords(e.clientX, e.clientY);
      dragRef.current = { id, grabX: sx - item.x, grabY: sy - item.y };
    },
    [editingId, items, setSelectedId, sheetCoords]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const { id, grabX, grabY } = dragRef.current;
        const { x: sx, y: sy } = sheetCoords(e.clientX, e.clientY);
        const sheet = sheetRef.current;
        setItems((prev) => {
          const it = prev.find((i) => i.id === id);
          if (!it || !sheet) return prev;
          const maxX = Math.max(0, sheet.offsetWidth - it.width);
          const maxY = Math.max(0, sheet.offsetHeight - it.height);
          const nx = Math.min(maxX, Math.max(0, sx - grabX));
          const ny = Math.min(maxY, Math.max(0, sy - grabY));
          return prev.map((i) => (i.id === id ? { ...i, x: nx, y: ny } : i));
        });
      }
      if (connectRef.current) {
        const { x: sx, y: sy } = sheetCoords(e.clientX, e.clientY);
        const { fromId, fromHandle, x: x1, y: y1 } = connectRef.current;
        setPointerLine({ x1, y1, x2: sx, y2: sy });
      }
    };
    const onUp = (e: MouseEvent) => {
      if (dragRef.current) {
        dragRef.current = null;
      }
      if (connectRef.current) {
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const targetHandle = el?.closest?.('[data-handle]') as HTMLElement | null;
        if (targetHandle) {
          const toId = targetHandle.dataset.itemId;
          const th = Number(targetHandle.dataset.handle) as 0 | 1 | 2 | 3;
          const { fromId, fromHandle } = connectRef.current;
          if (toId && fromId !== toId) {
            setConnections((prev) => {
              const dup = prev.some(
                (c) =>
                  (c.fromId === fromId && c.toId === toId && c.fromHandle === fromHandle && c.toHandle === th) ||
                  (c.fromId === toId && c.toId === fromId && c.fromHandle === th && c.toHandle === fromHandle)
              );
              if (dup) return prev;
              return [...prev, { id: `c-${Date.now()}`, fromId, fromHandle, toId, toHandle: th }];
            });
          }
        }
        connectRef.current = null;
        setPointerLine(null);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [setConnections, setItems, sheetCoords]);

  const handleMouseDown = (e: React.MouseEvent, itemId: string, handle: 0 | 1 | 2 | 3) => {
    e.stopPropagation();
    e.preventDefault();
    const item = items.find((i) => i.id === itemId);
    if (!item || item.kind !== 'element') return;
    const c = handleCenter(item, handle);
    connectRef.current = { fromId: itemId, fromHandle: handle, x: c.x, y: c.y };
    const { x: sx, y: sy } = sheetCoords(e.clientX, e.clientY);
    setPointerLine({ x1: c.x, y1: c.y, x2: sx, y2: sy });
  };

  const onSheetBackgroundMouseDown = () => {
    if (!editingId) {
      setSelectedId(null);
    }
  };

  const updateItem = (id: string, patch: Partial<SheetItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handlePos: Record<0 | 1 | 2 | 3, React.CSSProperties> = {
    0: { left: '50%', top: 0, transform: 'translate(-50%, -50%)' },
    1: { right: 0, top: '50%', transform: 'translate(50%, -50%)' },
    2: { left: '50%', bottom: 0, transform: 'translate(-50%, 50%)' },
    3: { left: 0, top: '50%', transform: 'translate(-50%, -50%)' },
  };

  return (
    <div
      ref={sheetRef}
      id="mindmap-sheet-print"
      className="relative touch-manipulation bg-white"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
      }}
      onMouseDown={onSheetBackgroundMouseDown}
    >
      {gridMode === 'cells' && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgb(230 230 230) 1px, transparent 1px), linear-gradient(to bottom, rgb(230 230 230) 1px, transparent 1px)`,
            backgroundSize: '8px 8px',
          }}
        />
      )}
      {gridMode === 'dots' && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(200 200 200) 0.65px, transparent 1.1px)',
            backgroundSize: '10px 10px',
          }}
        />
      )}

      <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible">
        {connections.map((c) => {
          const a = items.find((i) => i.id === c.fromId);
          const b = items.find((i) => i.id === c.toId);
          if (!a || !b) return null;
          const p1 = handleCenter(a, c.fromHandle);
          const p2 = handleCenter(b, c.toHandle);
          return (
            <line
              key={c.id}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#64748b"
              strokeWidth={2}
            />
          );
        })}
        {pointerLine && (
          <line
            x1={pointerLine.x1}
            y1={pointerLine.y1}
            x2={pointerLine.x2}
            y2={pointerLine.y2}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        )}
      </svg>

      {items.map((it) => {
        const selected = it.id === selectedId;
        const isEl = it.kind === 'element';
        const isText = it.kind === 'text';
        const trimmed = it.text.trim();
        const showElementCenter = isEl && !trimmed;
        const showTextPlaceholder = isText && !trimmed;
        const border = selected
          ? '2px solid #3b82f6'
          : isEl
            ? isDark
              ? '1px solid #94a3b8'
              : '1px solid #cbd5e1'
            : isDark
              ? '1px dashed rgba(148,163,184,0.35)'
              : '1px dashed rgba(203,213,225,0.9)';
        return (
          <div
            key={it.id}
            className="absolute z-[2] cursor-move select-none"
            style={{
              left: it.x,
              top: it.y,
              width: it.width,
              height: it.height,
              zIndex: selected ? 5 : 2,
              border,
              borderRadius: isEl ? 10 : 4,
              backgroundColor: isEl ? it.backgroundColor : 'transparent',
              fontFamily: fontStack(it.fontId),
              fontSize: it.fontSize,
              color: it.color,
              padding: isEl ? 10 : 4,
              boxSizing: 'border-box',
            }}
            onMouseDown={(e) => onItemMouseDown(e, it.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingId(it.id);
              setSelectedId(it.id);
            }}
          >
            {editingId === it.id ? (
              <textarea
                className={`h-full w-full resize-none border-0 bg-transparent p-0 outline-none ${
                  isEl ? 'placeholder:text-gray-400/70 dark:placeholder:text-gray-500/70' : 'placeholder:text-gray-400/70 dark:placeholder:text-gray-500/70'
                }`}
                value={it.text}
                placeholder={isEl ? elementTextareaPlaceholder : textPlaceholder}
                autoFocus
                onChange={(e) => updateItem(it.id, { text: e.target.value })}
                onBlur={() => setEditingId(null)}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className={`relative h-full w-full overflow-hidden whitespace-pre-wrap break-words ${
                  showElementCenter ? 'flex items-center justify-center text-center' : ''
                }`}
              >
                {showElementCenter ? (
                  <span className="pointer-events-none text-gray-400/75 dark:text-gray-500/75">{newElementLabel}</span>
                ) : showTextPlaceholder ? (
                  <span className="pointer-events-none text-gray-400/75 dark:text-gray-500/75">{textPlaceholder}</span>
                ) : (
                  it.text
                )}
              </div>
            )}

            {isEl && (
              <>
                {([0, 1, 2, 3] as const).map((hi) => (
                  <div
                    key={hi}
                    data-item-id={it.id}
                    data-handle={hi}
                    className="absolute z-20 h-3.5 w-3.5 cursor-crosshair rounded-full border-2 border-white bg-slate-500 shadow"
                    style={handlePos[hi]}
                    onMouseDown={(e) => handleMouseDown(e, it.id, hi)}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
