import { db, schema } from "@/db/client";
import { requireRole, toResponse, writeAudit } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.enum(schema.roleEnum.enumValues).optional(),
  initials: z.string().min(1).max(4).transform((v) => v.toUpperCase()).optional(),
  title: z.string().max(120).nullable().optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).max(200).optional(), // if present, reset password
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("super_admin", "admissions_head");
    const id = params.id;
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    // Prevent self-deactivation.
    if (session.user.id === id && parsed.data.active === false) {
      return Response.json({ error: "You cannot deactivate your own account." }, { status: 400 });
    }

    const { password, ...rest } = parsed.data;
    const set: Record<string, unknown> = { ...rest };
    if (password) set.passwordHash = bcrypt.hashSync(password, 10);

    const [row] = await db
      .update(schema.users)
      .set(set)
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        initials: schema.users.initials,
        title: schema.users.title,
        active: schema.users.active,
      });
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    await writeAudit(
      password ? `Reset password for ${row.email}` : `Updated user: ${row.email}`,
      "user",
      id
    );
    return Response.json({ user: row });
  } catch (err) {
    return toResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("super_admin");
    const id = params.id;
    if (session.user.id === id) {
      return Response.json({ error: "You cannot delete your own account." }, { status: 400 });
    }
    // Soft delete = deactivate. Hard delete would cascade to owned leads.
    const [row] = await db
      .update(schema.users)
      .set({ active: false })
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id, email: schema.users.email });
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    await writeAudit(`Deactivated user: ${row.email}`, "user", id);
    return Response.json({ ok: true });
  } catch (err) {
    return toResponse(err);
  }
}
