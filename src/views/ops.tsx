"use client";

import { Icon } from "@/components/icon";
import { useOps } from "@/lib/api";

export function OpsView() {
  const { data, isLoading } = useOps();
  const buat = data?.buat ?? [];
  const merit = data?.merit ?? [];
  const slots = data?.slots ?? [];
  const verify = data?.verify ?? [];

  return (
    <section className="view">
      <div className="mb-5">
        <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 6 }}>
          Admissions · Coordination
        </div>
        <h2 style={{ margin: "0 0 4px" }}>Admission Ops</h2>
        <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
          BUAT coordination, merit lists, counselling and document verification — the CRM works around the exam, it does
          not deliver it.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 22 }}>
        {buat.map((b) => (
          <div key={b.label} className="card" style={{ gap: 8 }}>
            <div className="flex items-center justify-between">
              <span className="card-kicker">{b.label}</span>
              <Icon name={b.icon} size={15} style={{ color: "var(--color-accent)" }} />
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontFeatureSettings: "'tnum'" }}>
              {isLoading ? "…" : b.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            className="flex items-center justify-between"
            style={{ padding: "13px 16px", borderBottom: "1px solid var(--color-divider)" }}
          >
            <h5 style={{ margin: 0 }}>Merit list</h5>
            <a href="#" style={{ fontSize: 12 }}>
              Publish results →
            </a>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Rank</th>
                <th>Programme</th>
                <th>BUAT</th>
                <th>10+2</th>
                <th style={{ paddingRight: 16 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {merit.map((m) => (
                <tr key={m.rank}>
                  <td style={{ paddingLeft: 16, fontFamily: "var(--font-heading)", color: "var(--color-accent-700)" }}>{m.rank}</td>
                  <td style={{ fontSize: 12.5, color: "var(--color-muted)" }}>{m.program}</td>
                  <td style={{ fontFeatureSettings: "'tnum'" }}>{m.buatScore}</td>
                  <td style={{ fontFeatureSettings: "'tnum'" }}>{m.aggregate}</td>
                  <td style={{ paddingRight: 16 }}>
                    <span className="tag tag-neutral">{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-5">
          <div className="card">
            <h5 style={{ margin: "0 0 10px" }}>Counselling slots</h5>
            {slots.map((s) => {
              const pct = s.capacity > 0 ? Math.round((s.booked / s.capacity) * 100) : 0;
              return (
                <div key={s.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--color-divider)" }}>
                  <div className="flex justify-between" style={{ fontSize: 12.5 }}>
                    <span>{s.slotTime}</span>
                    <span style={{ color: "var(--color-muted)" }}>{s.booked} / {s.capacity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)", margin: "3px 0 5px" }}>
                    {s.program} · {s.ranks}
                  </div>
                  <div style={{ height: 5, background: "var(--color-neutral-200)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-accent-400)" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card">
            <h5 style={{ margin: "0 0 8px" }}>Document verification queue</h5>
            {verify.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>All caught up.</div>
            )}
            {verify.map((d) => {
              const color =
                d.status === "Query raised" || d.status === "Rejected"
                  ? "#b4442e"
                  : "var(--color-neutral-600)";
              return (
                <div key={d.id} className="flex items-center gap-2.5" style={{ padding: "7px 0", borderBottom: "1px solid var(--color-divider)" }}>
                  <Icon name="file-check" size={15} style={{ color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5 }}>{d.lead?.name ?? "—"}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{d.name}</div>
                  </div>
                  <span style={{ fontSize: 11, color }}>{d.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
