import { evaluateJourneys } from "@/lib/journeys";
import { writeAudit } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Vercel Cron pings this every 15 min (see vercel.json). Protected by
 * `CRON_SECRET` — Vercel automatically sends the `Authorization: Bearer <secret>`
 * header when cron.schedule is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (!secret) {
    // In dev, allow the call without a secret so you can hit it manually.
    if (process.env.NODE_ENV === "production") {
      return new Response("cron secret not configured", { status: 500 });
    }
  } else if (auth !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const started = Date.now();
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
    `Cron journey run · ${totals.sent} sent · ${totals.failed} failed · ${totals.skipped} skipped · ${Date.now() - started}ms`,
    "journey_cron"
  );

  return Response.json({ ok: true, took_ms: Date.now() - started, summaries, totals });
}
