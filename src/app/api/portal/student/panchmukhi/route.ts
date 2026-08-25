import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { desc, eq, sql } from "drizzle-orm";
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

const WEEKLY_TARGET_MIN = 60; // per dimension per week

export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }
    const lead = await findMyLead(session.user.name ?? "");
    if (!lead) return Response.json({ lead: null });

    // Weekly sum per dimension (rolling 7 days).
    const weekly = await db
      .select({
        dimension: schema.panchmukhiLogs.dimension,
        minutes: sql<number>`coalesce(sum(${schema.panchmukhiLogs.minutes}), 0)::int`,
        entries: sql<number>`count(*)::int`,
      })
      .from(schema.panchmukhiLogs)
      .where(
        sql`${schema.panchmukhiLogs.leadId} = ${lead.id} AND ${schema.panchmukhiLogs.occurredAt} > now() - interval '7 days'`
      )
      .groupBy(schema.panchmukhiLogs.dimension);

    // All-time count for badges.
    const allTime = await db
      .select({
        dimension: schema.panchmukhiLogs.dimension,
        minutes: sql<number>`coalesce(sum(${schema.panchmukhiLogs.minutes}), 0)::int`,
      })
      .from(schema.panchmukhiLogs)
      .where(eq(schema.panchmukhiLogs.leadId, lead.id))
      .groupBy(schema.panchmukhiLogs.dimension);

    const weeklyMap = new Map(weekly.map((r) => [r.dimension, r.minutes]));
    const allTimeMap = new Map(allTime.map((r) => [r.dimension, r.minutes]));

    const dimensions = schema.panchmukhiDimensionEnum.enumValues.map((d) => ({
      key: d,
      weekMinutes: weeklyMap.get(d) ?? 0,
      allTimeMinutes: allTimeMap.get(d) ?? 0,
      target: WEEKLY_TARGET_MIN,
      pct: Math.min(100, Math.round(((weeklyMap.get(d) ?? 0) / WEEKLY_TARGET_MIN) * 100)),
    }));

    const totalWeek = dimensions.reduce((a, d) => a + d.weekMinutes, 0);
    const balanceScore =
      dimensions.length > 0
        ? Math.round(
            (dimensions.filter((d) => d.weekMinutes > 0).length / dimensions.length) * 100
          )
        : 0;

    const recent = await db
      .select()
      .from(schema.panchmukhiLogs)
      .where(eq(schema.panchmukhiLogs.leadId, lead.id))
      .orderBy(desc(schema.panchmukhiLogs.occurredAt))
      .limit(10);

    return Response.json({ dimensions, recent, totals: { totalWeek, balanceScore, target: WEEKLY_TARGET_MIN } });
  } catch (err) {
    return toResponse(err);
  }
}

const logSchema = z.object({
  dimension: z.enum(schema.panchmukhiDimensionEnum.enumValues),
  activity: z.string().min(1).max(200),
  minutes: z.number().int().min(1).max(600),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }
    const lead = await findMyLead(session.user.name ?? "");
    if (!lead) return Response.json({ error: "No linked lead" }, { status: 404 });

    const parsed = logSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [row] = await db
      .insert(schema.panchmukhiLogs)
      .values({
        leadId: lead.id,
        dimension: parsed.data.dimension,
        activity: parsed.data.activity,
        minutes: parsed.data.minutes,
        note: parsed.data.note ?? null,
      })
      .returning();

    return Response.json({ log: row }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
