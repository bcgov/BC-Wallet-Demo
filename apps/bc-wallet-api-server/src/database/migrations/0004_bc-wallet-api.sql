ALTER TABLE "tenant" ADD COLUMN "realm" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "clientId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "clientSecret" text NOT NULL;--> statement-breakpoint
CREATE INDEX "tenants_to_users_user_idx" ON "tenantsToUsers" USING btree ("user");