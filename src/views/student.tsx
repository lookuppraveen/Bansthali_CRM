"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { initials } from "@/lib/format";
import { STU_ANN } from "@/lib/mock-data";
import { type StudentDoc, useStudentPortal, useUploadStudentDoc } from "@/lib/api";

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
