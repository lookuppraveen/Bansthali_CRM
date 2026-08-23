import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const rowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  program: z.string().optional().or(z.literal("")),
  faculty: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const sources = await db.select().from(schema.sources);
    const sourceIdByName = new Map(sources.map((s) => [s.name.toLowerCase(), s.id]));

    const values = parsed.data.rows.map((r) => ({
      name: r.name,
      email: r.email || null,
      phone: r.phone || null,
      city: r.city || null,
      program: r.program || null,
      faculty: r.faculty || null,
      sourceId: r.source ? sourceIdByName.get(r.source.toLowerCase()) ?? null : null,
      ownerId: session.user.id,
      stage: "Enquiry" as const,
    }));

    const inserted = await db.insert(schema.leads).values(values).returning({ id: schema.leads.id });

    // Timeline event on each new lead so the trail is honest.
    if (inserted.length) {
      await db.insert(schema.leadEvents).values(
        inserted.map((row) => ({
          leadId: row.id,
          icon: "upload",
          title: "Enquiry imported",
          detail: `Bulk upload by ${session.user.name}`,
          actorId: session.user.id,
        }))
      );
    }

    await writeAudit(`Imported ${inserted.length} leads via CSV`, "lead");
    return Response.json({ inserted: inserted.length }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
