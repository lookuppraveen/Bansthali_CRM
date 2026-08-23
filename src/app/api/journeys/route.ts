import { db, schema } from "@/db/client";
import { requireRole, requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const rows = await db.query.journeys.findMany({
      with: { template: { columns: { id: true, name: true, channel: true } } },
      orderBy: desc(schema.journeys.updatedAt),
    });

    // Attach a run-count summary per journey.
    const summaries = await db
      .select({
        journeyId: schema.journeyRuns.journeyId,
        total: sql<number>`count(*)::int`,
        sent: sql<number>`count(*) filter (where ${schema.journeyRuns.status} = 'sent')::int`,
        failed: sql<number>`count(*) filter (where ${schema.journeyRuns.status} = 'failed')::int`,
        skipped: sql<number>`count(*) filter (where ${schema.journeyRuns.status} = 'skipped')::int`,
      })
      .from(schema.journeyRuns)
      .groupBy(schema.journeyRuns.journeyId);
    const byJourney = new Map(summaries.map((s) => [s.journeyId, s]));

    return Response.json({
      journeys: rows.map((r) => ({
        ...r,
        stats: byJourney.get(r.id) ?? { total: 0, sent: 0, failed: 0, skipped: 0 },
      })),
    });
  } catch (err) {
    return toResponse(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(160),
  trigger: z.enum(schema.journeyTriggerEnum.enumValues),
  triggerStage: z.enum(schema.stageEnum.enumValues).nullable().optional(),
  delayHours: z.number().int().min(0).max(720).default(24),
  channel: z.enum(schema.commChannelEnum.enumValues),
  templateId: z.number().int(),
  active: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    await requireRole("super_admin", "admissions_head");
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    if (
      (parsed.data.trigger === "stage_entered" || parsed.data.trigger === "stage_stalled") &&
      !parsed.data.triggerStage
    ) {
      return Response.json({ error: "triggerStage required for this trigger" }, { status: 400 });
    }

    const [row] = await db
      .insert(schema.journeys)
      .values({
        name: parsed.data.name,
        trigger: parsed.data.trigger,
        triggerStage: parsed.data.triggerStage ?? null,
        delayHours: parsed.data.delayHours,
        channel: parsed.data.channel,
        templateId: parsed.data.templateId,
        active: parsed.data.active,
      })
      .returning();

    await writeAudit(`Created journey: ${row.name}`, "journey", row.id);
    return Response.json({ journey: row }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
