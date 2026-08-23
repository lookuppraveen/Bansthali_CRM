"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { useCreateUser, useDeactivateUser, useUpdateUser } from "@/lib/api";

const ROLES = [
  { value: "super_admin", label: "Super Admin / IT" },
  { value: "admissions_head", label: "Admissions Head / Registrar" },
  { value: "counsellor", label: "Admission Counsellor" },
  { value: "marketing", label: "Marketing / Outreach" },
  { value: "front_office", label: "Front Office / Data Entry" },
  { value: "management", label: "Management / Leadership" },
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent / Guardian" },
  { value: "dpo", label: "Data Protection Officer" },
] as const;

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
  title: string | null;
  active: boolean;
}

export function UserDialog({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  const create = useCreateUser();
  const update = useUpdateUser();
  const del = useDeactivateUser();

  const isNew = !user;
  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState(user?.role ?? "counsellor");
  const [initials, setInitials] = useState(user?.initials ?? "");
  const [title, setTitle] = useState(user?.title ?? "");
  const [active, setActive] = useState(user?.active ?? true);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      if (isNew) {
        if (password.length < 6) {
          setErr("Password must be at least 6 characters.");
          return;
        }
        await create.mutateAsync({ email, name, role, initials, title: title || undefined, password });
      } else {
        await update.mutateAsync({
          id: user!.id,
          name,
          role,
          initials,
          title: title || null,
          active,
          password: password || undefined,
        });
      }
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const deactivate = async () => {
    if (!user) return;
    if (!confirm(`Deactivate ${user.email}? They will lose access immediately.`)) return;
    setErr(null);
    try {
      await del.mutateAsync({ id: user.id });
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
          <h4 style={{ margin: 0 }}>{isNew ? "New user" : `Edit user · ${user!.name}`}</h4>
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
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Email *</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!isNew}
            />
            {!isNew && (
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
                Email is the login identifier — cannot change after creation.
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Full name *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Initials * (2-4 chars)</label>
            <input
              className="input"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 4))}
              required
              maxLength={4}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Role *</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Title / department</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Admissions Counsellor · UG"
            />
          </div>
          <div className="col-span-2">
            <label style={{ fontSize: 12, color: "var(--color-muted)" }}>
              {isNew ? "Password *" : "New password (leave blank to keep existing)"}
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isNew ? 6 : undefined}
              required={isNew}
              placeholder={isNew ? "min 6 characters" : "leave blank to keep existing"}
            />
          </div>
          {!isNew && (
            <div className="col-span-2 flex items-center">
              <label className="flex items-center gap-2" style={{ fontSize: 12.5 }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Active (can log in and be assigned leads)
              </label>
            </div>
          )}
        </div>

        {err && <div style={{ fontSize: 12, color: "#b4442e" }}>{err}</div>}

        <div className="flex gap-2 justify-between items-center mt-2">
          <div>
            {!isNew && (
              <button
                type="button"
                onClick={deactivate}
                className="btn btn-secondary"
                style={{ color: "#b4442e", borderColor: "#b4442e" }}
                disabled={del.isPending}
              >
                {del.isPending ? "Deactivating…" : "Deactivate"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={create.isPending || update.isPending}
            >
              {create.isPending || update.isPending
                ? "Saving…"
                : isNew
                  ? "Create user"
                  : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
