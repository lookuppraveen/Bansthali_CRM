"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { useCreateTemplate, useDeleteTemplate, useTemplates, useUpdateTemplate } from "@/lib/api";

type Channel = "email" | "whatsapp" | "sms" | "in_app" | "phone";

const CHANNEL_LABEL: Record<Channel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  sms: "SMS",
  in_app: "In-app",
  phone: "Phone",
};
const CHANNEL_ICON: Record<Channel, string> = {
  email: "mail",
  whatsapp: "message-circle",
  sms: "smartphone",
  in_app: "bell",
  phone: "phone",
};

interface TplRow {
  id: number;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  language: string;
  approved: boolean;
}

export function TemplatesView() {
  const { data, isLoading } = useTemplates();
  const templates = data?.templates ?? [];
  const [filter, setFilter] = useState<"all" | Channel>("all");
  const [editing, setEditing] = useState<TplRow | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = filter === "all" ? templates : templates.filter((t) => t.channel === filter);

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
            System · Communications
          </div>
          <h2 style={{ margin: "0 0 4px" }}>Message templates</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            Manage the templates counsellors send from Lead 360°. Merge tokens: {"{{name}}"},{" "}
            {"{{program}}"}, {"{{faculty}}"}, {"{{city}}"}.
          </p>
        </div>
        <button className="btn btn-primary" style={{ gap: 7 }} onClick={() => setCreating(true)}>
          <Icon name="plus" size={15} />
          New template
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "email", "whatsapp", "sms"] as const).map((k) => {
          const on = filter === k;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className="tag"
              style={{
                cursor: "pointer",
                border: `1px solid ${on ? "var(--color-accent)" : "var(--color-divider)"}`,
                color: on ? "var(--color-accent-700)" : "var(--color-muted)",
                background: on ? "var(--color-accent-100)" : "transparent",
                fontFamily: "var(--font-body)",
              }}
            >
              {k === "all" ? "All" : CHANNEL_LABEL[k]}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 16, width: 40 }}>Ch</th>
              <th>Name</th>
              <th>Subject</th>
              <th style={{ width: 80 }}>Lang</th>
              <th style={{ width: 90 }}>Status</th>
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
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--color-muted)" }}>
                  No templates in this channel yet.
                </td>
              </tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id}>
                <td style={{ paddingLeft: 16 }}>
                  <Icon
                    name={CHANNEL_ICON[t.channel as Channel] ?? "file-text"}
                    size={16}
                    style={{ color: "var(--color-accent-700)" }}
                  />
                </td>
                <td style={{ fontSize: 13 }}>{t.name}</td>
                <td style={{ fontSize: 12, color: "var(--color-muted)" }}>{t.subject ?? "—"}</td>
                <td>
                  <span className="tag tag-neutral">{t.language}</span>
                </td>
                <td>
                  <span className={`tag ${t.approved ? "tag-accent" : "tag-outline"}`}>
                    {t.approved ? "Approved" : "Draft"}
                  </span>
                </td>
                <td style={{ paddingRight: 16, textAlign: "right" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                    onClick={() => setEditing(t)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <TemplateDialog
          template={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

// ── Dialog for create + edit ─────────────────────────────
function TemplateDialog({ template, onClose }: { template: TplRow | null; onClose: () => void }) {
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const del = useDeleteTemplate();

  const isNew = !template;
  const [name, setName] = useState(template?.name ?? "");
  const [channel, setChannel] = useState<Channel>((template?.channel as Channel) ?? "email");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [language, setLanguage] = useState(template?.language ?? "en");
  const [approved, setApproved] = useState(template?.approved ?? false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      if (isNew) {
        await create.mutateAsync({ name, channel, subject: subject || undefined, body, language, approved });
      } else {
        await update.mutateAsync({
          id: template!.id,
          name,
          subject: subject || null,
          body,
          language,
          approved,
        });
      }
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const remove = async () => {
    if (!template) return;
    if (!confirm(`Delete template "${template.name}"?`)) return;
    setErr(null);
    try {
      await del.mutateAsync({ id: template.id });
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
        className="w-full max-w-[700px] flex flex-col gap-3"
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
          <h4 style={{ margin: 0 }}>{isNew ? "New template" : `Edit template · ${template!.name}`}</h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Name *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Channel</label>
            <select
              className="input"
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
              disabled={!isNew}
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="in_app">In-app</option>
            </select>
            {!isNew && (
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
                Channel is fixed after creation.
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Language</label>
            <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
            </select>
          </div>
          {channel === "email" && (
            <div className="col-span-2">
              <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Subject</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Body *</label>
          <textarea
            className="input"
            style={{ minHeight: channel === "email" ? 220 : 120, fontFamily: "var(--font-body)" }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
            Merge tokens: <code>{"{{name}}"}</code> <code>{"{{program}}"}</code>{" "}
            <code>{"{{faculty}}"}</code> <code>{"{{city}}"}</code>
          </div>
        </div>

        <label className="flex items-center gap-2" style={{ fontSize: 12.5 }}>
          <input
            type="checkbox"
            checked={approved}
            onChange={(e) => setApproved(e.target.checked)}
          />
          Approved for send (counsellors can pick it from the send dialog)
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
                {del.isPending ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={create.isPending || update.isPending}
            >
              {create.isPending || update.isPending ? "Saving…" : "Save template"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
