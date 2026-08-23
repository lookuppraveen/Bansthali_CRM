import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Leads ───────────────────────────────────────────────
export function useLeads(params: { search?: string; stage?: string; ownerId?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.stage && params.stage !== "All") qs.set("stage", params.stage);
  if (params.ownerId) qs.set("ownerId", params.ownerId);
  return useQuery({
    queryKey: ["leads", params],
    queryFn: () => jsonFetch<{ leads: LeadRow[] }>(`/api/leads?${qs.toString()}`),
  });
}

export function useLead(id: number | null) {
  return useQuery({
    queryKey: ["lead", id],
    enabled: id != null,
    queryFn: () => jsonFetch<{ lead: LeadDetail }>(`/api/leads/${id}`),
  });
}

export function useTemplates(channel?: string) {
  return useQuery({
    queryKey: ["templates", channel ?? "all"],
    queryFn: () =>
      jsonFetch<{
        templates: {
          id: number;
          name: string;
          channel: string;
          subject: string | null;
          body: string;
          language: string;
          approved: boolean;
        }[];
      }>(`/api/templates${channel ? `?channel=${channel}` : ""}`),
  });
}

export function useSendComm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      leadId: number;
      channel: "email" | "whatsapp" | "sms" | "in_app" | "phone";
      templateId?: number;
      subject?: string;
      body: string;
      recipientOverride?: string;
    }) =>
      jsonFetch<{ ok: boolean; providerMessageId?: string; status: string; error?: string }>(
        `/api/leads/${v.leadId}/send`,
        {
          method: "POST",
          body: JSON.stringify({
            channel: v.channel,
            templateId: v.templateId,
            subject: v.subject,
            body: v.body,
            recipientOverride: v.recipientOverride,
          }),
        }
      ),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["lead", v.leadId] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useCreatePaymentLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      leadId: number;
      amountRupees: number;
      purpose?: "application_fee" | "admission_fee" | "semester_fee" | "hostel_deposit" | "other";
      description?: string;
    }) =>
      jsonFetch<{ payment: { id: number; shortUrl: string; status: string; amount: number }; shortUrl: string }>(
        `/api/leads/${v.leadId}/payment-link`,
        {
          method: "POST",
          body: JSON.stringify({
            amountRupees: v.amountRupees,
            purpose: v.purpose,
            description: v.description,
          }),
        }
      ),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["lead", v.leadId] });
    },
  });
}

export function useRefreshPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { paymentId: number; leadId: number }) =>
      jsonFetch<{ status: string }>(`/api/payments/${v.paymentId}/refresh`, { method: "POST" }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["lead", v.leadId] });
    },
  });
}

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: () => jsonFetch<{ sources: { id: number; name: string; icon: string }[] }>("/api/sources"),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; email?: string; phone?: string; city?: string; program?: string; faculty?: string; sourceId?: number }) =>
      jsonFetch(`/api/leads`, { method: "POST", body: JSON.stringify(v) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useImportLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: Record<string, string>[]) =>
      jsonFetch<{ inserted: number }>(`/api/leads/import`, {
        method: "POST",
        body: JSON.stringify({ rows }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useAdvanceStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; stage: string }) =>
      jsonFetch(`/api/leads/${v.id}`, { method: "PATCH", body: JSON.stringify({ stage: v.stage }) }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["lead", v.id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useLogEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { leadId: number; title: string; detail?: string; icon?: string }) =>
      jsonFetch(`/api/leads/${v.leadId}/events`, {
        method: "POST",
        body: JSON.stringify({ title: v.title, detail: v.detail, icon: v.icon ?? "pen-line" }),
      }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["lead", v.leadId] });
    },
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; done: boolean }) =>
      jsonFetch(`/api/tasks/${v.id}`, { method: "PATCH", body: JSON.stringify({ done: v.done }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead"] });
    },
  });
}

// ── Dashboard / Ops / Admin / ERP ──────────────────────
export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: () => jsonFetch<DashboardData>("/api/dashboard") });
}

export function useOps() {
  return useQuery({ queryKey: ["ops"], queryFn: () => jsonFetch<OpsData>("/api/ops") });
}

export function useAdmin() {
  return useQuery({ queryKey: ["admin"], queryFn: () => jsonFetch<AdminData>("/api/admin") });
}

export function useStudentPortal() {
  return useQuery({
    queryKey: ["portal", "student"],
    queryFn: () =>
      jsonFetch<{
        lead: (LeadDetail & { documents: { id: number; name: string; status: string }[] }) | null;
        checklist: { name: string; done: boolean }[];
      }>("/api/portal/student"),
  });
}

export function useParentPortal() {
  return useQuery({
    queryKey: ["portal", "parent"],
    queryFn: () =>
      jsonFetch<{
        lead: LeadDetail | null;
        parent: { name: string; relation: string; phone: string | null } | null;
        status: { icon: string; title: string; meta: string; done: boolean }[];
      }>("/api/portal/parent"),
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () =>
      jsonFetch<{
        kpis: { label: string; value: string; delta: string; up: boolean }[];
        funnel: { stage: string; count: number; conv: string; width: string }[];
        roi: { src: string; leads: string; enr: string; conv: string; cost: string; fill: string }[];
        comms: { ch: string; icon: string; sent: string; rate: string; fill: string }[];
        counsellors: { id: string; name: string; initials: string; leads: number; converted: string; onTime: string }[];
      }>("/api/analytics"),
  });
}

export function useErp() {
  return useQuery({ queryKey: ["erp"], queryFn: () => jsonFetch<ErpData>("/api/erp") });
}

export function useHandoff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { leadId: number }) =>
      jsonFetch(`/api/erp`, { method: "POST", body: JSON.stringify(v) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["erp"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// ── Types ──────────────────────────────────────────────
export interface LeadRow {
  id: number;
  name: string;
  city: string | null;
  program: string | null;
  faculty: string | null;
  stage: string;
  score: number;
  sla: string;
  lastTouchAt: string;
  owner: { id: string; name: string; initials: string } | null;
  source: { name: string; icon: string } | null;
  campaign: { name: string } | null;
}

export interface LeadDetail extends LeadRow {
  email: string | null;
  phone: string | null;
  category: string | null;
  aggregate: string | null;
  language: string | null;
  hostelRequested: boolean;
  medium: string | null;
  firstTouchAt: string;
  scoreFactors: { id: number; label: string; points: number; outOf: number }[];
  parents: { id: number; name: string; relation: string; phone: string | null; consent: boolean; portalLinked: boolean }[];
  events: { id: number; icon: string; title: string; detail: string | null; occurredAt: string }[];
  tasks: { id: number; text: string; dueLabel: string | null; done: boolean }[];
  documents: { id: number; name: string; status: string }[];
  handoff: { id: number; status: string; erpStudentId: string | null; attempts: number; lastError: string | null }[];
  payments: {
    id: number;
    purpose: string;
    amount: number;
    currency: string;
    status: string;
    shortUrl: string | null;
    description: string | null;
    createdAt: string;
    paidAt: string | null;
  }[];
}

export interface DashboardData {
  kpis: { label: string; value: string; delta: string; icon: string }[];
  funnel: { stage: string; count: number; conv: string; width: string }[];
  sources: { name: string; icon: string; count: number; pct: string }[];
  counsellors: { id: string; name: string; initials: string; leads: number; converted: string; onTime: string }[];
  recentHandoffs: { id: number; studentName: string; program: string; status: string; erpStudentId: string | null }[];
}

export interface OpsData {
  buat: { label: string; value: string; icon: string }[];
  merit: { rank: string; leadId: number | null; program: string; buatScore: string | null; aggregate: string | null; status: string }[];
  slots: { id: number; slotTime: string; program: string; ranks: string; booked: number; capacity: number }[];
  verify: { id: number; name: string; status: string; lead: { name: string } | null }[];
}

export interface AdminData {
  audit: { id: number; actorLabel: string; action: string; occurredAt: string }[];
  users: { id: string; name: string; email: string; role: string; initials: string; title: string | null }[];
}

export interface ErpData {
  queue: { id: number; studentName: string; program: string; status: string; erpStudentId: string | null; attempts: number; lastError: string | null; updatedAt: string }[];
  stats: { total: number; synced: number; queued: number; review: number; successRate: string };
}
