import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  subject: z.string().max(240).nullable().optional(),
  body: z.string().min(1).optional(),
  language: z.string().max(20).optional(),
  approved: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [row] = await db
      .update(schema.templates)
      .set(parsed.data)
      .where(eq(schema.templates.id, id))
      .returning();
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    await writeAudit(`Edited template: ${row.name}`, "template", id);
    return Response.json({ template: row });
  } catch (err) {
    return toResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    const [row] = await db.delete(schema.templates).where(eq(schema.templates.id, id)).returning();
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    await writeAudit(`Deleted template: ${row.name}`, "template", id);
    return Response.json({ ok: true });
  } catch (err) {
    return toResponse(err);
  }
}
