import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import { formatGlossaryForClipboard } from '@/lib/format-glossary-clipboard';

type GlossaryRow = { element: string; description: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildGlossaryTableHtml(
  rows: GlossaryRow[],
  elementTitle: string,
  descriptionTitle: string
): string {
  const bodyRows = rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.element)}</td><td>${escapeHtml(row.description)}</td></tr>`
    )
    .join('');

  return `
<table>
  <thead>
    <tr>
      <th>${escapeHtml(elementTitle)}</th>
      <th>${escapeHtml(descriptionTitle)}</th>
    </tr>
  </thead>
  <tbody>
    ${bodyRows}
  </tbody>
</table>`;
}

function buildGlossaryStyledHtmlDocument(
  rows: GlossaryRow[],
  elementTitle: string,
  descriptionTitle: string,
  title?: string
): string {
  const table = buildGlossaryTableHtml(rows, elementTitle, descriptionTitle);
  const heading = title ? `<h3>${escapeHtml(title)}</h3>` : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      color: #000;
    }
    h3 {
      margin: 0 0 12px 0;
      font-size: 14pt;
      font-weight: 700;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px 10px;
      vertical-align: top;
      word-wrap: break-word;
    }
    th {
      text-align: center;
      font-weight: 700;
    }
    td {
      text-align: left;
    }
  </style>
</head>
<body>
  ${heading}
  ${table}
</body>
</html>`;
}

function downloadBlob(content: BlobPart, mimeType: string, fileName: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyGlossaryToClipboard(
  rows: GlossaryRow[],
  elementTitle: string,
  descriptionTitle: string,
  title?: string
): Promise<void> {
  const plain = formatGlossaryForClipboard(rows, elementTitle, descriptionTitle);
  const html = buildGlossaryStyledHtmlDocument(rows, elementTitle, descriptionTitle, title);

  if (navigator.clipboard && 'write' in navigator.clipboard && 'ClipboardItem' in window) {
    const item = new ClipboardItem({
      'text/plain': new Blob([plain], { type: 'text/plain' }),
      'text/html': new Blob([html], { type: 'text/html' }),
    });
    await navigator.clipboard.write([item]);
    return;
  }

  await navigator.clipboard.writeText(plain);
}

export function exportGlossaryAsWord(
  rows: GlossaryRow[],
  elementTitle: string,
  descriptionTitle: string,
  fileName = 'glossary.doc'
): void {
  const html = buildGlossaryStyledHtmlDocument(rows, elementTitle, descriptionTitle, 'Глоссарий');
  downloadBlob(html, 'application/msword;charset=utf-8', fileName);
}

export function exportGlossaryAsExcel(
  rows: GlossaryRow[],
  elementTitle: string,
  descriptionTitle: string,
  fileName = 'glossary.xls'
): void {
  const html = buildGlossaryStyledHtmlDocument(rows, elementTitle, descriptionTitle, 'Глоссарий');
  downloadBlob(html, 'application/vnd.ms-excel;charset=utf-8', fileName);
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export async function exportGlossaryAsPdf(
  rows: GlossaryRow[],
  elementTitle: string,
  descriptionTitle: string,
  fileName = 'glossary.pdf'
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  const tableWidth = page.getWidth() - margin * 2;
  const col1Width = Math.floor(tableWidth * 0.35);
  const col2Width = tableWidth - col1Width;
  const lineHeight = 14;
  const fontSize = 11;
  const padding = 6;
  let y = page.getHeight() - margin;

  const drawRow = (
    leftText: string,
    rightText: string,
    isHeader: boolean
  ): number => {
    const leftLines = wrapText(leftText, col1Width - padding * 2, isHeader ? boldFont : font, fontSize);
    const rightLines = wrapText(rightText, col2Width - padding * 2, isHeader ? boldFont : font, fontSize);
    const maxLines = Math.max(leftLines.length, rightLines.length);
    const rowHeight = Math.max(28, maxLines * lineHeight + padding * 2);

    if (y - rowHeight < margin) {
      page = pdfDoc.addPage([595, 842]);
      y = page.getHeight() - margin;
    }

    const top = y;
    const bottom = y - rowHeight;
    const x1 = margin;
    const x2 = margin + col1Width;
    const x3 = margin + col1Width + col2Width;

    page.drawLine({ start: { x: x1, y: top }, end: { x: x3, y: top }, color: rgb(0, 0, 0), thickness: 1 });
    page.drawLine({ start: { x: x1, y: bottom }, end: { x: x3, y: bottom }, color: rgb(0, 0, 0), thickness: 1 });
    page.drawLine({ start: { x: x1, y: top }, end: { x: x1, y: bottom }, color: rgb(0, 0, 0), thickness: 1 });
    page.drawLine({ start: { x: x2, y: top }, end: { x: x2, y: bottom }, color: rgb(0, 0, 0), thickness: 1 });
    page.drawLine({ start: { x: x3, y: top }, end: { x: x3, y: bottom }, color: rgb(0, 0, 0), thickness: 1 });

    const useFont = isHeader ? boldFont : font;
    leftLines.forEach((line, idx) => {
      const textWidth = useFont.widthOfTextAtSize(line, fontSize);
      const textX = isHeader ? x1 + (col1Width - textWidth) / 2 : x1 + padding;
      page.drawText(line, {
        x: textX,
        y: top - padding - fontSize - idx * lineHeight,
        size: fontSize,
        font: useFont,
        color: rgb(0, 0, 0),
      });
    });
    rightLines.forEach((line, idx) => {
      const textWidth = useFont.widthOfTextAtSize(line, fontSize);
      const textX = isHeader ? x2 + (col2Width - textWidth) / 2 : x2 + padding;
      page.drawText(line, {
        x: textX,
        y: top - padding - fontSize - idx * lineHeight,
        size: fontSize,
        font: useFont,
        color: rgb(0, 0, 0),
      });
    });

    y = bottom;
    return rowHeight;
  };

  drawRow(elementTitle, descriptionTitle, true);
  rows.forEach((row) => drawRow(row.element, row.description, false));

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer;
  downloadBlob(pdfBuffer, 'application/pdf', fileName);
}
