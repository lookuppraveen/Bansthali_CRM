import { db, schema } from "@/db/client";
import { requireRole, requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { asc } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const rows = await db.query.pipelines.findMany({
      with: {
        stages: { orderBy: asc(schema.pipelineStages.orderIndex) },
      },
      orderBy: asc(schema.pipelines.name),
    });
    return Response.json({ pipelines: rows });
  } catch (err) {
    return toResponse(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  programmeFilter: z.string().max(120).nullable().optional(),
  stages: z
    .array(
      z.object({
        stage: z.enum(schema.stageEnum.enumValues),
        slaHours: z.number().int().min(0).max(720).default(24),
        visible: z.boolean().default(true),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    await requireRole("super_admin", "admissions_head");
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [pipeline] = await db
      .insert(schema.pipelines)
      .values({
        name: parsed.data.name,
        programmeFilter: parsed.data.programmeFilter ?? null,
      })
      .returning();

    await db.insert(schema.pipelineStages).values(
      parsed.data.stages.map((s, i) => ({
        pipelineId: pipeline.id,
        stage: s.stage,
        orderIndex: i,
        slaHours: s.slaHours,
        visible: s.visible,
      }))
    );

    await writeAudit(`Created pipeline: ${pipeline.name}`, "pipeline", pipeline.id);
    return Response.json({ pipeline }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
