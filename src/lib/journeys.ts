/**
 * Journey evaluator — invoked by the /api/cron/journeys endpoint.
 *
 * For each active journey, finds leads that satisfy the trigger + delay,
 * haven't already been run through that journey, and sends the templated
 * message through the comms router.
 */

import { db, schema } from "@/db/client";
import { and, eq, sql } from "drizzle-orm";
import { sendComm } from "@/lib/comms/router";
import { mergeTemplate } from "@/lib/comms/types";

export interface JourneyEvalSummary {
  journeyId: number;
  name: string;
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
}

export async function evaluateJourneys(): Promise<JourneyEvalSummary[]> {
  const active = await db.query.journeys.findMany({
    where: eq(schema.journeys.active, true),
    with: { template: true },
  });

  const summaries: JourneyEvalSummary[] = [];

  for (const j of active) {
    const summary: JourneyEvalSummary = {
      journeyId: j.id,
      name: j.name,
      candidates: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    };
    if (!j.template) {
      summaries.push(summary);
      continue;
    }

    // Candidate leads by trigger.
    let candidateSql;
    if (j.trigger === "enquiry_created") {
      // Leads created > delayHours ago, still in Enquiry stage.
      candidateSql = sql`
        select id, name, email, phone, program, faculty, city
        from ${schema.leads}
        where ${schema.leads.stage} = 'Enquiry'
          and ${schema.leads.createdAt} < now() - (${j.delayHours} || ' hours')::interval
      `;
    } else if (j.trigger === "stage_entered" && j.triggerStage) {
      // Leads currently in the trigger stage; lastTouchAt used as proxy for "when entered".
      candidateSql = sql`
        select id, name, email, phone, program, faculty, city
        from ${schema.leads}
        where ${schema.leads.stage} = ${j.triggerStage}
          and ${schema.leads.lastTouchAt} < now() - (${j.delayHours} || ' hours')::interval
      `;
    } else if (j.trigger === "stage_stalled" && j.triggerStage) {
      // Leads that have been in the trigger stage without any lastTouchAt update for > delayHours.
      candidateSql = sql`
        select id, name, email, phone, program, faculty, city
        from ${schema.leads}
        where ${schema.leads.stage} = ${j.triggerStage}
          and ${schema.leads.lastTouchAt} < now() - (${j.delayHours} || ' hours')::interval
      `;
    } else {
      summaries.push(summary);
      continue;
    }

    const candidates = (await db.execute(candidateSql)) as unknown as {
      rows: {
        id: number;
        name: string;
        email: string | null;
        phone: string | null;
        program: string | null;
        faculty: string | null;
        city: string | null;
      }[];
    };
    const rows = candidates.rows ?? (candidates as unknown as typeof candidates.rows);
    summary.candidates = rows.length;

    // Already-run set for this journey.
    const already = await db
      .select({ leadId: schema.journeyRuns.leadId })
      .from(schema.journeyRuns)
      .where(eq(schema.journeyRuns.journeyId, j.id));
    const alreadySet = new Set(already.map((r) => r.leadId));

    for (const lead of rows) {
      if (alreadySet.has(lead.id)) {
        continue;
      }

      const recipient =
        j.channel === "email" ? lead.email ?? "" : lead.phone ?? "";
      if (!recipient) {
        await db.insert(schema.journeyRuns).values({
          journeyId: j.id,
          leadId: lead.id,
          status: "skipped",
          error: `Missing ${j.channel === "email" ? "email" : "phone"}`,
        });
        summary.skipped++;
        continue;
      }

      const vars = {
        name: lead.name,
        program: lead.program,
        faculty: lead.faculty,
        city: lead.city,
      };
      const body = mergeTemplate(j.template.body, vars);
      const subject = j.template.subject ? mergeTemplate(j.template.subject, vars) : undefined;

      const result = await sendComm({
        channel: j.channel,
        recipient,
        subject,
        body,
        templateId: j.template.id,
        leadId: lead.id,
      });

      await db.insert(schema.journeyRuns).values({
        journeyId: j.id,
        leadId: lead.id,
        status: result.ok ? "sent" : "failed",
        providerMessageId: result.providerMessageId,
        error: result.ok ? null : result.error ?? "unknown",
      });
      await db.insert(schema.leadEvents).values({
        leadId: lead.id,
        icon: "workflow",
        title: `Journey "${j.name}" → ${result.ok ? "sent" : "failed"}`,
        detail: result.ok
          ? `${j.channel.toUpperCase()} sent automatically`
          : `${j.channel.toUpperCase()} failed: ${result.error}`,
        channel: j.channel,
      });

      if (result.ok) summary.sent++;
      else summary.failed++;
    }

    summaries.push(summary);
  }

  return summaries;
}
