import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { createPaymentLink } from "@/lib/razorpay";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  amountRupees: z.number().int().min(1).max(1000000),
  purpose: z.enum(schema.paymentPurposeEnum.enumValues).default("admission_fee"),
  description: z.string().max(240).optional(),
});

const PURPOSE_LABEL: Record<(typeof schema.paymentPurposeEnum.enumValues)[number], string> = {
  application_fee: "Application fee",
  admission_fee: "Admission fee",
  semester_fee: "Semester fee",
  hostel_deposit: "Hostel deposit",
  other: "Payment",
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const leadId = Number(params.id);
    if (!Number.isFinite(leadId)) return Response.json({ error: "Bad id" }, { status: 400 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).limit(1);
    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

    const description =
      parsed.data.description ??
      `${PURPOSE_LABEL[parsed.data.purpose]} · ${lead.program ?? "Banasthali Vidyapith"}`;

    const link = await createPaymentLink({
      amountPaise: parsed.data.amountRupees * 100,
      description,
      reference: `lead-${leadId}-${Date.now()}`,
      customerName: lead.name,
      customerEmail: lead.email ?? undefined,
      customerPhone: lead.phone ?? undefined,
    });

    const [row] = await db
      .insert(schema.payments)
      .values({
        leadId,
        purpose: parsed.data.purpose,
        amount: parsed.data.amountRupees * 100,
        currency: "INR",
        status: "created",
        providerLinkId: link.id,
        shortUrl: link.short_url,
        description,
        createdById: session.user.id,
      })
      .returning();

    // Timeline event so the counsellor's action is visible.
    await db.insert(schema.leadEvents).values({
      leadId,
      icon: "indian-rupee",
      title: `Payment link created — ${PURPOSE_LABEL[parsed.data.purpose]} ₹${parsed.data.amountRupees.toLocaleString()}`,
      detail: link.short_url,
      actorId: session.user.id,
    });

    await db.update(schema.leads).set({ lastTouchAt: new Date() }).where(eq(schema.leads.id, leadId));

    await writeAudit(
      `Created payment link ₹${parsed.data.amountRupees.toLocaleString()} for ${lead.name}`,
      "payment",
      row.id
    );

    return Response.json({ payment: row, shortUrl: link.short_url }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
