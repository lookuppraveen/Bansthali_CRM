ALTER TABLE "documents" ADD COLUMN "required" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_data" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_name" varchar(200);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_mime_type" varchar(100);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_size" integer;