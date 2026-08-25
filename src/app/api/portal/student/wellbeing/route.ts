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

export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }
    const lead = await findMyLead(session.user.name ?? "");
    if (!lead) return Response.json({ lead: null });

    const rows = await db
      .select()
      .from(schema.wellbeingCheckins)
      .where(
        sql`${schema.wellbeingCheckins.leadId} = ${lead.id} AND ${schema.wellbeingCheckins.occurredAt} > now() - interval '30 days'`
      )
      .orderBy(desc(schema.wellbeingCheckins.occurredAt));

    // Today's checkin (based on UTC day of occurredAt matching today).
    const todayIso = new Date().toISOString().slice(0, 10);
    const todaysCheckin = rows.find(
      (r) => new Date(r.occurredAt).toISOString().slice(0, 10) === todayIso
    );

    // Trend: last 30 days as daily average.
    const dailyMap = new Map<string, { total: number; count: number }>();
    for (const r of rows) {
      const key = new Date(r.occurredAt).toISOString().slice(0, 10);
      const cur = dailyMap.get(key) ?? { total: 0, count: 0 };
      cur.total += r.moodScore;
      cur.count += 1;
      dailyMap.set(key, cur);
    }
    const trend = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      const bucket = dailyMap.get(key);
      return {
        date: key,
        avg: bucket ? bucket.total / bucket.count : null,
      };
    });

    // Rolling 7-day average for the "how you're doing" summary.
    const last7 = rows.filter(
      (r) => new Date(r.occurredAt).getTime() > Date.now() - 7 * 86400_000
    );
    const avg7 = last7.length ? last7.reduce((a, r) => a + r.moodScore, 0) / last7.length : null;

    // Streak: consecutive days with a check-in ending today or yesterday.
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (dailyMap.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return Response.json({
      todaysCheckin: todaysCheckin ?? null,
      recent: rows.slice(0, 10).map((r) => ({
        id: r.id,
        moodScore: r.moodScore,
        note: r.note,
        occurredAt: r.occurredAt,
      })),
      trend,
      summary: {
        avg7,
        streak,
        totalEntries: rows.length,
      },
    });
  } catch (err) {
    return toResponse(err);
  }
}

const bodySchema = z.object({
  moodScore: z.number().int().min(1).max(5),
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

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    // Upsert today's check-in — one per calendar day per student.
    const todayIso = new Date().toISOString().slice(0, 10);
    const [existing] = await db
      .select()
      .from(schema.wellbeingCheckins)
      .where(
        sql`${schema.wellbeingCheckins.leadId} = ${lead.id} AND to_char(${schema.wellbeingCheckins.occurredAt}, 'YYYY-MM-DD') = ${todayIso}`
      )
      .limit(1);

    if (existing) {
      await db
        .update(schema.wellbeingCheckins)
        .set({ moodScore: parsed.data.moodScore, note: parsed.data.note ?? null })
        .where(eq(schema.wellbeingCheckins.id, existing.id));
      return Response.json({ ok: true, updated: true });
    }

    await db.insert(schema.wellbeingCheckins).values({
      leadId: lead.id,
      moodScore: parsed.data.moodScore,
      note: parsed.data.note ?? null,
    });
    return Response.json({ ok: true, updated: false }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
