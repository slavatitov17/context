/** TSV с заголовками — удобно вставлять в Excel / Google Sheets */

function sanitizeCell(value: string): string {
  return value.replace(/\t/g, ' ').replace(/\r\n/g, '\n').replace(/\n/g, ' ');
}

export function formatGlossaryForClipboard(
  items: Array<{ element: string; description: string }>,
  elementColumnTitle: string,
  descriptionColumnTitle: string
): string {
  const lines = [
    `${sanitizeCell(elementColumnTitle)}\t${sanitizeCell(descriptionColumnTitle)}`,
    ...items.map((row) => `${sanitizeCell(row.element)}\t${sanitizeCell(row.description)}`),
  ];
  return lines.join('\n');
}
