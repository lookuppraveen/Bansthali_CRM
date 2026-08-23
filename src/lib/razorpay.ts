/**
 * Razorpay wrapper — creates & fetches payment links, verifies webhooks.
 * Test-mode compatible: same code paths as live, only credentials differ.
 *
 * Env vars:
 *   RAZORPAY_KEY_ID       – e.g. rzp_test_ABC123
 *   RAZORPAY_KEY_SECRET   – secret from Razorpay dashboard
 *   RAZORPAY_WEBHOOK_SECRET – configured on the webhook endpoint in Razorpay
 */

import Razorpay from "razorpay";
import crypto from "node:crypto";

let client: Razorpay | null = null;
function getClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set");
  }
  if (!client) client = new Razorpay({ key_id, key_secret });
  return client;
}

export interface CreateLinkInput {
  amountPaise: number;
  currency?: string;
  description: string;
  reference: string; // our internal reference to store
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl?: string; // where Razorpay redirects after payment
}

export interface RzpLinkResponse {
  id: string; // plink_xxx
  short_url: string;
  status: string;
  amount: number;
  currency: string;
  reference_id?: string;
}

export async function createPaymentLink(input: CreateLinkInput): Promise<RzpLinkResponse> {
  const rp = getClient();
  // razorpay SDK typings for paymentLink are loose — cast responses.
  const link = (await (rp as unknown as {
    paymentLink: { create: (opts: object) => Promise<RzpLinkResponse> };
  }).paymentLink.create({
    amount: input.amountPaise,
    currency: input.currency ?? "INR",
    accept_partial: false,
    description: input.description,
    reference_id: input.reference,
    customer: {
      name: input.customerName,
      email: input.customerEmail,
      contact: input.customerPhone,
    },
    notify: { sms: false, email: false }, // we send comms ourselves
    reminder_enable: true,
    callback_url: input.callbackUrl,
    callback_method: input.callbackUrl ? "get" : undefined,
  })) as RzpLinkResponse;

  return link;
}

export async function fetchPaymentLink(linkId: string): Promise<RzpLinkResponse & { payments?: unknown[] }> {
  const rp = getClient();
  return (await (rp as unknown as {
    paymentLink: { fetch: (id: string) => Promise<RzpLinkResponse> };
  }).paymentLink.fetch(linkId)) as RzpLinkResponse & { payments?: unknown[] };
}

/** Verify the X-Razorpay-Signature header on a webhook body. */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  // constant-time compare
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
