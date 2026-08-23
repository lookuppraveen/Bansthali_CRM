"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { STAGES } from "@/lib/mock-data";
import { useBulkLeads, useTemplates, useUsers } from "@/lib/api";

interface Props {
  selectedIds: number[];
  onClear: () => void;
  onDone: () => void;
}

type Mode = "menu" | "assign" | "advance" | "send";

export function BulkActionBar({ selectedIds, onClear, onDone }: Props) {
  const [mode, setMode] = useState<Mode>("menu");
  const bulk = useBulkLeads();
  const { data: usersData } = useUsers();
  const { data: emailTpls } = useTemplates("email");

  const [ownerId, setOwnerId] = useState<string>("");
  const [stage, setStage] = useState<string>(STAGES[1]);
  const [channel, setChannel] = useState<"email" | "whatsapp" | "sms">("email");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const staff = (usersData?.users ?? []).filter(
    (u) => u.active && ["counsellor", "admissions_head", "front_office"].includes(u.role)
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    try {
      if (mode === "assign") {
        if (!ownerId) return;
        const r = await bulk.mutateAsync({ action: "assign", ids: selectedIds, ownerId });
        setResult(`Reassigned ${r.count ?? selectedIds.length} lead(s).`);
      } else if (mode === "advance") {
        const r = await bulk.mutateAsync({ action: "advance", ids: selectedIds, stage });
        setResult(`Advanced ${r.count ?? selectedIds.length} lead(s) to ${stage}.`);
      } else if (mode === "send") {
        if (!body.trim()) return;
        const r = await bulk.mutateAsync({
          action: "send",
          ids: selectedIds,
          channel,
          templateId: templateId === "" ? undefined : Number(templateId),
          subject: subject || undefined,
          body,
        });
        setResult(`Sent ${r.sent ?? 0} · Failed ${r.failed ?? 0}.`);
      }
      onDone();
    } catch (err) {
      setResult(`Error: ${(err as Error).message}`);
    }
  };

  const pickTemplate = (idStr: string) => {
    const id = idStr === "" ? "" : Number(idStr);
    setTemplateId(id);
    if (id === "") return;
    const t = emailTpls?.templates.find((x) => x.id === id);
    if (t) {
      setSubject(t.subject ?? "");
      setBody(t.body);
    }
  };

  return (
    <div
      className="fixed left-1/2 bottom-6 z-40"
      style={{
        transform: "translateX(-50%)",
        background: "var(--color-card)",
        border: "1px solid var(--color-accent)",
        borderRadius: 8,
        padding: mode === "menu" ? "10px 14px" : "16px 18px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
        minWidth: 360,
        maxWidth: mode === "send" ? 640 : 480,
      }}
    >
      {result && (
        <div style={{ fontSize: 12.5, color: "var(--color-accent-700)", marginBottom: 8 }}>{result}</div>
      )}

      {mode === "menu" && (
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 13, fontFamily: "var(--font-heading)" }}>
            {selectedIds.length} selected
          </span>
          <span style={{ color: "var(--color-divider)" }}>·</span>
          <button className="btn btn-secondary" style={{ padding: "4px 10px", gap: 6 }} onClick={() => setMode("assign")}>
            <Icon name="user-plus" size={13} /> Reassign
          </button>
          <button className="btn btn-secondary" style={{ padding: "4px 10px", gap: 6 }} onClick={() => setMode("advance")}>
            <Icon name="chevron-right" size={13} /> Advance stage
          </button>
          <button className="btn btn-secondary" style={{ padding: "4px 10px", gap: 6 }} onClick={() => setMode("send")}>
            <Icon name="send" size={13} /> Bulk message
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: "4px 6px", marginLeft: "auto" }}
            onClick={onClear}
            title="Clear selection"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {mode !== "menu" && (
        <form onSubmit={submit}>
          <div className="flex items-center justify-between mb-2.5">
            <h5 style={{ margin: 0 }}>
              {mode === "assign"
                ? "Reassign to"
                : mode === "advance"
                  ? "Advance stage to"
                  : "Bulk message"}
              <span style={{ fontSize: 12, color: "var(--color-muted)", marginLeft: 8, fontFamily: "var(--font-body)" }}>
                {selectedIds.length} lead{selectedIds.length === 1 ? "" : "s"}
              </span>
            </h5>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "4px 6px" }}
              onClick={() => setMode("menu")}
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          {mode === "assign" && (
            <div>
              <select className="input" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required>
                <option value="">— pick a counsellor —</option>
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "advance" && (
            <div>
              <select className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "send" && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Channel</label>
                  <select
                    className="input"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as typeof channel)}
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Template</label>
                  <select className="input" value={templateId} onChange={(e) => pickTemplate(e.target.value)}>
                    <option value="">— optional —</option>
                    {emailTpls?.templates
                      .filter((t) => t.channel === channel)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              {channel === "email" && (
                <div>
                  <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Subject</label>
                  <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Body</label>
                <textarea
                  className="input"
                  style={{ minHeight: 100, fontFamily: "var(--font-body)" }}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
                <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
                  Merge tokens applied per-lead: {"{{name}}"}, {"{{program}}"}, {"{{faculty}}"}, {"{{city}}"}.
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end mt-3">
            <button type="button" className="btn btn-secondary" onClick={() => setMode("menu")}>
              Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={bulk.isPending}>
              {bulk.isPending ? "Applying…" : "Apply to selection"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
