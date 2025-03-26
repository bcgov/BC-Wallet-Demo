ALTER TABLE "credentialDefinition" ALTER COLUMN "icon" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stepAction" ADD COLUMN "credential_definition_id" text;--> statement-breakpoint
ALTER TABLE "stepAction" ADD COLUMN "connection_id" text;--> statement-breakpoint
ALTER TABLE "stepAction" ADD COLUMN "go_to_step" text;