import { Resend } from "resend";
import type { CommsAdapter, OutboundMessage, SendResult } from "./types";

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || "Banasthali Admissions <onboarding@resend.dev>";

// Lazy-init so build-time doesn't fail if key isn't present yet.
let client: Resend | null = null;
function getClient(): Resend {
  if (!RESEND_KEY) throw new Error("RESEND_API_KEY not set");
  if (!client) client = new Resend(RESEND_KEY);
  return client;
}

export class EmailAdapter implements CommsAdapter {
  async send(msg: OutboundMessage): Promise<SendResult> {
    try {
      const resend = getClient();
      const res = await resend.emails.send({
        from: FROM,
        to: msg.recipient,
        subject: msg.subject ?? "Message from Banasthali Vidyapith",
        text: msg.body,
      });
      if (res.error) {
        return { ok: false, status: "failed", error: res.error.message };
      }
      return { ok: true, status: "sent", providerMessageId: res.data?.id };
    } catch (err) {
      return { ok: false, status: "failed", error: (err as Error).message };
    }
  }
}
