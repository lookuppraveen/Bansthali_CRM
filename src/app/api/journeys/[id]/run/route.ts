import { requireRole, toResponse, writeAudit } from "@/lib/rbac";
import { evaluateJourneys } from "@/lib/journeys";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Manual "Run now" — evaluates all active journeys once. */
export async function POST() {
  try {
    await requireRole("super_admin", "admissions_head");
    const summaries = await evaluateJourneys();
    const totals = summaries.reduce(
      (acc, s) => ({
        candidates: acc.candidates + s.candidates,
        sent: acc.sent + s.sent,
        failed: acc.failed + s.failed,
        skipped: acc.skipped + s.skipped,
      }),
      { candidates: 0, sent: 0, failed: 0, skipped: 0 }
    );
    await writeAudit(
      `Manual journey run · ${totals.sent} sent · ${totals.failed} failed · ${totals.skipped} skipped`,
      "journey"
    );
    return Response.json({ summaries, totals });
  } catch (err) {
    return toResponse(err);
  }
}
