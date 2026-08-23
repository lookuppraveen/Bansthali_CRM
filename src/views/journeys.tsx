"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { STAGES } from "@/lib/mock-data";
import {
  useCreateJourney,
  useDeleteJourney,
  useJourneys,
  useRunJourneys,
  useTemplates,
  useUpdateJourney,
  type JourneyRow,
} from "@/lib/api";

const TRIGGER_LABEL: Record<string, string> = {
  enquiry_created: "New enquiry (age > delay)",
  stage_entered: "Stage entered",
  stage_stalled: "Stage stalled",
};

const CHANNEL_ICON: Record<string, string> = {
  email: "mail",
  whatsapp: "message-circle",
  sms: "smartphone",
};

export function JourneysView() {
  const { data, isLoading } = useJourneys();
  const journeys = data?.journeys ?? [];
  const [editing, setEditing] = useState<JourneyRow | null>(null);
  const [creating, setCreating] = useState(false);
  const runNow = useRunJourneys();
  const update = useUpdateJourney();
  const [lastRun, setLastRun] = useState<null | {
    candidates: number;
    sent: number;
    failed: number;
    skipped: number;
  }>(null);

  const doRun = async () => {
    setLastRun(null);
    try {
      const r = await runNow.mutateAsync();
      setLastRun(r.totals);
    } catch {}
  };

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
            System · Automation
          </div>
          <h2 style={{ margin: "0 0 4px" }}>Journeys &middot; drip automation</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            Trigger-and-delay rules. Vercel Cron evaluates every 15 min. Each lead runs through a
            journey at most once.
          </p>
        </div>
        <button className="btn btn-secondary" style={{ gap: 7 }} onClick={doRun} disabled={runNow.isPending}>
          <Icon name="play" size={14} />
          {runNow.isPending ? "Running…" : "Run now"}
        </button>
        <button className="btn btn-primary" style={{ gap: 7 }} onClick={() => setCreating(true)}>
          <Icon name="plus" size={15} />
          New journey
        </button>
      </div>

      {lastRun && (
        <div
          className="card mb-4"
          style={{ borderColor: "var(--color-accent)", background: "var(--color-accent-100)" }}
        >
          <div style={{ fontSize: 13 }}>
            <strong>Manual run complete.</strong> Candidates: {lastRun.candidates} · Sent: {lastRun.sent} ·
            Skipped: {lastRun.skipped} · Failed: {lastRun.failed}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 16 }}>Name</th>
              <th>Trigger</th>
              <th>Delay</th>
              <th>Channel</th>
              <th>Template</th>
              <th>Runs</th>
              <th>Status</th>
              <th style={{ paddingRight: 16 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} style={{ padding: 20, textAlign: "center", color: "var(--color-muted)" }}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && journeys.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
                  No journeys yet. Create your first automation — for example,
                  &ldquo;Application incomplete reminder&rdquo; 3 days after Enquiry.
                </td>
              </tr>
            )}
            {journeys.map((j) => (
              <tr key={j.id} style={{ opacity: j.active ? 1 : 0.55 }}>
                <td style={{ paddingLeft: 16, fontSize: 13 }}>{j.name}</td>
                <td style={{ fontSize: 12 }}>
                  {TRIGGER_LABEL[j.trigger] ?? j.trigger}
                  {j.triggerStage && (
                    <div style={{ color: "var(--color-muted)", fontSize: 11 }}>{j.triggerStage}</div>
                  )}
                </td>
                <td style={{ fontFeatureSettings: "'tnum'" }}>{j.delayHours}h</td>
                <td>
                  <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12 }}>
                    <Icon
                      name={CHANNEL_ICON[j.channel] ?? "send"}
                      size={13}
                      style={{ color: "var(--color-accent-700)" }}
                    />
                    {j.channel}
                  </span>
                </td>
                <td style={{ fontSize: 12 }}>{j.template?.name ?? "—"}</td>
                <td style={{ fontSize: 12, fontFeatureSettings: "'tnum'" }}>
                  <span title={`${j.stats.sent} sent · ${j.stats.failed} failed · ${j.stats.skipped} skipped`}>
                    {j.stats.total}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => update.mutate({ id: j.id, active: !j.active })}
                    className={`tag ${j.active ? "tag-accent" : "tag-neutral"}`}
                    style={{ cursor: "pointer", border: "none" }}
                  >
                    {j.active ? "Active" : "Paused"}
                  </button>
                </td>
                <td style={{ paddingRight: 16, textAlign: "right" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "3px 10px", fontSize: 12 }}
                    onClick={() => setEditing(j)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 12 }}>
        <strong style={{ color: "var(--color-text)" }}>Deploy note:</strong> On Vercel, cron runs every
        15 minutes automatically (see <code>vercel.json</code>). In dev, click <em>Run now</em> to
        trigger evaluation manually.
      </div>

      {(creating || editing) && (
        <JourneyDialog
          journey={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

function JourneyDialog({ journey, onClose }: { journey: JourneyRow | null; onClose: () => void }) {
  const create = useCreateJourney();
  const update = useUpdateJourney();
  const del = useDeleteJourney();
  const isNew = !journey;

  const [name, setName] = useState(journey?.name ?? "");
  const [trigger, setTrigger] = useState<"enquiry_created" | "stage_entered" | "stage_stalled">(
    (journey?.trigger as "enquiry_created" | "stage_entered" | "stage_stalled") ?? "stage_stalled"
  );
  const [triggerStage, setTriggerStage] = useState(journey?.triggerStage ?? STAGES[0]);
  const [delayHours, setDelayHours] = useState(journey?.delayHours ?? 72);
  const [channel, setChannel] = useState<"email" | "whatsapp" | "sms">(
    (journey?.channel as "email" | "whatsapp" | "sms") ?? "email"
  );
  const [templateId, setTemplateId] = useState<number | "">(journey?.templateId ?? "");
  const [active, setActive] = useState(journey?.active ?? true);
  const [err, setErr] = useState<string | null>(null);

  const { data: tpls } = useTemplates(channel);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (templateId === "") {
      setErr("Pick a template.");
      return;
    }
    try {
      if (isNew) {
        await create.mutateAsync({
          name,
          trigger,
          triggerStage: trigger === "enquiry_created" ? null : triggerStage,
          delayHours,
          channel,
          templateId: Number(templateId),
          active,
        });
      } else {
        await update.mutateAsync({
          id: journey!.id,
          name,
          trigger,
          triggerStage: trigger === "enquiry_created" ? null : triggerStage,
          delayHours,
          channel,
          templateId: Number(templateId),
          active,
        });
      }
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const remove = async () => {
    if (!journey) return;
    if (!confirm(`Delete journey "${journey.name}"?`)) return;
    try {
      await del.mutateAsync({ id: journey.id });
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
        className="w-full max-w-[640px] flex flex-col gap-3"
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
          <h4 style={{ margin: 0 }}>{isNew ? "New journey" : `Edit journey · ${journey!.name}`}</h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Name *</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Application incomplete reminder"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Trigger</label>
            <select
              className="input"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as typeof trigger)}
            >
              <option value="enquiry_created">New enquiry (age &gt; delay)</option>
              <option value="stage_entered">Stage entered</option>
              <option value="stage_stalled">Stage stalled</option>
            </select>
          </div>
          {trigger !== "enquiry_created" && (
            <div>
              <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Trigger stage</label>
              <select
                className="input"
                value={triggerStage ?? ""}
                onChange={(e) => setTriggerStage(e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Delay (hours)</label>
            <input
              className="input"
              type="number"
              min={0}
              max={720}
              value={delayHours}
              onChange={(e) => setDelayHours(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Channel</label>
            <select
              className="input"
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value as typeof channel);
                setTemplateId("");
              }}
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div className="col-span-2">
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Template</label>
            <select
              className="input"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value === "" ? "" : Number(e.target.value))}
              required
            >
              <option value="">— pick a {channel} template —</option>
              {tpls?.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2" style={{ fontSize: 12.5 }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active (cron will evaluate this journey)
        </label>

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
              {create.isPending || update.isPending ? "Saving…" : "Save journey"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
