import type { SheetItem } from '@/app/components/mindmap-editor/SheetEditorCanvas';

/** Keep item fully inside the sheet (px). */
export function clampItemToSheet(it: SheetItem, sheetW: number, sheetH: number): SheetItem {
  const w = Math.min(Math.max(20, it.width), Math.max(20, sheetW));
  const h = Math.min(Math.max(16, it.height), Math.max(16, sheetH));
  const x = Math.min(Math.max(0, it.x), Math.max(0, sheetW - w));
  const y = Math.min(Math.max(0, it.y), Math.max(0, sheetH - h));
  return { ...it, x, y, width: w, height: h };
}

export function clampItemsToSheet(items: SheetItem[], sheetW: number, sheetH: number): SheetItem[] {
  return items.map((it) => clampItemToSheet(it, sheetW, sheetH));
}
