import { db, schema } from "@/db/client";
import { requireRole, requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { ingestDocument } from "@/lib/kb-ingest";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    await requireSession();
    const rows = await db
      .select({
        id: schema.kbDocuments.id,
        title: schema.kbDocuments.title,
        sourcePath: schema.kbDocuments.sourcePath,
        language: schema.kbDocuments.language,
        category: schema.kbDocuments.category,
        updatedAt: schema.kbDocuments.updatedAt,
        editable: sql<boolean>`${schema.kbDocuments.rawSource} is not null`,
        chunkCount: sql<number>`(select count(*) from ${schema.kbChunks} where ${schema.kbChunks.documentId} = ${schema.kbDocuments.id})::int`,
      })
      .from(schema.kbDocuments)
      .orderBy(desc(schema.kbDocuments.updatedAt));
    return Response.json({ documents: rows });
  } catch (err) {
    return toResponse(err);
  }
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  language: z.string().max(10).default("en"),
  category: z.string().max(60).default("general"),
  body: z.string().min(20),
});

export async function POST(req: Request) {
  try {
    await requireRole("super_admin", "admissions_head", "marketing");
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const slug = parsed.data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const sourcePath = `db://${parsed.data.language}/${slug}-${Date.now()}.md`;

    const result = await ingestDocument({
      title: parsed.data.title,
      sourcePath,
      language: parsed.data.language,
      category: parsed.data.category,
      body: parsed.data.body,
      storeRaw: true,
    });

    await writeAudit(
      `KB doc ${result.action}: ${parsed.data.title} (${result.chunksInserted} chunks)`,
      "kb_document",
      result.documentId
    );
    return Response.json({ id: result.documentId, ...result }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
