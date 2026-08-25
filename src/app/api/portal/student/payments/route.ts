import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { createPaymentLink } from "@/lib/razorpay";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Illustrative fee schedule the student sees on the dashboard. In production
// this comes from the ERP; here it is derived so the demo shows a realistic
// pending fee alongside the actual `payments` history.
const UPCOMING = [
  {
    key: "semester_fee_sep",
    purpose: "semester_fee" as const,
    label: "Semester fee · Autumn 2026",
    amount: 68400,
    dueOn: "2026-09-05",
  },
  {
    key: "hostel_deposit_sep",
    purpose: "hostel_deposit" as const,
    label: "Hostel deposit · refundable",
    amount: 15000,
    dueOn: "2026-09-05",
  },
];

async function findMyLead(name: string) {
  const [lead] = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.name, name))
    .limit(1);
  return lead;
}

export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }

    const lead = await findMyLead(session.user.name ?? "");
    if (!lead) return Response.json({ lead: null });

    const history = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.leadId, lead.id))
      .orderBy(desc(schema.payments.createdAt));

    // Compute simple totals for the student's summary tiles.
    const totalPaid = history
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalDueUpcoming = UPCOMING.reduce((sum, u) => sum + u.amount * 100, 0);

    // Mark which UPCOMING items already have a matching created/pending link
    // (avoid duplicate link creation on the client).
    const pendingByPurpose = new Set(
      history
        .filter((p) => p.status === "created" || p.status === "pending")
        .map((p) => p.purpose)
    );
    const upcoming = UPCOMING.map((u) => ({
      ...u,
      amountPaise: u.amount * 100,
      alreadyRequested: pendingByPurpose.has(u.purpose),
    }));

    return Response.json({
      totals: {
        paidPaise: totalPaid,
        upcomingPaise: totalDueUpcoming,
        currency: "INR",
      },
      upcoming,
      history: history.map((p) => ({
        id: p.id,
        purpose: p.purpose,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        description: p.description,
        shortUrl: p.shortUrl,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
      })),
    });
  } catch (err) {
    return toResponse(err);
  }
}

const createSchema = z.object({
  purpose: z.enum(schema.paymentPurposeEnum.enumValues),
  amountRupees: z.number().int().min(1).max(1000000),
  description: z.string().max(240).optional(),
});

const PURPOSE_LABEL: Record<(typeof schema.paymentPurposeEnum.enumValues)[number], string> = {
  application_fee: "Application fee",
  admission_fee: "Admission fee",
  semester_fee: "Semester fee",
  hostel_deposit: "Hostel deposit",
  other: "Payment",
};

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }
    const lead = await findMyLead(session.user.name ?? "");
    if (!lead) return Response.json({ error: "No linked lead" }, { status: 404 });

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const description =
      parsed.data.description ??
      `${PURPOSE_LABEL[parsed.data.purpose]} · ${lead.program ?? "Banasthali Vidyapith"}`;

    const link = await createPaymentLink({
      amountPaise: parsed.data.amountRupees * 100,
      description,
      reference: `student-${lead.id}-${Date.now()}`,
      customerName: lead.name,
      customerEmail: lead.email ?? undefined,
      customerPhone: lead.phone ?? undefined,
    });

    const [row] = await db
      .insert(schema.payments)
      .values({
        leadId: lead.id,
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

    await db.insert(schema.leadEvents).values({
      leadId: lead.id,
      icon: "indian-rupee",
      title: `Student requested payment link — ${description}`,
      detail: link.short_url,
      actorId: session.user.id,
    });

    return Response.json({ payment: row, shortUrl: link.short_url }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
