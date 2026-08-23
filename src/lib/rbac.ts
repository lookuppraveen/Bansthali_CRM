import { auth } from "@/auth";
import { db, schema } from "@/db/client";

export type Role = (typeof schema.roleEnum.enumValues)[number];

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new HttpError(401, "Not authenticated");
  }
  return session;
}

export async function requireRole(...allowed: Role[]) {
  const session = await requireSession();
  const role = session.user.role;
  if (!allowed.includes(role)) {
    throw new HttpError(403, `Role ${role} not permitted`);
  }
  return session;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function toResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: "Internal error" }, { status: 500 });
}

export async function writeAudit(
  action: string,
  entityType?: string,
  entityId?: string | number,
  meta?: unknown
) {
  const session = await auth();
  await db.insert(schema.auditLog).values({
    actorId: session?.user?.id ?? null,
    actorLabel: session?.user?.name ?? "System",
    action,
    entityType: entityType ?? null,
    entityId: entityId != null ? String(entityId) : null,
    meta: meta ? (meta as object) : null,
  });
}
