import { db, schema } from "@/db/client";
import { requireRole, requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { asc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const rows = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        initials: schema.users.initials,
        title: schema.users.title,
        active: schema.users.active,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(asc(schema.users.name));
    return Response.json({ users: rows });
  } catch (err) {
    return toResponse(err);
  }
}

const createSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  name: z.string().min(1).max(120),
  role: z.enum(schema.roleEnum.enumValues),
  initials: z.string().min(1).max(4).transform((v) => v.toUpperCase()),
  title: z.string().max(120).optional(),
  password: z.string().min(6).max(200),
  active: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    await requireRole("super_admin", "admissions_head");
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const { password, ...rest } = parsed.data;
    const [row] = await db
      .insert(schema.users)
      .values({
        ...rest,
        passwordHash: bcrypt.hashSync(password, 10),
        active: parsed.data.active ?? true,
      })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        initials: schema.users.initials,
        title: schema.users.title,
        active: schema.users.active,
      });

    await writeAudit(`Created user: ${row.email} (${row.role})`, "user", row.id);
    return Response.json({ user: row }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
