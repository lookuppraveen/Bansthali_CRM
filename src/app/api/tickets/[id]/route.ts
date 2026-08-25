import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function canReadTicket(userId: string, userRole: string, userName: string, ticketLeadId: number) {
  const staff = ["counsellor", "admissions_head", "super_admin", "front_office"];
  if (staff.includes(userRole)) return true;
  if (userRole === "student") {
    const [lead] = await db
      .select({ name: schema.leads.name })
      .from(schema.leads)
      .where(eq(schema.leads.id, ticketLeadId))
      .limit(1);
    return lead?.name === userName;
  }
  return false;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    const ticket = await db.query.supportTickets.findFirst({
      where: eq(schema.supportTickets.id, id),
      with: {
        lead: { columns: { id: true, name: true, program: true } },
        assignedTo: { columns: { id: true, name: true, initials: true, role: true } },
        createdBy: { columns: { id: true, name: true, role: true } },
        messages: {
          orderBy: asc(schema.supportTicketMessages.createdAt),
          with: { sender: { columns: { id: true, name: true, role: true, initials: true } } },
        },
      },
    });
    if (!ticket) return Response.json({ error: "Not found" }, { status: 404 });

    const ok = await canReadTicket(session.user.id, session.user.role, session.user.name ?? "", ticket.leadId);
    if (!ok) return Response.json({ error: "Forbidden" }, { status: 403 });

    return Response.json({ ticket });
  } catch (err) {
    return toResponse(err);
  }
}

const patchSchema = z.object({
  status: z.enum(schema.ticketStatusEnum.enumValues).optional(),
  priority: z.enum(schema.ticketPriorityEnum.enumValues).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const staff = ["counsellor", "admissions_head", "super_admin", "front_office"] as const;
    if (!(staff as readonly string[]).includes(session.user.role)) {
      return Response.json({ error: "Staff only" }, { status: 403 });
    }
    const id = Number(params.id);
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const set: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.status === "resolved" || parsed.data.status === "closed") {
      set.resolvedAt = new Date();
    }

    const [row] = await db
      .update(schema.supportTickets)
      .set(set)
      .where(eq(schema.supportTickets.id, id))
      .returning();
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    await writeAudit(`Ticket #${id} updated`, "ticket", id, parsed.data);
    return Response.json({ ticket: row });
  } catch (err) {
    return toResponse(err);
  }
}
