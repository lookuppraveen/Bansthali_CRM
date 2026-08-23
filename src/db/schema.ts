import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  serial,
  pgEnum,
  jsonb,
  uuid,
  primaryKey,
  customType,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// pgvector column type — 1536 dims matches OpenAI text-embedding-3-small.
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string) {
    return value.replace(/^\[|\]$/g, "").split(",").map(Number);
  },
});

// ══════════════════════════════════════════════════════════════════
// Enums
// ══════════════════════════════════════════════════════════════════

export const roleEnum = pgEnum("role", [
  "super_admin",
  "admissions_head",
  "counsellor",
  "marketing",
  "front_office",
  "management",
  "student",
  "parent",
  "dpo",
]);

export const stageEnum = pgEnum("stage", [
  "Enquiry",
  "Nurturing",
  "Application",
  "BUAT",
  "Merit List",
  "Counselling",
  "Verification",
  "Enrolled",
  "Dropped",
]);

export const slaEnum = pgEnum("sla", ["On track", "Due today", "Breached"]);

export const erpStatusEnum = pgEnum("erp_status", [
  "pending",
  "synced",
  "queued",
  "review",
  "failed",
]);

export const docStatusEnum = pgEnum("doc_status", [
  "Not uploaded",
  "Pending",
  "Issued",
  "Verified",
  "Query raised",
  "Rejected",
]);

export const commChannelEnum = pgEnum("comm_channel", [
  "email",
  "sms",
  "whatsapp",
  "in_app",
  "phone",
]);

// ══════════════════════════════════════════════════════════════════
// Users & auth
// ══════════════════════════════════════════════════════════════════

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  initials: varchar("initials", { length: 4 }).notNull(),
  title: varchar("title", { length: 120 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// Reference / catalog
// ══════════════════════════════════════════════════════════════════

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  icon: varchar("icon", { length: 40 }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  medium: varchar("medium", { length: 60 }).notNull(),
  sourceId: integer("source_id").references(() => sources.id),
  active: boolean("active").notNull().default(true),
});

// ══════════════════════════════════════════════════════════════════
// Leads (CRM core)
// ══════════════════════════════════════════════════════════════════

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 254 }),
  phone: varchar("phone", { length: 32 }),
  city: varchar("city", { length: 120 }),
  program: varchar("program", { length: 160 }),
  faculty: varchar("faculty", { length: 160 }),
  category: varchar("category", { length: 40 }),
  aggregate: varchar("aggregate", { length: 20 }),
  language: varchar("language", { length: 60 }),
  hostelRequested: boolean("hostel_requested").notNull().default(false),

  sourceId: integer("source_id").references(() => sources.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  medium: varchar("medium", { length: 60 }),

  stage: stageEnum("stage").notNull().default("Enquiry"),
  score: integer("score").notNull().default(0),
  sla: slaEnum("sla").notNull().default("On track"),

  ownerId: uuid("owner_id").references(() => users.id),

  firstTouchAt: timestamp("first_touch_at", { withTimezone: true }).defaultNow().notNull(),
  lastTouchAt: timestamp("last_touch_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leadScoreFactors = pgTable("lead_score_factors", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 80 }).notNull(),
  points: integer("points").notNull(),
  outOf: integer("out_of").notNull(),
});

export const leadParents = pgTable("lead_parents", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  relation: varchar("relation", { length: 40 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  consent: boolean("consent").notNull().default(false),
  portalLinked: boolean("portal_linked").notNull().default(false),
});

// ══════════════════════════════════════════════════════════════════
// Activity / timeline
// ══════════════════════════════════════════════════════════════════

export const leadEvents = pgTable("lead_events", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  icon: varchar("icon", { length: 40 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  detail: text("detail"),
  channel: commChannelEnum("channel"),
  actorId: uuid("actor_id").references(() => users.id),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  text: varchar("text", { length: 240 }).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  dueLabel: varchar("due_label", { length: 60 }),
  ownerId: uuid("owner_id").references(() => users.id),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// Documents
// ══════════════════════════════════════════════════════════════════

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  status: docStatusEnum("status").notNull().default("Not uploaded"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifierId: uuid("verifier_id").references(() => users.id),
  note: text("note"),
});

// ══════════════════════════════════════════════════════════════════
// Admissions ops
// ══════════════════════════════════════════════════════════════════

export const meritList = pgTable("merit_list", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
  rank: varchar("rank", { length: 8 }).notNull(),
  program: varchar("program", { length: 160 }).notNull(),
  buatScore: varchar("buat_score", { length: 10 }),
  aggregate: varchar("aggregate", { length: 10 }),
  status: varchar("status", { length: 40 }).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
});

export const counsellingSlots = pgTable("counselling_slots", {
  id: serial("id").primaryKey(),
  slotTime: varchar("slot_time", { length: 60 }).notNull(),
  program: varchar("program", { length: 120 }).notNull(),
  ranks: varchar("ranks", { length: 60 }).notNull(),
  booked: integer("booked").notNull().default(0),
  capacity: integer("capacity").notNull(),
});

// ══════════════════════════════════════════════════════════════════
// ERP handoff
// ══════════════════════════════════════════════════════════════════

export const erpHandoffs = pgTable("erp_handoffs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  studentName: varchar("student_name", { length: 160 }).notNull(),
  program: varchar("program", { length: 160 }).notNull(),
  erpStudentId: varchar("erp_student_id", { length: 40 }),
  status: erpStatusEnum("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// Communications
// ══════════════════════════════════════════════════════════════════

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  channel: commChannelEnum("channel").notNull(),
  subject: varchar("subject", { length: 240 }),
  body: text("body").notNull(),
  language: varchar("language", { length: 20 }).notNull().default("en"),
  approved: boolean("approved").notNull().default(false),
});

export const communications = pgTable("communications", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  templateId: integer("template_id").references(() => templates.id),
  channel: commChannelEnum("channel").notNull(),
  senderId: uuid("sender_id").references(() => users.id),
  recipient: varchar("recipient", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 240 }),
  body: text("body").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("sent"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// Payments
// ══════════════════════════════════════════════════════════════════

export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "pending",
  "paid",
  "failed",
  "expired",
  "cancelled",
]);

export const paymentPurposeEnum = pgEnum("payment_purpose", [
  "application_fee",
  "admission_fee",
  "semester_fee",
  "hostel_deposit",
  "other",
]);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  purpose: paymentPurposeEnum("purpose").notNull().default("admission_fee"),
  amount: integer("amount").notNull(), // in paise (₹1 = 100)
  currency: varchar("currency", { length: 8 }).notNull().default("INR"),
  status: paymentStatusEnum("status").notNull().default("created"),
  providerLinkId: varchar("provider_link_id", { length: 80 }),
  providerPaymentId: varchar("provider_payment_id", { length: 80 }),
  shortUrl: text("short_url"),
  description: varchar("description", { length: 240 }),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  lead: one(leads, { fields: [payments.leadId], references: [leads.id] }),
  createdBy: one(users, { fields: [payments.createdById], references: [users.id] }),
}));

// ══════════════════════════════════════════════════════════════════
// AI Assistant · knowledge base (RAG)
// ══════════════════════════════════════════════════════════════════

export const kbDocuments = pgTable("kb_documents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  sourcePath: varchar("source_path", { length: 300 }).notNull().unique(),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  category: varchar("category", { length: 60 }).notNull().default("general"),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const kbChunks = pgTable(
  "kb_chunks",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id")
      .notNull()
      .references(() => kbDocuments.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    text: text("text").notNull(),
    tokenCount: integer("token_count").notNull(),
    embedding: vector("embedding").notNull(),
  },
  (t) => ({
    ivf: index("kb_chunks_embedding_ivf")
      .using("ivfflat", sql`${t.embedding} vector_cosine_ops`)
      .with({ lists: 100 }),
  })
);

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  citations: jsonb("citations"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const kbChunksRelations = relations(kbChunks, ({ one }) => ({
  document: one(kbDocuments, { fields: [kbChunks.documentId], references: [kbDocuments.id] }),
}));

// ══════════════════════════════════════════════════════════════════
// Audit
// ══════════════════════════════════════════════════════════════════

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actorId: uuid("actor_id").references(() => users.id),
  actorLabel: varchar("actor_label", { length: 120 }).notNull(),
  action: varchar("action", { length: 200 }).notNull(),
  entityType: varchar("entity_type", { length: 60 }),
  entityId: varchar("entity_id", { length: 60 }),
  meta: jsonb("meta"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// Relations
// ══════════════════════════════════════════════════════════════════

export const leadsRelations = relations(leads, ({ one, many }) => ({
  owner: one(users, { fields: [leads.ownerId], references: [users.id] }),
  source: one(sources, { fields: [leads.sourceId], references: [sources.id] }),
  campaign: one(campaigns, { fields: [leads.campaignId], references: [campaigns.id] }),
  scoreFactors: many(leadScoreFactors),
  parents: many(leadParents),
  events: many(leadEvents),
  tasks: many(tasks),
  documents: many(documents),
  handoff: many(erpHandoffs),
  payments: many(payments),
}));

export const usersRelations = relations(users, ({ many }) => ({
  ownedLeads: many(leads),
  events: many(leadEvents),
  tasks: many(tasks),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  lead: one(leads, { fields: [documents.leadId], references: [leads.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  lead: one(leads, { fields: [tasks.leadId], references: [leads.id] }),
  owner: one(users, { fields: [tasks.ownerId], references: [users.id] }),
}));

export const leadEventsRelations = relations(leadEvents, ({ one }) => ({
  lead: one(leads, { fields: [leadEvents.leadId], references: [leads.id] }),
  actor: one(users, { fields: [leadEvents.actorId], references: [users.id] }),
}));

export const meritListRelations = relations(meritList, ({ one }) => ({
  lead: one(leads, { fields: [meritList.leadId], references: [leads.id] }),
}));

export const erpHandoffsRelations = relations(erpHandoffs, ({ one }) => ({
  lead: one(leads, { fields: [erpHandoffs.leadId], references: [leads.id] }),
}));

export const leadScoreFactorsRelations = relations(leadScoreFactors, ({ one }) => ({
  lead: one(leads, { fields: [leadScoreFactors.leadId], references: [leads.id] }),
}));

export const leadParentsRelations = relations(leadParents, ({ one }) => ({
  lead: one(leads, { fields: [leadParents.leadId], references: [leads.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadEvent = typeof leadEvents.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type ErpHandoff = typeof erpHandoffs.$inferSelect;
