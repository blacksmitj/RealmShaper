ALTER TYPE "public"."pgc_kind" ADD VALUE 'prop';--> statement-breakpoint
CREATE TABLE "map_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"map_id" text NOT NULL,
	"map_name" text NOT NULL,
	"map_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "map_drafts" ADD CONSTRAINT "map_drafts_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "map_drafts_owner_idx" ON "map_drafts" USING btree ("owner_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "map_drafts_owner_map_id_uq" ON "map_drafts" USING btree ("owner_account_id","map_id");