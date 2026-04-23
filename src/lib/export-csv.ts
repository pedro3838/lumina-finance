// CSV export utility with BR-friendly formatting (semicolon delimiter, BOM for Excel)

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[";\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const sep = ";";
  const headerLine = headers.map(escapeCell).join(sep);
  const bodyLines = rows.map((r) => r.map(escapeCell).join(sep));
  return [headerLine, ...bodyLines].join("\r\n");
}

export function downloadCSV(filename: string, csv: string) {
  // BOM ensures Excel opens UTF-8 with accents correctly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function timestampedFilename(base: string, ext = "csv"): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `${base}-${stamp}.${ext}`;
}

// Format number as BR decimal (comma) without thousand separators for clean CSV import
export function csvNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(2).replace(".", ",");
}
