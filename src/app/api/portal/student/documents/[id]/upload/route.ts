import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 900 * 1024; // ~900 KB per file — safe under Neon HTTP driver ~1 MB payload limit after base64 inflation
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const bodySchema = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.string().max(100),
  size: z.number().int().min(1).max(MAX_BYTES),
  dataUrl: z.string().min(20), // "data:...;base64,..."
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }

    const docId = Number(params.id);
    if (!Number.isFinite(docId)) return Response.json({ error: "Bad id" }, { status: 400 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });
    if (!ALLOWED.has(parsed.data.mimeType)) {
      return Response.json({ error: `File type ${parsed.data.mimeType} not allowed` }, { status: 400 });
    }

    // Verify this doc belongs to the logged-in student's lead.
    const [doc] = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, docId))
      .limit(1);
    if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

    const [lead] = await db
      .select({ id: schema.leads.id, name: schema.leads.name })
      .from(schema.leads)
      .where(eq(schema.leads.id, doc.leadId))
      .limit(1);
    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
    if (session.user.role === "student" && lead.name !== session.user.name) {
      return Response.json({ error: "This document belongs to another student." }, { status: 403 });
    }

    await db
      .update(schema.documents)
      .set({
        status: "Pending", // awaiting verifier review
        uploadedAt: new Date(),
        fileData: parsed.data.dataUrl,
        fileName: parsed.data.fileName,
        fileMimeType: parsed.data.mimeType,
        fileSize: parsed.data.size,
        note: null, // clear any previous query text
        verifiedAt: null,
        verifierId: null,
      })
      .where(eq(schema.documents.id, docId));

    await db.insert(schema.leadEvents).values({
      leadId: doc.leadId,
      icon: "upload",
      title: `Student uploaded: ${doc.name}`,
      detail: `${parsed.data.fileName} · ${(parsed.data.size / 1024).toFixed(0)} KB`,
      actorId: session.user.id,
    });

    await writeAudit(`Student uploaded document: ${doc.name}`, "document", docId);
    return Response.json({ ok: true });
  } catch (err) {
    return toResponse(err);
  }
}
