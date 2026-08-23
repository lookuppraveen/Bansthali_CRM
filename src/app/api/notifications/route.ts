import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { computeSlaMany } from "@/lib/sla";
import { and, desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Build a per-user notification feed on the fly. Cheap query — this is on the
 * critical path for every page navigation via the topbar poll.
 *
 * Sources:
 *  - Your open leads with sla = 'Breached' or 'Due today'
 *  - Your pending tasks with dueLabel = 'Today ...' or overdue text
 *  - Recently reassigned leads pointing at you (last 24h from lead_events)
 */
export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    // Compute SLA live from lastTouchAt, then filter — the stored column
    // may lag behind pipeline-config changes.
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
    const breached = withSla
      .filter((l) => l.sla === "Breached" || l.sla === "Due today")
      .slice(0, 20);

    const tasks = await db
      .select({
        id: schema.tasks.id,
        text: schema.tasks.text,
        dueLabel: schema.tasks.dueLabel,
        done: schema.tasks.done,
        leadId: schema.tasks.leadId,
      })
      .from(schema.tasks)
      .where(and(eq(schema.tasks.ownerId, userId), eq(schema.tasks.done, false)))
      .limit(20);

    const recentAssignments = await db
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
      .limit(5);

    const items = [
      ...breached.map((l) => ({
        kind: "sla" as const,
        severity: (l.sla === "Breached" ? "high" : "med") as "high" | "med",
        leadId: l.id,
        title: `${l.name} — SLA ${l.sla}`,
        detail: l.program ?? "",
      })),
      ...tasks.map((t) => ({
        kind: "task" as const,
        severity: /overdue|breach/i.test(t.dueLabel ?? "") ? ("high" as const) : ("med" as const),
        leadId: t.leadId,
        title: t.text,
        detail: t.dueLabel ?? "no due date",
      })),
      ...recentAssignments.map((r) => ({
        kind: "assignment" as const,
        severity: "low" as const,
        leadId: r.leadId,
        title: r.title,
        detail: new Date(r.occurredAt).toLocaleString(undefined, {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    ];

    return Response.json({
      items,
      counts: {
        total: items.length,
        high: items.filter((i) => i.severity === "high").length,
        sla: breached.length,
        tasks: tasks.length,
      },
    });
  } catch (err) {
    return toResponse(err);
  }
}
