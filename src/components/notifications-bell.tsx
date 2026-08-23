"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { useNotifications } from "@/lib/api";
import { useView } from "@/app/view-context";

const SEVERITY_COLOR: Record<string, string> = {
  high: "#b4442e",
  med: "var(--color-accent)",
  low: "var(--color-neutral-500)",
};

const KIND_ICON: Record<string, string> = {
  sla: "alert-triangle",
  task: "list-checks",
  assignment: "user-plus",
};

export function NotificationsBell() {
  const { data } = useNotifications();
  const { openLead } = useView();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = data?.items ?? [];
  const highCount = data?.counts.high ?? 0;
  const totalCount = data?.counts.total ?? 0;
  const badgeColor = highCount > 0 ? "#b4442e" : "var(--color-accent)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="btn btn-icon btn-secondary"
        title={totalCount ? `${totalCount} notification(s)` : "Notifications"}
        onClick={() => setOpen((v) => !v)}
        style={{ position: "relative" }}
      >
        <Icon name="bell" size={16} />
        {totalCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              padding: "0 4px",
              background: badgeColor,
              color: "#fff",
              fontSize: 10,
              fontFamily: "var(--font-heading)",
              display: "grid",
              placeItems: "center",
              lineHeight: 1,
            }}
          >
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 380,
            maxHeight: 480,
            overflowY: "auto",
            background: "var(--color-card)",
            border: "1px solid var(--color-divider)",
            borderRadius: 6,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            zIndex: 50,
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--color-divider)",
            }}
          >
            <h5 style={{ margin: 0, fontSize: 14 }}>Notifications</h5>
            <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{totalCount} total</span>
          </div>

          {items.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--color-muted)", fontSize: 12.5 }}>
              You&rsquo;re all caught up.
            </div>
          )}

          {items.map((n, i) => (
            <div
              key={i}
              className={n.leadId ? "rowlead" : undefined}
              onClick={() => {
                if (n.leadId) openLead(n.leadId);
                setOpen(false);
              }}
              style={{
                display: "flex",
                gap: 10,
                padding: "10px 14px",
                borderBottom: "1px solid var(--color-divider)",
                cursor: n.leadId ? "pointer" : "default",
                alignItems: "flex-start",
              }}
            >
              <Icon
                name={KIND_ICON[n.kind] ?? "circle"}
                size={15}
                style={{ color: SEVERITY_COLOR[n.severity], marginTop: 2, flex: "none" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, lineHeight: 1.35 }}>{n.title}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>{n.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
