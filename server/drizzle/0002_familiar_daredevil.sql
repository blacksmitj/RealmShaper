ALTER TABLE "map_drafts" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "map_drafts_published_idx" ON "map_drafts" USING btree ("is_published");