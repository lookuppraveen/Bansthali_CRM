/**
 * KB ingest — reads markdown files under content/kb/**, chunks them,
 * embeds each chunk with OpenAI, and upserts into kb_documents + kb_chunks.
 *
 * Idempotent: a document with the same source_path and unchanged content
 * (hash match) is skipped. If content changed, old chunks are wiped and
 * the new ones inserted.
 *
 * Usage:  npm run kb:ingest
 */

import "dotenv/config";
import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import OpenAI from "openai";
import * as schema from "./schema";

dotenv.config({ path: ".env.local" });

const DB_URL = process.env.DATABASE_URL;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!DB_URL) throw new Error("DATABASE_URL not set");
if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not set");

const sql = neon(DB_URL);
const db = drizzle(sql, { schema });
const openai = new OpenAI({ apiKey: OPENAI_KEY });

const KB_ROOT = "content/kb";
const CHUNK_TARGET_CHARS = 1200; // ~300 tokens ≈ good semantic unit
const CHUNK_OVERLAP_CHARS = 200;

// ── Front-matter parser (minimal — no yaml dep) ────────────
function parseFrontMatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { meta: {}, body: raw };
  const head = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const meta: Record<string, string> = {};
  for (const line of head.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return { meta, body };
}

// ── Semantic-ish chunker: split on ## headings, then window ─
function chunkText(body: string): string[] {
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

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (entry.name.endsWith(".md")) out.push(p);
  }
  return out;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding as number[]);
}

async function main() {
  console.log("Scanning KB under", KB_ROOT);
  const files = await walk(KB_ROOT);
  console.log(`Found ${files.length} markdown file(s).`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let chunksInserted = 0;

  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const { meta, body } = parseFrontMatter(raw);
    const relPath = relative(".", file).split(sep).join("/");
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 32);

    const existing = await db.query.kbDocuments.findFirst({
      where: eq(schema.kbDocuments.sourcePath, relPath),
    });

    if (existing && existing.contentHash === hash) {
      skipped++;
      console.log(`  · skip  ${relPath}`);
      continue;
    }

    const title = meta.title ?? relPath;
    const language = meta.language ?? "en";
    const category = meta.category ?? "general";

    let documentId: number;
    if (existing) {
      await db
        .update(schema.kbDocuments)
        .set({ title, language, category, contentHash: hash, updatedAt: new Date() })
        .where(eq(schema.kbDocuments.id, existing.id));
      // wipe old chunks
      await db.delete(schema.kbChunks).where(eq(schema.kbChunks.documentId, existing.id));
      documentId = existing.id;
      updated++;
    } else {
      const [row] = await db
        .insert(schema.kbDocuments)
        .values({ title, sourcePath: relPath, language, category, contentHash: hash })
        .returning();
      documentId = row.id;
      created++;
    }

    const chunks = chunkText(body);
    console.log(`  · ${existing ? "update" : "create"}  ${relPath} — ${chunks.length} chunk(s)`);

    // Embed in batches of up to 32
    const batchSize = 32;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const slice = chunks.slice(i, i + batchSize);
      const embeddings = await embedBatch(slice);
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
  }

  console.log(
    `\nDone. Created ${created}, updated ${updated}, skipped ${skipped}. Inserted ${chunksInserted} chunk(s).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
