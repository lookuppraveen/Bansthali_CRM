import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({ done: z.boolean() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const id = Number(params.id);
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [row] = await db
      .update(schema.tasks)
      .set({ done: parsed.data.done })
      .where(eq(schema.tasks.id, id))
      .returning();

    return Response.json({ task: row });
  } catch (err) {
    return toResponse(err);
  }
}
