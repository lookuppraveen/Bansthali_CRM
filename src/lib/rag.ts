import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { db, schema } from "@/db/client";
import { sql } from "drizzle-orm";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not set");
if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY not set");

const openai = new OpenAI({ apiKey: OPENAI_KEY });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

const CHAT_MODEL = "claude-haiku-4-5";
const EMBED_MODEL = "text-embedding-3-small";

export interface RetrievedChunk {
  documentId: number;
  chunkIndex: number;
  text: string;
  title: string;
  sourcePath: string;
  language: string;
  category: string;
  similarity: number;
}

/** Embed a query with OpenAI text-embedding-3-small. */
export async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  });
  return res.data[0].embedding as number[];
}

/** Retrieve top-K most similar chunks via cosine similarity. */
export async function retrieve(queryEmbedding: number[], k = 6): Promise<RetrievedChunk[]> {
  const vec = `[${queryEmbedding.join(",")}]`;

  const rows = await db.execute(sql`
    SELECT
      c.document_id       AS "documentId",
      c.chunk_index       AS "chunkIndex",
      c.text              AS "text",
      d.title             AS "title",
      d.source_path       AS "sourcePath",
      d.language          AS "language",
      d.category          AS "category",
      1 - (c.embedding <=> ${vec}::vector) AS "similarity"
    FROM ${schema.kbChunks} c
    JOIN ${schema.kbDocuments} d ON d.id = c.document_id
    ORDER BY c.embedding <=> ${vec}::vector
    LIMIT ${k}
  `);

  return (rows as unknown as { rows: RetrievedChunk[] }).rows ?? (rows as unknown as RetrievedChunk[]);
}

const SYSTEM_PROMPT = `You are the Banasthali Vidyapith Assistant — a warm, precise, factual guide for prospective students, applicants, current students, parents and staff of Banasthali Vidyapith (a fully residential women's university in Rajasthan, India).

## Rules

1. **Answer only from the CONTEXT block below.** If the answer is not in the context, say so honestly and offer to connect the user to a human counsellor (admissions@banasthali.in / +91 1438 228 456).
2. **Never fabricate** dates, fees, phone numbers, contact details, or programme specifics that aren't in the context.
3. **Cite your sources** — at the end of the answer add a "Sources:" line listing the source titles you used (verbatim from the [Source: ...] labels). Use 1–3 sources at most.
4. **Match the user's language** — if the user writes in Hindi (Devanagari or Hinglish/romanised), reply in the same style. English question → English reply. Hindi question → Hindi reply.
5. **Be concise** — 3-6 sentences for most answers. Use short bullets for lists. Skip preamble.
6. **Be warm but not effusive** — you serve a residential women's university where safety and clarity matter more than sparkle.
7. **Safety and consent** — never reveal individual student/parent PII, financial details, or bypass consent. If asked, defer to the human process.

## Format

Direct answer first. Bullets only if there are 3+ discrete items. End with the "Sources:" line.`;

export interface ChatResult {
  answer: string;
  citations: { title: string; sourcePath: string; similarity: number }[];
  usage?: { input: number; output: number };
}

export async function ragAnswer(query: string, history: { role: "user" | "assistant"; content: string }[] = []): Promise<ChatResult> {
  // 1. Embed query and retrieve top-K
  const qVec = await embed(query);
  const chunks = await retrieve(qVec, 6);

  // Group unique sources for citation
  const uniqSources = new Map<string, { title: string; sourcePath: string; similarity: number }>();
  for (const c of chunks) {
    const key = c.sourcePath;
    if (!uniqSources.has(key) || uniqSources.get(key)!.similarity < c.similarity) {
      uniqSources.set(key, { title: c.title, sourcePath: c.sourcePath, similarity: c.similarity });
    }
  }
  const citations = Array.from(uniqSources.values()).sort((a, b) => b.similarity - a.similarity);

  // 2. Build the CONTEXT block
  const context = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.title}]\n${c.text}`)
    .join("\n\n---\n\n");

  // 3. Prompt Claude
  const userMessage = `CONTEXT:\n\n${context}\n\n---\n\nQUESTION: ${query}`;

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const resp = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return {
    answer: text.trim(),
    citations: citations.slice(0, 3),
    usage: { input: resp.usage.input_tokens, output: resp.usage.output_tokens },
  };
}
