CREATE TYPE "public"."CredentialAttributeType" AS ENUM('STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'DATE');--> statement-breakpoint
CREATE TYPE "public"."CredentialType" AS ENUM('ANONCRED');--> statement-breakpoint
CREATE TYPE "public"."IdentifierType" AS ENUM('DID');--> statement-breakpoint
CREATE TYPE "public"."IssuerType" AS ENUM('ARIES');--> statement-breakpoint
CREATE TYPE "public"."StepType" AS ENUM('HUMAN_TASK', 'SERVICE', 'SCENARIO');--> statement-breakpoint
CREATE TYPE "public"."ScenarioType" AS ENUM('ISSUANCE', 'PRESENTATION');--> statement-breakpoint
CREATE TYPE "public"."ShowcaseStatus" AS ENUM('PENDING', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."RelyingPartyType" AS ENUM('ARIES');--> statement-breakpoint
CREATE TYPE "public"."Source" AS ENUM('IMPORTED', 'CREATED');--> statement-breakpoint
CREATE TABLE "ariesProofRequest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attributes" jsonb NOT NULL,
	"predicates" jsonb NOT NULL,
	"step_action" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ariesProofRequest_step_action_unique" UNIQUE("step_action")
);
--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_type" text NOT NULL,
	"file_name" text,
	"description" text,
	"content" "bytea" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentialAttribute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"type" "CredentialAttributeType" NOT NULL,
	"credential_schema" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentialDefinition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"identifier_type" "IdentifierType",
	"identifier" text,
	"credential_schema" uuid NOT NULL,
	"icon" uuid,
	"type" "CredentialType" NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentialRepresentation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_definition" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentialSchema" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier_type" "IdentifierType",
	"source" "Source" DEFAULT 'CREATED',
	"identifier" text,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relyingPartiesToCredentialDefinitions" (
	"relying_party" uuid NOT NULL,
	"credential_definition" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "relyingPartiesToCredentialDefinitions_relying_party_credential_definition_pk" PRIMARY KEY("relying_party","credential_definition")
);
--> statement-breakpoint
CREATE TABLE "relyingParty" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "RelyingPartyType" NOT NULL,
	"description" text NOT NULL,
	"organization" text,
	"logo" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issuer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "IssuerType" NOT NULL,
	"description" text NOT NULL,
	"organization" text,
	"logo" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issuersToCredentialDefinitions" (
	"issuer" uuid NOT NULL,
	"credential_definition" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "issuersToCredentialDefinitions_issuer_credential_definition_pk" PRIMARY KEY("issuer","credential_definition")
);
--> statement-breakpoint
CREATE TABLE "issuersToCredentialSchemas" (
	"issuer" uuid NOT NULL,
	"credential_schema" uuid NOT NULL,
	CONSTRAINT "issuersToCredentialSchemas_issuer_credential_schema_pk" PRIMARY KEY("issuer","credential_schema")
);
--> statement-breakpoint
CREATE TABLE "step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"order" integer NOT NULL,
	"type" "StepType" NOT NULL,
	"sub_scenario" uuid,
	"scenario" uuid NOT NULL,
	"asset" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "step_order_scenario_unique" UNIQUE("order","scenario")
);
--> statement-breakpoint
CREATE TABLE "stepAction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_type" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"step" uuid,
	"credential_definition_id" text,
	"connection_id" text,
	"go_to_step" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"scenario_type" "ScenarioType" NOT NULL,
	"issuer" uuid,
	"hidden" boolean DEFAULT false NOT NULL,
	"relying_party" uuid,
	"banner_image" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scenario_slug_unique" UNIQUE("slug"),
	CONSTRAINT "scenario_type_check" CHECK (
            (scenario_type = 'PRESENTATION' AND relying_party IS NOT NULL) OR
            (scenario_type = 'ISSUANCE' AND issuer IS NOT NULL)
    )
);
--> statement-breakpoint
CREATE TABLE "revocationInfo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"credential_definition" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "revocationInfo_credential_definition_unique" UNIQUE("credential_definition")
);
--> statement-breakpoint
CREATE TABLE "persona" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"role" text NOT NULL,
	"description" text NOT NULL,
	"headshot_image" uuid,
	"body_image" uuid,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "persona_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "scenariosToPersonas" (
	"scenario" uuid NOT NULL,
	"persona" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scenariosToPersonas_scenario_persona_pk" PRIMARY KEY("scenario","persona")
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "showcase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"completionMessage" text,
	"status" "ShowcaseStatus" NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"banner_image" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "showcase_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "showcasesToCredentialDefinitions" (
	"showcase" uuid NOT NULL,
	"credential_definition" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "showcasesToCredentialDefinitions_showcase_credential_definition_pk" PRIMARY KEY("showcase","credential_definition")
);
--> statement-breakpoint
CREATE TABLE "showcasesToPersonas" (
	"showcase" uuid NOT NULL,
	"persona" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "showcasesToPersonas_showcase_persona_pk" PRIMARY KEY("showcase","persona")
);
--> statement-breakpoint
CREATE TABLE "showcasesToScenarios" (
	"showcase" uuid NOT NULL,
	"scenario" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "showcasesToScenarios_showcase_scenario_pk" PRIMARY KEY("showcase","scenario")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userName" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ariesProofRequest" ADD CONSTRAINT "ariesProofRequest_step_action_stepAction_id_fk" FOREIGN KEY ("step_action") REFERENCES "public"."stepAction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialAttribute" ADD CONSTRAINT "credentialAttribute_credential_schema_credentialSchema_id_fk" FOREIGN KEY ("credential_schema") REFERENCES "public"."credentialSchema"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD CONSTRAINT "credentialDefinition_credential_schema_credentialSchema_id_fk" FOREIGN KEY ("credential_schema") REFERENCES "public"."credentialSchema"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD CONSTRAINT "credentialDefinition_icon_asset_id_fk" FOREIGN KEY ("icon") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD CONSTRAINT "credentialDefinition_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialRepresentation" ADD CONSTRAINT "credentialRepresentation_credential_definition_credentialDefinition_id_fk" FOREIGN KEY ("credential_definition") REFERENCES "public"."credentialDefinition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relyingPartiesToCredentialDefinitions" ADD CONSTRAINT "relyingPartiesToCredentialDefinitions_relying_party_relyingParty_id_fk" FOREIGN KEY ("relying_party") REFERENCES "public"."relyingParty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relyingPartiesToCredentialDefinitions" ADD CONSTRAINT "relyingPartiesToCredentialDefinitions_credential_definition_credentialDefinition_id_fk" FOREIGN KEY ("credential_definition") REFERENCES "public"."credentialDefinition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relyingParty" ADD CONSTRAINT "relyingParty_logo_asset_id_fk" FOREIGN KEY ("logo") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuer" ADD CONSTRAINT "issuer_logo_asset_id_fk" FOREIGN KEY ("logo") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuersToCredentialDefinitions" ADD CONSTRAINT "issuersToCredentialDefinitions_issuer_issuer_id_fk" FOREIGN KEY ("issuer") REFERENCES "public"."issuer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuersToCredentialDefinitions" ADD CONSTRAINT "issuersToCredentialDefinitions_credential_definition_credentialDefinition_id_fk" FOREIGN KEY ("credential_definition") REFERENCES "public"."credentialDefinition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuersToCredentialSchemas" ADD CONSTRAINT "issuersToCredentialSchemas_issuer_issuer_id_fk" FOREIGN KEY ("issuer") REFERENCES "public"."issuer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuersToCredentialSchemas" ADD CONSTRAINT "issuersToCredentialSchemas_credential_schema_credentialSchema_id_fk" FOREIGN KEY ("credential_schema") REFERENCES "public"."credentialSchema"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_sub_scenario_scenario_id_fk" FOREIGN KEY ("sub_scenario") REFERENCES "public"."scenario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_scenario_scenario_id_fk" FOREIGN KEY ("scenario") REFERENCES "public"."scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_asset_asset_id_fk" FOREIGN KEY ("asset") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stepAction" ADD CONSTRAINT "stepAction_step_step_id_fk" FOREIGN KEY ("step") REFERENCES "public"."step"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario" ADD CONSTRAINT "scenario_issuer_issuer_id_fk" FOREIGN KEY ("issuer") REFERENCES "public"."issuer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario" ADD CONSTRAINT "scenario_relying_party_relyingParty_id_fk" FOREIGN KEY ("relying_party") REFERENCES "public"."relyingParty"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario" ADD CONSTRAINT "scenario_banner_image_asset_id_fk" FOREIGN KEY ("banner_image") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revocationInfo" ADD CONSTRAINT "revocationInfo_credential_definition_credentialDefinition_id_fk" FOREIGN KEY ("credential_definition") REFERENCES "public"."credentialDefinition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona" ADD CONSTRAINT "persona_headshot_image_asset_id_fk" FOREIGN KEY ("headshot_image") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona" ADD CONSTRAINT "persona_body_image_asset_id_fk" FOREIGN KEY ("body_image") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenariosToPersonas" ADD CONSTRAINT "scenariosToPersonas_scenario_scenario_id_fk" FOREIGN KEY ("scenario") REFERENCES "public"."scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenariosToPersonas" ADD CONSTRAINT "scenariosToPersonas_persona_persona_id_fk" FOREIGN KEY ("persona") REFERENCES "public"."persona"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase" ADD CONSTRAINT "showcase_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase" ADD CONSTRAINT "showcase_banner_image_asset_id_fk" FOREIGN KEY ("banner_image") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase" ADD CONSTRAINT "showcase_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase" ADD CONSTRAINT "showcase_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcasesToCredentialDefinitions" ADD CONSTRAINT "showcasesToCredentialDefinitions_showcase_showcase_id_fk" FOREIGN KEY ("showcase") REFERENCES "public"."showcase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcasesToCredentialDefinitions" ADD CONSTRAINT "showcasesToCredentialDefinitions_credential_definition_credentialDefinition_id_fk" FOREIGN KEY ("credential_definition") REFERENCES "public"."credentialDefinition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcasesToPersonas" ADD CONSTRAINT "showcasesToPersonas_showcase_showcase_id_fk" FOREIGN KEY ("showcase") REFERENCES "public"."showcase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcasesToPersonas" ADD CONSTRAINT "showcasesToPersonas_persona_persona_id_fk" FOREIGN KEY ("persona") REFERENCES "public"."persona"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcasesToScenarios" ADD CONSTRAINT "showcasesToScenarios_showcase_showcase_id_fk" FOREIGN KEY ("showcase") REFERENCES "public"."showcase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcasesToScenarios" ADD CONSTRAINT "showcasesToScenarios_scenario_scenario_id_fk" FOREIGN KEY ("scenario") REFERENCES "public"."scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_credential_attributes" ON "credentialAttribute" USING btree ("credential_schema");--> statement-breakpoint
CREATE INDEX "idx_cd_icon" ON "credentialDefinition" USING btree ("icon");--> statement-breakpoint
CREATE INDEX "idx_cd_credentialSchema" ON "credentialDefinition" USING btree ("credential_schema");--> statement-breakpoint
CREATE INDEX "idx_cd_approvedBy" ON "credentialDefinition" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "idx_credential_representations" ON "credentialRepresentation" USING btree ("credential_definition");--> statement-breakpoint
CREATE INDEX "idx_relyingParty" ON "relyingPartiesToCredentialDefinitions" USING btree ("relying_party");--> statement-breakpoint
CREATE INDEX "idx_logo" ON "relyingParty" USING btree ("logo");--> statement-breakpoint
CREATE INDEX "idx_issuer_logo" ON "issuer" USING btree ("logo");--> statement-breakpoint
CREATE INDEX "idx_issuer" ON "issuersToCredentialDefinitions" USING btree ("issuer");--> statement-breakpoint
CREATE INDEX "idx_issuer_schemas" ON "issuersToCredentialSchemas" USING btree ("issuer");--> statement-breakpoint
CREATE INDEX "idx_scenarios_steps" ON "step" USING btree ("scenario");--> statement-breakpoint
CREATE INDEX "idx_asset_steps" ON "step" USING btree ("asset");--> statement-breakpoint
CREATE INDEX "idx_step_actions" ON "stepAction" USING btree ("step");--> statement-breakpoint
CREATE INDEX "idx_relyingParty_issuer_scenario" ON "scenario" USING btree ("relying_party");--> statement-breakpoint
CREATE INDEX "idx_issuer_scenario" ON "scenario" USING btree ("issuer");--> statement-breakpoint
CREATE INDEX "idx_bannerImage_issuer_scenario" ON "scenario" USING btree ("banner_image");--> statement-breakpoint
CREATE INDEX "idx_revocation_info" ON "revocationInfo" USING btree ("credential_definition");--> statement-breakpoint
CREATE INDEX "idx_headshotImage" ON "persona" USING btree ("headshot_image");--> statement-breakpoint
CREATE INDEX "idx_bodyImage" ON "persona" USING btree ("body_image");--> statement-breakpoint
CREATE INDEX "idx_scenario" ON "scenariosToPersonas" USING btree ("scenario");--> statement-breakpoint
CREATE INDEX "idx_bannerImage" ON "showcase" USING btree ("banner_image");--> statement-breakpoint
CREATE INDEX "idx_tenant_id" ON "showcase" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_sc_approvedBy" ON "showcase" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "showcases_to_credential_definitions_showcase_idx" ON "showcasesToCredentialDefinitions" USING btree ("showcase");--> statement-breakpoint
CREATE INDEX "showcases_to_personas_showcase_idx" ON "showcasesToPersonas" USING btree ("showcase");--> statement-breakpoint
CREATE INDEX "showcases_to_scenarios_showcase_idx" ON "showcasesToScenarios" USING btree ("showcase");