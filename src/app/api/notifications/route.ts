import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { computeSlaMany } from "@/lib/sla";
import { and, desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Per-user notification feed. Categories differ by role:
 *
 * Staff (counsellor / admissions_head / super_admin / front_office):
 *   - Own leads with live SLA = Breached / Due today
 *   - Own open tasks
 *   - Recently reassigned-by-me events (last 24h)
 *   - Documents pending your verification (docs with status Pending)
 *   - Recent payments received across all leads (last 24h)
 *   - Open support tickets in your queue
 *
 * Student:
 *   - Documents that need re-upload (Rejected / Query raised)
 *   - Recent counsellor replies on your tickets (last 48h)
 *   - Payments received (auto-flip in status)
 *
 * Parent:
 *   - Recent status changes on linked student's admission
 */
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 200);

    type NotifItem = {
      kind:
        | "sla"
        | "task"
        | "assignment"
        | "doc_pending"
        | "doc_rejected"
        | "payment_received"
        | "ticket_reply"
        | "ticket_open";
      severity: "high" | "med" | "low";
      leadId: number | null;
      title: string;
      detail: string;
      occurredAt: string;
    };
    const items: NotifItem[] = [];

    const isStaff = ["counsellor", "admissions_head", "super_admin", "front_office"].includes(
      session.user.role
    );

    if (isStaff) {
      // Live-SLA breached for own leads
      const myLeadRows = await db
        .select({
          id: schema.leads.id,
          name: schema.leads.name,
          program: schema.leads.program,
          stage: schema.leads.stage,
          lastTouchAt: schema.leads.lastTouchAt,
        })
        .from(schema.leads)
        .where(eq(schema.leads.ownerId, userId))
        .limit(200);
      const withSla = await computeSlaMany(myLeadRows);
      for (const l of withSla.filter((l) => l.sla === "Breached" || l.sla === "Due today")) {
        items.push({
          kind: "sla",
          severity: l.sla === "Breached" ? "high" : "med",
          leadId: l.id,
          title: `${l.name} — SLA ${l.sla}`,
          detail: l.program ?? "",
          occurredAt:
            typeof l.lastTouchAt === "string"
              ? l.lastTouchAt
              : (l.lastTouchAt as Date).toISOString(),
        });
      }

      // Open tasks
      const tasks = await db
        .select({
          id: schema.tasks.id,
          text: schema.tasks.text,
          dueLabel: schema.tasks.dueLabel,
          leadId: schema.tasks.leadId,
          createdAt: schema.tasks.createdAt,
        })
        .from(schema.tasks)
        .where(and(eq(schema.tasks.ownerId, userId), eq(schema.tasks.done, false)))
        .orderBy(desc(schema.tasks.createdAt))
        .limit(30);
      for (const t of tasks) {
        items.push({
          kind: "task",
          severity: /overdue|breach/i.test(t.dueLabel ?? "") ? "high" : "med",
          leadId: t.leadId,
          title: t.text,
          detail: t.dueLabel ?? "no due date",
          occurredAt: t.createdAt.toISOString(),
        });
      }

      // Documents awaiting your review
      const pendingDocs = await db
        .select({
          id: schema.documents.id,
          leadId: schema.documents.leadId,
          name: schema.documents.name,
          uploadedAt: schema.documents.uploadedAt,
          leadName: schema.leads.name,
        })
        .from(schema.documents)
        .innerJoin(schema.leads, eq(schema.leads.id, schema.documents.leadId))
        .where(
          and(
            eq(schema.documents.status, "Pending"),
            sql`${schema.documents.fileData} is not null`
          )
        )
        .orderBy(desc(schema.documents.uploadedAt))
        .limit(30);
      for (const d of pendingDocs) {
        items.push({
          kind: "doc_pending",
          severity: "med",
          leadId: d.leadId,
          title: `Verify: ${d.name}`,
          detail: `From ${d.leadName}`,
          occurredAt: (d.uploadedAt ?? new Date()).toISOString(),
        });
      }

      // Recent payments received (last 24h, across all leads)
      const paidRows = await db
        .select({
          id: schema.payments.id,
          leadId: schema.payments.leadId,
          amount: schema.payments.amount,
          description: schema.payments.description,
          paidAt: schema.payments.paidAt,
        })
        .from(schema.payments)
        .where(
          and(
            eq(schema.payments.status, "paid"),
            sql`${schema.payments.paidAt} > now() - interval '24 hours'`
          )
        )
        .orderBy(desc(schema.payments.paidAt))
        .limit(20);
      for (const p of paidRows) {
        items.push({
          kind: "payment_received",
          severity: "low",
          leadId: p.leadId,
          title: `Payment received — ₹${(p.amount / 100).toLocaleString()}`,
          detail: p.description ?? "",
          occurredAt: (p.paidAt ?? new Date()).toISOString(),
        });
      }

      // Open tickets in your queue
      const openTickets = await db
        .select({
          id: schema.supportTickets.id,
          leadId: schema.supportTickets.leadId,
          subject: schema.supportTickets.subject,
          priority: schema.supportTickets.priority,
          updatedAt: schema.supportTickets.updatedAt,
          category: schema.supportTickets.category,
        })
        .from(schema.supportTickets)
        .where(
          and(
            eq(schema.supportTickets.assignedToId, userId),
            sql`${schema.supportTickets.status} in ('open','waiting_on_student')`
          )
        )
        .orderBy(desc(schema.supportTickets.updatedAt))
        .limit(30);
      for (const t of openTickets) {
        items.push({
          kind: "ticket_open",
          severity: t.priority === "urgent" || t.priority === "high" ? "high" : "med",
          leadId: t.leadId,
          title: `Ticket: ${t.subject}`,
          detail: `${t.category} · ${t.priority}`,
          occurredAt: t.updatedAt.toISOString(),
        });
      }

      // Recently reassigned by me
      const reassigns = await db
        .select({
          id: schema.leadEvents.id,
          leadId: schema.leadEvents.leadId,
          title: schema.leadEvents.title,
          occurredAt: schema.leadEvents.occurredAt,
        })
        .from(schema.leadEvents)
        .where(
          and(
            eq(schema.leadEvents.actorId, userId),
            sql`${schema.leadEvents.occurredAt} > now() - interval '24 hours'`,
            sql`${schema.leadEvents.title} ilike 'Reassigned%'`
          )
        )
        .orderBy(desc(schema.leadEvents.occurredAt))
        .limit(10);
      for (const r of reassigns) {
        items.push({
          kind: "assignment",
          severity: "low",
          leadId: r.leadId,
          title: r.title,
          detail: "",
          occurredAt: r.occurredAt.toISOString(),
        });
      }
    } else if (session.user.role === "student") {
      // Find my lead once.
      const [lead] = await db
        .select()
        .from(schema.leads)
        .where(eq(schema.leads.name, session.user.name ?? ""))
        .limit(1);

      if (lead) {
        // Rejected / query docs that need re-upload
        const badDocs = await db
          .select()
          .from(schema.documents)
          .where(
            and(
              eq(schema.documents.leadId, lead.id),
              sql`${schema.documents.status} in ('Rejected','Query raised')`
            )
          );
        for (const d of badDocs) {
          items.push({
            kind: "doc_rejected",
            severity: "high",
            leadId: lead.id,
            title: `Re-upload: ${d.name}`,
            detail: d.note ?? d.status,
            occurredAt: (d.uploadedAt ?? d.verifiedAt ?? new Date()).toISOString(),
          });
        }

        // Recent counsellor replies on my tickets
        const myTickets = await db
          .select({ id: schema.supportTickets.id })
          .from(schema.supportTickets)
          .where(eq(schema.supportTickets.leadId, lead.id));
        if (myTickets.length > 0) {
          const ids = myTickets.map((t) => t.id);
          const replies = await db.execute(
            sql`
              select m.id, m.body, m.sender_role, m.ticket_id, m.created_at, t.subject
              from ${schema.supportTicketMessages} m
              join ${schema.supportTickets} t on t.id = m.ticket_id
              where m.ticket_id = any(${ids})
                and m.sender_role != 'student'
                and m.created_at > now() - interval '48 hours'
              order by m.created_at desc
              limit 10
            `
          );
          const rows =
            (replies as unknown as {
              rows: {
                id: number;
                body: string;
                sender_role: string;
                ticket_id: number;
                created_at: string;
                subject: string;
              }[];
            }).rows ?? [];
          for (const r of rows) {
            items.push({
              kind: "ticket_reply",
              severity: "med",
              leadId: lead.id,
              title: `Reply on: ${r.subject}`,
              detail: r.body.slice(0, 100),
              occurredAt: r.created_at,
            });
          }
        }

        // Recent paid payments (last 7 days)
        const paidRows = await db
          .select()
          .from(schema.payments)
          .where(
            and(
              eq(schema.payments.leadId, lead.id),
              eq(schema.payments.status, "paid"),
              sql`${schema.payments.paidAt} > now() - interval '7 days'`
            )
          )
          .orderBy(desc(schema.payments.paidAt))
          .limit(10);
        for (const p of paidRows) {
          items.push({
            kind: "payment_received",
            severity: "low",
            leadId: lead.id,
            title: `Payment confirmed — ₹${(p.amount / 100).toLocaleString()}`,
            detail: p.description ?? "",
            occurredAt: (p.paidAt ?? new Date()).toISOString(),
          });
        }
      }
    }

    // Sort newest first, cap.
    items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
    const trimmed = items.slice(0, limit);

    return Response.json({
      items: trimmed,
      counts: {
        total: items.length,
        high: items.filter((i) => i.severity === "high").length,
        sla: items.filter((i) => i.kind === "sla").length,
        tasks: items.filter((i) => i.kind === "task").length,
      },
    });
  } catch (err) {
    return toResponse(err);
  }
}
