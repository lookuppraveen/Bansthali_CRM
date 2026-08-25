import { db, schema } from "@/db/client";
import { requireSession, toResponse } from "@/lib/rbac";
import { asc, eq, notInArray, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface SurveyQuestion {
  prompt: string;
  kind: "rating" | "text";
  required?: boolean;
}

const DEMO_SURVEYS: Array<{
  title: string;
  description: string;
  category: (typeof schema.surveyCategoryEnum.enumValues)[number];
  audience: string;
  questions: SurveyQuestion[];
}> = [
  {
    title: "Orientation week feedback",
    description: "Two minutes to help us improve orientation for the next batch.",
    category: "onboarding",
    audience: "First year",
    questions: [
      { prompt: "How would you rate the orientation programme overall?", kind: "rating", required: true },
      { prompt: "How welcome did you feel in your bhawan on arrival?", kind: "rating", required: true },
      { prompt: "Anything specific you'd like us to keep, drop, or add?", kind: "text" },
    ],
  },
  {
    title: "Mess & food · this week",
    description: "Quick check on this week's mess service.",
    category: "mess",
    audience: "All students",
    questions: [
      { prompt: "Food quality this week", kind: "rating", required: true },
      { prompt: "Menu variety", kind: "rating", required: true },
      { prompt: "Timeliness of meals", kind: "rating", required: true },
      { prompt: "Any specific dish you'd like added?", kind: "text" },
    ],
  },
  {
    title: "Hostel · Chandra Bhawan",
    description: "Feedback for your warden and the hostel team.",
    category: "hostel",
    audience: "Chandra Bhawan residents",
    questions: [
      { prompt: "Cleanliness of your bhawan", kind: "rating", required: true },
      { prompt: "Response time to maintenance requests", kind: "rating", required: true },
      { prompt: "Wi-Fi & basic amenities", kind: "rating", required: true },
    ],
  },
];

async function ensureDemoSurveys() {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.surveys);
  if ((rows[0]?.n ?? 0) > 0) return;

  await db.insert(schema.surveys).values(
    DEMO_SURVEYS.map((s) => ({
      title: s.title,
      description: s.description,
      category: s.category,
      audience: s.audience,
      questions: s.questions as unknown as object,
      active: true,
    }))
  );
}

async function findMyLead(name: string) {
  const [lead] = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.name, name))
    .limit(1);
  return lead;
}

export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "student" && session.user.role !== "super_admin") {
      return Response.json({ error: "Student access only" }, { status: 403 });
    }
    const lead = await findMyLead(session.user.name ?? "");
    if (!lead) return Response.json({ available: [], completed: [] });

    try {
      await ensureDemoSurveys();
    } catch {
      /* if the seed helper hits an edge case with SQL raw, fine — the table just stays empty until the admin creates one */
    }

    const submitted = await db
      .select({ surveyId: schema.surveyResponses.surveyId })
      .from(schema.surveyResponses)
      .where(eq(schema.surveyResponses.leadId, lead.id));
    const submittedIds = submitted.map((s) => s.surveyId);

    const available = await db
      .select()
      .from(schema.surveys)
      .where(
        submittedIds.length > 0
          ? and(eq(schema.surveys.active, true), notInArray(schema.surveys.id, submittedIds))
          : eq(schema.surveys.active, true)
      )
      .orderBy(asc(schema.surveys.createdAt));

    const completed = await db
      .select({
        id: schema.surveys.id,
        title: schema.surveys.title,
        category: schema.surveys.category,
        submittedAt: schema.surveyResponses.submittedAt,
      })
      .from(schema.surveys)
      .innerJoin(schema.surveyResponses, eq(schema.surveyResponses.surveyId, schema.surveys.id))
      .where(eq(schema.surveyResponses.leadId, lead.id));

    return Response.json({ available, completed });
  } catch (err) {
    return toResponse(err);
  }
}
