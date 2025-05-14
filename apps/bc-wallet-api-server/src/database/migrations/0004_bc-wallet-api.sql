CREATE TYPE "public"."TenantType" AS ENUM('ROOT', 'SHOWCASE');--> statement-breakpoint
ALTER TABLE "credentialSchema" ALTER COLUMN "source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD COLUMN "source" "Source" DEFAULT 'CREATED' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "tenantType" "TenantType" NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "oidc_issuer" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "traction_tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "traction_api_url" text;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "traction_wallet_id" uuid;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "traction_api_key" text;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "nonce_base_64" text;--> statement-breakpoint
CREATE INDEX "tenants_to_users_user_idx" ON "tenantsToUsers" USING btree ("user");