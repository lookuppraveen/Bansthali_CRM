import { db, schema } from "@/db/client";
import { requireSession, toResponse, writeAudit } from "@/lib/rbac";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  answers: z
    .array(
      z.object({
        rating: z.number().int().min(1).max(5).optional(),
        text: z.string().max(2000).optional(),
      })
    )
    .max(50),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }
    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const [lead] = await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.name, session.user.name ?? ""))
      .limit(1);
    if (!lead) return Response.json({ error: "No linked lead" }, { status: 404 });

    // Prevent duplicate submissions.
    const [existing] = await db
      .select()
      .from(schema.surveyResponses)
      .where(
        and(eq(schema.surveyResponses.surveyId, id), eq(schema.surveyResponses.leadId, lead.id))
      )
      .limit(1);
    if (existing) {
      return Response.json({ error: "Already submitted" }, { status: 400 });
    }

    const [survey] = await db
      .select()
      .from(schema.surveys)
      .where(eq(schema.surveys.id, id))
      .limit(1);
    if (!survey) return Response.json({ error: "Survey not found" }, { status: 404 });

    await db.insert(schema.surveyResponses).values({
      surveyId: id,
      leadId: lead.id,
      answers: parsed.data.answers as unknown as object,
    });

    await writeAudit(`Survey submitted: "${survey.title}"`, "survey", id);
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
