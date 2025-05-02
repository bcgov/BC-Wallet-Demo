ALTER TABLE "credentialSchema" ALTER COLUMN "source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD COLUMN "source" "Source" DEFAULT 'CREATED' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "realm" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "client_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "client_secret" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "nonce_base_64" text;--> statement-breakpoint
CREATE INDEX "tenants_to_users_user_idx" ON "tenantsToUsers" USING btree ("user");