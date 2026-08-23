import type { CommsAdapter, OutboundMessage, SendResult } from "./types";

/**
 * WhatsApp adapter — Gupshup v1 REST API (sandbox + production use the same
 * endpoint, only credentials differ). Env vars:
 *
 *   GUPSHUP_API_KEY       – "sk_..." from Gupshup console
 *   GUPSHUP_APP_NAME      – app name as registered in Gupshup
 *   GUPSHUP_SOURCE_NUMBER – E.164 without "+" (e.g. 917834811114 for sandbox)
 *
 * Sandbox note: the destination number MUST have opted in from their WhatsApp
 * by messaging the sandbox number first, otherwise Gupshup returns "not
 * subscribed" and the send fails.
 */

const API_URL = "https://api.gupshup.io/wa/api/v1/msg";

function normalisePhone(raw: string): string {
  // Gupshup wants E.164 without the leading "+" — e.g. "919812345678".
  const digits = raw.replace(/\D+/g, "");
  if (digits.length === 10) return `91${digits}`; // assume India default
  return digits;
}

export class WhatsAppAdapter implements CommsAdapter {
  async send(msg: OutboundMessage): Promise<SendResult> {
    const apiKey = process.env.GUPSHUP_API_KEY;
    const appName = process.env.GUPSHUP_APP_NAME;
    const source = process.env.GUPSHUP_SOURCE_NUMBER;

    if (!apiKey || !appName || !source) {
      return {
        ok: false,
        status: "failed",
        error: "Gupshup env vars not set (GUPSHUP_API_KEY / GUPSHUP_APP_NAME / GUPSHUP_SOURCE_NUMBER)",
      };
    }

    const destination = normalisePhone(msg.recipient);
    const payload = new URLSearchParams({
      channel: "whatsapp",
      source,
      destination,
      "src.name": appName,
      message: JSON.stringify({ type: "text", text: msg.body }),
    });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          apikey: apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      const raw = await res.text();
      let data: { status?: string; messageId?: string; message?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }

      if (!res.ok || data.status !== "submitted") {
        return {
          ok: false,
          status: "failed",
          error: data.message ?? `Gupshup ${res.status}`,
        };
      }

      return {
        ok: true,
        status: "sent",
        providerMessageId: data.messageId,
      };
    } catch (err) {
      return { ok: false, status: "failed", error: (err as Error).message };
    }
  }
}
