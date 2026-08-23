import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { sendComm } from "@/lib/comms/router";
import { mergeTemplate } from "@/lib/comms/types";
import { inArray, eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const baseSchema = z.object({
  ids: z.array(z.number().int()).min(1).max(200),
});

const assignSchema = baseSchema.extend({
  action: z.literal("assign"),
  ownerId: z.string().uuid(),
});

const advanceSchema = baseSchema.extend({
  action: z.literal("advance"),
  stage: z.enum(schema.stageEnum.enumValues),
});

const sendSchema = baseSchema.extend({
  action: z.literal("send"),
  channel: z.enum(schema.commChannelEnum.enumValues),
  templateId: z.number().int().optional(),
  subject: z.string().max(240).optional(),
  body: z.string().min(1),
});

const bodySchema = z.discriminatedUnion("action", [assignSchema, advanceSchema, sendSchema]);

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const { ids } = parsed.data;

    if (parsed.data.action === "assign") {
      const [owner] = await db
        .select({ name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, parsed.data.ownerId))
        .limit(1);
      if (!owner) return Response.json({ error: "Owner not found" }, { status: 400 });

      await db
        .update(schema.leads)
        .set({ ownerId: parsed.data.ownerId, lastTouchAt: new Date() })
        .where(inArray(schema.leads.id, ids));

      await db.insert(schema.leadEvents).values(
        ids.map((leadId) => ({
          leadId,
          icon: "user-plus",
          title: `Reassigned to ${owner.name}`,
          detail: "via bulk action",
          actorId: session.user.id,
        }))
      );

      await writeAudit(`Bulk reassigned ${ids.length} leads to ${owner.name}`, "lead");
      return Response.json({ ok: true, count: ids.length });
    }

    if (parsed.data.action === "advance") {
      const stage = parsed.data.stage;
      await db
        .update(schema.leads)
        .set({ stage, lastTouchAt: new Date() })
        .where(inArray(schema.leads.id, ids));

      await db.insert(schema.leadEvents).values(
        ids.map((leadId) => ({
          leadId,
          icon: "chevron-right",
          title: `Stage advanced to ${stage}`,
          detail: "via bulk action",
          actorId: session.user.id,
        }))
      );

      await writeAudit(`Bulk advanced ${ids.length} leads to ${stage}`, "lead");
      return Response.json({ ok: true, count: ids.length });
    }

    // action === "send"
    const leads = await db.select().from(schema.leads).where(inArray(schema.leads.id, ids));
    let sent = 0;
    let failed = 0;
    for (const lead of leads) {
      const recipient =
        parsed.data.channel === "email" ? lead.email ?? "" : lead.phone ?? "";
      if (!recipient) {
        failed++;
        continue;
      }
      const mergedBody = mergeTemplate(parsed.data.body, {
        name: lead.name,
        program: lead.program,
        faculty: lead.faculty,
        city: lead.city,
      });
      const mergedSubject = parsed.data.subject
        ? mergeTemplate(parsed.data.subject, { name: lead.name, program: lead.program })
        : undefined;

      const result = await sendComm({
        channel: parsed.data.channel,
        recipient,
        subject: mergedSubject,
        body: mergedBody,
        templateId: parsed.data.templateId,
        leadId: lead.id,
        senderId: session.user.id,
      });

      const iconByChannel: Record<string, string> = {
        email: "mail",
        whatsapp: "message-circle",
        sms: "smartphone",
        in_app: "bell",
        phone: "phone",
      };
      await db.insert(schema.leadEvents).values({
        leadId: lead.id,
        icon: iconByChannel[parsed.data.channel] ?? "send",
        title: result.ok
          ? `${parsed.data.channel.toUpperCase()} sent (bulk) — ${mergedSubject ?? mergedBody.slice(0, 60)}`
          : `${parsed.data.channel.toUpperCase()} failed (bulk) — ${result.error ?? "unknown"}`,
        detail: `To ${recipient}`,
        channel: parsed.data.channel,
        actorId: session.user.id,
      });

      if (result.ok) sent++;
      else failed++;
    }

    await db
      .update(schema.leads)
      .set({ lastTouchAt: new Date() })
      .where(inArray(schema.leads.id, ids));

    await writeAudit(
      `Bulk ${parsed.data.channel} send · ${sent} sent · ${failed} failed`,
      "communication"
    );
    return Response.json({ ok: true, sent, failed });
  } catch (err) {
    return toResponse(err);
  }
}
