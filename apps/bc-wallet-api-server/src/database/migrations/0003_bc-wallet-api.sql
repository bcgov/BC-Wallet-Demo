CREATE TABLE "tenantsToUsers" (
	"tenant" text NOT NULL,
	"user" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenantsToUsers_tenant_user_pk" PRIMARY KEY("tenant","user")
);
--> statement-breakpoint
ALTER TABLE "tenantsToUsers" ADD CONSTRAINT "tenantsToUsers_tenant_tenant_id_fk" FOREIGN KEY ("tenant") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenantsToUsers" ADD CONSTRAINT "tenantsToUsers_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenants_to_users_tenant_idx" ON "tenantsToUsers" USING btree ("tenant");