ALTER TABLE "showcase" DROP CONSTRAINT "showcase_slug_unique";--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD COLUMN "tenant_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD CONSTRAINT "credentialDefinition_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenant_slug_unique" ON "showcase" USING btree ("tenant_id","slug");