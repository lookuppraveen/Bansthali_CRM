"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import {
  useCreateKbDoc,
  useDeleteKbDoc,
  useKbDoc,
  useKbDocs,
  useUpdateKbDoc,
  type KbDoc,
} from "@/lib/api";

const LANG_LABEL: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
};

export function KbView() {
  const { data, isLoading } = useKbDocs();
  const docs = data?.documents ?? [];
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <section className="view">
      <div className="flex items-end gap-4 mb-5">
        <div className="flex-1">
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".13em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              marginBottom: 6,
            }}
          >
            System · AI Assistant Knowledge Base
          </div>
          <h2 style={{ margin: "0 0 4px" }}>Knowledge Base</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            Content the AI Assistant answers from. New docs and edits are re-embedded automatically
            (OpenAI text-embedding-3-small).
          </p>
        </div>
        <button className="btn btn-primary" style={{ gap: 7 }} onClick={() => setCreating(true)}>
          <Icon name="plus" size={15} />
          New document
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 16 }}>Title</th>
              <th style={{ width: 100 }}>Language</th>
              <th style={{ width: 110 }}>Category</th>
              <th style={{ width: 90 }}>Chunks</th>
              <th style={{ width: 140 }}>Updated</th>
              <th style={{ paddingRight: 16, width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--color-muted)" }}>
                  Loading…
                </td>
              </tr>
            )}
            {docs.map((d) => (
              <tr key={d.id}>
                <td style={{ paddingLeft: 16 }}>
                  <div style={{ fontSize: 13 }}>{d.title}</div>
                  <div style={{ fontSize: 10.5, color: "var(--color-muted)" }}>{d.sourcePath}</div>
                </td>
                <td>
                  <span className="tag tag-neutral">{LANG_LABEL[d.language] ?? d.language}</span>
                </td>
                <td style={{ fontSize: 12, color: "var(--color-muted)" }}>{d.category}</td>
                <td style={{ fontFeatureSettings: "'tnum'" }}>{d.chunkCount}</td>
                <td style={{ fontSize: 11.5, color: "var(--color-muted)" }}>
                  {new Date(d.updatedAt).toLocaleString(undefined, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td style={{ paddingRight: 16, textAlign: "right" }}>
                  {d.editable ? (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "3px 10px", fontSize: 12 }}
                      onClick={() => setEditingId(d.id)}
                    >
                      Edit
                    </button>
                  ) : (
                    <span title="Filesystem-managed — edit source file + run `npm run kb:ingest`" style={{ fontSize: 11, color: "var(--color-muted)" }}>
                      file
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && <KbDialog id={null} onClose={() => setCreating(false)} />}
      {editingId != null && <KbDialog id={editingId} onClose={() => setEditingId(null)} />}
    </section>
  );
}

// ── Dialog for create + edit ──────────────────────────────
function KbDialog({ id, onClose }: { id: number | null; onClose: () => void }) {
  const isNew = id == null;
  const { data } = useKbDoc(id);
  const create = useCreateKbDoc();
  const update = useUpdateKbDoc();
  const del = useDeleteKbDoc();

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("en");
  const [category, setCategory] = useState("general");
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.document) return;
    setTitle(data.document.title);
    setLanguage(data.document.language);
    setCategory(data.document.category);
    setBody(data.document.rawSource ?? "");
  }, [data]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (body.trim().length < 20) {
      setErr("Body must be at least 20 characters.");
      return;
    }
    try {
      if (isNew) {
        const r = await create.mutateAsync({ title, language, category, body });
        setOk(`Created + embedded (${r.chunksInserted} chunks). Close to see it in the list.`);
      } else {
        await update.mutateAsync({ id: id!, title, language, category, body });
        setOk("Saved and re-embedded.");
      }
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const remove = async () => {
    if (!id) return;
    if (!confirm(`Delete this document? Its chunks will be removed from the AI's knowledge.`)) return;
    try {
      await del.mutateAsync({ id });
      onClose();
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
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[820px] flex flex-col gap-3"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-divider)",
          borderRadius: 6,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxHeight: "94vh",
          overflow: "auto",
        }}
      >
        <div className="flex items-center justify-between">
          <h4 style={{ margin: 0 }}>{isNew ? "New KB document" : `Edit KB document`}</h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "1.5fr 1fr 1fr" }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Title *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Language</label>
            <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {Object.entries(LANG_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Category</label>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="admissions / hostel / fees / safety …"
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>
            Markdown body *
          </label>
          <textarea
            className="input"
            style={{ minHeight: 320, fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12.5 }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder="# Title&#10;&#10;Intro paragraph.&#10;&#10;## Section&#10;&#10;- Bullet&#10;- Bullet"
          />
          <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
            The chunker splits on <code>##</code> section headings — write clear H2s for cleaner retrieval.
          </div>
        </div>

        {ok && <div style={{ fontSize: 12.5, color: "var(--color-accent-700)" }}>{ok}</div>}
        {err && <div style={{ fontSize: 12.5, color: "#b4442e" }}>{err}</div>}

        <div className="flex gap-2 justify-between items-center mt-2">
          <div>
            {!isNew && (
              <button
                type="button"
                onClick={remove}
                className="btn btn-secondary"
                style={{ color: "#b4442e", borderColor: "#b4442e" }}
                disabled={del.isPending}
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={create.isPending || update.isPending}
            >
              {create.isPending || update.isPending ? "Embedding…" : isNew ? "Create + embed" : "Save + re-embed"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
