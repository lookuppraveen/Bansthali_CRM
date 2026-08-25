import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [ticket] = await db
      .select()
      .from(schema.supportTickets)
      .where(eq(schema.supportTickets.id, id))
      .limit(1);
    if (!ticket) return Response.json({ error: "Not found" }, { status: 404 });

    // Access check — student only on own ticket; staff always.
    if (session.user.role === "student") {
      const [lead] = await db
        .select({ name: schema.leads.name })
        .from(schema.leads)
        .where(eq(schema.leads.id, ticket.leadId))
        .limit(1);
      if (!lead || lead.name !== session.user.name) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [message] = await db
      .insert(schema.supportTicketMessages)
      .values({
        ticketId: id,
        senderId: session.user.id,
        senderRole: session.user.role,
        body: parsed.data.body,
      })
      .returning();

    // Auto-status transitions on reply.
    let nextStatus = ticket.status;
    if (session.user.role === "student" && ticket.status === "waiting_on_student") {
      nextStatus = "in_progress";
    } else if (session.user.role !== "student" && ticket.status === "open") {
      nextStatus = "in_progress";
    }
    await db
      .update(schema.supportTickets)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(schema.supportTickets.id, id));

    return Response.json({ message }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
