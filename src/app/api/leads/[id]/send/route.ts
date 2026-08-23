import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { sendComm } from "@/lib/comms/router";
import { mergeTemplate } from "@/lib/comms/types";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  channel: z.enum(schema.commChannelEnum.enumValues),
  templateId: z.number().int().optional(),
  subject: z.string().max(240).optional(),
  body: z.string().min(1),
  recipientOverride: z.string().max(200).optional(),
});

/**
 * Send a communication from a lead's Lead 360°.
 * - If templateId is provided, uses the template body as the base
 *   (though the client should have already merged fields into `body`).
 * - Recipient: email/phone from the lead unless overridden.
 * - Logs an entry in leadEvents so the timeline reflects the send.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const leadId = Number(params.id);
    if (!Number.isFinite(leadId)) return Response.json({ error: "Bad id" }, { status: 400 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });
    const { channel, templateId, subject, body, recipientOverride } = parsed.data;

    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).limit(1);
    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

    // Pick recipient by channel.
    let recipient = recipientOverride?.trim() ?? "";
    if (!recipient) {
      if (channel === "email") recipient = lead.email ?? "";
      else recipient = lead.phone ?? "";
    }
    if (!recipient) {
      return Response.json(
        { error: `No ${channel === "email" ? "email address" : "phone number"} on file for this lead.` },
        { status: 400 }
      );
    }

    // Merge in a couple of standard fields defensively (in case client didn't).
    const mergedBody = mergeTemplate(body, {
      name: lead.name,
      program: lead.program,
      faculty: lead.faculty,
      city: lead.city,
    });
    const mergedSubject = subject
      ? mergeTemplate(subject, { name: lead.name, program: lead.program })
      : undefined;

    const result = await sendComm({
      channel,
      recipient,
      subject: mergedSubject,
      body: mergedBody,
      templateId,
      leadId,
      senderId: session.user.id,
    });

    // Timeline event so the send shows up on Lead 360°.
    const iconByChannel: Record<string, string> = {
      email: "mail",
      whatsapp: "message-circle",
      sms: "smartphone",
      in_app: "bell",
      phone: "phone",
    };
    await db.insert(schema.leadEvents).values({
      leadId,
      icon: iconByChannel[channel] ?? "send",
      title: result.ok
        ? `${channel.toUpperCase()} sent — ${mergedSubject ?? mergedBody.slice(0, 60)}`
        : `${channel.toUpperCase()} failed — ${result.error ?? "unknown"}`,
      detail: `To ${recipient}${result.providerMessageId ? ` · id ${result.providerMessageId}` : ""}`,
      channel,
      actorId: session.user.id,
    });

    await db.update(schema.leads).set({ lastTouchAt: new Date() }).where(eq(schema.leads.id, leadId));

    await writeAudit(
      `${result.ok ? "Sent" : "Failed"} ${channel} to ${lead.name}`,
      "communication",
      leadId,
      { recipient, ok: result.ok, error: result.error }
    );

    return Response.json(result, { status: result.ok ? 201 : 502 });
  } catch (err) {
    return toResponse(err);
  }
}
