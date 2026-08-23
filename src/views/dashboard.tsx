"use client";

import { Icon } from "@/components/icon";
import { useView } from "@/app/view-context";
import { useDashboard } from "@/lib/api";

export function DashboardView() {
  const { setView } = useView();
  const { data, isLoading } = useDashboard();

  const kpis = data?.kpis ?? [];
  const funnel = data?.funnel ?? [];
  const sources = data?.sources ?? [];
  const counsellors = data?.counsellors ?? [];
  const recent = data?.recentHandoffs ?? [];

  return (
    <section className="view">
      <div className="flex items-end gap-4 mb-[22px]">
        <div className="flex-1">
          <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 6 }}>
            Command Center · Admission Cycle 2026–27
          </div>
          <h2 style={{ margin: "0 0 4px" }}>Welcome back.</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            {isLoading ? "Loading live counts…" : `Live pipeline · ${funnel.reduce((a, f) => a + f.count, 0)} open leads.`}
          </p>
        </div>
        <div className="flex items-center gap-2" style={{ fontSize: 12, color: "var(--color-accent-700)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
          Live · Neon Postgres
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-[22px]">
        {kpis.map((k) => (
          <div key={k.label} className="card" style={{ gap: 8 }}>
            <div className="flex items-center justify-between">
              <span className="card-kicker">{k.label}</span>
              <Icon name={k.icon} size={15} style={{ color: "var(--color-accent)" }} />
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 34, lineHeight: 1, fontFeatureSettings: "'tnum'" }}>
              {k.value}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--color-accent-700)", display: "flex", alignItems: "center", gap: 5 }}>
              <Icon name="activity" size={13} />
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "1.35fr 1fr" }}>
        <div className="card">
          <div className="flex items-center justify-between mb-1.5">
            <h4 style={{ margin: 0 }}>Admission funnel</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); setView("funnel"); }} style={{ fontSize: 12 }}>
              Open pipeline →
            </a>
          </div>
          {funnel.map((s) => (
            <div key={s.stage} className="flex items-center gap-3" style={{ padding: "7px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <span style={{ width: 118, flex: "none", fontSize: 13 }}>{s.stage}</span>
              <div style={{ flex: 1, height: 9, background: "var(--color-neutral-200)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: s.width, background: "var(--color-accent-400)" }} />
              </div>
              <span style={{ width: 56, textAlign: "right", fontSize: 13, fontFeatureSettings: "'tnum'" }}>
                {s.count}
              </span>
              <span style={{ width: 52, textAlign: "right", fontSize: 11.5, color: "var(--color-muted)", fontFeatureSettings: "'tnum'" }}>
                {s.conv}
              </span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-1.5">
            <h4 style={{ margin: 0 }}>Enquiries by source</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); setView("analytics"); }} style={{ fontSize: 12 }}>
              Source ROI →
            </a>
          </div>
          {sources.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5" style={{ padding: "6px 0" }}>
              <span className="w-4 h-4 flex-none grid place-items-center" style={{ color: "var(--color-accent-700)" }}>
                <Icon name={s.icon} size={16} />
              </span>
              <span style={{ flex: 1, fontSize: 13 }}>{s.name}</span>
              <div style={{ width: 80, height: 6, background: "var(--color-neutral-200)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: s.pct, background: "var(--color-accent-400)" }} />
              </div>
              <span style={{ width: 40, textAlign: "right", fontSize: 12, fontFeatureSettings: "'tnum'" }}>{s.pct}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <h5 style={{ margin: "0 0 4px" }}>Counsellor leaderboard</h5>
          {counsellors.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5" style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div
                className="w-7 h-7 flex-none grid place-items-center rounded-full"
                style={{
                  border: "1px solid var(--color-divider)",
                  fontFamily: "var(--font-heading)",
                  fontSize: 12,
                  color: "var(--color-accent-700)",
                }}
              >
                {c.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{c.leads} leads</div>
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, color: "var(--color-accent-700)" }}>
                {c.converted}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h5 style={{ margin: "0 0 4px" }}>Recent ERP handoffs</h5>
          {recent.map((e) => (
            <div key={e.id} className="flex items-center gap-2.5" style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <Icon
                name={e.status === "synced" ? "check-circle-2" : e.status === "review" ? "alert-triangle" : "clock"}
                size={15}
                style={{ color: e.status === "synced" ? "var(--color-accent-700)" : e.status === "review" ? "#b4442e" : "var(--color-neutral-600)" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{e.studentName}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
                  {e.program}
                  {e.erpStudentId && ` · ID ${e.erpStudentId}`}
                </div>
              </div>
              <span className={`tag ${e.status === "synced" ? "tag-accent" : e.status === "review" ? "tag-outline" : "tag-neutral"}`}>
                {e.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
