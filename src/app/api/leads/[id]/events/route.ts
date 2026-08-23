import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().max(2000).optional(),
  icon: z.string().max(40).default("pen-line"),
  channel: z.enum(schema.commChannelEnum.enumValues).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const id = Number(params.id);
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [row] = await db
      .insert(schema.leadEvents)
      .values({
        leadId: id,
        title: parsed.data.title,
        detail: parsed.data.detail ?? null,
        icon: parsed.data.icon,
        channel: parsed.data.channel ?? null,
        actorId: session.user.id,
      })
      .returning();

    await db.update(schema.leads).set({ lastTouchAt: new Date() }).where(eq(schema.leads.id, id));

    return Response.json({ event: row }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
