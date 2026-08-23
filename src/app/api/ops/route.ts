import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { asc, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();

    const [totals] = await db
      .select({
        registered: sql<number>`count(*) filter (where ${schema.leads.stage} in ('BUAT','Merit List','Counselling','Verification','Enrolled'))::int`,
        appeared: sql<number>`count(*) filter (where ${schema.leads.stage} in ('Merit List','Counselling','Verification','Enrolled'))::int`,
      })
      .from(schema.leads);

    const buat = [
      { label: "Registered", value: totals.registered.toLocaleString(), icon: "user-check" },
      { label: "Admit cards issued", value: totals.registered.toLocaleString(), icon: "ticket" },
      { label: "Appeared", value: totals.appeared.toLocaleString(), icon: "pen-line" },
      { label: "Scores imported", value: totals.appeared.toLocaleString(), icon: "download" },
    ];

    const merit = await db
      .select()
      .from(schema.meritList)
      .orderBy(asc(schema.meritList.rank))
      .limit(20);

    const slots = await db
      .select()
      .from(schema.counsellingSlots)
      .orderBy(asc(schema.counsellingSlots.slotTime));

    const verify = await db.query.documents.findMany({
      where: sql`${schema.documents.status} in ('Pending','Query raised','Not uploaded')`,
      with: { lead: { columns: { name: true } } },
      orderBy: desc(schema.documents.id),
      limit: 20,
    });

    return Response.json({ buat, merit, slots, verify });
  } catch (err) {
    return toResponse(err);
  }
}
