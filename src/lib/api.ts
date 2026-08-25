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

export interface JourneyRow {
  id: number;
  name: string;
  active: boolean;
  trigger: string;
  triggerStage: string | null;
  delayHours: number;
  channel: string;
  templateId: number | null;
  template: { id: number; name: string; channel: string } | null;
  stats: { total: number; sent: number; failed: number; skipped: number };
}

export function useJourneys() {
  return useQuery({
    queryKey: ["journeys"],
    queryFn: () => jsonFetch<{ journeys: JourneyRow[] }>("/api/journeys"),
  });
}

export function useCreateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      name: string;
      trigger: "enquiry_created" | "stage_entered" | "stage_stalled";
      triggerStage?: string | null;
      delayHours: number;
      channel: "email" | "whatsapp" | "sms";
      templateId: number;
      active?: boolean;
    }) => jsonFetch(`/api/journeys`, { method: "POST", body: JSON.stringify(v) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journeys"] }),
  });
}

export function useUpdateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: number;
      name?: string;
      active?: boolean;
      trigger?: "enquiry_created" | "stage_entered" | "stage_stalled";
      triggerStage?: string | null;
      delayHours?: number;
      channel?: "email" | "whatsapp" | "sms";
      templateId?: number;
    }) => {
      const { id, ...rest } = v;
      return jsonFetch(`/api/journeys/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journeys"] }),
  });
}

export function useDeleteJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number }) => jsonFetch(`/api/journeys/${v.id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journeys"] }),
  });
}

export function useRunJourneys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      jsonFetch<{
        totals: { candidates: number; sent: number; failed: number; skipped: number };
      }>(`/api/journeys/0/run`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journeys"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export type NotificationKind =
  | "sla"
  | "task"
  | "assignment"
  | "doc_pending"
  | "doc_rejected"
  | "payment_received"
  | "ticket_reply"
  | "ticket_open";

export interface NotificationsData {
  items: {
    kind: NotificationKind;
    severity: "high" | "med" | "low";
    leadId: number | null;
    title: string;
    detail: string;
    occurredAt: string;
  }[];
  counts: { total: number; high: number; sla: number; tasks: number };
}

export function useNotifications(limit = 30) {
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: () => jsonFetch<NotificationsData>(`/api/notifications?limit=${limit}`),
    refetchInterval: 60_000, // poll every 60s
  });
}

export interface KbDoc {
  id: number;
  title: string;
  sourcePath: string;
  language: string;
  category: string;
  updatedAt: string;
  editable: boolean;
  chunkCount: number;
}

export function useKbDocs() {
  return useQuery({
    queryKey: ["kb"],
    queryFn: () => jsonFetch<{ documents: KbDoc[] }>("/api/kb"),
  });
}

export function useKbDoc(id: number | null) {
  return useQuery({
    queryKey: ["kb", id],
    enabled: id != null,
    queryFn: () =>
      jsonFetch<{
        document: {
          id: number;
          title: string;
          sourcePath: string;
          language: string;
          category: string;
          rawSource: string | null;
        };
      }>(`/api/kb/${id}`),
  });
}

export function useCreateKbDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { title: string; language?: string; category?: string; body: string }) =>
      jsonFetch<{ id: number; chunksInserted: number }>(`/api/kb`, {
        method: "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}

export function useUpdateKbDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; title?: string; language?: string; category?: string; body?: string }) => {
      const { id, ...rest } = v;
      return jsonFetch(`/api/kb/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["kb"] });
      qc.invalidateQueries({ queryKey: ["kb", v.id] });
    },
  });
}

export function useDeleteKbDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number }) => jsonFetch(`/api/kb/${v.id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}

export interface PipelineRow {
  id: number;
  name: string;
  programmeFilter: string | null;
  active: boolean;
  stages: {
    id: number;
    stage: string;
    orderIndex: number;
    slaHours: number;
    visible: boolean;
  }[];
}

export function usePipelines() {
  return useQuery({
    queryKey: ["pipelines"],
    queryFn: () => jsonFetch<{ pipelines: PipelineRow[] }>("/api/pipelines"),
  });
}

export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      name: string;
      programmeFilter?: string | null;
      stages: { stage: string; slaHours: number; visible: boolean }[];
    }) => jsonFetch(`/api/pipelines`, { method: "POST", body: JSON.stringify(v) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipelines"] }),
  });
}

export function useUpdatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: number;
      name?: string;
      programmeFilter?: string | null;
      active?: boolean;
      stages?: { stage: string; slaHours: number; visible: boolean }[];
    }) => {
      const { id, ...rest } = v;
      return jsonFetch(`/api/pipelines/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipelines"] }),
  });
}

export function useDeletePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number }) => jsonFetch(`/api/pipelines/${v.id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipelines"] }),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () =>
      jsonFetch<{
        users: {
          id: string;
          email: string;
          name: string;
          role: string;
          initials: string;
          title: string | null;
          active: boolean;
        }[];
      }>("/api/users"),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      email: string;
      name: string;
      role: string;
      initials: string;
      title?: string;
      password: string;
    }) => jsonFetch(`/api/users`, { method: "POST", body: JSON.stringify(v) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: string;
      name?: string;
      role?: string;
      initials?: string;
      title?: string | null;
      active?: boolean;
      password?: string;
    }) => {
      const { id, ...rest } = v;
      return jsonFetch(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string }) => jsonFetch(`/api/users/${v.id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; channel: string; subject?: string; body: string; language?: string; approved?: boolean }) =>
      jsonFetch(`/api/templates`, { method: "POST", body: JSON.stringify(v) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; name?: string; subject?: string | null; body?: string; language?: string; approved?: boolean }) => {
      const { id, ...rest } = v;
      return jsonFetch(`/api/templates/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number }) => jsonFetch(`/api/templates/${v.id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
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

export function useBulkLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      v:
        | { action: "assign"; ids: number[]; ownerId: string }
        | { action: "advance"; ids: number[]; stage: string }
        | {
            action: "send";
            ids: number[];
            channel: "email" | "whatsapp" | "sms";
            templateId?: number;
            subject?: string;
            body: string;
          }
    ) =>
      jsonFetch<{ ok: true; count?: number; sent?: number; failed?: number }>(`/api/leads/bulk`, {
        method: "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: number;
      name?: string;
      email?: string | null;
      phone?: string | null;
      city?: string | null;
      program?: string | null;
      faculty?: string | null;
      category?: string | null;
      aggregate?: string | null;
      language?: string | null;
      hostelRequested?: boolean;
    }) => {
      const { id, ...rest } = v;
      return jsonFetch(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["lead", v.id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
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

export interface StudentDoc {
  id: number;
  name: string;
  status: string;
  required: boolean;
  uploadedAt: string | null;
  verifiedAt: string | null;
  note: string | null;
  hasFile: boolean;
  fileName: string | null;
  fileSize: number | null;
  fileMimeType: string | null;
}

export interface SurveyQuestion {
  prompt: string;
  kind: "rating" | "text";
  required?: boolean;
}
export interface SurveyAvailable {
  id: number;
  title: string;
  description: string | null;
  category: string;
  audience: string | null;
  questions: SurveyQuestion[];
}
export interface SurveyCompleted {
  id: number;
  title: string;
  category: string;
  submittedAt: string;
}

export function useSurveys() {
  return useQuery({
    queryKey: ["portal", "student", "surveys"],
    queryFn: () =>
      jsonFetch<{ available: SurveyAvailable[]; completed: SurveyCompleted[] }>(
        "/api/portal/student/surveys"
      ),
  });
}

export function useSubmitSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: number;
      answers: { rating?: number; text?: string }[];
    }) =>
      jsonFetch(`/api/portal/student/surveys/${v.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: v.answers }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "student", "surveys"] }),
  });
}

export interface WellbeingData {
  todaysCheckin: { id: number; moodScore: number; note: string | null; occurredAt: string } | null;
  recent: { id: number; moodScore: number; note: string | null; occurredAt: string }[];
  trend: { date: string; avg: number | null }[];
  summary: { avg7: number | null; streak: number; totalEntries: number };
}

export function useWellbeing() {
  return useQuery({
    queryKey: ["portal", "student", "wellbeing"],
    queryFn: () => jsonFetch<WellbeingData>("/api/portal/student/wellbeing"),
  });
}

export function useSaveCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { moodScore: number; note?: string }) =>
      jsonFetch(`/api/portal/student/wellbeing`, { method: "POST", body: JSON.stringify(v) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "student", "wellbeing"] }),
  });
}

export interface StudentEvent {
  id: number;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  audience: string | null;
  myRsvp: "going" | "interested" | "declined" | null;
  goingCount: number;
}

export function useStudentEvents() {
  return useQuery({
    queryKey: ["portal", "student", "events"],
    queryFn: () => jsonFetch<{ events: StudentEvent[] }>("/api/portal/student/events"),
  });
}

export function useEventRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { eventId: number; status: "going" | "interested" | "declined" }) =>
      jsonFetch(`/api/portal/student/events/${v.eventId}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ status: v.status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "student", "events"] }),
  });
}

export interface PanchmukhiData {
  dimensions: {
    key: "physical" | "practical" | "aesthetic" | "moral" | "intellectual";
    weekMinutes: number;
    allTimeMinutes: number;
    target: number;
    pct: number;
  }[];
  recent: {
    id: number;
    dimension: string;
    activity: string;
    minutes: number;
    note: string | null;
    occurredAt: string;
  }[];
  totals: { totalWeek: number; balanceScore: number; target: number };
}

export function usePanchmukhi() {
  return useQuery({
    queryKey: ["portal", "student", "panchmukhi"],
    queryFn: () => jsonFetch<PanchmukhiData>("/api/portal/student/panchmukhi"),
  });
}

export function useLogPanchmukhi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { dimension: string; activity: string; minutes: number; note?: string }) =>
      jsonFetch(`/api/portal/student/panchmukhi`, {
        method: "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "student", "panchmukhi"] }),
  });
}

export interface StudentTicket {
  id: number;
  category: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string; initials: string; role: string } | null;
}

export interface TicketDetail extends StudentTicket {
  description: string;
  lead: { id: number; name: string; program: string | null };
  createdBy: { id: string; name: string; role: string } | null;
  messages: {
    id: number;
    body: string;
    createdAt: string;
    senderRole: string;
    sender: { id: string; name: string; role: string; initials: string } | null;
  }[];
}

export function useStudentTickets() {
  return useQuery({
    queryKey: ["portal", "student", "tickets"],
    queryFn: () => jsonFetch<{ tickets: StudentTicket[] }>("/api/portal/student/tickets"),
  });
}

export function useTicket(id: number | null) {
  return useQuery({
    queryKey: ["ticket", id],
    enabled: id != null,
    queryFn: () => jsonFetch<{ ticket: TicketDetail }>(`/api/tickets/${id}`),
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      category: "academic" | "hostel" | "mess" | "medical" | "fees" | "documents" | "other";
      subject: string;
      description: string;
      priority?: "low" | "normal" | "high" | "urgent";
    }) =>
      jsonFetch<{ ticket: { id: number } }>(`/api/portal/student/tickets`, {
        method: "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "student", "tickets"] }),
  });
}

export function useReplyTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { ticketId: number; body: string }) =>
      jsonFetch(`/api/tickets/${v.ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: v.body }),
      }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["ticket", v.ticketId] });
      qc.invalidateQueries({ queryKey: ["portal", "student", "tickets"] });
    },
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: number;
      status?: string;
      priority?: string;
      assignedToId?: string | null;
    }) => {
      const { id, ...rest } = v;
      return jsonFetch(`/api/tickets/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["ticket", v.id] });
      qc.invalidateQueries({ queryKey: ["portal", "student", "tickets"] });
    },
  });
}

export interface StudentPaymentsData {
  totals: { paidPaise: number; upcomingPaise: number; currency: string };
  upcoming: {
    key: string;
    purpose: string;
    label: string;
    amount: number;
    amountPaise: number;
    dueOn: string;
    alreadyRequested: boolean;
  }[];
  history: {
    id: number;
    purpose: string;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    shortUrl: string | null;
    createdAt: string;
    paidAt: string | null;
  }[];
}

export function useStudentPayments() {
  return useQuery({
    queryKey: ["portal", "student", "payments"],
    queryFn: () => jsonFetch<StudentPaymentsData>("/api/portal/student/payments"),
  });
}

export function useStudentCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { purpose: string; amountRupees: number; description?: string }) =>
      jsonFetch<{ payment: { id: number }; shortUrl: string }>(`/api/portal/student/payments`, {
        method: "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "student", "payments"] }),
  });
}

export function useStudentPortal() {
  return useQuery({
    queryKey: ["portal", "student"],
    queryFn: () =>
      jsonFetch<{
        lead:
          | (Omit<LeadDetail, "documents"> & {
              documents: StudentDoc[];
            })
          | null;
        checklist: { name: string; done: boolean }[];
      }>("/api/portal/student"),
  });
}

export function useUploadStudentDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { docId: number; file: File }) => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("File read failed"));
        r.readAsDataURL(v.file);
      });
      return jsonFetch(`/api/portal/student/documents/${v.docId}/upload`, {
        method: "POST",
        body: JSON.stringify({
          fileName: v.file.name,
          mimeType: v.file.type,
          size: v.file.size,
          dataUrl,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal", "student"] });
      qc.invalidateQueries({ queryKey: ["portal", "parent"] });
      qc.invalidateQueries({ queryKey: ["ops"] });
    },
  });
}

export function useReviewDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; status: string; note?: string | null }) =>
      jsonFetch(`/api/documents/${v.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: v.status, note: v.note ?? null }),
      }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["ops"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["portal", "student"] });
      qc.invalidateQueries({ queryKey: ["portal", "parent"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      void v;
    },
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
  verify: {
    id: number;
    name: string;
    status: string;
    hasFile: boolean;
    fileName: string | null;
    fileSize: number | null;
    note: string | null;
    lead: { name: string } | null;
  }[];
}

export interface AdminData {
  audit: { id: number; actorLabel: string; action: string; occurredAt: string }[];
  users: { id: string; name: string; email: string; role: string; initials: string; title: string | null }[];
}

export interface ErpData {
  queue: { id: number; studentName: string; program: string; status: string; erpStudentId: string | null; attempts: number; lastError: string | null; updatedAt: string }[];
  stats: { total: number; synced: number; queued: number; review: number; successRate: string };
}
