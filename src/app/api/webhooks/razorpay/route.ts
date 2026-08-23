import { db, schema } from "@/db/client";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Razorpay POSTs on: payment_link.paid, payment_link.expired, payment_link.cancelled, etc.
export async function POST(req: Request) {
  const sig = req.headers.get("x-razorpay-signature");
  const raw = await req.text();

  if (!sig || !verifyWebhookSignature(raw, sig)) {
    return new Response("bad signature", { status: 400 });
  }

  let event: {
    event: string;
    payload: {
      payment_link?: { entity?: { id: string; status: string; amount: number } };
      payment?: { entity?: { id: string } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("bad body", { status: 400 });
  }

  const linkEntity = event.payload?.payment_link?.entity;
  if (!linkEntity) return new Response("ignored", { status: 200 });

  const [row] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.providerLinkId, linkEntity.id))
    .limit(1);
  if (!row) return new Response("no matching payment", { status: 200 });

  const statusByEvent: Record<string, (typeof schema.paymentStatusEnum.enumValues)[number]> = {
    "payment_link.paid": "paid",
    "payment_link.partially_paid": "pending",
    "payment_link.expired": "expired",
    "payment_link.cancelled": "cancelled",
  };
  const next = statusByEvent[event.event];
  if (!next) return new Response("ignored", { status: 200 });

  await db
    .update(schema.payments)
    .set({
      status: next,
      providerPaymentId: event.payload.payment?.entity?.id ?? row.providerPaymentId,
      paidAt: next === "paid" ? new Date() : row.paidAt,
    })
    .where(eq(schema.payments.id, row.id));

  if (next === "paid" && row.leadId) {
    await db.insert(schema.leadEvents).values({
      leadId: row.leadId,
      icon: "check-circle-2",
      title: `Payment received — ₹${(row.amount / 100).toLocaleString()}`,
      detail: `via Razorpay webhook · ${event.payload.payment?.entity?.id ?? ""}`,
    });
  }

  return new Response("ok", { status: 200 });
}
