CREATE TYPE "public"."TenantType" AS ENUM('ROOT', 'SHOWCASE');--> statement-breakpoint
ALTER TABLE "tenant" RENAME COLUMN "realm" TO "oidc_realm";--> statement-breakpoint
ALTER TABLE "tenant" RENAME COLUMN "client_id" TO "oidc_client_id";--> statement-breakpoint
ALTER TABLE "tenant" RENAME COLUMN "client_secret" TO "oidc_client_secret";--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "tenantType" "TenantType" NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "traction_tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "traction_wallet_id" uuid;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "traction_api_url" text;