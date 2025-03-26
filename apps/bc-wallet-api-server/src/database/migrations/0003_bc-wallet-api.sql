ALTER TABLE "step" ADD COLUMN "screenId" text;--> statement-breakpoint
ALTER TABLE "credentialDefinition" ALTER COLUMN "icon" DROP NOT NULL;--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier_type" "IdentifierType",
	"identifier" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credentialDefinition" ALTER COLUMN "icon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "showcase" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "showcase" ADD CONSTRAINT "showcase_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;