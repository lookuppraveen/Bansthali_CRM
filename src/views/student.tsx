"use client";

import { Icon } from "@/components/icon";
import { initials } from "@/lib/format";
import { STU_ANN } from "@/lib/mock-data";
import { useStudentPortal } from "@/lib/api";

export function StudentView() {
  const { data, isLoading } = useStudentPortal();
  const lead = data?.lead;
  const checklist = data?.checklist ?? [];

  const done = checklist.filter((c) => c.done).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) + "%" : "0%";

  const feeInfo = [
    {
      icon: "indian-rupee",
      label: "Semester fee",
      value: "₹68,400",
      sub: lead?.stage === "Enrolled" ? "Due 5 Sep · from ERP" : "Pending enrolment",
      color: "var(--color-accent-700)",
    },
    {
      icon: "bed-double",
      label: "Hostel",
      value: lead?.hostelRequested ? "Chandra Bhawan · C-214" : "Not requested",
      sub: lead?.hostelRequested ? "Allotted · read-only" : "—",
      color: "var(--color-text)",
    },
    {
      icon: "clock",
      label: "Classes begin",
      value: "2 September",
      sub: "Timetable from ERP",
      color: "var(--color-text)",
    },
  ];

  if (isLoading) return <div style={{ padding: 40 }}>Loading portal…</div>;
  if (!lead)
    return (
      <div style={{ padding: 40 }}>
        No student record found linked to your account.
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
        <Icon name="eye" size={12} />
        Student-facing view
      </div>

      <div className="flex items-end gap-4 mb-[22px]">
        <div
          className="w-[54px] h-[54px] flex-none grid place-items-center rounded-full"
          style={{
            border: "1px solid var(--color-accent)",
            fontFamily: "var(--font-heading)",
            fontSize: 20,
            color: "var(--color-accent-700)",
          }}
        >
          {initials(lead.name)}
        </div>
        <div className="flex-1">
          <h2 style={{ margin: "0 0 3px" }}>Welcome, {lead.name.split(" ")[0]}.</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            {lead.program} · Batch 2026 · Your onboarding is {pct} complete.
          </p>
        </div>
      </div>

      <div className="grid gap-5 items-start mb-5" style={{ gridTemplateColumns: "1.1fr 1fr" }}>
        <div className="card">
          <div className="flex items-center justify-between mb-2.5">
            <h5 style={{ margin: 0 }}>Onboarding checklist</h5>
            <span style={{ fontSize: 12, color: "var(--color-accent-700)", fontFeatureSettings: "'tnum'" }}>
              {done} / {checklist.length}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "var(--color-neutral-200)",
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <div style={{ height: "100%", width: pct, background: "var(--color-accent-400)" }} />
          </div>
          {checklist.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-2.5"
              style={{ padding: "7px 0", borderBottom: "1px solid var(--color-divider)" }}
            >
              {c.done ? (
                <Icon name="check-circle-2" size={16} style={{ color: "var(--color-accent-700)" }} />
              ) : (
                <span
                  style={{
                    width: 16,
                    height: 16,
                    flex: "none",
                    border: "1.5px solid var(--color-neutral-400)",
                    borderRadius: "50%",
                  }}
                />
              )}
              <span
                style={{
                  fontSize: 13,
                  flex: 1,
                  color: c.done ? "var(--color-text)" : "var(--color-muted)",
                }}
              >
                {c.name}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3.5">
          {feeInfo.map((i) => (
            <div
              key={i.label}
              className="card"
              style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}
            >
              <div
                className="w-10 h-10 flex-none grid place-items-center rounded-full"
                style={{
                  border: "1px solid var(--color-divider)",
                  color: "var(--color-accent-700)",
                }}
              >
                <Icon name={i.icon} size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "var(--color-muted)",
                  }}
                >
                  {i.label}
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, color: i.color }}>{i.value}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{i.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        <div className="card">
          <h5 style={{ margin: "0 0 8px" }}>Announcements</h5>
          {STU_ANN.map((a) => (
            <div
              key={a.title}
              className="flex gap-2.5"
              style={{ padding: "9px 0", borderBottom: "1px solid var(--color-divider)" }}
            >
              <div
                className="w-8 h-8 flex-none grid place-items-center rounded-full"
                style={{ border: "1px solid var(--color-divider)", color: "var(--color-accent-700)" }}
              >
                <Icon name={a.icon} size={15} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--color-muted)" }}>{a.meta}</div>
              </div>
              <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{a.time}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h5 style={{ margin: "0 0 10px" }}>Self-service</h5>
          <div className="grid grid-cols-2 gap-2.5">
            <button className="btn btn-secondary" style={{ justifyContent: "flex-start", gap: 8, margin: 0 }}>
              <Icon name="sparkles" size={15} />
              Ask AI assistant
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: "flex-start", gap: 8, margin: 0 }}>
              <Icon name="life-buoy" size={15} />
              Raise a query
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: "flex-start", gap: 8, margin: 0 }}>
              <Icon name="download" size={15} />
              Download letters
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: "flex-start", gap: 8, margin: 0 }}>
              <Icon name="message-square-heart" size={15} />
              Give feedback
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
