"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { STAGES } from "@/lib/mock-data";
import {
  useCreatePipeline,
  useDeletePipeline,
  usePipelines,
  useUpdatePipeline,
  type PipelineRow,
} from "@/lib/api";

interface StageRow {
  stage: string;
  slaHours: number;
  visible: boolean;
}

const DEFAULT_STAGES: StageRow[] = STAGES.map((s) => ({
  stage: s,
  slaHours: 24,
  visible: true,
}));

export function PipelinesView() {
  const { data, isLoading } = usePipelines();
  const pipelines = data?.pipelines ?? [];
  const [editing, setEditing] = useState<PipelineRow | null>(null);
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
            System · Configuration over code
          </div>
          <h2 style={{ margin: "0 0 4px" }}>Pipelines &amp; stages</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            Configure the admission funnel per programme — stage order, SLA hours, visibility. No
            code changes required.
          </p>
        </div>
        <button className="btn btn-primary" style={{ gap: 7 }} onClick={() => setCreating(true)}>
          <Icon name="plus" size={15} />
          New pipeline
        </button>
      </div>

      {isLoading && <div style={{ padding: 20, color: "var(--color-muted)" }}>Loading…</div>}

      <div className="grid gap-4">
        {pipelines.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <h4 style={{ margin: 0 }}>{p.name}</h4>
                <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
                  {p.programmeFilter ? `Applies to: ${p.programmeFilter}` : "Applies to: all programmes"}
                  {" · "}
                  {p.active ? "Active" : "Inactive"}
                </div>
              </div>
              <button className="btn btn-secondary" style={{ padding: "5px 12px" }} onClick={() => setEditing(p)}>
                Edit
              </button>
            </div>

            <div style={{ borderTop: "1px solid var(--color-divider)", marginTop: 8, paddingTop: 12 }}>
              <div className="flex flex-wrap gap-1.5">
                {p.stages.map((s) => (
                  <span
                    key={s.id}
                    className="tag"
                    style={{
                      background: s.visible ? "var(--color-accent-100)" : "transparent",
                      border: `1px solid ${s.visible ? "var(--color-accent)" : "var(--color-divider)"}`,
                      color: s.visible ? "var(--color-accent-800)" : "var(--color-muted)",
                    }}
                    title={`SLA: ${s.slaHours}h${!s.visible ? " · Hidden" : ""}`}
                  >
                    {s.stage} · {s.slaHours}h
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {pipelines.length === 0 && !isLoading && (
          <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--color-muted)" }}>
            No pipelines yet. Create the first one for B.Tech, PG, PhD, or School programmes.
          </div>
        )}
      </div>

      {(creating || editing) && (
        <PipelineDialog
          pipeline={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

// ── Dialog for create + edit ──────────────────────────────
function PipelineDialog({ pipeline, onClose }: { pipeline: PipelineRow | null; onClose: () => void }) {
  const create = useCreatePipeline();
  const update = useUpdatePipeline();
  const del = useDeletePipeline();
  const isNew = !pipeline;

  const [name, setName] = useState(pipeline?.name ?? "");
  const [programmeFilter, setProgrammeFilter] = useState(pipeline?.programmeFilter ?? "");
  const [active, setActive] = useState(pipeline?.active ?? true);
  const [stages, setStages] = useState<StageRow[]>(
    pipeline?.stages.map((s) => ({ stage: s.stage, slaHours: s.slaHours, visible: s.visible })) ??
      DEFAULT_STAGES
  );
  const [err, setErr] = useState<string | null>(null);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...stages];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setStages(next);
  };

  const updateStage = (idx: number, patch: Partial<StageRow>) => {
    setStages(stages.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      if (isNew) {
        await create.mutateAsync({
          name,
          programmeFilter: programmeFilter || null,
          stages,
        });
      } else {
        await update.mutateAsync({
          id: pipeline!.id,
          name,
          programmeFilter: programmeFilter || null,
          active,
          stages,
        });
      }
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const remove = async () => {
    if (!pipeline) return;
    if (!confirm(`Delete pipeline "${pipeline.name}"? Existing leads keep their current stage but new-lead defaults for this programme will fall back.`)) return;
    try {
      await del.mutateAsync({ id: pipeline.id });
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
        className="w-full max-w-[720px] flex flex-col gap-3"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-divider)",
          borderRadius: 6,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div className="flex items-center justify-between">
          <h4 style={{ margin: 0 }}>{isNew ? "New pipeline" : `Edit pipeline · ${pipeline!.name}`}</h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Name *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="B.Tech · UG · 2026-27"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Programme filter</label>
            <input
              className="input"
              value={programmeFilter}
              onChange={(e) => setProgrammeFilter(e.target.value)}
              placeholder="B.Tech (leave blank for all)"
            />
          </div>
        </div>

        {!isNew && (
          <label className="flex items-center gap-2" style={{ fontSize: 12.5 }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active (leads for this programme use this pipeline)
          </label>
        )}

        <div>
          <h5 style={{ margin: "8px 0" }}>Stages</h5>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 12, width: 60 }}>#</th>
                  <th>Stage</th>
                  <th style={{ width: 100 }}>SLA (hrs)</th>
                  <th style={{ width: 80 }}>Visible</th>
                  <th style={{ paddingRight: 12, width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s, i) => (
                  <tr key={i}>
                    <td style={{ paddingLeft: 12, fontFamily: "var(--font-heading)", color: "var(--color-accent-700)" }}>
                      {i + 1}
                    </td>
                    <td>
                      <select
                        className="input"
                        style={{ minHeight: 30, padding: "4px 8px" }}
                        value={s.stage}
                        onChange={(e) => updateStage(i, { stage: e.target.value })}
                      >
                        {STAGES.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="input"
                        style={{ minHeight: 30, padding: "4px 8px" }}
                        type="number"
                        min={0}
                        max={720}
                        value={s.slaHours}
                        onChange={(e) => updateStage(i, { slaHours: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={s.visible}
                        onChange={(e) => updateStage(i, { visible: e.target.checked })}
                      />
                    </td>
                    <td style={{ paddingRight: 12 }}>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: i === 0 ? "not-allowed" : "pointer",
                            opacity: i === 0 ? 0.35 : 1,
                          }}
                          title="Move up"
                        >
                          <Icon name="chevron-up" size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(i, 1)}
                          disabled={i === stages.length - 1}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: i === stages.length - 1 ? "not-allowed" : "pointer",
                            opacity: i === stages.length - 1 ? 0.35 : 1,
                          }}
                          title="Move down"
                        >
                          <Icon name="chevron-down" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {err && <div style={{ fontSize: 12, color: "#b4442e" }}>{err}</div>}

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
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? "Saving…" : "Save pipeline"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
