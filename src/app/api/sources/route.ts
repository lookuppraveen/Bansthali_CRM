import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const rows = await db.select().from(schema.sources).orderBy(asc(schema.sources.name));
    return Response.json({ sources: rows });
  } catch (err) {
    return toResponse(err);
  }
}
