import type { ViewKey } from "./mock-data";

export type Role =
  | "super_admin"
  | "admissions_head"
  | "counsellor"
  | "marketing"
  | "front_office"
  | "management"
  | "student"
  | "parent"
  | "dpo";

// Which sidebar keys each role can see.
export const VIEW_ACCESS: Record<Role, ViewKey[]> = {
  super_admin: ["dashboard", "leads", "funnel", "workbench", "ops", "erp", "analytics", "student", "parent", "ai", "admin"],
  admissions_head: ["dashboard", "leads", "funnel", "workbench", "ops", "erp", "analytics", "ai", "admin"],
  counsellor: ["dashboard", "leads", "funnel", "workbench", "ops", "ai"],
  marketing: ["dashboard", "leads", "analytics", "ai"],
  front_office: ["leads", "ai"],
  management: ["dashboard", "analytics"],
  student: ["student", "ai"],
  parent: ["parent"],
  dpo: ["admin", "analytics"],
};

// Default landing view when the user logs in.
export const DEFAULT_VIEW: Record<Role, ViewKey> = {
  super_admin: "dashboard",
  admissions_head: "dashboard",
  counsellor: "workbench",
  marketing: "dashboard",
  front_office: "leads",
  management: "dashboard",
  student: "student",
  parent: "parent",
  dpo: "admin",
};

export function canAccess(role: Role | undefined, view: ViewKey): boolean {
  if (!role) return false;
  if (view === "lead360") return VIEW_ACCESS[role].includes("leads");
  return VIEW_ACCESS[role].includes(view);
}
