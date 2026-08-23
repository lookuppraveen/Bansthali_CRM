CREATE TYPE "public"."comm_channel" AS ENUM('email', 'sms', 'whatsapp', 'in_app', 'phone');--> statement-breakpoint
CREATE TYPE "public"."doc_status" AS ENUM('Not uploaded', 'Pending', 'Issued', 'Verified', 'Query raised', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."erp_status" AS ENUM('pending', 'synced', 'queued', 'review', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('super_admin', 'admissions_head', 'counsellor', 'marketing', 'front_office', 'management', 'student', 'parent', 'dpo');--> statement-breakpoint
CREATE TYPE "public"."sla" AS ENUM('On track', 'Due today', 'Breached');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('Enquiry', 'Nurturing', 'Application', 'BUAT', 'Merit List', 'Counselling', 'Verification', 'Enrolled', 'Dropped');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"actor_label" varchar(120) NOT NULL,
	"action" varchar(200) NOT NULL,
	"entity_type" varchar(60),
	"entity_id" varchar(60),
	"meta" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"medium" varchar(60) NOT NULL,
	"source_id" integer,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"template_id" integer,
	"channel" "comm_channel" NOT NULL,
	"sender_id" uuid,
	"recipient" varchar(200) NOT NULL,
	"subject" varchar(240),
	"body" text NOT NULL,
	"status" varchar(40) DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "counselling_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot_time" varchar(60) NOT NULL,
	"program" varchar(120) NOT NULL,
	"ranks" varchar(60) NOT NULL,
	"booked" integer DEFAULT 0 NOT NULL,
	"capacity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"status" "doc_status" DEFAULT 'Not uploaded' NOT NULL,
	"uploaded_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verifier_id" uuid,
	"note" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "erp_handoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"student_name" varchar(160) NOT NULL,
	"program" varchar(160) NOT NULL,
	"erp_student_id" varchar(40),
	"status" "erp_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"icon" varchar(40) NOT NULL,
	"title" varchar(200) NOT NULL,
	"detail" text,
	"channel" "comm_channel",
	"actor_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_parents" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"relation" varchar(40) NOT NULL,
	"phone" varchar(32),
	"consent" boolean DEFAULT false NOT NULL,
	"portal_linked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_score_factors" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"label" varchar(80) NOT NULL,
	"points" integer NOT NULL,
	"out_of" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(254),
	"phone" varchar(32),
	"city" varchar(120),
	"program" varchar(160),
	"faculty" varchar(160),
	"category" varchar(40),
	"aggregate" varchar(20),
	"language" varchar(60),
	"hostel_requested" boolean DEFAULT false NOT NULL,
	"source_id" integer,
	"campaign_id" integer,
	"medium" varchar(60),
	"stage" "stage" DEFAULT 'Enquiry' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"sla" "sla" DEFAULT 'On track' NOT NULL,
	"owner_id" uuid,
	"first_touch_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_touch_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "merit_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"rank" varchar(8) NOT NULL,
	"program" varchar(160) NOT NULL,
	"buat_score" varchar(10),
	"aggregate" varchar(10),
	"status" varchar(40) NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"icon" varchar(40) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"text" varchar(240) NOT NULL,
	"due_at" timestamp with time zone,
	"due_label" varchar(60),
	"owner_id" uuid,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"channel" "comm_channel" NOT NULL,
	"subject" varchar(240),
	"body" text NOT NULL,
	"language" varchar(20) DEFAULT 'en' NOT NULL,
	"approved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"name" varchar(120) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"initials" varchar(4) NOT NULL,
	"title" varchar(120),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communications" ADD CONSTRAINT "communications_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communications" ADD CONSTRAINT "communications_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communications" ADD CONSTRAINT "communications_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_verifier_id_users_id_fk" FOREIGN KEY ("verifier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "erp_handoffs" ADD CONSTRAINT "erp_handoffs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_parents" ADD CONSTRAINT "lead_parents_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_score_factors" ADD CONSTRAINT "lead_score_factors_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "merit_list" ADD CONSTRAINT "merit_list_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
