import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireSession();
    const url = new URL(req.url);
    const channel = url.searchParams.get("channel");

    const rows = channel
      ? await db
          .select()
          .from(schema.templates)
          .where(
            eq(
              schema.templates.channel,
              channel as (typeof schema.commChannelEnum.enumValues)[number]
            )
          )
          .orderBy(asc(schema.templates.name))
      : await db.select().from(schema.templates).orderBy(asc(schema.templates.name));

    return Response.json({ templates: rows });
  } catch (err) {
    return toResponse(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  channel: z.enum(schema.commChannelEnum.enumValues),
  subject: z.string().max(240).optional(),
  body: z.string().min(1),
  language: z.string().max(20).optional(),
  approved: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    await requireSession();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [row] = await db
      .insert(schema.templates)
      .values({
        name: parsed.data.name,
        channel: parsed.data.channel,
        subject: parsed.data.subject ?? null,
        body: parsed.data.body,
        language: parsed.data.language ?? "en",
        approved: parsed.data.approved ?? false,
      })
      .returning();

    await writeAudit(`Created template: ${row.name}`, "template", row.id);
    return Response.json({ template: row }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
