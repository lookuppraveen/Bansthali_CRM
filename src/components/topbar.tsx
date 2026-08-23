"use client";

import { Icon } from "@/components/icon";
import { CRUMBS } from "@/lib/mock-data";
import { useView } from "@/app/view-context";
import { NotificationsBell } from "@/components/notifications-bell";

export function Topbar() {
  const { view } = useView();
  const [root, leaf] = CRUMBS[view] ?? ["", ""];

  return (
    <header
      className="flex-none h-[60px] flex items-center gap-4 px-[26px]"
      style={{
        borderBottom: "1px solid var(--color-divider)",
        background: "var(--color-bg)",
      }}
    >
      <div className="flex items-center gap-2" style={{ fontSize: 12, color: "var(--color-muted)" }}>
        <span>{root}</span>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: "var(--color-text)" }}>{leaf}</span>
      </div>

      <div
        className="ml-auto flex items-center gap-2 px-[11px] py-[6px]"
        style={{
          border: "1px solid var(--color-divider)",
          borderRadius: "var(--radius-md)",
          minWidth: 280,
          background: "var(--color-bg)",
        }}
      >
        <Icon name="search" size={15} style={{ color: "var(--color-muted)" }} />
        <input
          placeholder="Search leads, applicants, students…"
          style={{
            border: "none",
            background: "transparent",
            outline: "none",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-text)",
            flex: 1,
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: "var(--color-muted)",
            border: "1px solid var(--color-divider)",
            borderRadius: 3,
            padding: "1px 5px",
          }}
        >
          ⌘K
        </span>
      </div>

      <button className="btn btn-secondary" style={{ gap: 7 }}>
        <Icon name="calendar" size={15} />
        Cycle 2026–27
      </button>
      <NotificationsBell />
    </header>
  );
}
