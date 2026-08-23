import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    const lead = await db.query.leads.findFirst({
      where: eq(schema.leads.id, id),
      with: {
        owner: { columns: { id: true, name: true, initials: true } },
        source: true,
        campaign: true,
        scoreFactors: true,
        parents: true,
        events: { orderBy: desc(schema.leadEvents.occurredAt), limit: 50 },
        tasks: { orderBy: asc(schema.tasks.dueAt) },
        documents: true,
        handoff: true,
        payments: { orderBy: desc(schema.payments.createdAt) },
      },
    });
    if (!lead) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json({ lead });
  } catch (err) {
    return toResponse(err);
  }
}

const patchSchema = z.object({
  stage: z.enum(schema.stageEnum.enumValues).optional(),
  score: z.number().int().min(0).max(100).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  sla: z.enum(schema.slaEnum.enumValues).optional(),
  name: z.string().min(1).max(160).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(32).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  program: z.string().max(160).nullable().optional(),
  faculty: z.string().max(160).nullable().optional(),
  category: z.string().max(40).nullable().optional(),
  aggregate: z.string().max(20).nullable().optional(),
  language: z.string().max(60).nullable().optional(),
  hostelRequested: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const id = Number(params.id);
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [existing] = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).limit(1);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    const [updated] = await db
      .update(schema.leads)
      .set({ ...parsed.data, lastTouchAt: new Date() })
      .where(eq(schema.leads.id, id))
      .returning();

    if (parsed.data.stage && parsed.data.stage !== existing.stage) {
      await db.insert(schema.leadEvents).values({
        leadId: id,
        icon: "chevron-right",
        title: `Stage advanced to ${parsed.data.stage}`,
        detail: `From ${existing.stage}`,
      });
      await writeAudit(`Advanced ${existing.name} to ${parsed.data.stage}`, "lead", id);
    }

    return Response.json({ lead: updated });
  } catch (err) {
    return toResponse(err);
  }
}
