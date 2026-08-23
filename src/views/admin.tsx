"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { ADM_CONFIG, ADM_INTEG } from "@/lib/mock-data";
import { useAdmin, useUsers } from "@/lib/api";
import { UserDialog } from "@/components/user-dialog";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin / IT",
  admissions_head: "Admissions Head / Registrar",
  counsellor: "Admission Counsellor",
  marketing: "Marketing / Outreach",
  front_office: "Front Office / Data Entry",
  management: "Management / Leadership",
  student: "Student",
  parent: "Parent / Guardian",
  dpo: "Data Protection Officer",
};

function timeShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
  title: string | null;
  active: boolean;
}

export function AdminView() {
  const { data: admin, isLoading: adminLoading } = useAdmin();
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const audit = admin?.audit ?? [];
  const users = usersData?.users ?? [];

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <section className="view">
      <div className="mb-5">
        <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 6 }}>
          System · Governance
        </div>
        <h2 style={{ margin: "0 0 4px" }}>Admin &amp; RBAC</h2>
        <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
          Least-privilege roles, configuration over code, integration health and an immutable audit trail.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 22 }}>
        {ADM_CONFIG.map((c) => (
          <div key={c.title} className="card" style={{ gap: 8 }}>
            <div className="flex items-center gap-2">
              <Icon name={c.icon} size={16} style={{ color: "var(--color-accent)" }} />
              <span style={{ fontSize: 13, fontFamily: "var(--font-heading)" }}>{c.title}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--color-muted)", lineHeight: 1.4 }}>{c.meta}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            className="flex items-center justify-between"
            style={{ padding: "13px 16px", borderBottom: "1px solid var(--color-divider)" }}
          >
            <h5 style={{ margin: 0 }}>Users &amp; roles</h5>
            <button className="btn btn-primary" style={{ padding: "5px 12px", gap: 6 }} onClick={() => setCreating(true)}>
              <Icon name="plus" size={13} />
              New user
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>User</th>
                <th>Email</th>
                <th>Role</th>
                <th style={{ paddingRight: 16, width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {usersLoading && (
                <tr>
                  <td colSpan={4} style={{ padding: 20, textAlign: "center", color: "var(--color-muted)" }}>
                    Loading…
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} style={{ opacity: u.active ? 1 : 0.55 }}>
                  <td style={{ paddingLeft: 16 }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 flex-none grid place-items-center rounded-full"
                        style={{
                          border: "1px solid var(--color-divider)",
                          fontFamily: "var(--font-heading)",
                          fontSize: 10,
                          color: "var(--color-accent-700)",
                        }}
                      >
                        {u.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 12.5 }}>
                          {u.name}
                          {!u.active && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "#b4442e",
                                marginLeft: 6,
                                letterSpacing: ".05em",
                                textTransform: "uppercase",
                              }}
                            >
                              inactive
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--color-muted)" }}>{u.title ?? ""}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--color-muted)" }}>{u.email}</td>
                  <td>
                    <span className="tag tag-neutral" style={{ whiteSpace: "nowrap" }}>
                      {roleLabels[u.role] ?? u.role}
                    </span>
                  </td>
                  <td style={{ paddingRight: 16, textAlign: "right" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "3px 10px", fontSize: 12 }}
                      onClick={() => setEditing(u)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-5">
          <div className="card">
            <h5 style={{ margin: "0 0 8px" }}>Integration health</h5>
            {ADM_INTEG.map((i) => (
              <div key={i.name} className="flex items-center gap-2.5" style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <span style={{ width: 8, height: 8, flex: "none", borderRadius: "50%", background: i.dot }} />
                <span style={{ flex: 1, fontSize: 13 }}>{i.name}</span>
                <span style={{ fontSize: 11.5, color: i.color }}>{i.status}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h5 style={{ margin: "0 0 8px" }}>Audit trail</h5>
            {adminLoading && (
              <div style={{ fontSize: 12, color: "var(--color-muted)", padding: "8px 0" }}>Loading…</div>
            )}
            {audit.map((a) => (
              <div key={a.id} className="flex gap-2.5" style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--color-accent-700)",
                    fontFeatureSettings: "'tnum'",
                    width: 48,
                    flex: "none",
                  }}
                >
                  {timeShort(a.occurredAt)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5 }}>{a.action}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{a.actorLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(creating || editing) && (
        <UserDialog
          user={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
