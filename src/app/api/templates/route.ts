import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { asc, eq } from "drizzle-orm";

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
