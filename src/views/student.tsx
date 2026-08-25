"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { initials } from "@/lib/format";
import { STU_ANN } from "@/lib/mock-data";
import {
  type StudentDoc,
  type StudentEvent,
  type StudentTicket,
  type SurveyAvailable,
  useCreateTicket,
  useEventRsvp,
  useLogPanchmukhi,
  usePanchmukhi,
  useReplyTicket,
  useSaveCheckin,
  useStudentCreatePayment,
  useStudentEvents,
  useStudentPayments,
  useStudentPortal,
  useStudentTickets,
  useSubmitSurvey,
  useSurveys,
  useTicket,
  useUpdateTicket,
  useUploadStudentDoc,
  useWellbeing,
} from "@/lib/api";

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

      {/* Documents section — upload against required docs, see approval status */}
      <div className="mb-5">
        <DocumentsSection docs={lead.documents} />
      </div>

      {/* Fees & payments — history + one-click pay upcoming */}
      <div className="mb-5">
        <FeesSection />
      </div>

      {/* Support tickets — raise a query, track resolution */}
      <div className="mb-5">
        <TicketsSection />
      </div>

      {/* Panchmukhi Shiksha tracker — 5-fold participation, log activities */}
      <div className="mb-5">
        <PanchmukhiSection />
      </div>

      {/* Events & calendar — upcoming campus events with RSVP */}
      <div className="mb-5">
        <EventsSection />
      </div>

      {/* Wellbeing check-in — daily mood pulse with 30-day trend */}
      <div className="mb-5">
        <WellbeingSection />
      </div>

      {/* Surveys & feedback — quick 2-min polls the University sends out */}
      <div className="mb-5">
        <SurveysSection />
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

// ══════════════════════════════════════════════════════════════
// Documents card — upload against each required doc, see status
// ══════════════════════════════════════════════════════════════

function DocumentsSection({ docs }: { docs: StudentDoc[] }) {
  const verified = docs.filter((d) => d.status === "Verified" || d.status === "Issued").length;
  const rejected = docs.filter((d) => d.status === "Rejected" || d.status === "Query raised").length;
  const pending = docs.filter((d) => d.status === "Pending").length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h5 style={{ margin: 0 }}>Documents</h5>
        <div className="flex items-center gap-3" style={{ fontSize: 11.5 }}>
          <span style={{ color: "var(--color-accent-700)" }}>{verified} verified</span>
          <span style={{ color: "var(--color-neutral-600)" }}>{pending} pending</span>
          {rejected > 0 && <span style={{ color: "#b4442e" }}>{rejected} needs action</span>}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 12 }}>
        Upload the required documents below. Accepted formats: PDF, JPG, PNG, WEBP · max ~900 KB per file. Your counsellor is
        notified as soon as you upload.
      </div>
      <div style={{ borderTop: "1px solid var(--color-divider)" }}>
        {docs.map((d) => (
          <DocumentRow key={d.id} doc={d} />
        ))}
      </div>
    </div>
  );
}

function DocumentRow({ doc }: { doc: StudentDoc }) {
  const upload = useUploadStudentDoc();
  const inputRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);

  const needsUpload =
    doc.status === "Not uploaded" || doc.status === "Rejected" || doc.status === "Query raised";
  const canReplace = doc.status === "Pending" || doc.status === "Verified" || doc.status === "Issued";

  const statusStyle = ((): { color: string; bg: string; label: string } => {
    switch (doc.status) {
      case "Verified":
      case "Issued":
        return { color: "var(--color-accent-800)", bg: "var(--color-accent-100)", label: "Approved" };
      case "Pending":
        return { color: "var(--color-neutral-800)", bg: "var(--color-neutral-100)", label: "Under review" };
      case "Rejected":
        return { color: "#fff", bg: "#b4442e", label: "Rejected — re-upload" };
      case "Query raised":
        return { color: "#fff", bg: "#b4442e", label: "Query raised — re-upload" };
      case "Not uploaded":
      default:
        return { color: "var(--color-neutral-800)", bg: "var(--color-neutral-100)", label: "Awaiting upload" };
    }
  })();

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    if (file.size > 900 * 1024) {
      setErr("File must be under ~900 KB. Compress it and try again.");
      e.target.value = "";
      return;
    }
    try {
      await upload.mutateAsync({ docId: doc.id, file });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div
      className="flex items-center gap-3"
      style={{ padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={onFilePicked}
      />
      <Icon
        name={
          doc.status === "Verified" || doc.status === "Issued"
            ? "check-circle-2"
            : doc.status === "Rejected" || doc.status === "Query raised"
              ? "alert-triangle"
              : doc.status === "Pending"
                ? "file-clock"
                : "file"
        }
        size={18}
        style={{ color: statusStyle.color === "#fff" ? statusStyle.bg : statusStyle.color, flex: "none" }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5 }}>
          {doc.name}
          {doc.required && (
            <span style={{ fontSize: 10, color: "#b4442e", marginLeft: 6, letterSpacing: ".05em", textTransform: "uppercase" }}>
              required
            </span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 2 }}>
          {doc.hasFile && doc.fileName ? (
            <>
              {doc.fileName} · {Math.round((doc.fileSize ?? 0) / 1024)} KB
              {doc.uploadedAt && ` · uploaded ${new Date(doc.uploadedAt).toLocaleDateString()}`}
            </>
          ) : (
            "No file uploaded yet"
          )}
          {doc.note && (
            <div style={{ color: "#b4442e", marginTop: 2 }}>
              <strong>Counsellor:</strong> {doc.note}
            </div>
          )}
          {err && <div style={{ color: "#b4442e", marginTop: 2 }}>{err}</div>}
        </div>
      </div>

      <span
        className="tag"
        style={{
          background: statusStyle.bg,
          color: statusStyle.color,
          whiteSpace: "nowrap",
        }}
      >
        {statusStyle.label}
      </span>

      {doc.hasFile && (
        <a
          href={`/api/documents/${doc.id}/file`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ padding: "5px 12px", fontSize: 12, gap: 4 }}
        >
          <Icon name="eye" size={13} />
          View
        </a>
      )}

      {(needsUpload || canReplace) && (
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: "5px 12px", fontSize: 12, gap: 4 }}
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          <Icon name="upload" size={13} />
          {upload.isPending ? "Uploading…" : canReplace ? "Replace" : "Upload"}
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Fees & payments — history + one-click pay upcoming
// ══════════════════════════════════════════════════════════════

function FeesSection() {
  const { data, isLoading } = useStudentPayments();
  const create = useStudentCreatePayment();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [justPaidUrl, setJustPaidUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
        Loading fees…
      </div>
    );
  }
  if (!data) return null;

  const paidRupees = data.totals.paidPaise / 100;
  const upcomingRupees = data.totals.upcomingPaise / 100;

  const payNow = async (item: (typeof data.upcoming)[number]) => {
    setPendingKey(item.key);
    setJustPaidUrl(null);
    try {
      const r = await create.mutateAsync({
        purpose: item.purpose,
        amountRupees: item.amount,
        description: item.label,
      });
      setJustPaidUrl(r.shortUrl);
    } catch {
      /* useMutation surfaces the error */
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h5 style={{ margin: 0 }}>Fees &amp; payments</h5>
        <div style={{ fontSize: 11, color: "var(--color-muted)" }}>Secure payments via Razorpay</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div style={{ border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", padding: 12 }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)" }}>
            Paid this cycle
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, color: "var(--color-accent-700)", fontFeatureSettings: "'tnum'" }}>
            ₹{paidRupees.toLocaleString()}
          </div>
        </div>
        <div style={{ border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", padding: 12 }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)" }}>
            Upcoming due
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, color: upcomingRupees > 0 ? "var(--color-text)" : "var(--color-muted)", fontFeatureSettings: "'tnum'" }}>
            ₹{upcomingRupees.toLocaleString()}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 6 }}>
          Upcoming
        </div>
        {data.upcoming.length === 0 && (
          <div style={{ fontSize: 12.5, color: "var(--color-muted)", padding: "8px 0" }}>
            No upcoming fees. You&rsquo;re all clear.
          </div>
        )}
        {data.upcoming.map((u) => (
          <div key={u.key} className="flex items-center gap-3" style={{ padding: "10px 0", borderBottom: "1px solid var(--color-divider)" }}>
            <Icon name="indian-rupee" size={17} style={{ color: "var(--color-accent-700)", flex: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13 }}>{u.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--color-muted)" }}>
                Due {new Date(u.dueOn).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontFeatureSettings: "'tnum'", minWidth: 90, textAlign: "right" }}>
              ₹{u.amount.toLocaleString()}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: "5px 12px", fontSize: 12, gap: 4 }}
              onClick={() => payNow(u)}
              disabled={pendingKey === u.key}
            >
              <Icon name="credit-card" size={13} />
              {pendingKey === u.key ? "Creating link…" : "Pay now"}
            </button>
          </div>
        ))}
      </div>

      {justPaidUrl && (
        <div
          className="mt-3"
          style={{
            background: "var(--color-accent-100)",
            border: "1px solid var(--color-accent-300)",
            borderRadius: "var(--radius-md)",
            padding: 12,
            fontSize: 12.5,
          }}
        >
          <div style={{ marginBottom: 6 }}>Your payment link is ready. Open it to pay securely.</div>
          <a
            href={justPaidUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ gap: 6, padding: "5px 12px", fontSize: 12 }}
          >
            <Icon name="external-link" size={13} />
            Open Razorpay checkout
          </a>
        </div>
      )}

      <div className="mt-4">
        <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 6 }}>
          Payment history
        </div>
        {data.history.length === 0 && (
          <div style={{ fontSize: 12.5, color: "var(--color-muted)", padding: "8px 0" }}>
            No payments yet.
          </div>
        )}
        {data.history.map((p) => {
          const paid = p.status === "paid";
          const failed = p.status === "failed" || p.status === "expired" || p.status === "cancelled";
          const badgeStyle = paid
            ? { color: "var(--color-accent-800)", bg: "var(--color-accent-100)" }
            : failed
              ? { color: "#fff", bg: "#b4442e" }
              : { color: "var(--color-neutral-800)", bg: "var(--color-neutral-100)" };
          return (
            <div key={p.id} className="flex items-center gap-3" style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5 }}>{p.description ?? p.purpose}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
                  {p.paidAt ? `Paid on ${new Date(p.paidAt).toLocaleDateString()}` : `Created ${new Date(p.createdAt).toLocaleDateString()}`}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontFeatureSettings: "'tnum'" }}>
                ₹{(p.amount / 100).toLocaleString()}
              </div>
              <span className="tag" style={{ background: badgeStyle.bg, color: badgeStyle.color, whiteSpace: "nowrap" }}>
                {p.status}
              </span>
              {!paid && !failed && p.shortUrl && (
                <a href={p.shortUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "3px 10px", fontSize: 11.5, gap: 3 }}>
                  Open
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Support tickets — raise a query, thread of replies, live status
// ══════════════════════════════════════════════════════════════

const CATEGORY_LABEL: Record<string, string> = {
  academic: "Academic",
  hostel: "Hostel & Bhawan",
  mess: "Mess & Food",
  medical: "Medical",
  fees: "Fees & Payments",
  documents: "Documents",
  other: "Other",
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  open: { bg: "var(--color-accent-100)", color: "var(--color-accent-800)", label: "Open" },
  in_progress: { bg: "var(--color-accent-100)", color: "var(--color-accent-800)", label: "In progress" },
  waiting_on_student: { bg: "#b4442e", color: "#fff", label: "Awaiting your reply" },
  resolved: { bg: "var(--color-neutral-100)", color: "var(--color-neutral-800)", label: "Resolved" },
  closed: { bg: "var(--color-neutral-100)", color: "var(--color-neutral-800)", label: "Closed" },
};

function TicketsSection() {
  const { data, isLoading } = useStudentTickets();
  const tickets = data?.tickets ?? [];
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const openCount = tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h5 style={{ margin: 0 }}>Support tickets</h5>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: "5px 12px", fontSize: 12, gap: 4 }}
          onClick={() => setCreating(true)}
        >
          <Icon name="plus" size={13} /> Raise a query
        </button>
      </div>
      <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 8 }}>
        Ask the admissions or hostel team anything — we&rsquo;ll route it and track it to resolution.
        {tickets.length > 0 && ` ${openCount} open · ${tickets.length - openCount} closed.`}
      </div>

      {isLoading && <div style={{ padding: 16, color: "var(--color-muted)" }}>Loading…</div>}
      {!isLoading && tickets.length === 0 && (
        <div style={{ fontSize: 12.5, color: "var(--color-muted)", padding: "12px 0" }}>
          No tickets yet.
        </div>
      )}

      <div style={{ borderTop: tickets.length > 0 ? "1px solid var(--color-divider)" : "none" }}>
        {tickets.map((t) => (
          <TicketRow key={t.id} ticket={t} onOpen={() => setOpenId(t.id)} />
        ))}
      </div>

      {creating && <NewTicketDialog onClose={() => setCreating(false)} />}
      {openId != null && <TicketDetailDialog id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function TicketRow({ ticket, onOpen }: { ticket: StudentTicket; onOpen: () => void }) {
  const status = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open;
  return (
    <div
      onClick={onOpen}
      className="rowlead flex items-center gap-3"
      style={{ padding: "10px 0", borderBottom: "1px solid var(--color-divider)", cursor: "pointer" }}
    >
      <Icon name="life-buoy" size={16} style={{ color: "var(--color-accent-700)", flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13 }}>{ticket.subject}</div>
        <div style={{ fontSize: 11.5, color: "var(--color-muted)" }}>
          {CATEGORY_LABEL[ticket.category] ?? ticket.category}
          {" · "}
          Priority {ticket.priority}
          {ticket.assignedTo && ` · Assigned to ${ticket.assignedTo.name}`}
        </div>
      </div>
      <span
        className="tag"
        style={{ background: status.bg, color: status.color, whiteSpace: "nowrap" }}
      >
        {status.label}
      </span>
    </div>
  );
}

function NewTicketDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateTicket();
  const [category, setCategory] = useState<
    "academic" | "hostel" | "mess" | "medical" | "fees" | "documents" | "other"
  >("hostel");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (subject.trim().length < 3 || description.trim().length < 5) {
      setErr("Please provide a short subject and a description.");
      return;
    }
    try {
      await create.mutateAsync({ category, priority, subject: subject.trim(), description: description.trim() });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div
      className="fixed inset-0 grid place-items-center z-50"
      style={{ background: "rgba(28,21,18,0.55)", padding: 24 }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] flex flex-col gap-3"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-divider)",
          borderRadius: 6,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div className="flex items-center justify-between">
          <h4 style={{ margin: 0 }}>Raise a query</h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
            >
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Priority</label>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Subject</label>
          <input
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Hostel Wi-Fi not working"
            required
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Describe what&rsquo;s wrong</label>
          <textarea
            className="input"
            style={{ minHeight: 130, fontFamily: "var(--font-body)" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Wi-Fi drops every 5 minutes in room C-214. Started yesterday evening."
            required
          />
        </div>

        {err && <div style={{ fontSize: 12, color: "#b4442e" }}>{err}</div>}

        <div className="flex gap-2 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>
            {create.isPending ? "Sending…" : "Send to support"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TicketDetailDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading } = useTicket(id);
  const reply = useReplyTicket();
  const update = useUpdateTicket();
  const [body, setBody] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    await reply.mutateAsync({ ticketId: id, body: body.trim() });
    setBody("");
  };

  const ticket = data?.ticket;
  const canClose = ticket && ticket.status !== "closed" && ticket.status !== "resolved";

  return (
    <div
      className="fixed inset-0 grid place-items-center z-50"
      style={{ background: "rgba(28,21,18,0.55)", padding: 24 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[680px] flex flex-col gap-3"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-divider)",
          borderRadius: 6,
          padding: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        {isLoading && <div style={{ padding: 40, color: "var(--color-muted)" }}>Loading…</div>}
        {ticket && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 4 }}>
                  Ticket #{ticket.id} · {CATEGORY_LABEL[ticket.category] ?? ticket.category}
                </div>
                <h4 style={{ margin: 0 }}>{ticket.subject}</h4>
                {ticket.assignedTo && (
                  <div style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 4 }}>
                    Assigned to {ticket.assignedTo.name} ({ticket.assignedTo.role})
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="tag"
                  style={{
                    background: (STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open).bg,
                    color: (STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open).color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {(STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open).label}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: 12 }}>
              {ticket.messages.map((m) => {
                const isMe =
                  ticket.createdBy?.id === m.sender?.id ||
                  (m.senderRole === "student" && ticket.messages[0]?.sender?.id === m.sender?.id);
                return (
                  <div
                    key={m.id}
                    style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 8 }}
                  >
                    <div
                      style={{
                        maxWidth: "78%",
                        padding: "10px 12px",
                        borderRadius: isMe ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                        background: isMe ? "var(--color-accent-100)" : "var(--color-neutral-200)",
                        border: `1px solid ${isMe ? "var(--color-accent-300)" : "var(--color-divider)"}`,
                        fontSize: 13,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <div style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 4 }}>
                        {m.sender?.name ?? m.senderRole}
                        {" · "}
                        {new Date(m.createdAt).toLocaleString(undefined, {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {m.body}
                    </div>
                  </div>
                );
              })}
            </div>

            {canClose && (
              <form onSubmit={send} className="flex gap-2" style={{ borderTop: "1px solid var(--color-divider)", paddingTop: 12 }}>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your reply…"
                />
                <button type="submit" className="btn btn-primary" disabled={reply.isPending || !body.trim()}>
                  {reply.isPending ? "Sending…" : "Reply"}
                </button>
              </form>
            )}

            {canClose && (
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: "4px 12px", fontSize: 12 }}
                  onClick={() => update.mutate({ id: ticket.id, status: "resolved" })}
                >
                  Mark as resolved
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Panchmukhi Shiksha tracker — five-fold participation
// ══════════════════════════════════════════════════════════════

const DIMENSION_LABEL: Record<string, { en: string; hi: string; icon: string; hint: string }> = {
  physical: { en: "Physical", hi: "शारीरिक", icon: "activity", hint: "Yoga · sports · horse riding · march-past" },
  practical: { en: "Practical", hi: "व्यावहारिक", icon: "hammer", hint: "Community service · crafts · cooking · gardening" },
  aesthetic: { en: "Aesthetic", hi: "कलात्मक", icon: "music", hint: "Music · dance · painting · fine arts" },
  moral: { en: "Moral", hi: "नैतिक", icon: "heart", hint: "Prarthana · values reading · service" },
  intellectual: { en: "Intellectual", hi: "बौद्धिक", icon: "book-open", hint: "Reading · classes · study · debate" },
};

function PanchmukhiSection() {
  const { data, isLoading } = usePanchmukhi();
  const [logging, setLogging] = useState<null | keyof typeof DIMENSION_LABEL>(null);

  if (isLoading) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
        Loading Panchmukhi tracker…
      </div>
    );
  }
  if (!data) return null;

  const badge = ((): { label: string; color: string } => {
    const b = data.totals.balanceScore;
    if (b === 100) return { label: "All five dimensions this week — Sampurna 🌟", color: "var(--color-accent-700)" };
    if (b >= 60) return { label: "Well-balanced week", color: "var(--color-accent-700)" };
    if (b >= 20) return { label: "Off to a start — try one more dimension today", color: "var(--color-accent-600)" };
    return { label: "Log your first activity to start the week", color: "var(--color-muted)" };
  })();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h5 style={{ margin: 0 }}>Panchmukhi Shiksha · this week</h5>
          <div style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 2 }}>
            The five-fold education tradition of Banasthali. Log activities across all five dimensions
            for a complete week.
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: badge.color, fontFeatureSettings: "'tnum'" }}>
            {data.totals.balanceScore}%
          </div>
          <div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)" }}>
            balance
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: badge.color, marginBottom: 12, marginTop: 6 }}>{badge.label}</div>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {data.dimensions.map((d) => {
          const meta = DIMENSION_LABEL[d.key];
          const done = d.weekMinutes >= d.target;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setLogging(d.key)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: 12,
                border: `1px solid ${done ? "var(--color-accent)" : "var(--color-divider)"}`,
                borderRadius: "var(--radius-md)",
                background: done ? "var(--color-accent-100)" : "transparent",
                cursor: "pointer",
                textAlign: "center",
                fontFamily: "var(--font-body)",
              }}
              title={meta.hint}
            >
              <Icon
                name={meta.icon}
                size={20}
                style={{ color: done ? "var(--color-accent-800)" : "var(--color-accent-700)" }}
              />
              <div style={{ fontSize: 12, fontFamily: "var(--font-heading)" }}>{meta.en}</div>
              <div style={{ fontSize: 10.5, color: "var(--color-muted)" }}>{meta.hi}</div>
              <div style={{ width: "100%", height: 4, background: "var(--color-neutral-200)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${d.pct}%`, background: "var(--color-accent-400)" }} />
              </div>
              <div style={{ fontSize: 10.5, color: "var(--color-muted)", fontFeatureSettings: "'tnum'" }}>
                {d.weekMinutes} / {d.target} min
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 6 }}>
          Recent activities
        </div>
        {data.recent.length === 0 && (
          <div style={{ fontSize: 12.5, color: "var(--color-muted)", padding: "8px 0" }}>
            Nothing logged yet. Click a dimension above to add your first activity.
          </div>
        )}
        {data.recent.map((r) => {
          const meta = DIMENSION_LABEL[r.dimension];
          return (
            <div
              key={r.id}
              className="flex items-center gap-3"
              style={{ padding: "7px 0", borderBottom: "1px solid var(--color-divider)" }}
            >
              <Icon name={meta?.icon ?? "circle"} size={14} style={{ color: "var(--color-accent-700)", flex: "none" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5 }}>{r.activity}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
                  {meta?.en ?? r.dimension} ·{" "}
                  {new Date(r.occurredAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                  {r.note && ` · ${r.note}`}
                </div>
              </div>
              <div style={{ fontSize: 11.5, fontFeatureSettings: "'tnum'", color: "var(--color-muted)" }}>
                {r.minutes} min
              </div>
            </div>
          );
        })}
      </div>

      {logging && <LogPanchmukhiDialog dimension={logging} onClose={() => setLogging(null)} />}
    </div>
  );
}

function LogPanchmukhiDialog({
  dimension,
  onClose,
}: {
  dimension: keyof typeof DIMENSION_LABEL;
  onClose: () => void;
}) {
  const meta = DIMENSION_LABEL[dimension];
  const log = useLogPanchmukhi();
  const [activity, setActivity] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!activity.trim()) {
      setErr("Please name the activity.");
      return;
    }
    try {
      await log.mutateAsync({ dimension, activity: activity.trim(), minutes, note: note.trim() || undefined });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div
      className="fixed inset-0 grid place-items-center z-50"
      style={{ background: "rgba(28,21,18,0.55)", padding: 24 }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] flex flex-col gap-3"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-divider)",
          borderRadius: 6,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name={meta.icon} size={18} style={{ color: "var(--color-accent-700)" }} />
              Log · {meta.en} <span style={{ color: "var(--color-muted)", fontSize: 14 }}>({meta.hi})</span>
            </h4>
            <div style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 2 }}>{meta.hint}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Activity *</label>
          <input
            className="input"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="Morning yoga session"
            required
            autoFocus
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Minutes</label>
          <input
            className="input"
            type="number"
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            required
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Reflection (optional)</label>
          <textarea
            className="input"
            style={{ minHeight: 60, fontFamily: "var(--font-body)" }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you notice today?"
          />
        </div>

        {err && <div style={{ fontSize: 12, color: "#b4442e" }}>{err}</div>}

        <div className="flex gap-2 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={log.isPending}>
            {log.isPending ? "Logging…" : "Log activity"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Events & calendar — upcoming campus events + RSVP
// ══════════════════════════════════════════════════════════════

const EVENT_CATEGORY_STYLE: Record<string, { color: string; icon: string; label: string }> = {
  academic: { color: "var(--color-accent-700)", icon: "book-open", label: "Academic" },
  cultural: { color: "#7b1e28", icon: "music", label: "Cultural" },
  sports: { color: "var(--color-accent-700)", icon: "activity", label: "Sports" },
  hostel: { color: "var(--color-accent-700)", icon: "home", label: "Hostel" },
  panchmukhi: { color: "var(--color-accent-700)", icon: "sparkles", label: "Panchmukhi" },
  orientation: { color: "var(--color-accent)", icon: "compass", label: "Orientation" },
  other: { color: "var(--color-neutral-600)", icon: "calendar", label: "Other" },
};

function formatEventTime(startsAt: string, endsAt: string | null): string {
  const s = new Date(startsAt);
  const dateStr = s.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
  const startStr = s.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (endsAt) {
    const e = new Date(endsAt);
    const endStr = e.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `${dateStr} · ${startStr} – ${endStr}`;
  }
  return `${dateStr} · ${startStr}`;
}

function groupByDay(evts: StudentEvent[]): Record<string, StudentEvent[]> {
  const map: Record<string, StudentEvent[]> = {};
  for (const e of evts) {
    const d = new Date(e.startsAt);
    const key = d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long" });
    (map[key] = map[key] ?? []).push(e);
  }
  return map;
}

function EventsSection() {
  const { data, isLoading } = useStudentEvents();
  const events = data?.events ?? [];
  const grouped = groupByDay(events);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h5 style={{ margin: 0 }}>Upcoming events</h5>
        <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
          {events.length} in the next 30 days
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 12 }}>
        RSVP to reserve your seat and get a reminder. Panchmukhi-tagged events count toward your
        weekly balance.
      </div>

      {isLoading && (
        <div style={{ padding: 24, textAlign: "center", color: "var(--color-muted)" }}>
          Loading events…
        </div>
      )}
      {!isLoading && events.length === 0 && (
        <div style={{ fontSize: 12.5, color: "var(--color-muted)", padding: "12px 0" }}>
          No upcoming events. Check back soon.
        </div>
      )}

      {Object.entries(grouped).map(([day, dayEvents]) => (
        <div key={day} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--color-accent-700)",
              padding: "6px 0",
              borderBottom: "1px solid var(--color-divider)",
              marginBottom: 4,
            }}
          >
            {day}
          </div>
          {dayEvents.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EventRow({ event }: { event: StudentEvent }) {
  const rsvp = useEventRsvp();
  const cat = EVENT_CATEGORY_STYLE[event.category] ?? EVENT_CATEGORY_STYLE.other;

  const setRsvp = (status: "going" | "interested" | "declined") => {
    rsvp.mutate({ eventId: event.id, status });
  };

  const btn = (status: "going" | "interested" | "declined", label: string, iconName: string) => {
    const active = event.myRsvp === status;
    return (
      <button
        type="button"
        onClick={() => setRsvp(status)}
        disabled={rsvp.isPending}
        style={{
          padding: "4px 10px",
          fontSize: 11.5,
          border: `1px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`,
          background: active ? "var(--color-accent-100)" : "transparent",
          color: active ? "var(--color-accent-800)" : "var(--color-text)",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "var(--font-body)",
        }}
      >
        <Icon name={iconName} size={12} />
        {label}
      </button>
    );
  };

  return (
    <div
      className="flex items-start gap-3"
      style={{ padding: "10px 0", borderBottom: "1px solid var(--color-divider)" }}
    >
      <div
        className="grid place-items-center rounded-full flex-none"
        style={{
          width: 36,
          height: 36,
          border: `1px solid ${cat.color}`,
          color: cat.color,
        }}
      >
        <Icon name={cat.icon} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5 }}>{event.title}</div>
        <div style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 2 }}>
          {formatEventTime(event.startsAt, event.endsAt)}
          {event.location && ` · ${event.location}`}
          {event.audience && ` · ${event.audience}`}
        </div>
        {event.description && (
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 4 }}>
            {event.description}
          </div>
        )}
        <div className="flex items-center gap-4 mt-2" style={{ fontSize: 11, color: "var(--color-muted)" }}>
          <span
            className="tag"
            style={{ background: "transparent", border: `1px solid ${cat.color}`, color: cat.color }}
          >
            {cat.label}
          </span>
          <span>
            {event.goingCount} going{event.capacity ? ` · capacity ${event.capacity}` : ""}
          </span>
        </div>
      </div>
      <div className="flex gap-1.5 flex-none">
        {btn("going", "Going", "check")}
        {btn("interested", "Interested", "bookmark")}
        {btn("declined", "Skip", "x")}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Wellbeing check-in — daily mood pulse + 30-day trend
// ══════════════════════════════════════════════════════════════

const MOOD_META: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: "Struggling", emoji: "😔", color: "#b4442e" },
  2: { label: "Low", emoji: "🙁", color: "#c67a1e" },
  3: { label: "OK", emoji: "😐", color: "var(--color-neutral-600)" },
  4: { label: "Good", emoji: "🙂", color: "var(--color-accent-600)" },
  5: { label: "Great", emoji: "😄", color: "var(--color-accent-700)" },
};

function WellbeingSection() {
  const { data, isLoading } = useWellbeing();
  const save = useSaveCheckin();
  const [note, setNote] = useState("");
  const [chosen, setChosen] = useState<number | null>(null);

  const submit = async (score: number) => {
    setChosen(score);
    try {
      await save.mutateAsync({ moodScore: score, note: note.trim() || undefined });
      setNote("");
    } catch {
      setChosen(null);
    }
  };

  if (isLoading) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
        Loading wellbeing…
      </div>
    );
  }
  if (!data) return null;

  const today = data.todaysCheckin;
  const avg7 = data.summary.avg7;
  const suggestion = ((): { label: string; color: string; hint: string } | null => {
    if (avg7 === null) return null;
    if (avg7 <= 2) {
      return {
        label: "Low week",
        color: "#b4442e",
        hint: "Please reach out to your warden or the campus counselling centre — they're there for you. You can also raise a support ticket above.",
      };
    }
    if (avg7 <= 3) {
      return {
        label: "Middle-of-the-road",
        color: "var(--color-accent-600)",
        hint: "Try a Panchmukhi activity or an event today — a small change often helps.",
      };
    }
    return {
      label: "Doing well",
      color: "var(--color-accent-700)",
      hint: "Keep it up — check in tomorrow to keep your streak.",
    };
  })();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h5 style={{ margin: 0 }}>How are you today?</h5>
          <div style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 2 }}>
            A 10-second pulse. Only you can see this. Private &amp; confidential.
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: "var(--color-accent-700)", fontFeatureSettings: "'tnum'" }}>
            {data.summary.streak}d
          </div>
          <div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)" }}>
            streak
          </div>
        </div>
      </div>

      {/* Mood picker */}
      <div className="flex items-center justify-center gap-3 mb-3" style={{ padding: "10px 0" }}>
        {[1, 2, 3, 4, 5].map((s) => {
          const m = MOOD_META[s];
          const isToday = today?.moodScore === s || chosen === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              disabled={save.isPending}
              title={m.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "8px 12px",
                border: `1px solid ${isToday ? m.color : "var(--color-divider)"}`,
                background: isToday ? "var(--color-accent-100)" : "transparent",
                borderRadius: "var(--radius-md)",
                cursor: save.isPending ? "wait" : "pointer",
                minWidth: 68,
              }}
            >
              <div style={{ fontSize: 24 }}>{m.emoji}</div>
              <div style={{ fontSize: 10.5, color: m.color, fontFamily: "var(--font-heading)" }}>
                {m.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Optional note */}
      {!today && (
        <div className="mb-3">
          <input
            className="input"
            placeholder="Anything on your mind? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
        </div>
      )}

      {today && (
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 12 }}>
          Recorded today at{" "}
          {new Date(today.occurredAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          {today.note && ` — "${today.note}"`}
          . Tap another face to update.
        </div>
      )}

      {/* 30-day sparkline */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 6 }}>
          Last 30 days
        </div>
        <div className="flex items-end gap-[3px]" style={{ height: 50 }}>
          {data.trend.map((d) => {
            const h = d.avg ? Math.max(4, (d.avg / 5) * 50) : 2;
            const color = d.avg ? (MOOD_META[Math.round(d.avg)]?.color ?? "var(--color-accent-400)") : "var(--color-neutral-200)";
            return (
              <div
                key={d.date}
                title={d.avg ? `${d.date} · ${d.avg.toFixed(1)}/5` : `${d.date} · no entry`}
                style={{
                  flex: 1,
                  height: h,
                  background: color,
                  borderRadius: 2,
                }}
              />
            );
          })}
        </div>
      </div>

      {suggestion && (
        <div
          className="mt-3"
          style={{
            padding: 12,
            borderRadius: "var(--radius-md)",
            background: "rgba(0,0,0,0.03)",
            border: `1px solid ${suggestion.color === "#b4442e" ? "#b4442e" : "var(--color-divider)"}`,
            fontSize: 12.5,
          }}
        >
          <div style={{ color: suggestion.color, fontFamily: "var(--font-heading)", marginBottom: 4 }}>
            {suggestion.label}
          </div>
          <div style={{ color: "var(--color-muted)" }}>{suggestion.hint}</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Surveys & feedback — quick polls the University sends out
// ══════════════════════════════════════════════════════════════

const SURVEY_CATEGORY_META: Record<string, { icon: string; label: string }> = {
  faculty: { icon: "book-open", label: "Faculty" },
  mess: { icon: "utensils", label: "Mess & food" },
  hostel: { icon: "home", label: "Hostel" },
  event: { icon: "calendar", label: "Event" },
  onboarding: { icon: "compass", label: "Onboarding" },
  general: { icon: "clipboard-list", label: "General" },
};

function SurveysSection() {
  const { data, isLoading } = useSurveys();
  const [open, setOpen] = useState<SurveyAvailable | null>(null);

  const available = data?.available ?? [];
  const completed = data?.completed ?? [];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h5 style={{ margin: 0 }}>Feedback &amp; surveys</h5>
        <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
          {available.length} open · {completed.length} completed
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 12 }}>
        Short, focused polls — your feedback goes straight to the team. Anonymous to peers,
        traceable to the University for follow-up.
      </div>

      {isLoading && (
        <div style={{ padding: 16, color: "var(--color-muted)" }}>Loading…</div>
      )}

      {!isLoading && available.length === 0 && completed.length === 0 && (
        <div style={{ fontSize: 12.5, color: "var(--color-muted)", padding: "12px 0" }}>
          No surveys right now.
        </div>
      )}

      {available.length > 0 && (
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 6 }}>
            Waiting for your response
          </div>
          {available.map((s) => {
            const meta = SURVEY_CATEGORY_META[s.category] ?? SURVEY_CATEGORY_META.general;
            return (
              <div
                key={s.id}
                className="flex items-start gap-3"
                style={{ padding: "10px 0", borderBottom: "1px solid var(--color-divider)" }}
              >
                <div
                  className="grid place-items-center rounded-full flex-none"
                  style={{
                    width: 34,
                    height: 34,
                    border: "1px solid var(--color-accent)",
                    background: "var(--color-accent-100)",
                    color: "var(--color-accent-700)",
                  }}
                >
                  <Icon name={meta.icon} size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>{s.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 2 }}>
                    {meta.label} · {s.questions.length} question{s.questions.length === 1 ? "" : "s"} · ~
                    {Math.max(1, Math.round(s.questions.length * 0.5))} min
                    {s.audience && ` · ${s.audience}`}
                  </div>
                  {s.description && (
                    <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 4 }}>
                      {s.description}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: "5px 12px", fontSize: 12, gap: 4 }}
                  onClick={() => setOpen(s)}
                >
                  <Icon name="edit-3" size={13} />
                  Respond
                </button>
              </div>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <div className="mt-4">
          <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 6 }}>
            Thanks for these
          </div>
          {completed.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3"
              style={{ padding: "7px 0", borderBottom: "1px solid var(--color-divider)" }}
            >
              <Icon name="check-circle-2" size={14} style={{ color: "var(--color-accent-700)", flex: "none" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
                  Submitted{" "}
                  {new Date(c.submittedAt).toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
              </div>
              <span className="tag tag-accent">Submitted</span>
            </div>
          ))}
        </div>
      )}

      {open && <SurveyDialog survey={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function SurveyDialog({ survey, onClose }: { survey: SurveyAvailable; onClose: () => void }) {
  const submit = useSubmitSurvey();
  const [answers, setAnswers] = useState<{ rating?: number; text?: string }[]>(
    survey.questions.map(() => ({}))
  );
  const [err, setErr] = useState<string | null>(null);

  const update = (idx: number, patch: { rating?: number; text?: string }) => {
    setAnswers((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    // Validate required
    for (let i = 0; i < survey.questions.length; i++) {
      const q = survey.questions[i];
      const a = answers[i];
      if (!q.required) continue;
      if (q.kind === "rating" && (a.rating === undefined || a.rating < 1)) {
        setErr(`Question ${i + 1} needs a rating.`);
        return;
      }
      if (q.kind === "text" && (!a.text || !a.text.trim())) {
        setErr(`Question ${i + 1} needs an answer.`);
        return;
      }
    }
    try {
      await submit.mutateAsync({ id: survey.id, answers });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div
      className="fixed inset-0 grid place-items-center z-50"
      style={{ background: "rgba(28,21,18,0.55)", padding: 24 }}
      onClick={onClose}
    >
      <form
        onSubmit={send}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] flex flex-col gap-4"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-divider)",
          borderRadius: 6,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxHeight: "92vh",
          overflow: "auto",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 style={{ margin: 0 }}>{survey.title}</h4>
            {survey.description && (
              <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 4 }}>
                {survey.description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {survey.questions.map((q, i) => (
            <div key={i}>
              <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
                {i + 1}. {q.prompt}
                {q.required && <span style={{ color: "#b4442e", marginLeft: 4 }}>*</span>}
              </label>

              {q.kind === "rating" ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const on = answers[i].rating === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update(i, { rating: n })}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "var(--radius-md)",
                          border: `1px solid ${on ? "var(--color-accent)" : "var(--color-divider)"}`,
                          background: on ? "var(--color-accent-100)" : "transparent",
                          color: on ? "var(--color-accent-800)" : "var(--color-text)",
                          fontFamily: "var(--font-heading)",
                          fontSize: 15,
                          cursor: "pointer",
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                  <div className="flex items-center" style={{ fontSize: 11, color: "var(--color-muted)", marginLeft: 8 }}>
                    1 = poor, 5 = excellent
                  </div>
                </div>
              ) : (
                <textarea
                  className="input"
                  style={{ minHeight: 80, fontFamily: "var(--font-body)" }}
                  value={answers[i].text ?? ""}
                  onChange={(e) => update(i, { text: e.target.value })}
                  maxLength={2000}
                />
              )}
            </div>
          ))}
        </div>

        {err && <div style={{ fontSize: 12, color: "#b4442e" }}>{err}</div>}

        <div className="flex gap-2 justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit feedback"}
          </button>
        </div>
      </form>
    </div>
  );
}

