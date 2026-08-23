CREATE TYPE "public"."payment_purpose" AS ENUM('application_fee', 'admission_fee', 'semester_fee', 'hostel_deposit', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'pending', 'paid', 'failed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"purpose" "payment_purpose" DEFAULT 'admission_fee' NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"provider_link_id" varchar(80),
	"provider_payment_id" varchar(80),
	"short_url" text,
	"description" varchar(240),
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
