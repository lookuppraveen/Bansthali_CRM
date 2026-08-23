import "dotenv/config";
import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import { LEADS, LEAD_DETAILS } from "../lib/mock-data";

dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const sql = neon(url);
const db = drizzle(sql, { schema });

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

async function main() {
  console.log("Seeding…");

  // Clear (dev only).
  await db.delete(schema.auditLog);
  await db.delete(schema.communications);
  await db.delete(schema.templates);
  await db.delete(schema.erpHandoffs);
  await db.delete(schema.counsellingSlots);
  await db.delete(schema.meritList);
  await db.delete(schema.documents);
  await db.delete(schema.tasks);
  await db.delete(schema.leadEvents);
  await db.delete(schema.leadScoreFactors);
  await db.delete(schema.leadParents);
  await db.delete(schema.leads);
  await db.delete(schema.campaigns);
  await db.delete(schema.sources);
  await db.delete(schema.users);

  // ── Users ────────────────────────────────────────────────
  const [meenakshi, kavita, sunita, admin, dpo, student, parent] = await db
    .insert(schema.users)
    .values([
      { email: "meenakshi@banasthali.edu.in", name: "Meenakshi Vyas", passwordHash: hash("banasthali123"), role: "admissions_head", initials: "MV", title: "Admissions Head" },
      { email: "kavita@banasthali.edu.in", name: "Kavita Sharma", passwordHash: hash("banasthali123"), role: "counsellor", initials: "KS", title: "Counsellor" },
      { email: "sunita@banasthali.edu.in", name: "Sunita Rathore", passwordHash: hash("banasthali123"), role: "counsellor", initials: "SR", title: "Counsellor" },
      { email: "admin@banasthali.edu.in", name: "System Admin", passwordHash: hash("banasthali123"), role: "super_admin", initials: "SA", title: "Super Admin / IT" },
      { email: "dpo@banasthali.edu.in", name: "Data Protection Officer", passwordHash: hash("banasthali123"), role: "dpo", initials: "DP", title: "DPO" },
      { email: "aarohi@student.banasthali.edu.in", name: "Aarohi Sharma", passwordHash: hash("banasthali123"), role: "student", initials: "AS", title: "Student · B.Tech CS" },
      { email: "rajesh@parent.banasthali.edu.in", name: "Rajesh Sharma", passwordHash: hash("banasthali123"), role: "parent", initials: "RS", title: "Parent (linked: Aarohi)" },
    ])
    .returning();

  const ownerByLabel: Record<string, string> = {
    "Meenakshi V.": meenakshi.id,
    "Kavita S.": kavita.id,
    "Sunita R.": sunita.id,
  };

  // ── Sources ──────────────────────────────────────────────
  const srcRows = [
    { name: "Website", icon: "globe" },
    { name: "WhatsApp", icon: "message-circle" },
    { name: "Education Fair", icon: "tent" },
    { name: "Shiksha", icon: "building-2" },
    { name: "Careers360", icon: "building-2" },
    { name: "Instagram Ad", icon: "share-2" },
    { name: "Referral", icon: "user-plus" },
    { name: "Phone", icon: "phone" },
    { name: "Walk-in", icon: "door-open" },
    { name: "Email", icon: "mail" },
  ];
  const sourceRows = await db.insert(schema.sources).values(srcRows).returning();
  const sourceIdByName = Object.fromEntries(sourceRows.map((s) => [s.name, s.id]));

  // ── Campaigns ────────────────────────────────────────────
  const campaignRows = await db
    .insert(schema.campaigns)
    .values(
      Array.from(new Set(LEADS.map((l) => l.campaign))).map((name) => {
        const lead = LEADS.find((l) => l.campaign === name)!;
        return {
          name,
          medium: lead.medium,
          sourceId: sourceIdByName[lead.source] ?? null,
        };
      })
    )
    .returning();
  const campaignIdByName = Object.fromEntries(campaignRows.map((c) => [c.name, c.id]));

  // ── Leads ────────────────────────────────────────────────
  const leadRows = await db
    .insert(schema.leads)
    .values(
      LEADS.map((l) => ({
        name: l.name,
        city: l.city,
        program: l.program,
        faculty: l.faculty,
        sourceId: sourceIdByName[l.source] ?? null,
        campaignId: campaignIdByName[l.campaign] ?? null,
        medium: l.medium,
        stage: l.stage as (typeof schema.stageEnum.enumValues)[number],
        score: l.score,
        sla: l.sla as (typeof schema.slaEnum.enumValues)[number],
        ownerId: ownerByLabel[l.owner] ?? null,
      }))
    )
    .returning();

  const leadIdByName = Object.fromEntries(leadRows.map((l) => [l.name, l.id]));

  // ── Lead detail (profile, parent, docs, events, tasks, scores) ─
  for (const [mockIdStr, detail] of Object.entries(LEAD_DETAILS)) {
    const mockId = Number(mockIdStr);
    const mockLead = LEADS.find((x) => x.id === mockId)!;
    const dbLeadId = leadIdByName[mockLead.name];
    if (!dbLeadId) continue;

    // profile → written into leads.email/phone/etc.
    const p = Object.fromEntries(detail.profile.map((x) => [x.k, x.v]));
    await db
      .update(schema.leads)
      .set({
        phone: p["Phone"] ?? null,
        email: p["Email"] ?? null,
        category: p["Category"] ?? null,
        aggregate: p["10+2 aggregate"] ?? null,
        language: p["Language"] ?? null,
        hostelRequested: (p["Hostel"] ?? "").toLowerCase().includes("request"),
      })
      .where(eq(schema.leads.id, dbLeadId));

    // parent
    await db.insert(schema.leadParents).values({
      leadId: dbLeadId,
      name: detail.parent.name,
      relation: detail.parent.relation,
      phone: detail.parent.phone,
      consent: true,
      portalLinked: true,
    });

    // documents
    await db.insert(schema.documents).values(
      detail.docs.map((d) => ({
        leadId: dbLeadId,
        name: d.name,
        status: d.status as (typeof schema.docStatusEnum.enumValues)[number],
      }))
    );

    // score factors
    await db.insert(schema.leadScoreFactors).values(
      detail.scoreFactors.map((f) => {
        const [pts, out] = f.pts.split("/").map((x) => parseInt(x.trim(), 10));
        return { leadId: dbLeadId, label: f.label, points: pts, outOf: out };
      })
    );

    // timeline events (in chronological order — oldest first)
    const iconToChannel: Record<string, (typeof schema.commChannelEnum.enumValues)[number] | undefined> = {
      "message-circle": "whatsapp",
      phone: "phone",
      mail: "email",
    };
    await db.insert(schema.leadEvents).values(
      [...detail.timeline].reverse().map((t, idx) => ({
        leadId: dbLeadId,
        icon: t.icon,
        title: t.title,
        detail: t.detail,
        channel: iconToChannel[t.icon] ?? null,
        occurredAt: new Date(Date.now() - (detail.timeline.length - idx) * 24 * 60 * 60 * 1000),
      }))
    );

    // tasks
    await db.insert(schema.tasks).values(
      detail.tasks.map((t) => ({
        leadId: dbLeadId,
        text: t.text,
        dueLabel: t.due,
        ownerId: ownerByLabel[mockLead.owner] ?? null,
      }))
    );
  }

  // ── Counselling slots ────────────────────────────────────
  await db.insert(schema.counsellingSlots).values([
    { slotTime: "23 Aug · 10:00", program: "B.Tech / BCA", ranks: "Rank 1–120", booked: 96, capacity: 120 },
    { slotTime: "24 Aug · 10:00", program: "B.Tech / BCA", ranks: "Rank 121–250", booked: 71, capacity: 130 },
    { slotTime: "24 Aug · 14:00", program: "Life Sciences PG", ranks: "Rank 1–80", booked: 44, capacity: 80 },
    { slotTime: "25 Aug · 10:00", program: "Management", ranks: "Rank 1–150", booked: 22, capacity: 150 },
  ]);

  // ── Merit list ───────────────────────────────────────────
  await db.insert(schema.meritList).values([
    { rank: "001", leadId: leadIdByName["Kavya Nair"] ?? null, program: "M.Sc Biotech", buatScore: "191", aggregate: "96.2%", status: "Called" },
    { rank: "014", leadId: leadIdByName["Nidhi Kumari"] ?? null, program: "Ph.D Chemistry", buatScore: "184", aggregate: "—", status: "Called" },
    { rank: "142", leadId: leadIdByName["Aarohi Sharma"] ?? null, program: "B.Tech CS", buatScore: "168", aggregate: "93.4%", status: "Counselling" },
    { rank: "207", leadId: leadIdByName["Saanvi Reddy"] ?? null, program: "B.Tech CS", buatScore: "159", aggregate: "90.1%", status: "Waitlist R2" },
    { rank: "318", leadId: leadIdByName["Riya Gupta"] ?? null, program: "B.Ed", buatScore: "151", aggregate: "88.1%", status: "Pending" },
  ]);

  // ── ERP handoffs ─────────────────────────────────────────
  await db.insert(schema.erpHandoffs).values([
    { leadId: leadIdByName["Aarohi Sharma"], studentName: "Aarohi Sharma", program: "B.Tech CS", erpStudentId: "BV26-1042", status: "synced", attempts: 1 },
    { leadId: leadIdByName["Nidhi Kumari"], studentName: "Nidhi Kumari", program: "Ph.D Chemistry", status: "queued", attempts: 2 },
    { leadId: leadIdByName["Kavya Nair"], studentName: "Kavya Nair", program: "M.Sc Biotech", erpStudentId: "BV26-0771", status: "synced", attempts: 1 },
    { leadId: leadIdByName["Tanvi Joshi"], studentName: "Tanvi Joshi", program: "MA Music", status: "review", attempts: 3, lastError: "Schema mismatch on programme_code" },
  ]);

  // ── Templates ────────────────────────────────────────────
  await db.insert(schema.templates).values([
    {
      name: "Email — Application incomplete",
      channel: "email",
      subject: "Complete your Banasthali Vidyapith application",
      body: `Dear {{name}},

Thank you for beginning your application to Banasthali Vidyapith for {{program}}.

Our records show your application is still incomplete. To move to the next stage, please:

1. Upload any pending documents in your applicant portal
2. Complete the payment of your application fee if not done
3. Review your programme preferences

Log in at https://www.banasthali.org/portal to continue where you left off. If you need any help, reply to this email or call our admissions office at +91 1438 228 456.

With warm regards,
Banasthali Admissions Office`,
      approved: true,
    },
    {
      name: "Email — Counselling call letter",
      channel: "email",
      subject: "Counselling call — Banasthali Vidyapith {{program}}",
      body: `Dear {{name}},

Congratulations! You have been called for counselling for admission to {{program}} at Banasthali Vidyapith.

Please attend the counselling session as scheduled and carry the following originals + one photocopy each:

- 10+2 marksheet and certificate
- 10th standard marksheet
- BUAT admit card and score card
- Character certificate
- Transfer certificate
- Aadhaar
- 8 passport-size photographs

We look forward to welcoming you on campus.

With warm regards,
Banasthali Admissions Office`,
      approved: true,
    },
    {
      name: "Email — Offer letter",
      channel: "email",
      subject: "Offer of Admission — Banasthali Vidyapith",
      body: `Dear {{name}},

It gives us great pleasure to offer you admission to {{program}} at Banasthali Vidyapith for the 2026–27 academic session.

To confirm your seat, please pay the admission fee through your applicant portal within 7 days of receiving this letter. Your hostel allocation, orientation schedule and enrolment number will be issued after fee confirmation.

Welcome to the Banasthali family.

With warm regards,
Banasthali Admissions Office`,
      approved: true,
    },
    {
      name: "Email — Welcome to campus",
      channel: "email",
      subject: "Welcome to Banasthali — orientation & first days",
      body: `Dear {{name}},

Welcome to Banasthali Vidyapith! Your admission to {{program}} is confirmed.

Orientation week runs from 28 August to 3 September. Please arrive on campus at your allotted date with:

- Original documents for final verification
- Bedding and personal essentials
- 2–3 days' worth of clothing
- Your admission letter and photo ID

Your bhawan allotment and mess number will appear on your portal 3 days before reporting.

We look forward to walking this journey with you.

With warm regards,
Dean of Students, Banasthali Vidyapith`,
      approved: true,
    },
    {
      name: "WhatsApp — Counselling slot",
      channel: "whatsapp",
      body: "Namaste {{name}}, your counselling slot for {{program}} has been scheduled. Please check your portal for the exact date & time and reporting instructions. — Banasthali Admissions",
      approved: true,
    },
    {
      name: "SMS — BUAT reminder (DLT)",
      channel: "sms",
      body: "BUAT reminder: reporting time 9:00 AM. Bring admit card + photo ID. All the best. — Banasthali",
      approved: true,
    },
  ]);

  // ── Audit trail ──────────────────────────────────────────
  await db.insert(schema.auditLog).values([
    { actorId: kavita.id, actorLabel: "Kavita S.", action: "Advanced 12 leads to Counselling", entityType: "lead", occurredAt: new Date(Date.now() - 20 * 60 * 1000) },
    { actorId: null, actorLabel: "System", action: "ERP handoff — Aarohi Sharma synced (BV26-1042)", entityType: "erp_handoff", entityId: "BV26-1042", occurredAt: new Date(Date.now() - 42 * 60 * 1000) },
    { actorId: meenakshi.id, actorLabel: "Meenakshi V.", action: "Edited WhatsApp template “Counselling slot”", entityType: "template", occurredAt: new Date(Date.now() - 74 * 60 * 1000) },
    { actorId: dpo.id, actorLabel: "DPO", action: "Processed data-erasure request #DP-204", entityType: "dpdp_request", entityId: "DP-204", occurredAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
  ]);

  console.log(`✓ Seeded ${leadRows.length} leads, ${Object.keys(sourceIdByName).length} sources, users, docs, timeline, tasks, ERP queue, audit.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
