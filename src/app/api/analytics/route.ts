import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const STAGES = ["Enquiry", "Nurturing", "Application", "BUAT", "Merit List", "Counselling", "Verification", "Enrolled"] as const;

export async function GET() {
  try {
    await requireSession();

    // ── Stage counts (for funnel + KPIs) ──
    const stageRows = await db
      .select({ stage: schema.leads.stage, count: sql<number>`count(*)::int` })
      .from(schema.leads)
      .groupBy(schema.leads.stage);
    const byStage = Object.fromEntries(stageRows.map((r) => [r.stage, r.count]));
    const total = Object.values(byStage).reduce<number>((a, b) => a + b, 0);
    const enrolled = byStage["Enrolled"] ?? 0;
    const conversion = total > 0 ? ((enrolled / total) * 100).toFixed(1) : "0.0";

    const funnel = STAGES.map((stage) => {
      const count = byStage[stage] ?? 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { stage, count, conv: `${pct}%`, width: `${pct}%` };
    });

    // ── KPIs ──
    const kpis = [
      { label: "Enquiry → Enrolment", value: `${conversion}%`, delta: "live", up: true },
      { label: "Total leads", value: total.toLocaleString(), delta: "cycle", up: true },
      { label: "Enrolled", value: enrolled.toLocaleString(), delta: "confirmed", up: true },
      { label: "In pipeline", value: (total - enrolled).toLocaleString(), delta: "active", up: true },
    ];

    // ── Source ROI ──
    const sourceRows = await db
      .select({
        src: schema.sources.name,
        leads: sql<number>`count(${schema.leads.id})::int`,
        enr: sql<number>`count(*) filter (where ${schema.leads.stage} = 'Enrolled')::int`,
      })
      .from(schema.sources)
      .leftJoin(schema.leads, sql`${schema.leads.sourceId} = ${schema.sources.id}`)
      .groupBy(schema.sources.id, schema.sources.name)
      .orderBy(sql`count(${schema.leads.id}) desc`)
      .limit(10);

    const maxLeads = Math.max(1, ...sourceRows.map((r) => r.leads));
    const roi = sourceRows.map((r) => {
      const conv = r.leads > 0 ? ((r.enr / r.leads) * 100).toFixed(1) : "0.0";
      const width = `${Math.round((r.leads / maxLeads) * 100)}%`;
      // Illustrative cost model — real cost data would come from campaigns table.
      const costPerEnr = r.enr > 0 ? `₹${Math.round(2500 + (1 - r.enr / Math.max(r.leads, 1)) * 5000).toLocaleString()}` : "—";
      return { src: r.src, leads: r.leads.toLocaleString(), enr: r.enr.toLocaleString(), conv: `${conv}%`, cost: costPerEnr, fill: width };
    });

    // ── Communications summary (from communications table if populated) ──
    const commsRows = await db
      .select({
        channel: schema.communications.channel,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.communications)
      .groupBy(schema.communications.channel);

    const channelIcon: Record<string, string> = {
      whatsapp: "message-circle",
      email: "mail",
      sms: "smartphone",
      in_app: "bell",
      phone: "phone",
    };
    const channelLabel: Record<string, string> = {
      whatsapp: "WhatsApp",
      email: "Email",
      sms: "SMS (DLT)",
      in_app: "In-app",
      phone: "Phone",
    };
    const comms = commsRows.length
      ? commsRows.map((c) => ({
          ch: channelLabel[c.channel] ?? c.channel,
          icon: channelIcon[c.channel] ?? "message-square",
          sent: c.count.toLocaleString(),
          rate: "logged in system",
          fill: "60%",
        }))
      : [
          // No sends yet — return empty state.
        ];

    // ── Counsellor performance ──
    const counsellorRows = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        initials: schema.users.initials,
        leads: sql<number>`count(${schema.leads.id})::int`,
        converted: sql<number>`count(*) filter (where ${schema.leads.stage} = 'Enrolled')::int`,
      })
      .from(schema.users)
      .leftJoin(schema.leads, sql`${schema.leads.ownerId} = ${schema.users.id}`)
      .where(sql`${schema.users.role} in ('counsellor','admissions_head')`)
      .groupBy(schema.users.id, schema.users.name, schema.users.initials);

    const counsellors = counsellorRows.map((c) => ({
      ...c,
      converted: String(c.converted),
      onTime: "—",
    }));

    return Response.json({ kpis, funnel, roi, comms, counsellors });
  } catch (err) {
    return toResponse(err);
  }
}
