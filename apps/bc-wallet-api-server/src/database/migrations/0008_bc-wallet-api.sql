ALTER TABLE "step" ADD COLUMN "credential_definition_id" uuid;--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_credential_definition_id_credentialDefinition_id_fk" FOREIGN KEY ("credential_definition_id") REFERENCES "public"."credentialDefinition"("id") ON DELETE no action ON UPDATE no action;
