"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { useCreateLead, useSources } from "@/lib/api";

export function NewEnquiryDialog({ onClose, onCreated }: { onClose: () => void; onCreated?: (id: number) => void }) {
  const { data } = useSources();
  const create = useCreateLead();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    program: "",
    faculty: "",
    sourceId: "" as string,
  });
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.name.trim()) {
      setErr("Name is required.");
      return;
    }
    try {
      const res = (await create.mutateAsync({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
        program: form.program.trim() || undefined,
        faculty: form.faculty.trim() || undefined,
        sourceId: form.sourceId ? Number(form.sourceId) : undefined,
      })) as { lead: { id: number } };
      onCreated?.(res.lead.id);
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
          <h4 style={{ margin: 0 }}>New enquiry</h4>
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
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>City</label>
            <input
              className="input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Programme interest</label>
            <input
              className="input"
              value={form.program}
              onChange={(e) => setForm({ ...form, program: e.target.value })}
              placeholder="B.Tech CS"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Faculty</label>
            <input
              className="input"
              value={form.faculty}
              onChange={(e) => setForm({ ...form, faculty: e.target.value })}
              placeholder="Faculty of Technology"
            />
          </div>
          <div className="col-span-2">
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Source</label>
            <select
              className="input"
              value={form.sourceId}
              onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
            >
              <option value="">— pick a source —</option>
              {data?.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {err && <div style={{ fontSize: 12, color: "#b4442e" }}>{err}</div>}

        <div className="flex gap-2 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create enquiry"}
          </button>
        </div>
      </form>
    </div>
  );
}
