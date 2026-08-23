import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { fetchPaymentLink } from "@/lib/razorpay";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, (typeof schema.paymentStatusEnum.enumValues)[number]> = {
  created: "created",
  issued: "pending",
  partially_paid: "pending",
  paid: "paid",
  expired: "expired",
  cancelled: "cancelled",
};

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    const [row] = await db.select().from(schema.payments).where(eq(schema.payments.id, id)).limit(1);
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    if (!row.providerLinkId) return Response.json({ error: "No provider link" }, { status: 400 });

    const link = await fetchPaymentLink(row.providerLinkId);
    const mapped = STATUS_MAP[link.status] ?? row.status;

    if (mapped !== row.status) {
      await db
        .update(schema.payments)
        .set({
          status: mapped,
          paidAt: mapped === "paid" ? new Date() : row.paidAt,
        })
        .where(eq(schema.payments.id, id));

      if (mapped === "paid" && row.leadId) {
        await db.insert(schema.leadEvents).values({
          leadId: row.leadId,
          icon: "check-circle-2",
          title: `Payment received — ₹${(row.amount / 100).toLocaleString()}`,
          detail: row.description ?? "",
        });
        await writeAudit(`Payment ₹${row.amount / 100} confirmed`, "payment", id);
      }
    }

    return Response.json({ status: mapped, providerStatus: link.status });
  } catch (err) {
    return toResponse(err);
  }
}
