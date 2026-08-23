import { db, schema } from "@/db/client";
import { requireRole, toResponse, writeAudit } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  active: z.boolean().optional(),
  trigger: z.enum(schema.journeyTriggerEnum.enumValues).optional(),
  triggerStage: z.enum(schema.stageEnum.enumValues).nullable().optional(),
  delayHours: z.number().int().min(0).max(720).optional(),
  channel: z.enum(schema.commChannelEnum.enumValues).optional(),
  templateId: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("super_admin", "admissions_head");
    const id = Number(params.id);
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [row] = await db
      .update(schema.journeys)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.journeys.id, id))
      .returning();
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    await writeAudit(`Edited journey: ${row.name}`, "journey", id);
    return Response.json({ journey: row });
  } catch (err) {
    return toResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("super_admin");
    const id = Number(params.id);
    const [row] = await db
      .delete(schema.journeys)
      .where(eq(schema.journeys.id, id))
      .returning({ id: schema.journeys.id, name: schema.journeys.name });
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    await writeAudit(`Deleted journey: ${row.name}`, "journey", id);
    return Response.json({ ok: true });
  } catch (err) {
    return toResponse(err);
  }
}
