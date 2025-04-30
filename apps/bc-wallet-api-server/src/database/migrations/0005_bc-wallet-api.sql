ALTER TABLE "credentialSchema" ALTER COLUMN "source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ADD COLUMN "source" "Source" DEFAULT 'CREATED' NOT NULL;