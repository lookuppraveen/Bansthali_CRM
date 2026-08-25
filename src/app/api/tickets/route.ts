import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { and, desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Staff-facing ticket list. Filters:
 *   ?status=open|in_progress|waiting_on_student|resolved|closed
 *   ?assignedToMe=1
 *   ?category=hostel|academic|...
 */
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const staff = ["counsellor", "admissions_head", "super_admin", "front_office"] as const;
    if (!(staff as readonly string[]).includes(session.user.role)) {
      return Response.json({ error: "Staff access only" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const assignedToMe = url.searchParams.get("assignedToMe") === "1";

    const conds = [] as ReturnType<typeof eq>[];
    if (status)
      conds.push(
        eq(schema.supportTickets.status, status as (typeof schema.ticketStatusEnum.enumValues)[number])
      );
    if (category)
      conds.push(
        eq(
          schema.supportTickets.category,
          category as (typeof schema.ticketCategoryEnum.enumValues)[number]
        )
      );
    if (assignedToMe) conds.push(eq(schema.supportTickets.assignedToId, session.user.id));

    const rows = await db.query.supportTickets.findMany({
      where: conds.length ? and(...conds) : undefined,
      with: {
        lead: { columns: { id: true, name: true } },
        assignedTo: { columns: { id: true, name: true, initials: true } },
      },
      orderBy: desc(schema.supportTickets.updatedAt),
      limit: 200,
    });

    const [summary] = await db
      .select({
        open: sql<number>`count(*) filter (where ${schema.supportTickets.status} = 'open')::int`,
        in_progress: sql<number>`count(*) filter (where ${schema.supportTickets.status} = 'in_progress')::int`,
        waiting_on_student: sql<number>`count(*) filter (where ${schema.supportTickets.status} = 'waiting_on_student')::int`,
        resolved: sql<number>`count(*) filter (where ${schema.supportTickets.status} = 'resolved')::int`,
      })
      .from(schema.supportTickets);

    return Response.json({ tickets: rows, summary });
  } catch (err) {
    return toResponse(err);
  }
}
