CREATE TABLE IF NOT EXISTS "pipeline_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"pipeline_id" integer NOT NULL,
	"stage" "stage" NOT NULL,
	"order_index" integer NOT NULL,
	"sla_hours" integer DEFAULT 24 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"entry_criteria" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"programme_filter" varchar(120),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kb_documents" ADD COLUMN "raw_source" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
