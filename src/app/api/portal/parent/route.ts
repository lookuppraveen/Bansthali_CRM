import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Parent portal — returns the linked student's admission status.
 * Demo mapping: match on lead_parents.name to the logged-in user's name.
 */
export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "parent" && session.user.role !== "super_admin") {
      return Response.json({ error: "Parent access only" }, { status: 403 });
    }

    const parentRow = await db.query.leadParents.findFirst({
      where: eq(schema.leadParents.name, session.user.name ?? ""),
      with: {
        lead: {
          with: {
            documents: true,
            handoff: true,
          },
        },
      },
    });

    if (!parentRow || !parentRow.lead) {
      return Response.json({ lead: null, parent: null });
    }

    const lead = parentRow.lead;
    const docsVerified = lead.documents.every((d) => d.status === "Verified" || d.status === "Issued") && lead.documents.length > 0;
    const enrolled = lead.stage === "Enrolled";

    const status = [
      { icon: "check-circle-2", title: "Admission confirmed", meta: `${lead.program} · seat ${enrolled ? "secured" : "pending"}`, done: enrolled || lead.stage === "Verification" },
      { icon: "file-check", title: "Documents verified", meta: docsVerified ? "All certificates accepted" : `${lead.documents.filter((d) => d.status === "Verified").length}/${lead.documents.length} verified`, done: docsVerified },
      { icon: "home", title: "Hostel allotted", meta: lead.hostelRequested ? "Requested — awaiting allotment" : "Not requested", done: enrolled && lead.hostelRequested },
      { icon: "calendar-clock", title: "Orientation registration", meta: enrolled ? "Complete" : "Pending — closes 26 Aug", done: enrolled },
    ];

    return Response.json({ lead, parent: parentRow, status });
  } catch (err) {
    return toResponse(err);
  }
}
