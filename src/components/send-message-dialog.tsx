"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { useSendComm, useTemplates } from "@/lib/api";

type Channel = "email" | "whatsapp" | "sms";

const CHANNEL_LABEL: Record<Channel, string> = {
  email: "email",
  whatsapp: "WhatsApp message",
  sms: "SMS",
};
const CHANNEL_ICON: Record<Channel, string> = {
  email: "mail",
  whatsapp: "message-circle",
  sms: "smartphone",
};
const CHANNEL_PROVIDER: Record<Channel, string> = {
  email: "Resend",
  whatsapp: "Gupshup",
  sms: "MSG91",
};

function mergeTemplate(body: string, vars: Record<string, string | number | null | undefined>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_full, key: string) => {
    const v = vars[key];
    return v == null || v === "" ? `[${key}]` : String(v);
  });
}

interface Props {
  channel: Channel;
  lead: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    program: string | null;
    faculty: string | null;
    city: string | null;
  };
  onClose: () => void;
}

export function SendMessageDialog({ channel, lead, onClose }: Props) {
  const { data: tpls } = useTemplates(channel);
  const send = useSendComm();

  const initialRecipient = channel === "email" ? lead.email ?? "" : lead.phone ?? "";
  const [templateId, setTemplateId] = useState<number | "">("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipient, setRecipient] = useState(initialRecipient);
  const [done, setDone] = useState<null | { ok: boolean; error?: string; id?: string }>(null);

  const mergeVars = useMemo(
    () => ({
      name: lead.name,
      program: lead.program ?? "your programme",
      faculty: lead.faculty ?? "",
      city: lead.city ?? "",
    }),
    [lead]
  );

  useEffect(() => {
    if (templateId === "" || !tpls) return;
    const t = tpls.templates.find((x) => x.id === Number(templateId));
    if (!t) return;
    setSubject(t.subject ?? "");
    setBody(t.body);
  }, [templateId, tpls]);

  const preview = useMemo(() => mergeTemplate(body, mergeVars), [body, mergeVars]);
  const previewSubject = useMemo(() => mergeTemplate(subject, mergeVars), [subject, mergeVars]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) return;
    setDone(null);
    try {
      const res = await send.mutateAsync({
        leadId: lead.id,
        channel,
        templateId: templateId === "" ? undefined : Number(templateId),
        subject: channel === "email" ? previewSubject : undefined,
        body: preview,
        recipientOverride: recipient !== initialRecipient ? recipient : undefined,
      });
      setDone({ ok: res.ok, error: res.error, id: res.providerMessageId });
    } catch (err) {
      setDone({ ok: false, error: (err as Error).message });
    }
  };

  const recipientLabel = channel === "email" ? "To (email)" : "To (phone, E.164)";
  const recipientPlaceholder = channel === "email" ? "student@example.com" : "+919812345678";

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
          <div>
            <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name={CHANNEL_ICON[channel]} size={18} style={{ color: "var(--color-accent)" }} />
              Send {CHANNEL_LABEL[channel]} · {lead.name}
            </h4>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
              via {CHANNEL_PROVIDER[channel]} · logged to communications + timeline
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Template</label>
          <select
            className="input"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">— pick a template or write freely below —</option>
            {tpls?.templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>{recipientLabel}</label>
          <input
            className="input"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
            placeholder={recipientPlaceholder}
          />
          {channel === "whatsapp" && (
            <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
              Gupshup sandbox: the destination number must have opted in by messaging your sandbox
              number first from their WhatsApp.
            </div>
          )}
          {channel === "sms" && (
            <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
              MSG91: production sends need DLT-registered templates + sender ID.
            </div>
          )}
        </div>

        {channel === "email" && (
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Subject</label>
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Body</label>
          <textarea
            className="input"
            style={{ minHeight: channel === "email" ? 180 : 100, fontFamily: "var(--font-body)" }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={channel === "sms" ? 480 : undefined}
          />
          <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
            Merge tokens: <code>{"{{name}}"}</code> <code>{"{{program}}"}</code>{" "}
            <code>{"{{faculty}}"}</code> <code>{"{{city}}"}</code>
            {channel === "sms" && ` · ${body.length}/480 chars`}
          </div>
        </div>

        {body && (
          <div
            style={{
              background: "rgba(0,0,0,0.03)",
              border: "1px solid var(--color-divider)",
              borderRadius: 4,
              padding: 12,
              fontSize: 12.5,
              whiteSpace: "pre-wrap",
              maxHeight: 200,
              overflow: "auto",
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 6 }}>
              Preview (merged){channel === "email" && previewSubject ? ` — ${previewSubject}` : ""}
            </div>
            {preview}
          </div>
        )}

        {done?.ok && (
          <div style={{ fontSize: 12.5, color: "var(--color-accent-700)" }}>
            ✓ Sent{done.id ? ` · id ${done.id}` : ""}
          </div>
        )}
        {done && !done.ok && (
          <div style={{ fontSize: 12.5, color: "#b4442e" }}>Failed: {done.error}</div>
        )}

        <div className="flex gap-2 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {done?.ok ? "Done" : "Cancel"}
          </button>
          <button type="submit" className="btn btn-primary" disabled={send.isPending || done?.ok}>
            {send.isPending ? "Sending…" : `Send ${CHANNEL_LABEL[channel]}`}
          </button>
        </div>
      </form>
    </div>
  );
}
