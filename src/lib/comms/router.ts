import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { EmailAdapter } from "./email";
import { WhatsAppAdapter } from "./whatsapp";
import { SmsAdapter } from "./sms";
import type { CommsAdapter, OutboundMessage, SendResult } from "./types";

// Register adapters here. Callers should always use sendComm(); never
// import an adapter directly. Adding WhatsApp/SMS later = one line each.
const adapters: Partial<Record<OutboundMessage["channel"], CommsAdapter>> = {
  email: new EmailAdapter(),
  whatsapp: new WhatsAppAdapter(),
  sms: new SmsAdapter(),
};

/**
 * Fan-out entry point. Persists an entry in `communications` before hitting
 * the provider so we always have a record, then updates the status once the
 * provider replies.
 */
export async function sendComm(msg: OutboundMessage): Promise<SendResult> {
  const [row] = await db
    .insert(schema.communications)
    .values({
      leadId: msg.leadId ?? null,
      templateId: msg.templateId ?? null,
      channel: msg.channel,
      senderId: msg.senderId ?? null,
      recipient: msg.recipient,
      subject: msg.subject ?? null,
      body: msg.body,
      status: "pending",
    })
    .returning();

  const adapter = adapters[msg.channel];
  if (!adapter) {
    const err = `No adapter registered for channel "${msg.channel}"`;
    await db
      .update(schema.communications)
      .set({ status: `failed: ${err}` })
      .where(eq(schema.communications.id, row.id));
    return { ok: false, status: "failed", error: err };
  }

  const result = await adapter.send(msg);

  const status = result.ok
    ? "sent"
    : result.status === "queued"
      ? "queued"
      : `failed: ${result.error ?? "unknown"}`;

  await db
    .update(schema.communications)
    .set({ status })
    .where((await import("drizzle-orm")).eq(schema.communications.id, row.id));

  return result;
}
