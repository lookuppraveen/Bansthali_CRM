import { db, schema } from "@/db/client";
import { requireRole, toResponse, writeAudit } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(schema.docStatusEnum.enumValues),
  note: z.string().max(1000).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(
      "super_admin",
      "admissions_head",
      "counsellor",
      "front_office"
    );
    const id = Number(params.id);
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [doc] = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id))
      .limit(1);
    if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

    const isVerification =
      parsed.data.status === "Verified" ||
      parsed.data.status === "Issued" ||
      parsed.data.status === "Rejected" ||
      parsed.data.status === "Query raised";

    await db
      .update(schema.documents)
      .set({
        status: parsed.data.status,
        note: parsed.data.note ?? null,
        verifiedAt: isVerification ? new Date() : doc.verifiedAt,
        verifierId: isVerification ? session.user.id : doc.verifierId,
      })
      .where(eq(schema.documents.id, id));

    const iconByStatus: Record<string, string> = {
      Verified: "check-circle-2",
      Issued: "check-circle-2",
      Rejected: "x-circle",
      "Query raised": "message-square-warning",
      Pending: "file-clock",
      "Not uploaded": "file-x",
    };

    await db.insert(schema.leadEvents).values({
      leadId: doc.leadId,
      icon: iconByStatus[parsed.data.status] ?? "file-check",
      title: `Document ${parsed.data.status.toLowerCase()}: ${doc.name}`,
      detail: parsed.data.note ?? undefined,
      actorId: session.user.id,
    });

    await writeAudit(
      `Doc "${doc.name}" → ${parsed.data.status}${parsed.data.note ? ` (${parsed.data.note})` : ""}`,
      "document",
      id
    );
    return Response.json({ ok: true });
  } catch (err) {
    return toResponse(err);
  }
}
