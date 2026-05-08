import { PDFDocument } from 'pdf-lib';

export type GridMode = 'none' | 'cells' | 'dots';
export type SheetOrientation = 'portrait' | 'landscape';

function sheetMm(orientation: SheetOrientation) {
  const wMm = orientation === 'portrait' ? 210 : 297;
  const hMm = orientation === 'portrait' ? 297 : 210;
  return { wMm, hMm };
}

/** Рендер листа A4 на canvas (для экспорта, фиксированный DPI). */
export function renderSheetToCanvas(
  orientation: SheetOrientation,
  gridMode: GridMode,
  dpi = 150
): HTMLCanvasElement {
  const { wMm, hMm } = sheetMm(orientation);
  const pxW = Math.max(1, Math.round((wMm / 25.4) * dpi));
  const pxH = Math.max(1, Math.round((hMm / 25.4) * dpi));
  const canvas = document.createElement('canvas');
  canvas.width = pxW;
  canvas.height = pxH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pxW, pxH);

  if (gridMode === 'cells') {
    const step = Math.max(6, Math.round(dpi / 12));
    ctx.strokeStyle = 'rgba(210, 210, 210, 0.85)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= pxW; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, pxH);
      ctx.stroke();
    }
    for (let y = 0; y <= pxH; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(pxW, y + 0.5);
      ctx.stroke();
    }
  } else if (gridMode === 'dots') {
    const step = Math.max(8, Math.round(dpi / 10));
    const r = Math.max(0.6, dpi / 180);
    ctx.fillStyle = 'rgba(190, 190, 190, 0.9)';
    for (let x = step; x < pxW; x += step) {
      for (let y = step; y < pxH; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return canvas;
}

export function sanitizeFilenameSegment(s: string) {
  return s
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

export function buildExportBasename(diagramName: string, typeLabel: string, lang: 'ru' | 'en') {
  const name = sanitizeFilenameSegment(diagramName) || (lang === 'ru' ? 'Без названия' : 'Untitled');
  const type = sanitizeFilenameSegment(typeLabel) || (lang === 'ru' ? 'MindMap' : 'MindMap');
  return `${name} - ${type}`;
}

async function canvasToPngUint8Array(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG blob failed'))), 'image/png');
  });
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

export async function exportSheetPngBlob(
  orientation: SheetOrientation,
  gridMode: GridMode
): Promise<Blob> {
  const canvas = renderSheetToCanvas(orientation, gridMode, 150);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG failed'))), 'image/png');
  });
}

export async function exportSheetPdfBlob(
  orientation: SheetOrientation,
  gridMode: GridMode
): Promise<Blob> {
  const canvas = renderSheetToCanvas(orientation, gridMode, 150);
  const pngBytes = await canvasToPngUint8Array(canvas);
  const pdfDoc = await PDFDocument.create();
  const img = await pdfDoc.embedPng(pngBytes);
  const pageWPt = orientation === 'portrait' ? 595.28 : 841.89;
  const pageHPt = orientation === 'portrait' ? 841.89 : 595.28;
  const page = pdfDoc.addPage([pageWPt, pageHPt]);
  const iw = img.width;
  const ih = img.height;
  const scale = Math.min(pageWPt / iw, pageHPt / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const x = (pageWPt - dw) / 2;
  const y = (pageHPt - dh) / 2;
  page.drawImage(img, { x, y, width: dw, height: dh });
  const bytes = await pdfDoc.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

export async function exportSheetDocxBlob(
  orientation: SheetOrientation,
  gridMode: GridMode
): Promise<Blob> {
  const { Document, Packer, Paragraph, ImageRun } = await import('docx');
  const canvas = renderSheetToCanvas(orientation, gridMode, 150);
  const pngData = await canvasToPngUint8Array(canvas);
  const maxW = 600;
  const maxH = 850;
  const ratio = canvas.width / canvas.height;
  let tw = maxW;
  let th = Math.round(maxW / ratio);
  if (th > maxH) {
    th = maxH;
    tw = Math.round(maxH * ratio);
  }
  const image = new ImageRun({
    type: 'png',
    data: pngData,
    transformation: { width: tw, height: th },
  });
  const doc = new Document({
    sections: [
      {
        children: [new Paragraph({ children: [image] })],
      },
    ],
  });
  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
