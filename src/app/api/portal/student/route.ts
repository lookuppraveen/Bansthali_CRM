import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Returns the logged-in student's linked lead + admission progress. */
export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }

    // Simple demo mapping: match lead.name to user.name.
    const lead = await db.query.leads.findFirst({
      where: eq(schema.leads.name, session.user.name ?? ""),
      with: {
        documents: true,
        parents: true,
        handoff: true,
      },
    });

    if (!lead) {
      return Response.json({ lead: null });
    }

    // Onboarding checklist — derive from stage + docs + handoff status.
    const docsAllVerified =
      lead.documents.length > 0 &&
      lead.documents.every((d) => d.status === "Verified" || d.status === "Issued");
    const handedOff = lead.handoff.some((h) => h.status === "synced");
    const enrolled = lead.stage === "Enrolled";

    const checklist = [
      { name: "Accept offer & pay admission fee", done: ["Counselling", "Verification", "Enrolled"].includes(lead.stage) },
      { name: "Upload verified documents", done: docsAllVerified },
      { name: "Complete hostel preference form", done: lead.hostelRequested },
      { name: "Register for orientation (28 Aug)", done: enrolled },
      { name: "Health & vaccination declaration", done: false },
      { name: "Collect ID card & library access", done: handedOff },
    ];

    return Response.json({ lead, checklist });
  } catch (err) {
    return toResponse(err);
  }
}
