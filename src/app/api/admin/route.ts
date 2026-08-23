import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();

    const audit = await db
      .select()
      .from(schema.auditLog)
      .orderBy(desc(schema.auditLog.occurredAt))
      .limit(20);

    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        initials: schema.users.initials,
        title: schema.users.title,
      })
      .from(schema.users);

    return Response.json({ audit, users });
  } catch (err) {
    return toResponse(err);
  }
}
