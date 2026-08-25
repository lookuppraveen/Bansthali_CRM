"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { useView } from "@/app/view-context";
import { useNotifications, type NotificationKind } from "@/lib/api";

const KIND_META: Record<NotificationKind, { icon: string; label: string }> = {
  sla: { icon: "alert-triangle", label: "SLA" },
  task: { icon: "list-checks", label: "Task" },
  assignment: { icon: "user-plus", label: "Assignment" },
  doc_pending: { icon: "file-check", label: "Doc to verify" },
  doc_rejected: { icon: "file-x", label: "Doc rejected" },
  payment_received: { icon: "check-circle-2", label: "Payment" },
  ticket_reply: { icon: "message-circle", label: "Ticket reply" },
  ticket_open: { icon: "life-buoy", label: "Open ticket" },
};

const SEVERITY_COLOR: Record<string, string> = {
  high: "#b4442e",
  med: "var(--color-accent)",
  low: "var(--color-neutral-500)",
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const KIND_FILTERS: { key: "all" | NotificationKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sla", label: "SLA" },
  { key: "task", label: "Tasks" },
  { key: "doc_pending", label: "Docs to verify" },
  { key: "doc_rejected", label: "Rejected docs" },
  { key: "ticket_open", label: "Tickets" },
  { key: "ticket_reply", label: "Ticket replies" },
  { key: "payment_received", label: "Payments" },
  { key: "assignment", label: "Assignments" },
];

export function NotificationsView() {
  const { data, isLoading } = useNotifications(200);
  const { openLead } = useView();
  const [filter, setFilter] = useState<"all" | NotificationKind>("all");
  const [severity, setSeverity] = useState<"all" | "high" | "med" | "low">("all");

  const items = data?.items ?? [];
  const filtered = items.filter((it) => {
    if (filter !== "all" && it.kind !== filter) return false;
    if (severity !== "all" && it.severity !== severity) return false;
    return true;
  });

  const kindsInData = new Set(items.map((i) => i.kind));

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
            System · Feed
          </div>
          <h2 style={{ margin: "0 0 4px" }}>Notifications</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            {data?.counts.total ?? 0} live signals &middot; {data?.counts.high ?? 0} high priority.
            Feed refreshes automatically every minute.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {KIND_FILTERS.filter((f) => f.key === "all" || kindsInData.has(f.key as NotificationKind)).map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="tag"
              style={{
                cursor: "pointer",
                border: `1px solid ${on ? "var(--color-accent)" : "var(--color-divider)"}`,
                color: on ? "var(--color-accent-700)" : "var(--color-muted)",
                background: on ? "var(--color-accent-100)" : "transparent",
                fontFamily: "var(--font-body)",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "high", "med", "low"] as const).map((s) => {
          const on = severity === s;
          return (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className="tag"
              style={{
                cursor: "pointer",
                border: `1px solid ${on ? "var(--color-accent)" : "var(--color-divider)"}`,
                color: on ? "var(--color-accent-700)" : "var(--color-muted)",
                background: on ? "var(--color-accent-100)" : "transparent",
                fontFamily: "var(--font-body)",
              }}
            >
              {s === "all" ? "All severities" : s === "high" ? "High" : s === "med" ? "Medium" : "Low"}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
            Loading…
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
            Nothing matching those filters.
          </div>
        )}
        {filtered.map((n, i) => (
          <div
            key={i}
            className={n.leadId ? "rowlead" : undefined}
            onClick={() => n.leadId && openLead(n.leadId)}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-divider)",
              cursor: n.leadId ? "pointer" : "default",
              alignItems: "flex-start",
            }}
          >
            <Icon
              name={KIND_META[n.kind]?.icon ?? "circle"}
              size={17}
              style={{ color: SEVERITY_COLOR[n.severity], marginTop: 2, flex: "none" }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5 }}>{n.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 2 }}>
                {KIND_META[n.kind]?.label ?? n.kind}
                {n.detail && ` · ${n.detail}`}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-muted)", whiteSpace: "nowrap" }}>
              {timeAgo(n.occurredAt)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
