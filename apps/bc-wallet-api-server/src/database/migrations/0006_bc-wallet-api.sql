ALTER TABLE "scenario" DROP CONSTRAINT "scenario_type_check";--> statement-breakpoint
ALTER TABLE "scenario" DROP CONSTRAINT "scenario_issuer_issuer_id_fk";
--> statement-breakpoint
ALTER TABLE "scenario" DROP CONSTRAINT "scenario_relying_party_relyingParty_id_fk";
--> statement-breakpoint
ALTER TABLE "relyingParty" ADD COLUMN "tenant_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "issuer" ADD COLUMN "tenant_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "relyingParty" ADD CONSTRAINT "relyingParty_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuer" ADD CONSTRAINT "issuer_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario" ADD CONSTRAINT "scenario_issuer_issuer_id_fk" FOREIGN KEY ("issuer") REFERENCES "public"."issuer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario" ADD CONSTRAINT "scenario_relying_party_relyingParty_id_fk" FOREIGN KEY ("relying_party") REFERENCES "public"."relyingParty"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_rp_tenant" ON "relyingParty" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_issuer_tenant" ON "issuer" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "scenario" ADD CONSTRAINT "scenario_type_check" CHECK (
            (scenario_type = 'PRESENTATION' AND relying_party IS NOT NULL) OR
            (scenario_type = 'ISSUANCE' AND issuer IS NOT NULL) OR
            (issuer IS NULL AND relying_party IS NULL)
    );