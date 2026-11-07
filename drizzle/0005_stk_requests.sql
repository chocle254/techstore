CREATE TABLE "stk_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"checkout_request_id" text NOT NULL,
	"merchant_request_id" text,
	"phone" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stk_requests_checkout_request_id_unique" UNIQUE("checkout_request_id")
);
--> statement-breakpoint
ALTER TABLE "stk_requests" ADD CONSTRAINT "stk_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stk_requests_order_idx" ON "stk_requests" USING btree ("order_id");