CREATE TABLE "tenantsToUsers" (
  "tenant" uuid NOT NULL,
  "user" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
)
--> statement-breakpoint
ALTER TABLE "tenantsToUsers" ADD CONSTRAINT "tenantsToUsers_tenant_id_fk" FOREIGN KEY ("tenant") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenantsToUsers" ADD CONSTRAINT "tenantsToUsers_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;