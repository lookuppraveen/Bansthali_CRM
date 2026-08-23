"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { useCreatePaymentLink } from "@/lib/api";

type Purpose = "application_fee" | "admission_fee" | "semester_fee" | "hostel_deposit" | "other";

const PURPOSE_OPTIONS: { value: Purpose; label: string; defaultRupees: number }[] = [
  { value: "application_fee", label: "Application fee", defaultRupees: 1000 },
  { value: "admission_fee", label: "Admission fee", defaultRupees: 25000 },
  { value: "semester_fee", label: "Semester fee", defaultRupees: 68400 },
  { value: "hostel_deposit", label: "Hostel deposit", defaultRupees: 15000 },
  { value: "other", label: "Other", defaultRupees: 500 },
];

interface Props {
  leadId: number;
  leadName: string;
  onClose: () => void;
}

export function CreatePaymentDialog({ leadId, leadName, onClose }: Props) {
  const create = useCreatePaymentLink();
  const [purpose, setPurpose] = useState<Purpose>("admission_fee");
  const [amount, setAmount] = useState<number>(25000);
  const [description, setDescription] = useState<string>("");
  const [result, setResult] = useState<{ shortUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await create.mutateAsync({
        leadId,
        amountRupees: amount,
        purpose,
        description: description || undefined,
      });
      setResult({ shortUrl: res.shortUrl });
    } catch {
      // useMutation surfaces error; nothing else to do here.
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        className="w-full max-w-[520px] flex flex-col gap-3"
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
              <Icon name="indian-rupee" size={18} style={{ color: "var(--color-accent)" }} />
              Create payment link · {leadName}
            </h4>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
              via Razorpay · applicant pays online, status reflects on Lead 360°
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {!result && (
          <>
            <div>
              <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Purpose</label>
              <select
                className="input"
                value={purpose}
                onChange={(e) => {
                  const next = e.target.value as Purpose;
                  setPurpose(next);
                  const def = PURPOSE_OPTIONS.find((o) => o.value === next)?.defaultRupees;
                  if (def) setAmount(def);
                }}
              >
                {PURPOSE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Amount (₹)</label>
              <input
                className="input"
                type="number"
                min={1}
                max={1000000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Description (optional)</label>
              <input
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Admission fee · B.Tech Computer Science"
              />
            </div>

            {create.error && (
              <div style={{ fontSize: 12.5, color: "#b4442e" }}>{(create.error as Error).message}</div>
            )}

            <div className="flex gap-2 justify-end mt-2">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create link"}
              </button>
            </div>
          </>
        )}

        {result && (
          <>
            <div
              style={{
                background: "rgba(0,0,0,0.03)",
                border: "1px solid var(--color-accent-300)",
                borderRadius: 4,
                padding: 14,
                fontSize: 12.5,
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 6 }}>
                Payment link ready
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, wordBreak: "break-all" }}
                >
                  {result.shortUrl}
                </a>
                <button
                  type="button"
                  onClick={copy}
                  className="btn btn-secondary"
                  style={{ padding: "4px 10px", fontSize: 12 }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--color-muted)" }}>
              Share this link via WhatsApp, Email or SMS. Status will refresh once the applicant pays
              (test-mode: click &ldquo;Refresh&rdquo; on the payment card, or configure a webhook for
              auto-update).
            </div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
