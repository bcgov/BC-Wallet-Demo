CREATE TABLE "tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "step" DROP CONSTRAINT "step_credential_definition_id_credentialDefinition_id_fk";
--> statement-breakpoint
DROP INDEX "idx_icon";--> statement-breakpoint
DROP INDEX "idx_credentialSchema";--> statement-breakpoint
ALTER TABLE "stepAction" ALTER COLUMN "step" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "showcase" ADD COLUMN "tenant_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "showcase" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "showcase" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD CONSTRAINT "credentialDefinition_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase" ADD CONSTRAINT "showcase_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase" ADD CONSTRAINT "showcase_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cd_icon" ON "credentialDefinition" USING btree ("icon");--> statement-breakpoint
CREATE INDEX "idx_cd_credentialSchema" ON "credentialDefinition" USING btree ("credential_schema");--> statement-breakpoint
CREATE INDEX "idx_cd_approvedBy" ON "credentialDefinition" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "idx_tenant_id" ON "showcase" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_sc_approvedBy" ON "showcase" USING btree ("approved_by");--> statement-breakpoint
ALTER TABLE "step" DROP COLUMN "credential_definition_id";