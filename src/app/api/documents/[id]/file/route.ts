import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Serves the raw file for a document. Access is allowed to:
 *  - counsellor / admissions_head / super_admin (any doc)
 *  - the student whose lead this doc belongs to
 *  - the parent linked to that lead
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const id = Number(params.id);
    if (!Number.isFinite(id)) return new Response("Bad id", { status: 400 });

    const [doc] = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id))
      .limit(1);
    if (!doc) return new Response("Not found", { status: 404 });
    if (!doc.fileData) return new Response("No file uploaded", { status: 404 });

    // RBAC check
    const staff = ["counsellor", "admissions_head", "super_admin", "dpo", "front_office"] as const;
    const isStaff = (staff as readonly string[]).includes(session.user.role);
    if (!isStaff) {
      const [lead] = await db
        .select({ name: schema.leads.name })
        .from(schema.leads)
        .where(eq(schema.leads.id, doc.leadId))
        .limit(1);
      if (!lead) return new Response("Forbidden", { status: 403 });
      // Student = own lead; parent = linked parent name.
      if (session.user.role === "student") {
        if (lead.name !== session.user.name) return new Response("Forbidden", { status: 403 });
      } else if (session.user.role === "parent") {
        const [parentRow] = await db
          .select()
          .from(schema.leadParents)
          .where(eq(schema.leadParents.leadId, doc.leadId))
          .limit(1);
        if (!parentRow || parentRow.name !== session.user.name) {
          return new Response("Forbidden", { status: 403 });
        }
      } else {
        return new Response("Forbidden", { status: 403 });
      }
    }

    const match = doc.fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return new Response("Corrupt file record", { status: 500 });
    const [, mime, b64] = match;
    const buf = Buffer.from(b64, "base64");

    return new Response(buf, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(buf.length),
        "Content-Disposition": `inline; filename="${(doc.fileName ?? "document").replace(/"/g, "")}"`,
      },
    });
  } catch (err) {
    return toResponse(err);
  }
}
