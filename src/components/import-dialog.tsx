"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { useImportLeads } from "@/lib/api";

// Minimal CSV parser — handles double-quoted fields with commas inside.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (field !== "" || row.length) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length < 2) return [];
  const [header, ...body] = rows;
  const keys = header.map((h) => h.trim().toLowerCase());
  return body
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const imp = useImportLeads();

  const onFile = async (file: File) => {
    setErr(null);
    setDone(null);
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.length) {
      setErr("No rows found. Need a header row plus at least one data row.");
      setRows([]);
      return;
    }
    if (!parsed[0]?.name) {
      setErr('CSV must include a "name" column (case-insensitive).');
      setRows([]);
      return;
    }
    setRows(parsed);
  };

  const submit = async () => {
    setErr(null);
    try {
      const res = await imp.mutateAsync(rows);
      setDone(res.inserted);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div
      className="fixed inset-0 grid place-items-center z-50"
      style={{ background: "rgba(28,21,18,0.55)", padding: 24 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] flex flex-col gap-3"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-divider)",
          borderRadius: 6,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center justify-between">
          <h4 style={{ margin: 0 }}>Import leads · CSV</h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ fontSize: 12.5, color: "var(--color-muted)" }}>
          Columns: <code>name</code> (required), <code>email</code>, <code>phone</code>, <code>city</code>,{" "}
          <code>program</code>, <code>faculty</code>, <code>source</code> — up to 500 rows per upload.
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          style={{ display: "none" }}
        />

        <div
          onClick={() => fileRef.current?.click()}
          className="grid place-items-center text-center"
          style={{
            border: "1.5px dashed var(--color-divider)",
            borderRadius: 6,
            padding: 32,
            cursor: "pointer",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          <Icon name="upload-cloud" size={30} style={{ color: "var(--color-accent)" }} />
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 15, marginTop: 8 }}>
            {fileName ?? "Click to choose a .csv file"}
          </div>
          {rows.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--color-accent-700)", marginTop: 4 }}>
              {rows.length} row{rows.length === 1 ? "" : "s"} parsed
            </div>
          )}
        </div>

        {err && <div style={{ fontSize: 12, color: "#b4442e" }}>{err}</div>}
        {done != null && (
          <div style={{ fontSize: 13, color: "var(--color-accent-700)" }}>
            ✓ Imported {done} lead{done === 1 ? "" : "s"}.
          </div>
        )}

        <div className="flex gap-2 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {done != null ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={imp.isPending || rows.length === 0 || done != null}
          >
            {imp.isPending ? "Importing…" : `Import ${rows.length || ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
