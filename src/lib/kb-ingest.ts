/**
 * Ingest a single markdown document into kb_documents + kb_chunks.
 * Idempotent: re-ingesting the same content is a no-op (hash match).
 * Used by both `src/db/ingest.ts` (CLI, filesystem) and the Admin KB UI
 * (server, DB-managed docs).
 */

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { db, schema } from "@/db/client";

const CHUNK_TARGET_CHARS = 1200;
const CHUNK_OVERLAP_CHARS = 200;

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey: key });
}

export function chunkText(body: string): string[] {
  const sections = body.split(/\n(?=##\s)/g).map((s) => s.trim()).filter(Boolean);
  const chunks: string[] = [];
  for (const sec of sections) {
    if (sec.length <= CHUNK_TARGET_CHARS) {
      chunks.push(sec);
      continue;
    }
    let i = 0;
    while (i < sec.length) {
      chunks.push(sec.slice(i, i + CHUNK_TARGET_CHARS));
      i += CHUNK_TARGET_CHARS - CHUNK_OVERLAP_CHARS;
    }
  }
  return chunks.filter((c) => c.trim().length > 40);
}

async function embedBatch(openai: OpenAI, texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding as number[]);
}

export interface IngestArgs {
  title: string;
  sourcePath: string;
  language: string;
  category: string;
  body: string;
  /** If true, store body in kb_documents.rawSource (DB-managed docs). */
  storeRaw?: boolean;
}

export interface IngestResult {
  documentId: number;
  chunksInserted: number;
  action: "created" | "updated" | "skipped";
}

export async function ingestDocument(args: IngestArgs): Promise<IngestResult> {
  const hash = createHash("sha256").update(args.body).digest("hex").slice(0, 32);

  const existing = await db.query.kbDocuments.findFirst({
    where: eq(schema.kbDocuments.sourcePath, args.sourcePath),
  });

  if (existing && existing.contentHash === hash) {
    return { documentId: existing.id, chunksInserted: 0, action: "skipped" };
  }

  let documentId: number;
  const action: "created" | "updated" = existing ? "updated" : "created";

  if (existing) {
    await db
      .update(schema.kbDocuments)
      .set({
        title: args.title,
        language: args.language,
        category: args.category,
        contentHash: hash,
        rawSource: args.storeRaw ? args.body : existing.rawSource,
        updatedAt: new Date(),
      })
      .where(eq(schema.kbDocuments.id, existing.id));
    await db.delete(schema.kbChunks).where(eq(schema.kbChunks.documentId, existing.id));
    documentId = existing.id;
  } else {
    const [row] = await db
      .insert(schema.kbDocuments)
      .values({
        title: args.title,
        sourcePath: args.sourcePath,
        language: args.language,
        category: args.category,
        contentHash: hash,
        rawSource: args.storeRaw ? args.body : null,
      })
      .returning();
    documentId = row.id;
  }

  const chunks = chunkText(args.body);
  const openai = getOpenAI();
  const batchSize = 32;
  let chunksInserted = 0;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const slice = chunks.slice(i, i + batchSize);
    const embeddings = await embedBatch(openai, slice);
    await db.insert(schema.kbChunks).values(
      slice.map((text, idx) => ({
        documentId,
        chunkIndex: i + idx,
        text,
        tokenCount: Math.round(text.length / 4),
        embedding: embeddings[idx],
      }))
    );
    chunksInserted += slice.length;
  }

  return { documentId, chunksInserted, action };
}
