import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Standard required-doc set the demo Aarohi Sharma flow expects. If the
// lead is missing any of these, they are added on first portal load so the
// student always has something to upload against.
const REQUIRED_DOCS = [
  "10+2 Marksheet",
  "10th Standard Marksheet",
  "BUAT Admit Card",
  "Character Certificate",
  "Transfer Certificate",
  "Aadhaar",
  "Passport-size photograph",
];

/** Returns the logged-in student's linked lead + admission progress. */
export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }

    const lead = await db.query.leads.findFirst({
      where: eq(schema.leads.name, session.user.name ?? ""),
      with: {
        documents: true,
        parents: true,
        handoff: true,
      },
    });

    if (!lead) return Response.json({ lead: null });

    // Ensure every required doc has a slot for this student.
    const existingNames = new Set(lead.documents.map((d) => d.name));
    const missing = REQUIRED_DOCS.filter((n) => !existingNames.has(n));
    if (missing.length > 0) {
      await db.insert(schema.documents).values(
        missing.map((name) => ({
          leadId: lead.id,
          name,
          status: "Not uploaded" as const,
          required: true,
        }))
      );
      // Re-fetch docs so this response reflects the new rows.
      lead.documents = await db
        .select()
        .from(schema.documents)
        .where(eq(schema.documents.leadId, lead.id));
    }

    // Strip fileData from payload — it's served separately via /api/documents/[id]/file.
    const docs = lead.documents.map((d) => ({
      id: d.id,
      name: d.name,
      status: d.status,
      required: d.required,
      uploadedAt: d.uploadedAt,
      verifiedAt: d.verifiedAt,
      note: d.note,
      hasFile: !!d.fileData,
      fileName: d.fileName,
      fileSize: d.fileSize,
      fileMimeType: d.fileMimeType,
    }));

    const docsAllVerified =
      docs.length > 0 && docs.every((d) => d.status === "Verified" || d.status === "Issued");
    const handedOff = lead.handoff.some((h) => h.status === "synced");
    const enrolled = lead.stage === "Enrolled";

    const checklist = [
      {
        name: "Accept offer & pay admission fee",
        done: ["Counselling", "Verification", "Enrolled"].includes(lead.stage),
      },
      { name: "Upload verified documents", done: docsAllVerified },
      { name: "Complete hostel preference form", done: lead.hostelRequested },
      { name: "Register for orientation (28 Aug)", done: enrolled },
      { name: "Health & vaccination declaration", done: false },
      { name: "Collect ID card & library access", done: handedOff },
    ];

    // Rebuild the outbound lead object with the sanitised docs.
    const { documents: _dropped, ...leadCore } = lead;
    void _dropped;
    return Response.json({ lead: { ...leadCore, documents: docs }, checklist });
  } catch (err) {
    return toResponse(err);
  }
}
