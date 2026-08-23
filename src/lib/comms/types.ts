/**
 * Shared shape for every outbound comms adapter (Email, WhatsApp, SMS, in-app).
 *
 * Callers should always go through sendComm() in ./router.ts — never call an
 * adapter directly. The router picks the right one based on the channel enum
 * on the message.
 */

export type CommChannel = "email" | "whatsapp" | "sms" | "in_app" | "phone";

export interface OutboundMessage {
  channel: CommChannel;
  recipient: string; // email address, or E.164 phone, or user id
  subject?: string; // ignored for sms/whatsapp
  body: string;
  templateId?: number;
  leadId?: number;
  senderId?: string; // user id sending on behalf of
}

export interface SendResult {
  ok: boolean;
  providerMessageId?: string;
  status: string; // "sent" | "queued" | "failed"
  error?: string;
}

export interface CommsAdapter {
  send(msg: OutboundMessage): Promise<SendResult>;
}

// ── Template merge helpers ─────────────────────────────
/**
 * Very small `{{field}}` merge — no logic, no filters. Missing keys
 * are left as `[field]` so the reader can see what didn't merge.
 */
export function mergeTemplate(body: string, vars: Record<string, string | number | null | undefined>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_full, key: string) => {
    const v = vars[key];
    return v == null || v === "" ? `[${key}]` : String(v);
  });
}
