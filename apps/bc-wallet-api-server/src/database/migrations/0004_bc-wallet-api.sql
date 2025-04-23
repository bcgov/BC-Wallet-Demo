ALTER TABLE "credentialDefinition" ADD COLUMN "source" "Source" DEFAULT 'CREATED';--> statement-breakpoint
CREATE INDEX "tenants_to_users_user_idx" ON "tenantsToUsers" USING btree ("user");