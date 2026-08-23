CREATE TYPE "public"."journey_run_status" AS ENUM('queued', 'sent', 'skipped', 'failed');--> statement-breakpoint
CREATE TYPE "public"."journey_trigger" AS ENUM('enquiry_created', 'stage_entered', 'stage_stalled');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journey_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"journey_id" integer NOT NULL,
	"lead_id" integer NOT NULL,
	"status" "journey_run_status" NOT NULL,
	"error" text,
	"provider_message_id" varchar(120),
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"trigger" "journey_trigger" NOT NULL,
	"trigger_stage" "stage",
	"delay_hours" integer DEFAULT 0 NOT NULL,
	"channel" "comm_channel" NOT NULL,
	"template_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journey_runs" ADD CONSTRAINT "journey_runs_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journey_runs" ADD CONSTRAINT "journey_runs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journeys" ADD CONSTRAINT "journeys_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
