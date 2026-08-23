"use client";

import { Icon } from "@/components/icon";
import { ERP_FLOW, ERP_MAP, ERP_STYLES } from "@/lib/mock-data";
import { useErp } from "@/lib/api";

export function ErpView() {
  const { data, isLoading } = useErp();

  const queue = data?.queue ?? [];
  const stats = data?.stats;
  const statCards = stats
    ? [
        { label: "Handoff success", value: stats.successRate },
        { label: "Synced this cycle", value: stats.synced.toLocaleString() },
        { label: "In retry queue", value: String(stats.queued) },
        { label: "Review required", value: String(stats.review) },
      ]
    : [];

  return (
    <section className="view">
      <div className="mb-5">
        <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 6 }}>
          Admissions · Governed Integration
        </div>
        <h2 style={{ margin: "0 0 4px" }}>ERP Handoff &amp; Onboarding</h2>
        <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
          On confirmation, a deduplicated student record is handed to the in-house ERP — the system of record after
          admission. Currently backed by a <strong>mock adapter</strong>; the real integration contract slots in without
          touching callers.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 22 }}>
        {statCards.map((s) => (
          <div key={s.label} className="card" style={{ gap: 6 }}>
            <span className="card-kicker">{s.label}</span>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontFeatureSettings: "'tnum'" }}>
              {isLoading ? "…" : s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: "0 0 16px" }}>Onboarding &amp; handoff flow</h5>
        <div className="flex items-stretch">
          {ERP_FLOW.map((f, i) => (
            <div key={f.title} className="flex flex-col items-center text-center relative" style={{ flex: 1, padding: "0 6px" }}>
              <div
                className="w-10 h-10 grid place-items-center rounded-full"
                style={{
                  border: "1px solid var(--color-accent)",
                  background: "var(--color-accent-100)",
                  color: "var(--color-accent-700)",
                  zIndex: 1,
                }}
              >
                <Icon name={f.icon} size={18} />
              </div>
              {i < ERP_FLOW.length - 1 && (
                <div style={{ position: "absolute", top: 20, left: "50%", width: "100%", height: 1.5, background: "var(--color-accent-300)", zIndex: 0 }} />
              )}
              <div style={{ fontSize: 12, fontFamily: "var(--font-heading)", marginTop: 9, lineHeight: 1.15 }}>{f.title}</div>
              <div style={{ fontSize: 10.5, color: "var(--color-muted)", marginTop: 4, lineHeight: 1.3 }}>{f.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 items-start mb-5" style={{ gridTemplateColumns: "1fr 1.1fr" }}>
        <div className="card">
          <div className="flex items-center justify-between mb-1.5">
            <h5 style={{ margin: 0 }}>Integration contract</h5>
            <span style={{ fontSize: 11, color: "var(--color-muted)" }}>Adapter interface — swap freely</span>
          </div>
          {ERP_STYLES.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5" style={{ padding: "9px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  flex: "none",
                  borderRadius: "50%",
                  border: "1px solid var(--color-accent)",
                  background: s.on ? "var(--color-accent)" : "transparent",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{s.note}</div>
              </div>
              <span className={`tag ${s.on ? "tag-accent" : "tag-neutral"}`}>{s.tag}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--color-divider)" }}>
            <h5 style={{ margin: 0 }}>Field mapping · CRM → ERP</h5>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>CRM field</th>
                <th>ERP field</th>
                <th style={{ paddingRight: 16 }}>Transform</th>
              </tr>
            </thead>
            <tbody>
              {ERP_MAP.map((m) => (
                <tr key={m.crm}>
                  <td style={{ paddingLeft: 16, fontSize: 12.5 }}>{m.crm}</td>
                  <td style={{ fontSize: 12, fontFamily: "var(--font-heading)", color: "var(--color-accent-700)" }}>{m.erp}</td>
                  <td style={{ paddingRight: 16, fontSize: 11.5, color: "var(--color-muted)" }}>{m.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="flex items-center justify-between" style={{ padding: "13px 16px", borderBottom: "1px solid var(--color-divider)" }}>
          <h5 style={{ margin: 0 }}>Handoff queue</h5>
          <span style={{ fontSize: 11, color: "var(--color-muted)" }}>
            Failures are queued, alerted &amp; retried — never silently lost
          </span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 16 }}>Student</th>
              <th>Programme</th>
              <th>ERP student ID</th>
              <th>Attempts</th>
              <th style={{ paddingRight: 16 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--color-muted)" }}>
                  Loading queue…
                </td>
              </tr>
            )}
            {queue.map((q) => {
              const iconName =
                q.status === "synced"
                  ? "check-circle-2"
                  : q.status === "review"
                    ? "alert-triangle"
                    : "clock";
              const color =
                q.status === "synced"
                  ? "var(--color-accent-700)"
                  : q.status === "review"
                    ? "#b4442e"
                    : "var(--color-neutral-600)";
              const tag =
                q.status === "synced" ? "tag-accent" : q.status === "review" ? "tag-outline" : "tag-neutral";
              return (
                <tr key={q.id}>
                  <td style={{ paddingLeft: 16 }}>
                    <span className="inline-flex items-center gap-2">
                      <Icon name={iconName} size={15} style={{ color }} />
                      {q.studentName}
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{q.program}</td>
                  <td style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent-700)" }}>
                    {q.erpStudentId ?? (q.status === "review" ? "error" : "pending")}
                  </td>
                  <td style={{ fontFeatureSettings: "'tnum'" }}>{q.attempts}</td>
                  <td style={{ paddingRight: 16 }}>
                    <span className={`tag ${tag}`}>{q.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
