import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { asc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function findMyLead(name: string) {
  const [lead] = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.name, name))
    .limit(1);
  return lead;
}

/**
 * Seed a small always-visible set of demo events if none exist. Keeps the
 * portal from looking empty on a fresh DB. Idempotent per event title +
 * calendar week.
 */
async function ensureDemoEvents() {
  const [{ n }] = (await db.execute(
    sql`select count(*)::int as n from ${schema.events} where ${schema.events.startsAt} > now() - interval '1 day'`
  )) as unknown as { rows: { n: number }[] } as unknown as [{ n: number }];
  if (n > 0) return;

  const now = new Date();
  const day = (d: number, h: number, m: number = 0) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    dt.setHours(h, m, 0, 0);
    return dt;
  };

  await db.insert(schema.events).values([
    {
      title: "Orientation Week — Panchmukhi induction",
      description: "Try each of the five dimensions in one afternoon: yoga, music, community service, prayer meeting, arts.",
      category: "orientation",
      location: "Sharda Peeth Auditorium",
      startsAt: day(2, 15, 0),
      endsAt: day(2, 18, 0),
      capacity: 300,
      audience: "First year",
    },
    {
      title: "Faculty of Technology — Welcome Meet",
      description: "Meet your programme head, get your course outline, book library card.",
      category: "academic",
      location: "Tech Block 2 · Room 101",
      startsAt: day(3, 10, 30),
      endsAt: day(3, 12, 0),
      capacity: 120,
      audience: "B.Tech",
    },
    {
      title: "Horse-riding trial session",
      description: "Optional trial for interested students. Bring closed-toe shoes.",
      category: "sports",
      location: "Campus Stables",
      startsAt: day(4, 6, 0),
      endsAt: day(4, 7, 30),
      capacity: 40,
      audience: "All",
    },
    {
      title: "Vasant Panchami cultural evening",
      description: "Music, dance and poetry — student and faculty performances.",
      category: "cultural",
      location: "Cultural Hall",
      startsAt: day(6, 18, 30),
      endsAt: day(6, 21, 0),
      capacity: 500,
      audience: "All",
    },
    {
      title: "Bhawan meeting — Chandra Bhawan",
      description: "Warden briefing on hostel rules and support systems.",
      category: "hostel",
      location: "Chandra Bhawan Common Room",
      startsAt: day(1, 20, 0),
      endsAt: day(1, 21, 0),
      audience: "Chandra Bhawan residents",
    },
  ]);
}

export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }
    const lead = await findMyLead(session.user.name ?? "");
    if (!lead) return Response.json({ events: [] });

    await ensureDemoEvents();

    const evts = await db
      .select()
      .from(schema.events)
      .where(sql`${schema.events.startsAt} > now() - interval '2 days'`)
      .orderBy(asc(schema.events.startsAt))
      .limit(50);

    const rsvps = await db
      .select()
      .from(schema.eventRsvps)
      .where(eq(schema.eventRsvps.leadId, lead.id));
    const rsvpByEvent = new Map(rsvps.map((r) => [r.eventId, r.status]));

    // Aggregate going-count per event.
    const goingCounts = await db
      .select({
        eventId: schema.eventRsvps.eventId,
        going: sql<number>`count(*) filter (where ${schema.eventRsvps.status} = 'going')::int`,
      })
      .from(schema.eventRsvps)
      .groupBy(schema.eventRsvps.eventId);
    const goingByEvent = new Map(goingCounts.map((r) => [r.eventId, r.going]));

    return Response.json({
      events: evts.map((e) => ({
        ...e,
        myRsvp: rsvpByEvent.get(e.id) ?? null,
        goingCount: goingByEvent.get(e.id) ?? 0,
      })),
    });
  } catch (err) {
    return toResponse(err);
  }
}
