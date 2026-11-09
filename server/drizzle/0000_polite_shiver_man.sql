CREATE TYPE "public"."equip_slot" AS ENUM('weapon', 'armor', 'helmet', 'shield', 'accessory');--> statement-breakpoint
CREATE TYPE "public"."pgc_kind" AS ENUM('texture', 'map', 'weapon', 'armor', 'monster');--> statement-breakpoint
CREATE TYPE "public"."pgc_status" AS ENUM('pending_upload', 'uploaded', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" text NOT NULL,
	"last_login_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_equipment" (
	"character_id" uuid NOT NULL,
	"slot" "equip_slot" NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	CONSTRAINT "character_equipment_character_id_slot_pk" PRIMARY KEY("character_id","slot")
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"exp" bigint DEFAULT 0 NOT NULL,
	"str" integer DEFAULT 1 NOT NULL,
	"agi" integer DEFAULT 1 NOT NULL,
	"vit" integer DEFAULT 1 NOT NULL,
	"int" integer DEFAULT 1 NOT NULL,
	"dex" integer DEFAULT 1 NOT NULL,
	"luk" integer DEFAULT 1 NOT NULL,
	"stat_points" integer DEFAULT 0 NOT NULL,
	"hp" integer DEFAULT 150 NOT NULL,
	"max_hp" integer DEFAULT 150 NOT NULL,
	"map_id" text DEFAULT 'test_map' NOT NULL,
	"pos_x" real DEFAULT 0 NOT NULL,
	"pos_y" real DEFAULT 0 NOT NULL,
	"pos_z" real DEFAULT 2 NOT NULL,
	"facing" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"template_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"slot_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slot" "equip_slot" NOT NULL,
	"base_stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"pgc_asset_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pgc_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"kind" "pgc_kind" NOT NULL,
	"object_key" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text,
	"status" "pgc_status" DEFAULT 'pending_upload' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_equipment" ADD CONSTRAINT "character_equipment_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_equipment" ADD CONSTRAINT "character_equipment_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_template_id_item_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."item_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_templates" ADD CONSTRAINT "item_templates_pgc_asset_id_pgc_assets_id_fk" FOREIGN KEY ("pgc_asset_id") REFERENCES "public"."pgc_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pgc_assets" ADD CONSTRAINT "pgc_assets_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_guest_id_uq" ON "accounts" USING btree ("guest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "characters_name_uq" ON "characters" USING btree ("name");--> statement-breakpoint
CREATE INDEX "characters_account_idx" ON "characters" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "inventory_character_idx" ON "inventory_items" USING btree ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_char_slot_uq" ON "inventory_items" USING btree ("character_id","slot_index");--> statement-breakpoint
CREATE INDEX "pgc_assets_owner_idx" ON "pgc_assets" USING btree ("owner_account_id");--> statement-breakpoint
CREATE INDEX "pgc_assets_status_idx" ON "pgc_assets" USING btree ("status");