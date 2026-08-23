"use client";

import { Icon } from "@/components/icon";
import { useAnalytics } from "@/lib/api";

export function AnalyticsView() {
  const { data, isLoading } = useAnalytics();
  const kpis = data?.kpis ?? [];
  const roi = data?.roi ?? [];
  const comms = data?.comms ?? [];
  const funnel = data?.funnel ?? [];
  const counsellors = data?.counsellors ?? [];

  return (
    <section className="view">
      <div className="mb-5">
        <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 6 }}>
          Insight · Decision-grade
        </div>
        <h2 style={{ margin: "0 0 4px" }}>Analytics &amp; Dashboards</h2>
        <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
          Source ROI, funnel, counsellor performance and engagement — computed live from the pipeline.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 22 }}>
        {kpis.map((k) => (
          <div key={k.label} className="card" style={{ gap: 8 }}>
            <span className="card-kicker">{k.label}</span>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontFeatureSettings: "'tnum'" }}>
              {isLoading ? "…" : k.value}
            </div>
            <div className="flex items-center gap-1.5" style={{ fontSize: 11.5, color: "var(--color-accent-700)" }}>
              <Icon name={k.up ? "trending-up" : "trending-down"} size={13} />
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 items-start mb-5" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--color-divider)" }}>
            <h5 style={{ margin: 0 }}>Source &amp; campaign ROI</h5>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Source</th>
                <th>Leads</th>
                <th>Enrolled</th>
                <th>Conv.</th>
                <th style={{ paddingRight: 16 }}>Cost / enrol</th>
              </tr>
            </thead>
            <tbody>
              {roi.map((r) => (
                <tr key={r.src}>
                  <td style={{ paddingLeft: 16 }}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex-none"
                        style={{ width: 70, height: 5, background: "var(--color-neutral-200)", borderRadius: 3, overflow: "hidden" }}
                      >
                        <div style={{ height: "100%", width: r.fill, background: "var(--color-accent-400)" }} />
                      </div>
                      <span style={{ fontSize: 12.5 }}>{r.src}</span>
                    </div>
                  </td>
                  <td style={{ fontFeatureSettings: "'tnum'" }}>{r.leads}</td>
                  <td style={{ fontFeatureSettings: "'tnum'" }}>{r.enr}</td>
                  <td style={{ fontFeatureSettings: "'tnum'", color: "var(--color-accent-700)" }}>{r.conv}</td>
                  <td style={{ paddingRight: 16, fontFeatureSettings: "'tnum'" }}>{r.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h5 style={{ margin: "0 0 10px" }}>Funnel conversion</h5>
          {funnel.map((s) => (
            <div key={s.stage} className="flex items-center gap-2.5" style={{ padding: "5px 0" }}>
              <span style={{ width: 96, flex: "none", fontSize: 12.5 }}>{s.stage}</span>
              <div style={{ flex: 1, height: 8, background: "var(--color-neutral-200)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: s.width, background: "var(--color-accent-400)" }} />
              </div>
              <span style={{ width: 44, textAlign: "right", fontSize: 11.5, color: "var(--color-muted)", fontFeatureSettings: "'tnum'" }}>
                {s.conv}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          <h5 style={{ margin: "0 0 10px" }}>Communication analytics</h5>
          {comms.length === 0 && (
            <div style={{ fontSize: 12.5, color: "var(--color-muted)", padding: "12px 0" }}>
              No outbound communications logged yet. Send a template from a lead to populate.
            </div>
          )}
          {comms.map((c) => (
            <div key={c.ch} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div className="flex items-center gap-2.5 mb-1.5">
                <Icon name={c.icon} size={15} style={{ color: "var(--color-accent-700)" }} />
                <span style={{ fontSize: 13, flex: 1 }}>{c.ch}</span>
                <span style={{ fontSize: 11.5, fontFeatureSettings: "'tnum'", color: "var(--color-muted)" }}>{c.sent} sent</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div style={{ flex: 1, height: 6, background: "var(--color-neutral-200)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: c.fill, background: "var(--color-accent-400)" }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--color-muted)", width: 150 }}>{c.rate}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h5 style={{ margin: "0 0 10px" }}>Counsellor performance</h5>
          {counsellors.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5" style={{ padding: "10px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div
                className="w-8 h-8 flex-none grid place-items-center rounded-full"
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
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{c.leads} leads · {c.onTime} on-time SLA</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-accent-700)" }}>
                  {c.converted}
                </div>
                <div style={{ fontSize: 10, color: "var(--color-muted)" }}>converted</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
