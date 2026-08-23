"use client";

import { Icon } from "@/components/icon";
import { PAR_INFO } from "@/lib/mock-data";
import { useParentPortal } from "@/lib/api";

export function ParentView() {
  const { data, isLoading } = useParentPortal();
  const lead = data?.lead;
  const parent = data?.parent;
  const status = data?.status ?? [];

  if (isLoading) return <div style={{ padding: 40 }}>Loading portal…</div>;
  if (!lead || !parent)
    return (
      <div style={{ padding: 40 }}>
        No linked student found for your account.
      </div>
    );

  return (
    <section className="view">
      <div
        className="inline-flex items-center gap-1.5 mb-4"
        style={{
          fontSize: 10.5,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--color-accent-700)",
          border: "1px solid var(--color-accent-300)",
          borderRadius: "var(--radius-md)",
          padding: "4px 10px",
        }}
      >
        <Icon name="heart-handshake" size={12} />
        Parent-facing · consent-bound view
      </div>

      <div className="mb-[22px]">
        <h2 style={{ margin: "0 0 3px" }}>Namaste, {parent.name}.</h2>
        <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
          Linked to{" "}
          <strong style={{ color: "var(--color-text)", fontWeight: 400 }}>{lead.name}</strong> ·{" "}
          {lead.program}. Here is her admission progress and what matters for a residential campus.
        </p>
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1.1fr 1fr" }}>
        <div className="card">
          <h5 style={{ margin: "0 0 12px" }}>Admission &amp; onboarding status</h5>
          {status.map((s) => (
            <div
              key={s.title}
              className="flex items-center gap-3"
              style={{ padding: "10px 0", borderBottom: "1px solid var(--color-divider)" }}
            >
              <Icon
                name={s.icon}
                size={18}
                style={{ color: s.done ? "var(--color-accent-700)" : "var(--color-neutral-500)" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5 }}>{s.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--color-muted)" }}>{s.meta}</div>
              </div>
              <span className={`tag ${s.done ? "tag-accent" : "tag-neutral"}`}>
                {s.done ? "Done" : "Pending"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="card">
            <h5 style={{ margin: "0 0 4px" }}>Safety, hostel &amp; fees</h5>
            {PAR_INFO.map((i) => (
              <div
                key={i.label}
                className="flex gap-2.5"
                style={{ padding: "9px 0", borderBottom: "1px solid var(--color-divider)" }}
              >
                <Icon name={i.icon} size={17} style={{ color: "var(--color-accent-700)", marginTop: 1 }} />
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: "var(--color-muted)",
                    }}
                  >
                    {i.label}
                  </div>
                  <div style={{ fontSize: 13 }}>{i.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="flex items-center gap-2.5">
              <Icon name="lock" size={15} style={{ color: "var(--color-accent-700)" }} />
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                Access is linked &amp; consent-bound to {lead.name}. Scope is configurable by the
                University and governed under the DPDP Act, 2023.
              </span>
            </div>
          </div>
          <button className="btn btn-primary btn-block" style={{ margin: 0, gap: 7 }}>
            <Icon name="mail" size={15} />
            Contact the admission office
          </button>
        </div>
      </div>
    </section>
  );
}
