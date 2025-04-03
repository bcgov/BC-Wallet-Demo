DROP INDEX "idx_icon";--> statement-breakpoint
DROP INDEX "idx_credentialSchema";--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD CONSTRAINT "credentialDefinition_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cd_icon" ON "credentialDefinition" USING btree ("icon");--> statement-breakpoint
CREATE INDEX "idx_cd_credentialSchema" ON "credentialDefinition" USING btree ("credential_schema");--> statement-breakpoint
CREATE INDEX "idx_cd_approvedBy" ON "credentialDefinition" USING btree ("approved_by");