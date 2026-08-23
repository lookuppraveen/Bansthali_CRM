import { db, schema } from "@/db/client";
import { requireRole, requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { ingestDocument } from "@/lib/kb-ingest";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const id = Number(params.id);
    const [doc] = await db
      .select()
      .from(schema.kbDocuments)
      .where(eq(schema.kbDocuments.id, id))
      .limit(1);
    if (!doc) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ document: doc });
  } catch (err) {
    return toResponse(err);
  }
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  language: z.string().max(10).optional(),
  category: z.string().max(60).optional(),
  body: z.string().min(20).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("super_admin", "admissions_head", "marketing");
    const id = Number(params.id);
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [existing] = await db.select().from(schema.kbDocuments).where(eq(schema.kbDocuments.id, id)).limit(1);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    if (!existing.rawSource && parsed.data.body) {
      return Response.json(
        {
          error: "This document was ingested from the filesystem. Edit the source file and re-run `npm run kb:ingest`.",
        },
        { status: 400 }
      );
    }

    // If body changed, re-embed via ingestDocument.
    if (parsed.data.body) {
      const result = await ingestDocument({
        title: parsed.data.title ?? existing.title,
        sourcePath: existing.sourcePath,
        language: parsed.data.language ?? existing.language,
        category: parsed.data.category ?? existing.category,
        body: parsed.data.body,
        storeRaw: true,
      });
      await writeAudit(
        `KB doc updated: ${parsed.data.title ?? existing.title} (${result.chunksInserted} chunks)`,
        "kb_document",
        id
      );
      return Response.json({ id, ...result });
    }

    // Metadata-only edit — no re-embed needed.
    await db
      .update(schema.kbDocuments)
      .set({
        title: parsed.data.title ?? existing.title,
        language: parsed.data.language ?? existing.language,
        category: parsed.data.category ?? existing.category,
        updatedAt: new Date(),
      })
      .where(eq(schema.kbDocuments.id, id));

    await writeAudit(`KB doc metadata edited: ${parsed.data.title ?? existing.title}`, "kb_document", id);
    return Response.json({ ok: true });
  } catch (err) {
    return toResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("super_admin");
    const id = Number(params.id);
    const [row] = await db
      .delete(schema.kbDocuments)
      .where(eq(schema.kbDocuments.id, id))
      .returning({ id: schema.kbDocuments.id, title: schema.kbDocuments.title });
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    await writeAudit(`Deleted KB doc: ${row.title}`, "kb_document", id);
    return Response.json({ ok: true });
  } catch (err) {
    return toResponse(err);
  }
}
