CREATE TYPE "public"."chemical_reason" AS ENUM('purchase', 'batch', 'adjustment');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'ready' BEFORE 'assigned';--> statement-breakpoint
CREATE TABLE "chemical_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chemical_id" uuid NOT NULL,
	"delta" numeric(12, 2) NOT NULL,
	"reason" "chemical_reason" NOT NULL,
	"ref_id" uuid,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chemicals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chemicals_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "recipe_items" (
	"product_id" uuid NOT NULL,
	"chemical_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	CONSTRAINT "recipe_items_product_id_chemical_id_pk" PRIMARY KEY("product_id","chemical_id")
);
--> statement-breakpoint
ALTER TABLE "chemical_movements" ADD CONSTRAINT "chemical_movements_chemical_id_chemicals_id_fk" FOREIGN KEY ("chemical_id") REFERENCES "public"."chemicals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chemical_movements" ADD CONSTRAINT "chemical_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_chemical_id_chemicals_id_fk" FOREIGN KEY ("chemical_id") REFERENCES "public"."chemicals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chemical_movements_chemical_idx" ON "chemical_movements" USING btree ("chemical_id");--> statement-breakpoint
CREATE INDEX "chemical_movements_ref_idx" ON "chemical_movements" USING btree ("ref_id");--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_amount_positive" CHECK ("amount" > 0);--> statement-breakpoint
CREATE TRIGGER chemical_movements_append_only BEFORE UPDATE OR DELETE ON chemical_movements FOR EACH ROW EXECUTE FUNCTION jonwin_block_change();--> statement-breakpoint
-- Starter recipe for one batch of liquid soap, from the owner's description. Names and amounts can be changed in Admin > Chemicals.
INSERT INTO "chemicals" ("name", "unit") VALUES
	('Thick soap base (the slimy one)', '1 L bottle'),
	('Salt', 'paper packet'),
	('Glycerin', 'quarter bottle'),
	('Colour', 'sachet'),
	('White powder', 'packet'),
	('Caustic', 'packet')
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
INSERT INTO "recipe_items" ("product_id", "chemical_id", "amount")
SELECT p.id, c.id, 1 FROM "products" p CROSS JOIN "chemicals" c
WHERE p.slug = 'liquid-soap' AND c.name IN ('Thick soap base (the slimy one)', 'Salt', 'Glycerin', 'Colour', 'White powder', 'Caustic')
ON CONFLICT DO NOTHING;
