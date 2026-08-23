/**
 * Tiny CSV writer + downloader. Escapes fields with commas, quotes, or newlines
 * per RFC 4180 (double-quote wrap + double-quote escape).
 */

export type Row = Record<string, string | number | null | undefined>;

function csvField(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: Row[], columns?: string[]): string {
  if (rows.length === 0) return "";
  const cols = columns ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const header = cols.map(csvField).join(",");
  const body = rows.map((r) => cols.map((c) => csvField(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
  // BOM so Excel opens as UTF-8.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
