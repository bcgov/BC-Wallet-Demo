CREATE TABLE "tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "showcase" ADD COLUMN "tenant_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "showcase" ADD CONSTRAINT "showcase_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tenant_id" ON "showcase" USING btree ("tenant_id");