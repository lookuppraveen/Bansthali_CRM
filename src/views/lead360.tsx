"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { useView } from "@/app/view-context";
import { STAGES, STAGE_ICON } from "@/lib/mock-data";
import { gradeColor, gradeOf, initials, stageTag } from "@/lib/format";
import { useAdvanceStage, useHandoff, useLead, useLogEvent, useRefreshPayment, useToggleTask } from "@/lib/api";
import { SendMessageDialog } from "@/components/send-message-dialog";
import { CreatePaymentDialog } from "@/components/create-payment-dialog";
import { EditLeadDialog } from "@/components/edit-lead-dialog";

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

export function Lead360View() {
  const { selectedLeadId, setView } = useView();
  const { data, isLoading, error } = useLead(selectedLeadId);
  const advance = useAdvanceStage();
  const logEvent = useLogEvent();
  const toggleTask = useToggleTask();
  const handoff = useHandoff();
  const refreshPayment = useRefreshPayment();
  const [note, setNote] = useState("");
  const [sendChannel, setSendChannel] = useState<"email" | "whatsapp" | "sms" | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  if (isLoading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (error || !data?.lead)
    return (
      <div style={{ padding: 40, color: "#b4442e" }}>{(error as Error)?.message ?? "Lead not found"}</div>
    );

  const lead = data.lead;
  const stageIdx = STAGES.indexOf(lead.stage as (typeof STAGES)[number]);
  const nextStage = stageIdx >= 0 && stageIdx < STAGES.length - 1 ? STAGES[stageIdx + 1] : null;

  const steps = STAGES.map((name, i) => {
    const done = i < stageIdx;
    const cur = i === stageIdx;
    return {
      name,
      icon: STAGE_ICON[name],
      ring: done || cur ? "var(--color-accent)" : "var(--color-divider)",
      fill: cur ? "var(--color-accent)" : done ? "var(--color-accent-100)" : "transparent",
      ink: cur ? "#fff" : done ? "var(--color-accent-700)" : "var(--color-neutral-500)",
      label: done || cur ? "var(--color-text)" : "var(--color-muted)",
      bar: done ? "var(--color-accent-400)" : "var(--color-divider)",
    };
  });

  const grade = gradeOf(lead.score);
  const gColor = gradeColor(lead.score);
  const parent = lead.parents[0];
  const lastHandoff = lead.handoff[0];

  const submitNote = () => {
    if (!note.trim()) return;
    logEvent.mutate({ leadId: lead.id, title: note.trim(), icon: "pen-line" });
    setNote("");
  };

  return (
    <section className="view">
      {sendChannel && (
        <SendMessageDialog
          channel={sendChannel}
          lead={{
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            program: lead.program,
            faculty: lead.faculty,
            city: lead.city,
          }}
          onClose={() => setSendChannel(null)}
        />
      )}
      {showPayment && (
        <CreatePaymentDialog
          leadId={lead.id}
          leadName={lead.name}
          onClose={() => setShowPayment(false)}
        />
      )}
      {showEdit && (
        <EditLeadDialog
          lead={{
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            city: lead.city,
            program: lead.program,
            faculty: lead.faculty,
            category: lead.category,
            aggregate: lead.aggregate,
            language: lead.language,
            hostelRequested: lead.hostelRequested,
          }}
          onClose={() => setShowEdit(false)}
        />
      )}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setView("leads");
        }}
        className="inline-flex items-center gap-1.5"
        style={{ fontSize: 12.5, marginBottom: 16 }}
      >
        <Icon name="arrow-left" size={14} />
        All leads
      </a>

      <div className="card mb-5">
        <div className="flex items-start gap-4">
          <div
            className="w-[52px] h-[52px] flex-none grid place-items-center rounded-full"
            style={{
              border: "1px solid var(--color-accent)",
              fontFamily: "var(--font-heading)",
              fontSize: 20,
              color: "var(--color-accent-700)",
            }}
          >
            {initials(lead.name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 style={{ margin: 0 }}>{lead.name}</h3>
              <span className={`tag ${stageTag(lead.stage)}`}>{lead.stage}</span>
              {lastHandoff?.erpStudentId && (
                <span className="tag tag-accent" title="ERP student ID">
                  ERP · {lastHandoff.erpStudentId}
                </span>
              )}
            </div>
            <div
              className="flex gap-2 mt-1.5 flex-wrap"
              style={{ fontSize: 12.5, color: "var(--color-muted)" }}
            >
              <span>{lead.program}</span>
              <span>·</span>
              <span>{lead.faculty}</span>
              <span>·</span>
              <span>{lead.city}</span>
            </div>
          </div>
          <div className="text-center px-1.5">
            <div
              className="w-[52px] h-[52px] rounded-full grid place-items-center"
              style={{
                border: `2px solid ${gColor}`,
                fontFamily: "var(--font-heading)",
                fontSize: 22,
                color: gColor,
              }}
            >
              {lead.score}
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--color-muted)",
                marginTop: 5,
              }}
            >
              Grade {grade}
            </div>
          </div>
          <button
            className="btn btn-icon btn-secondary"
            title="Edit lead"
            onClick={() => setShowEdit(true)}
            style={{ alignSelf: "flex-start" }}
          >
            <Icon name="pencil" size={15} />
          </button>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button className="btn btn-primary" style={{ gap: 6 }}>
            <Icon name="phone" size={14} />
            Call
          </button>
          <button className="btn btn-secondary" style={{ gap: 6 }} onClick={() => setSendChannel("whatsapp")}>
            <Icon name="message-circle" size={14} />
            WhatsApp
          </button>
          <button className="btn btn-secondary" style={{ gap: 6 }} onClick={() => setSendChannel("email")}>
            <Icon name="mail" size={14} />
            Email
          </button>
          <button className="btn btn-secondary" style={{ gap: 6 }} onClick={() => setSendChannel("sms")}>
            <Icon name="smartphone" size={14} />
            SMS
          </button>
          <button className="btn btn-secondary" style={{ gap: 6 }} onClick={() => setShowPayment(true)}>
            <Icon name="indian-rupee" size={14} />
            Payment link
          </button>
          <button
            className="btn btn-secondary"
            style={{ gap: 6 }}
            onClick={() => handoff.mutate({ leadId: lead.id })}
            disabled={handoff.isPending}
            title="Push to ERP"
          >
            <Icon name="database-zap" size={14} />
            {handoff.isPending ? "Syncing…" : "Push to ERP"}
          </button>
          <button
            className="btn btn-secondary"
            style={{ gap: 6, marginLeft: "auto" }}
            onClick={() => nextStage && advance.mutate({ id: lead.id, stage: nextStage })}
            disabled={!nextStage || advance.isPending}
          >
            <Icon name="chevron-right" size={14} />
            {nextStage ? `Advance to ${nextStage}` : "Enrolled"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "0.9fr 1.2fr 0.9fr" }}>
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <div className="card">
            <h5 style={{ margin: "0 0 4px" }}>Profile</h5>
            {[
              ["Phone", lead.phone],
              ["Email", lead.email],
              ["Category", lead.category],
              ["10+2 aggregate", lead.aggregate],
              ["Language", lead.language],
              ["Hostel", lead.hostelRequested ? "Requested" : "—"],
            ].map(([k, v]) => (
              <div
                key={k as string}
                className="flex justify-between gap-2.5"
                style={{
                  padding: "5px 0",
                  borderBottom: "1px solid var(--color-divider)",
                  fontSize: 12.5,
                }}
              >
                <span style={{ color: "var(--color-muted)" }}>{k}</span>
                <span style={{ textAlign: "right" }}>{v || "—"}</span>
              </div>
            ))}
          </div>
          {parent && (
            <div className="card">
              <h5 style={{ margin: "0 0 8px" }}>Parent / Guardian</h5>
              <div style={{ fontSize: 13 }}>{parent.name}</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 8 }}>
                {parent.relation} · {parent.phone}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {parent.portalLinked && <span className="tag tag-neutral">Portal linked</span>}
                {parent.consent && <span className="tag tag-accent">Consent ✓</span>}
              </div>
            </div>
          )}
          <div className="card">
            <h5 style={{ margin: "0 0 8px" }}>Documents</h5>
            {lead.documents.map((d) => {
              const color =
                d.status === "Verified" || d.status === "Issued"
                  ? "var(--color-accent-700)"
                  : d.status === "Query raised" || d.status === "Rejected"
                    ? "#b4442e"
                    : "var(--color-neutral-600)";
              return (
                <div key={d.id} className="flex items-center gap-2.5" style={{ padding: "5px 0", fontSize: 12.5 }}>
                  <Icon name="file-check" size={14} style={{ color }} />
                  <span style={{ flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 11, color }}>{d.status}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle: pipeline + timeline */}
        <div className="flex flex-col gap-5">
          <div className="card">
            <h5 style={{ margin: "0 0 12px" }}>Admission pipeline</h5>
            <div className="flex items-center">
              {steps.map((st, i) => (
                <div key={st.name} className="flex flex-col items-center relative" style={{ flex: 1, gap: 6 }}>
                  <div
                    className="w-[22px] h-[22px] rounded-full grid place-items-center"
                    style={{
                      border: `1.5px solid ${st.ring}`,
                      background: st.fill,
                      color: st.ink,
                      fontSize: 10,
                      zIndex: 1,
                    }}
                  >
                    <Icon name={st.icon} size={11} />
                  </div>
                  <span style={{ fontSize: 9.5, textAlign: "center", color: st.label, lineHeight: 1.1 }}>
                    {st.name}
                  </span>
                  {i < steps.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 11,
                        left: "50%",
                        width: "100%",
                        height: 1.5,
                        background: st.bar,
                        zIndex: 0,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2.5">
              <h5 style={{ margin: 0 }}>Activity timeline</h5>
              <span style={{ fontSize: 11, color: "var(--color-muted)" }}>All channels</span>
            </div>
            <div className="relative pl-1.5">
              {lead.events.map((t) => (
                <div key={t.id} className="flex gap-3 pb-4 relative">
                  <div
                    className="w-7 h-7 flex-none grid place-items-center rounded-full"
                    style={{
                      border: "1px solid var(--color-divider)",
                      background: "var(--color-bg)",
                      color: "var(--color-accent-700)",
                      zIndex: 1,
                    }}
                  >
                    <Icon name={t.icon} size={14} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: 2 }}>
                    <div className="flex items-baseline gap-2">
                      <span style={{ fontSize: 13 }}>{t.title}</span>
                      <span style={{ fontSize: 11, color: "var(--color-muted)", marginLeft: "auto" }}>
                        {timeAgo(t.occurredAt)}
                      </span>
                    </div>
                    {t.detail && (
                      <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>{t.detail}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2 pt-3" style={{ borderTop: "1px solid var(--color-divider)" }}>
              <input
                placeholder="Add a note or log an interaction…"
                className="input"
                style={{ flex: 1 }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitNote()}
              />
              <button className="btn btn-primary" onClick={submitNote} disabled={logEvent.isPending}>
                Log
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <div className="card">
            <h5 style={{ margin: "0 0 8px" }}>Lead score breakdown</h5>
            {lead.scoreFactors.map((f) => {
              const width = `${Math.round((f.points / f.outOf) * 100)}%`;
              return (
                <div key={f.id} className="mb-2">
                  <div className="flex justify-between mb-1" style={{ fontSize: 12 }}>
                    <span>{f.label}</span>
                    <span style={{ fontFeatureSettings: "'tnum'", color: "var(--color-muted)" }}>
                      {f.points}/{f.outOf}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--color-neutral-200)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width, background: "var(--color-accent-400)" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card">
            <h5 style={{ margin: "0 0 8px" }}>Tasks &amp; follow-ups</h5>
            {lead.tasks.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>No tasks yet.</div>
            )}
            {lead.tasks.map((t) => {
              const color = t.done ? "var(--color-accent-700)" : "var(--color-neutral-600)";
              return (
                <div
                  key={t.id}
                  className="flex gap-2 items-center"
                  style={{ padding: "6px 0", fontSize: 12.5 }}
                >
                  <button
                    onClick={() => toggleTask.mutate({ id: t.id, done: !t.done })}
                    style={{
                      width: 14,
                      height: 14,
                      flex: "none",
                      border: `1.5px solid ${color}`,
                      background: t.done ? color : "transparent",
                      borderRadius: 3,
                      padding: 0,
                      cursor: "pointer",
                    }}
                    aria-label="toggle"
                  />
                  <span style={{ flex: 1, textDecoration: t.done ? "line-through" : "none" }}>
                    {t.text}
                  </span>
                  <span style={{ fontSize: 11, color }}>{t.dueLabel}</span>
                </div>
              );
            })}
          </div>
          <div className="card">
            <h5 style={{ margin: "0 0 8px" }}>Source &amp; attribution</h5>
            <div style={{ fontSize: 12.5, lineHeight: 1.9 }}>
              <div className="flex justify-between">
                <span className="text-muted">Source</span>
                <span>{lead.source?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Campaign</span>
                <span>{lead.campaign?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Medium</span>
                <span>{lead.medium ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">First touch</span>
                <span>{new Date(lead.firstTouchAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          {lead.payments && lead.payments.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h5 style={{ margin: 0 }}>Payments</h5>
                <span style={{ fontSize: 11, color: "var(--color-muted)" }}>via Razorpay</span>
              </div>
              {lead.payments.map((p) => {
                const paid = p.status === "paid";
                const failed = p.status === "failed" || p.status === "expired" || p.status === "cancelled";
                const color = paid
                  ? "var(--color-accent-700)"
                  : failed
                    ? "#b4442e"
                    : "var(--color-neutral-600)";
                return (
                  <div
                    key={p.id}
                    style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 12.5 }}>{p.description ?? p.purpose}</span>
                      <span
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: 13,
                          fontFeatureSettings: "'tnum'",
                        }}
                      >
                        ₹{(p.amount / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`tag ${paid ? "tag-accent" : failed ? "tag-outline" : "tag-neutral"}`} style={{ color }}>
                        {p.status}
                      </span>
                      <div className="flex items-center gap-2">
                        {p.shortUrl && (
                          <a
                            href={p.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 11 }}
                          >
                            Open link
                          </a>
                        )}
                        {!paid && (
                          <button
                            onClick={() =>
                              refreshPayment.mutate({ paymentId: p.id, leadId: lead.id })
                            }
                            className="btn btn-secondary"
                            style={{ padding: "2px 8px", fontSize: 11 }}
                            disabled={refreshPayment.isPending}
                          >
                            Refresh
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {lastHandoff && (
            <div className="card">
              <h5 style={{ margin: "0 0 8px" }}>ERP handoff</h5>
              <div style={{ fontSize: 12.5, lineHeight: 1.9 }}>
                <div className="flex justify-between">
                  <span className="text-muted">Status</span>
                  <span>{lastHandoff.status}</span>
                </div>
                {lastHandoff.erpStudentId && (
                  <div className="flex justify-between">
                    <span className="text-muted">Student ID</span>
                    <span
                      style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent-700)" }}
                    >
                      {lastHandoff.erpStudentId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Attempts</span>
                  <span>{lastHandoff.attempts}</span>
                </div>
                {lastHandoff.lastError && (
                  <div style={{ color: "#b4442e", fontSize: 11.5, marginTop: 6 }}>
                    {lastHandoff.lastError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
