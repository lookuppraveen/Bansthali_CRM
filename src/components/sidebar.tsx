"use client";

import { useSession, signOut } from "next-auth/react";
import { Icon } from "@/components/icon";
import { NAV_GROUPS, type ViewKey } from "@/lib/mock-data";
import { useView } from "@/app/view-context";
import { canAccess, type Role } from "@/lib/permissions";

export function Sidebar() {
  const { view, setView } = useView();
  const { data: session } = useSession();
  const user = session?.user;
  const role = user?.role as Role | undefined;
  const displayName = user?.name ?? "Meenakshi Vyas";
  const displayInitials = user?.initials ?? "MV";
  const displayTitle = user?.title ?? "Admissions Head";

  // Filter nav groups down to items this role can access; drop empty groups.
  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => canAccess(role, it.k as ViewKey)),
  })).filter((g) => g.items.length > 0);

  return (
    <aside
      className="flex flex-col flex-none w-[266px] border-r"
      style={{
        background: "#1c1512",
        color: "#e8e2da",
        borderRightColor: "rgba(0,0,0,.4)",
      }}
    >
      <div className="px-[22px] pt-[22px] pb-[18px]" style={{ borderBottom: "1px solid rgba(232,226,218,.12)" }}>
        <div className="flex items-center gap-[11px]">
          <div
            className="w-[38px] h-[38px] flex-none grid place-items-center rounded-full"
            style={{
              background: "#7b1e28",
              border: "1px solid #9a3341",
              color: "#f3ede3",
              fontFamily: "var(--font-heading)",
              fontSize: 19,
              letterSpacing: "-.02em",
            }}
          >
            बा
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 19, lineHeight: 1.05, color: "#f3ede3" }}>
              Banasthali
            </div>
            <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#b9a98f" }}>
              Vidyapith CRM
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto app-scroll px-3 pt-[14px] pb-6">
        {visibleGroups.map((grp) => (
          <div key={grp.label} className="mb-4">
            <div
              style={{
                fontSize: 9.5,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "#8f8069",
                padding: "0 12px 7px",
              }}
            >
              {grp.label}
            </div>
            {grp.items.map((it) => {
              const activeKey = view === "lead360" && it.k === "leads" ? true : it.k === view;
              const badge = "badge" in it ? (it as { badge?: string }).badge : undefined;
              return (
                <button
                  key={it.k}
                  className="navitem"
                  onClick={() => setView(it.k as ViewKey)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    textAlign: "left",
                    color: activeKey ? "#f3ede3" : "#c9bfae",
                    background: activeKey ? "rgba(225,173,102,.12)" : "transparent",
                    boxShadow: activeKey ? "inset 2px 0 0 #e1ad66" : "none",
                  }}
                >
                  <span
                    className="w-4 h-4 flex-none grid place-items-center"
                    style={{ color: activeKey ? "#e1ad66" : "#b9a98f" }}
                  >
                    <Icon name={it.icon} size={16} />
                  </span>
                  <span className="flex-1 text-left">{it.label}</span>
                  {badge && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#e1ad66",
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div
        className="flex items-center gap-[10px] px-4 py-[14px]"
        style={{ borderTop: "1px solid rgba(232,226,218,.12)" }}
      >
        <div
          className="w-8 h-8 flex-none grid place-items-center rounded-full"
          style={{
            background: "#3a2b23",
            border: "1px solid #5a463a",
            color: "#e1ad66",
            fontFamily: "var(--font-heading)",
            fontSize: 14,
          }}
        >
          {displayInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div
            style={{
              fontSize: 12.5,
              color: "#f3ede3",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </div>
          <div style={{ fontSize: 10, color: "#9d8e77" }}>{displayTitle}</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          className="grid place-items-center"
          style={{
            width: 24,
            height: 24,
            background: "transparent",
            border: "none",
            color: "#9d8e77",
            cursor: "pointer",
          }}
        >
          <Icon name="log-out" size={15} />
        </button>
      </div>
    </aside>
  );
}
