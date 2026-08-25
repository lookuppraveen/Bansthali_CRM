import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function findMyLead(name: string) {
  const [lead] = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.name, name))
    .limit(1);
  return lead;
}

export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }
    const lead = await findMyLead(session.user.name ?? "");
    if (!lead) return Response.json({ tickets: [] });

    const rows = await db.query.supportTickets.findMany({
      where: eq(schema.supportTickets.leadId, lead.id),
      with: {
        assignedTo: { columns: { id: true, name: true, initials: true, role: true } },
      },
      orderBy: desc(schema.supportTickets.updatedAt),
    });

    return Response.json({ tickets: rows });
  } catch (err) {
    return toResponse(err);
  }
}

const createSchema = z.object({
  category: z.enum(schema.ticketCategoryEnum.enumValues),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  priority: z.enum(schema.ticketPriorityEnum.enumValues).default("normal"),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }
    const lead = await findMyLead(session.user.name ?? "");
    if (!lead) return Response.json({ error: "No linked lead" }, { status: 404 });

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    // Auto-route based on category. Fall back to the lead's owner (counsellor).
    let assignedToId: string | null = lead.ownerId;
    // If the category is "documents" or "fees", also fall back to counsellor.

    const [ticket] = await db
      .insert(schema.supportTickets)
      .values({
        leadId: lead.id,
        category: parsed.data.category,
        subject: parsed.data.subject,
        description: parsed.data.description,
        priority: parsed.data.priority,
        status: "open",
        assignedToId,
        createdById: session.user.id,
      })
      .returning();

    // First message is the description itself.
    await db.insert(schema.supportTicketMessages).values({
      ticketId: ticket.id,
      senderId: session.user.id,
      senderRole: session.user.role,
      body: parsed.data.description,
    });

    // Timeline event on the lead so counsellor sees it in Lead 360°.
    await db.insert(schema.leadEvents).values({
      leadId: lead.id,
      icon: "life-buoy",
      title: `Ticket raised: ${parsed.data.subject}`,
      detail: `Category: ${parsed.data.category} · Priority: ${parsed.data.priority}`,
      actorId: session.user.id,
    });

    await writeAudit(`Ticket #${ticket.id} raised — ${parsed.data.subject}`, "ticket", ticket.id);
    return Response.json({ ticket }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
