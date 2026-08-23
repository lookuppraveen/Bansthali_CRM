import { db, schema } from "@/db/client";
import { requireRole, toResponse, writeAudit } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  programmeFilter: z.string().max(120).nullable().optional(),
  active: z.boolean().optional(),
  stages: z
    .array(
      z.object({
        stage: z.enum(schema.stageEnum.enumValues),
        slaHours: z.number().int().min(0).max(720),
        visible: z.boolean(),
      })
    )
    .optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("super_admin", "admissions_head");
    const id = Number(params.id);
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const { stages, ...pipelineFields } = parsed.data;
    if (Object.keys(pipelineFields).length) {
      await db.update(schema.pipelines).set(pipelineFields).where(eq(schema.pipelines.id, id));
    }

    if (stages) {
      // Replace all stages atomically-ish (cascade delete + re-insert).
      await db.delete(schema.pipelineStages).where(eq(schema.pipelineStages.pipelineId, id));
      await db.insert(schema.pipelineStages).values(
        stages.map((s, i) => ({
          pipelineId: id,
          stage: s.stage,
          orderIndex: i,
          slaHours: s.slaHours,
          visible: s.visible,
        }))
      );
    }

    await writeAudit(`Edited pipeline #${id}`, "pipeline", id);
    return Response.json({ ok: true });
  } catch (err) {
    return toResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("super_admin");
    const id = Number(params.id);
    const [row] = await db.delete(schema.pipelines).where(eq(schema.pipelines.id, id)).returning();
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    await writeAudit(`Deleted pipeline: ${row.name}`, "pipeline", id);
    return Response.json({ ok: true });
  } catch (err) {
    return toResponse(err);
  }
}
