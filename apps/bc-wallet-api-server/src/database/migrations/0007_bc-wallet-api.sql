CREATE TABLE "job_entity_map" (
	"job_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_status" (
	"job_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_name" text NOT NULL,
	"endpoint" text NOT NULL,
	"payload_data" jsonb,
	"status" text NOT NULL,
	"error_message" text,
	"result_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "job_entity_map" ADD CONSTRAINT "job_entity_map_job_id_job_status_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_status"("job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_entity_type_id" ON "job_entity_map" USING btree ("entity_type","entity_id");