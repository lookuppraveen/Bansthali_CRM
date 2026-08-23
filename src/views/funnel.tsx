"use client";

import { Icon } from "@/components/icon";
import { useView } from "@/app/view-context";
import { STAGES } from "@/lib/mock-data";
import { gradeColor, gradeOf, initials, slaColor, stageTag } from "@/lib/format";
import { useLeads } from "@/lib/api";

export function FunnelView() {
  const { openLead } = useView();
  const { data, isLoading } = useLeads();
  const leads = data?.leads ?? [];

  const board = STAGES.map((st) => ({
    stage: st,
    tagClass: stageTag(st),
    cards: leads.filter((l) => l.stage === st),
  }));

  return (
    <section className="view">
      <div className="flex items-end gap-4 mb-5">
        <div className="flex-1">
          <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 6 }}>
            CRM Core · Configurable Pipeline
          </div>
          <h2 style={{ margin: "0 0 4px" }}>Admission Funnel</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            The Banasthali funnel as a live board — stages, SLAs and automations per programme &amp; cycle.
          </p>
        </div>
        <button className="btn btn-secondary" style={{ gap: 6 }}>
          <Icon name="settings-2" size={14} />
          Configure stages
        </button>
        <button className="btn btn-secondary" style={{ gap: 6 }}>
          <Icon name="filter" size={14} />
          B.Tech · UG · 2026–27
        </button>
      </div>

      {isLoading && <div style={{ padding: 40, color: "var(--color-muted)" }}>Loading pipeline…</div>}

      <div className="flex gap-3.5 overflow-x-auto pb-3 items-start">
        {board.map((col) => (
          <div
            key={col.stage}
            className="flex-none"
            style={{
              width: 236,
              background: "color-mix(in srgb, var(--color-text) 3%, transparent)",
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
              padding: 12,
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className={`tag ${col.tagClass}`}>{col.stage}</span>
              <span style={{ fontSize: 12, fontFeatureSettings: "'tnum'", color: "var(--color-muted)" }}>
                {col.cards.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5 min-h-[40px]">
              {col.cards.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openLead(c.id)}
                  className="rowlead"
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-divider)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 11px",
                    cursor: "pointer",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-6 h-6 flex-none grid place-items-center rounded-full"
                      style={{
                        border: "1px solid var(--color-divider)",
                        fontFamily: "var(--font-heading)",
                        fontSize: 10,
                        color: "var(--color-accent-700)",
                      }}
                    >
                      {initials(c.name)}
                    </div>
                    <span style={{ fontSize: 12.5, flex: 1 }}>{c.name}</span>
                    <span
                      className="w-[18px] h-[18px] flex-none grid place-items-center rounded-full"
                      style={{
                        border: `1px solid ${gradeColor(c.score)}`,
                        color: gradeColor(c.score),
                        fontSize: 9,
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      {gradeOf(c.score)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 6 }}>{c.program}</div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1" style={{ fontSize: 11 }}>
                      {c.source && <Icon name={c.source.icon} size={11} style={{ color: "var(--color-accent-700)" }} />}
                      {c.source?.name ?? "—"}
                    </span>
                    <span
                      className="inline-flex items-center gap-1"
                      style={{ fontSize: 10.5, color: slaColor(c.sla) }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: slaColor(c.sla),
                        }}
                      />
                      {c.sla}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
