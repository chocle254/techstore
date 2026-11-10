CREATE TYPE "public"."scheduled_status" AS ENUM('scheduled', 'done', 'cancelled');--> statement-breakpoint
CREATE TABLE "scheduled_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"qty" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"due_date" date NOT NULL,
	"note" text,
	"status" "scheduled_status" DEFAULT 'scheduled' NOT NULL,
	"sale_id" uuid,
	"cancel_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scheduled_orders_sale_id_unique" UNIQUE("sale_id")
);
--> statement-breakpoint
ALTER TABLE "scheduled_order_items" ADD CONSTRAINT "scheduled_order_items_order_id_scheduled_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."scheduled_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_order_items" ADD CONSTRAINT "scheduled_order_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_orders" ADD CONSTRAINT "scheduled_orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_orders" ADD CONSTRAINT "scheduled_orders_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_orders" ADD CONSTRAINT "scheduled_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduled_order_items_order_idx" ON "scheduled_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "scheduled_orders_due_idx" ON "scheduled_orders" USING btree ("status","due_date");