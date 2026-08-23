import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const listSchema = z.object({
  search: z.string().optional(),
  stage: z.string().optional(),
  ownerId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  try {
    await requireSession();
    const url = new URL(req.url);
    const parsed = listSchema.safeParse({
      search: url.searchParams.get("search") ?? undefined,
      stage: url.searchParams.get("stage") ?? undefined,
      ownerId: url.searchParams.get("ownerId") ?? undefined,
    });
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });
    const { search, stage, ownerId } = parsed.data;

    const conds = [] as ReturnType<typeof eq>[];
    if (stage && stage !== "All") {
      conds.push(eq(schema.leads.stage, stage as (typeof schema.stageEnum.enumValues)[number]));
    }
    if (ownerId) conds.push(eq(schema.leads.ownerId, ownerId));
    if (search) {
      const q = `%${search}%`;
      conds.push(
        or(
          ilike(schema.leads.name, q),
          ilike(schema.leads.city, q),
          ilike(schema.leads.program, q)
        )!
      );
    }

    const rows = await db.query.leads.findMany({
      where: conds.length ? and(...conds) : undefined,
      with: {
        owner: { columns: { id: true, name: true, initials: true } },
        source: { columns: { name: true, icon: true } },
        campaign: { columns: { name: true } },
      },
      orderBy: desc(schema.leads.lastTouchAt),
      limit: 200,
    });

    return Response.json({ leads: rows });
  } catch (err) {
    return toResponse(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  program: z.string().optional(),
  faculty: z.string().optional(),
  sourceId: z.number().int().optional(),
  campaignId: z.number().int().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [row] = await db
      .insert(schema.leads)
      .values({
        ...parsed.data,
        ownerId: session.user.id,
      })
      .returning();

    await writeAudit(`Created lead: ${row.name}`, "lead", row.id);
    return Response.json({ lead: row }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
