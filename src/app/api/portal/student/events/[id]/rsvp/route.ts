import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(schema.rsvpStatusEnum.enumValues),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }

    const eventId = Number(params.id);
    if (!Number.isFinite(eventId)) return Response.json({ error: "Bad id" }, { status: 400 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [lead] = await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.name, session.user.name ?? ""))
      .limit(1);
    if (!lead) return Response.json({ error: "No linked lead" }, { status: 404 });

    const [existing] = await db
      .select()
      .from(schema.eventRsvps)
      .where(and(eq(schema.eventRsvps.eventId, eventId), eq(schema.eventRsvps.leadId, lead.id)))
      .limit(1);

    if (existing) {
      await db
        .update(schema.eventRsvps)
        .set({ status: parsed.data.status, updatedAt: new Date() })
        .where(eq(schema.eventRsvps.id, existing.id));
    } else {
      await db.insert(schema.eventRsvps).values({
        eventId,
        leadId: lead.id,
        status: parsed.data.status,
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return toResponse(err);
  }
}
