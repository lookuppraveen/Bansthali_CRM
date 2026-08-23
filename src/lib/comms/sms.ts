import type { CommsAdapter, OutboundMessage, SendResult } from "./types";

/**
 * SMS adapter — MSG91 v5 REST API. Two modes:
 *
 * 1. Simple text send via /api/v5/campaign/api/create (works in test mode
 *    without DLT). Env vars needed:
 *
 *      MSG91_AUTH_KEY  – authentication key from MSG91 console
 *      MSG91_SENDER_ID – 6-char DLT-registered sender id (e.g. "BANSTL")
 *
 * 2. Production flows use pre-registered DLT templates via /api/v5/flow. For
 *    that mode set MSG91_FLOW_ID and pass template variables in the message
 *    body as JSON — kept out of scope for the sandbox demo.
 */

const API_URL = "https://control.msg91.com/api/v5/campaign/api/create";

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D+/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export class SmsAdapter implements CommsAdapter {
  async send(msg: OutboundMessage): Promise<SendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID;

    if (!authKey || !senderId) {
      return {
        ok: false,
        status: "failed",
        error: "MSG91 env vars not set (MSG91_AUTH_KEY / MSG91_SENDER_ID)",
      };
    }

    const destination = normalisePhone(msg.recipient);
    const payload = {
      sender: senderId,
      route: "4", // transactional
      country: "91",
      sms: [{ message: msg.body, to: [destination] }],
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          authkey: authKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        type?: string;
        message?: string;
        request_id?: string;
      };

      if (!res.ok || data.type === "error") {
        return {
          ok: false,
          status: "failed",
          error: data.message ?? `MSG91 ${res.status}`,
        };
      }

      return {
        ok: true,
        status: "sent",
        providerMessageId: data.request_id,
      };
    } catch (err) {
      return { ok: false, status: "failed", error: (err as Error).message };
    }
  }
}
