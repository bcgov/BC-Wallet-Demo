ALTER TABLE "credentialDefinition" ALTER COLUMN "icon" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stepAction" ADD COLUMN "credential_definition_id" text;--> statement-breakpoint
ALTER TABLE "stepAction" ADD COLUMN "connection_id" text;--> statement-breakpoint
ALTER TABLE "stepAction" ADD COLUMN "go_to_step" text;--> statement-breakpoint
ALTER TABLE "step" ADD COLUMN "credential_definition_id" uuid;--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_credential_definition_id_credentialDefinition_id_fk" FOREIGN KEY ("credential_definition_id") REFERENCES "public"."credentialDefinition"("id") ON DELETE no action ON UPDATE no action;
