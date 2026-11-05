-- Financial records are append-only. These guards apply to every connection, including the app itself.
CREATE OR REPLACE FUNCTION jonwin_block_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Records in % cannot be edited or deleted. Add a correcting entry instead.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER payments_append_only BEFORE UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION jonwin_block_change();
--> statement-breakpoint
CREATE TRIGGER sale_items_append_only BEFORE UPDATE OR DELETE ON sale_items FOR EACH ROW EXECUTE FUNCTION jonwin_block_change();
--> statement-breakpoint
CREATE TRIGGER stock_movements_append_only BEFORE UPDATE OR DELETE ON stock_movements FOR EACH ROW EXECUTE FUNCTION jonwin_block_change();
--> statement-breakpoint
CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION jonwin_block_change();
--> statement-breakpoint
-- Sales and expenses: never deleted; the only allowed change is voiding once.
CREATE OR REPLACE FUNCTION jonwin_void_only() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Records in % cannot be deleted. Void them instead.', TG_TABLE_NAME;
  END IF;
  IF OLD.voided_at IS NOT NULL THEN
    RAISE EXCEPTION 'This record in % is already voided.', TG_TABLE_NAME;
  END IF;
  IF NEW.voided_at IS NULL THEN
    RAISE EXCEPTION 'Records in % can only be voided, not edited.', TG_TABLE_NAME;
  END IF;
  IF (to_jsonb(NEW) - 'voided_at' - 'voided_by' - 'void_reason') <> (to_jsonb(OLD) - 'voided_at' - 'voided_by' - 'void_reason') THEN
    RAISE EXCEPTION 'Records in % can only be voided, not edited.', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER sales_void_only BEFORE UPDATE OR DELETE ON sales FOR EACH ROW EXECUTE FUNCTION jonwin_void_only();
--> statement-breakpoint
CREATE TRIGGER expenses_void_only BEFORE UPDATE OR DELETE ON expenses FOR EACH ROW EXECUTE FUNCTION jonwin_void_only();
