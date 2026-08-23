"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { useUpdateLead } from "@/lib/api";

interface EditableLead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  program: string | null;
  faculty: string | null;
  category: string | null;
  aggregate: string | null;
  language: string | null;
  hostelRequested: boolean;
}

export function EditLeadDialog({ lead, onClose }: { lead: EditableLead; onClose: () => void }) {
  const update = useUpdateLead();
  const [form, setForm] = useState<EditableLead>(lead);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.name.trim()) {
      setErr("Name is required.");
      return;
    }
    try {
      await update.mutateAsync({
        id: lead.id,
        name: form.name.trim(),
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        city: form.city?.trim() || null,
        program: form.program?.trim() || null,
        faculty: form.faculty?.trim() || null,
        category: form.category?.trim() || null,
        aggregate: form.aggregate?.trim() || null,
        language: form.language?.trim() || null,
        hostelRequested: form.hostelRequested,
      });
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
        className="w-full max-w-[640px] flex flex-col gap-3"
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
          <h4 style={{ margin: 0 }}>Edit lead · {lead.name}</h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Full name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Phone</label>
            <input
              className="input"
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+919812345678"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Email</label>
            <input
              className="input"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>City</label>
            <input
              className="input"
              value={form.city ?? ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Programme</label>
            <input
              className="input"
              value={form.program ?? ""}
              onChange={(e) => setForm({ ...form, program: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Faculty</label>
            <input
              className="input"
              value={form.faculty ?? ""}
              onChange={(e) => setForm({ ...form, faculty: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Category</label>
            <input
              className="input"
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="General / OBC / SC / ST / EWS"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>10+2 aggregate</label>
            <input
              className="input"
              value={form.aggregate ?? ""}
              onChange={(e) => setForm({ ...form, aggregate: e.target.value })}
              placeholder="93.4%"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Language</label>
            <input
              className="input"
              value={form.language ?? ""}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              placeholder="Hindi, English"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2" style={{ fontSize: 12.5 }}>
              <input
                type="checkbox"
                checked={form.hostelRequested}
                onChange={(e) => setForm({ ...form, hostelRequested: e.target.checked })}
              />
              Hostel requested
            </label>
          </div>
        </div>

        {err && <div style={{ fontSize: 12, color: "#b4442e" }}>{err}</div>}

        <div className="flex gap-2 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
