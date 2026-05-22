export function downloadFile(filename: string, content: BlobPart, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeCell(value: string | number): string {
  const s = String(value ?? '');
  if (/[";\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
): void {
  // ; separator + BOM so Excel (pt-BR locale) opens it correctly.
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(';'));
  const csv = '﻿' + lines.join('\r\n');
  downloadFile(filename, csv, 'text/csv;charset=utf-8');
}

export function downloadJSON(filename: string, data: unknown): void {
  downloadFile(filename, JSON.stringify(data, null, 2), 'application/json');
}
