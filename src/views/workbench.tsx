"use client";

import { useSession } from "next-auth/react";
import { Icon } from "@/components/icon";
import { useView } from "@/app/view-context";
import { initials, slaColor, stageTag } from "@/lib/format";
import { useLeads } from "@/lib/api";

export function WorkbenchView() {
  const { openLead } = useView();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const displayName = session?.user?.name ?? "";
  const { data, isLoading } = useLeads({ ownerId: userId });
  const myLeads = (data?.leads ?? []).sort((a, b) => b.score - a.score);

  return (
    <section className="view">
      <div className="flex items-end gap-4 mb-5">
        <div className="flex-1">
          <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 6 }}>
            CRM Core · {displayName}
          </div>
          <h2 style={{ margin: "0 0 4px" }}>Counsellor Workbench</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            Your prioritised worklist — score, SLA urgency and stage, turned into one place to act.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="card" style={{ gap: 6 }}>
          <span className="card-kicker">My open leads</span>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 30 }}>{myLeads.length}</div>
          <span style={{ fontSize: 11.5, color: "var(--color-muted)" }}>assigned to you</span>
        </div>
        <div className="card" style={{ gap: 6 }}>
          <span className="card-kicker">Due today</span>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 30 }}>
            {myLeads.filter((l) => l.sla === "Due today" || l.sla === "Breached").length}
          </div>
          <span style={{ fontSize: 11.5, color: "var(--color-accent-700)" }}>
            {myLeads.filter((l) => l.sla === "Breached").length} breached
          </span>
        </div>
        <div className="card" style={{ gap: 6 }}>
          <span className="card-kicker">Late stage (Verify+)</span>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 30 }}>
            {myLeads.filter((l) => ["Verification", "Counselling", "Enrolled"].includes(l.stage)).length}
          </div>
          <span style={{ fontSize: 11.5, color: "var(--color-muted)" }}>closing soon</span>
        </div>
        <div className="card" style={{ gap: 6 }}>
          <span className="card-kicker">Enrolled</span>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 30 }}>
            {myLeads.filter((l) => l.stage === "Enrolled").length}
          </div>
          <span style={{ fontSize: 11.5, color: "var(--color-muted)" }}>this cycle</span>
        </div>
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="flex items-center justify-between" style={{ padding: "13px 16px", borderBottom: "1px solid var(--color-divider)" }}>
            <h5 style={{ margin: 0 }}>My prioritised queue</h5>
            <span style={{ fontSize: 11, color: "var(--color-muted)" }}>Sorted by score</span>
          </div>
          {isLoading && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--color-muted)" }}>Loading…</div>
          )}
          {!isLoading && myLeads.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--color-muted)" }}>
              No leads assigned to you.
            </div>
          )}
          {myLeads.map((l) => (
            <div
              key={l.id}
              onClick={() => openLead(l.id)}
              className="rowlead flex items-center gap-3"
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--color-divider)",
                cursor: "pointer",
              }}
            >
              <div
                className="w-8 h-8 flex-none grid place-items-center rounded-full"
                style={{
                  border: "1px solid var(--color-divider)",
                  fontFamily: "var(--font-heading)",
                  fontSize: 12,
                  color: "var(--color-accent-700)",
                }}
              >
                {initials(l.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5 }}>{l.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{l.program}</div>
              </div>
              <span className={`tag ${stageTag(l.stage)}`}>{l.stage}</span>
              <span
                className="inline-flex items-center gap-1"
                style={{ fontSize: 11.5, color: slaColor(l.sla), width: 78 }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: slaColor(l.sla) }} />
                {l.sla}
              </span>
              <div className="flex gap-1.5">
                <button className="btn btn-icon btn-secondary" style={{ width: 30, height: 30 }} onClick={(e) => e.stopPropagation()}>
                  <Icon name="phone" size={14} />
                </button>
                <button className="btn btn-icon btn-secondary" style={{ width: 30, height: 30 }} onClick={(e) => e.stopPropagation()}>
                  <Icon name="message-circle" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <div className="card">
            <h5 style={{ margin: "0 0 8px" }}>Quick templates</h5>
            <div className="flex flex-col gap-2">
              <button className="btn btn-secondary btn-block" style={{ justifyContent: "flex-start", gap: 8, margin: 0 }}>
                <Icon name="message-circle" size={14} />
                WhatsApp — counselling slot
              </button>
              <button className="btn btn-secondary btn-block" style={{ justifyContent: "flex-start", gap: 8, margin: 0 }}>
                <Icon name="mail" size={14} />
                Email — application incomplete
              </button>
              <button className="btn btn-secondary btn-block" style={{ justifyContent: "flex-start", gap: 8, margin: 0 }}>
                <Icon name="pen-line" size={14} />
                SMS — BUAT reminder (DLT)
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
