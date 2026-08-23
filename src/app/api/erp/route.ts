import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { handoffLead } from "@/lib/erp-adapter";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();

    const queue = await db
      .select()
      .from(schema.erpHandoffs)
      .orderBy(desc(schema.erpHandoffs.updatedAt))
      .limit(50);

    // aggregate stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        synced: sql<number>`count(*) filter (where ${schema.erpHandoffs.status} = 'synced')::int`,
        queued: sql<number>`count(*) filter (where ${schema.erpHandoffs.status} = 'queued')::int`,
        review: sql<number>`count(*) filter (where ${schema.erpHandoffs.status} = 'review')::int`,
      })
      .from(schema.erpHandoffs);

    const successRate = stats.total > 0 ? ((stats.synced / stats.total) * 100).toFixed(1) : "0.0";

    return Response.json({ queue, stats: { ...stats, successRate: `${successRate}%` } });
  } catch (err) {
    return toResponse(err);
  }
}

const postSchema = z.object({ leadId: z.number().int() });

export async function POST(req: Request) {
  try {
    await requireSession();
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const result = await handoffLead(parsed.data.leadId);

    if (result.status === "synced") {
      await db.update(schema.leads).set({ stage: "Enrolled" }).where(eq(schema.leads.id, parsed.data.leadId));
    }

    await writeAudit(
      `ERP handoff ${result.status}${result.studentId ? ` (${result.studentId})` : ""}`,
      "erp_handoff",
      result.handoffId
    );

    return Response.json(result);
  } catch (err) {
    return toResponse(err);
  }
}
