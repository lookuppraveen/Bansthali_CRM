import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const STAGES = ["Enquiry", "Nurturing", "Application", "BUAT", "Merit List", "Counselling", "Verification", "Enrolled"] as const;

export async function GET() {
  try {
    await requireSession();

    const stageRows = await db
      .select({
        stage: schema.leads.stage,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.leads)
      .groupBy(schema.leads.stage);

    const countByStage = Object.fromEntries(stageRows.map((r) => [r.stage, r.count]));
    const total = Object.values(countByStage).reduce<number>((a, b) => a + b, 0);
    const funnel = STAGES.map((stage) => {
      const count = countByStage[stage] ?? 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { stage, count, conv: `${pct}%`, width: `${pct}%` };
    });

    const enrolled = countByStage["Enrolled"] ?? 0;
    const applications = STAGES.slice(2).reduce<number>((a, s) => a + (countByStage[s] ?? 0), 0);
    const buatReg = STAGES.slice(3).reduce<number>((a, s) => a + (countByStage[s] ?? 0), 0);

    const kpis = [
      { label: "Total enquiries", value: total.toLocaleString(), delta: "live", icon: "inbox" },
      { label: "Applications", value: applications.toLocaleString(), delta: "live", icon: "file-text" },
      { label: "BUAT registered", value: buatReg.toLocaleString(), delta: `${total > 0 ? Math.round((buatReg / total) * 100) : 0}% of leads`, icon: "pen-line" },
      { label: "Enrolled", value: enrolled.toLocaleString(), delta: "live", icon: "graduation-cap" },
    ];

    const sourceRows = await db
      .select({
        name: schema.sources.name,
        icon: schema.sources.icon,
        count: sql<number>`count(${schema.leads.id})::int`,
      })
      .from(schema.sources)
      .leftJoin(schema.leads, sql`${schema.leads.sourceId} = ${schema.sources.id}`)
      .groupBy(schema.sources.id, schema.sources.name, schema.sources.icon)
      .orderBy(sql`count(${schema.leads.id}) desc`)
      .limit(8);

    const totalSource = sourceRows.reduce((a, r) => a + r.count, 0);
    const sources = sourceRows.map((r) => ({
      ...r,
      pct: totalSource > 0 ? `${Math.round((r.count / totalSource) * 100)}%` : "0%",
    }));

    const counsellorRows = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        initials: schema.users.initials,
        leadsCount: sql<number>`count(${schema.leads.id})::int`,
        converted: sql<number>`count(*) filter (where ${schema.leads.stage} = 'Enrolled')::int`,
      })
      .from(schema.users)
      .leftJoin(schema.leads, sql`${schema.leads.ownerId} = ${schema.users.id}`)
      .where(sql`${schema.users.role} = 'counsellor' or ${schema.users.role} = 'admissions_head'`)
      .groupBy(schema.users.id, schema.users.name, schema.users.initials);

    const counsellors = counsellorRows.map((c) => ({
      ...c,
      leads: c.leadsCount,
      converted: String(c.converted),
      onTime: "—",
    }));

    const recentHandoffs = await db.query.erpHandoffs.findMany({
      orderBy: desc(schema.erpHandoffs.updatedAt),
      limit: 3,
    });

    return Response.json({ kpis, funnel, sources, counsellors, recentHandoffs });
  } catch (err) {
    return toResponse(err);
  }
}
