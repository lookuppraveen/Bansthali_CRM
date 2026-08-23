"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { useView } from "@/app/view-context";
import { SOURCE_STRIP, STAGES } from "@/lib/mock-data";
import { gradeColor, gradeOf, initials, slaColor, stageTag } from "@/lib/format";
import { useLeads } from "@/lib/api";
import { NewEnquiryDialog } from "@/components/new-enquiry-dialog";
import { ImportDialog } from "@/components/import-dialog";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { downloadCsv, toCsv } from "@/lib/csv";

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function LeadsView() {
  const { openLead } = useView();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("All");
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { data, isLoading, error } = useLeads({ search, stage: stageFilter });

  const leads = data?.leads ?? [];
  const allShownSelected = leads.length > 0 && leads.every((l) => selected.has(l.id));

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllShown = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) leads.forEach((l) => next.delete(l.id));
      else leads.forEach((l) => next.add(l.id));
      return next;
    });
  };

  const chips = ["All", ...STAGES];

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
            CRM Core · Focus Area
          </div>
          <h2 style={{ margin: "0 0 4px" }}>Leads &amp; Enquiries</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            Single funnel, many doors. Every expression of interest, captured with its source.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          style={{ gap: 7 }}
          onClick={() => {
            const csv = toCsv(
              leads.map((l) => ({
                id: l.id,
                name: l.name,
                city: l.city ?? "",
                program: l.program ?? "",
                faculty: l.faculty ?? "",
                source: l.source?.name ?? "",
                campaign: l.campaign?.name ?? "",
                stage: l.stage,
                score: l.score,
                sla: l.sla,
                owner: l.owner?.name ?? "",
                lastTouchAt: l.lastTouchAt,
              })),
              ["id", "name", "city", "program", "faculty", "source", "campaign", "stage", "score", "sla", "owner", "lastTouchAt"]
            );
            const ts = new Date().toISOString().slice(0, 10);
            downloadCsv(`banasthali-leads-${ts}.csv`, csv);
          }}
          disabled={leads.length === 0}
        >
          <Icon name="download" size={15} />
          Export CSV
        </button>
        <button className="btn btn-secondary" style={{ gap: 7 }} onClick={() => setShowImport(true)}>
          <Icon name="upload" size={15} />
          Import
        </button>
        <button className="btn btn-primary" style={{ gap: 7 }} onClick={() => setShowNew(true)}>
          <Icon name="plus" size={15} />
          New enquiry
        </button>
      </div>

      {showNew && (
        <NewEnquiryDialog
          onClose={() => setShowNew(false)}
          onCreated={(id) => openLead(id)}
        />
      )}
      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}

      <div className="flex gap-2.5 mb-5 flex-wrap">
        {SOURCE_STRIP.map((s) => (
          <div
            key={s.name}
            style={{
              flex: 1,
              minWidth: 118,
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
              padding: "11px 13px",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon name={s.icon} size={14} style={{ color: "var(--color-accent-700)" }} />
              <span style={{ fontSize: 11.5, color: "var(--color-muted)" }}>{s.name}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontFeatureSettings: "'tnum'" }}>{s.count}</span>
              <span style={{ fontSize: 11, color: "var(--color-accent-700)" }}>{s.pct}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
        <div
          className="flex items-center gap-1.5"
          style={{
            border: "1px solid var(--color-divider)",
            borderRadius: "var(--radius-md)",
            padding: "6px 11px",
            flex: 1,
            minWidth: 220,
          }}
        >
          <Icon name="search" size={14} style={{ color: "var(--color-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, city, programme…"
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              flex: 1,
              color: "var(--color-text)",
            }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {chips.map((s) => {
            const on = stageFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className="tag"
                style={{
                  cursor: "pointer",
                  border: `1px solid ${on ? "var(--color-accent)" : "var(--color-divider)"}`,
                  color: on ? "var(--color-accent-700)" : "var(--color-muted)",
                  background: on ? "var(--color-accent-100)" : "transparent",
                  fontFamily: "var(--font-body)",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
        <button className="btn btn-secondary" style={{ gap: 6, marginLeft: "auto" }}>
          <Icon name="sliders-horizontal" size={14} />
          Filters
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 16, width: 36 }}>
                <input
                  type="checkbox"
                  checked={allShownSelected}
                  onChange={toggleAllShown}
                  aria-label="Select all"
                  style={{ cursor: "pointer" }}
                />
              </th>
              <th>Lead</th>
              <th>Programme interest</th>
              <th>Source</th>
              <th>Stage</th>
              <th>Score</th>
              <th>Owner</th>
              <th>Last touch</th>
              <th style={{ paddingRight: 16 }}>SLA</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
                  Loading leads…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#b4442e" }}>
                  {(error as Error).message}
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              leads.map((l) => (
                <tr key={l.id} className="rowlead" onClick={() => openLead(l.id)}>
                  <td
                    style={{ paddingLeft: 16 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(l.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(l.id)}
                      onChange={() => toggle(l.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: "pointer" }}
                      aria-label={`Select ${l.name}`}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-[30px] h-[30px] flex-none grid place-items-center rounded-full"
                        style={{
                          border: "1px solid var(--color-divider)",
                          fontFamily: "var(--font-heading)",
                          fontSize: 12,
                          color: "var(--color-accent-700)",
                        }}
                      >
                        {initials(l.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5 }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{l.city}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{l.program}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{l.faculty}</div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12.5 }}>
                      {l.source && <Icon name={l.source.icon} size={13} style={{ color: "var(--color-accent-700)" }} />}
                      {l.source?.name ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`tag ${stageTag(l.stage)}`}>{l.stage}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 flex-none grid place-items-center rounded-full"
                        style={{
                          border: `1px solid ${gradeColor(l.score)}`,
                          color: gradeColor(l.score),
                          fontSize: 10,
                          fontFamily: "var(--font-heading)",
                        }}
                      >
                        {gradeOf(l.score)}
                      </span>
                      <span style={{ fontSize: 12.5, fontFeatureSettings: "'tnum'" }}>{l.score}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{l.owner?.name ?? "—"}</td>
                  <td style={{ fontSize: 12.5, color: "var(--color-muted)" }}>{timeAgo(l.lastTouchAt)}</td>
                  <td style={{ paddingRight: 16 }}>
                    <span
                      className="inline-flex items-center gap-1"
                      style={{ fontSize: 12, color: slaColor(l.sla) }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: slaColor(l.sla),
                        }}
                      />
                      {l.sla}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <BulkActionBar
          selectedIds={Array.from(selected)}
          onClear={() => setSelected(new Set())}
          onDone={() => setSelected(new Set())}
        />
      )}

      <div
        className="flex items-center justify-between mt-3"
        style={{ fontSize: 12, color: "var(--color-muted)" }}
      >
        <span>
          Showing {leads.length} leads · click any row for the 360° view
          {selected.size > 0 && ` · ${selected.size} selected`}
        </span>
        <span className="flex gap-1.5">
          <button className="btn btn-secondary" style={{ padding: "5px 10px" }}>
            Prev
          </button>
          <button className="btn btn-secondary" style={{ padding: "5px 10px" }}>
            Next
          </button>
        </span>
      </div>
    </section>
  );
}
