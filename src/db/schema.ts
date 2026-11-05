import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  index,
  uniqueIndex,
  jsonb,
  date,
} from "drizzle-orm/pg-core";

// Money is stored as whole Kenyan shillings (integer). Volumes are stored in millilitres.

export const roleEnum = pgEnum("role", ["boss", "helper", "cook", "rider", "customer"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "mpesa", "online", "cod", "credit"]);
export const saleChannelEnum = pgEnum("sale_channel", ["walk_in", "online"]);
export const stockReasonEnum = pgEnum("stock_reason", ["sale", "batch", "restock", "adjustment", "void"]);
export const expenseCategoryEnum = pgEnum("expense_category", [
  "transport",
  "containers",
  "labels",
  "rent",
  "chemicals",
  "tips",
  "wages",
  "other",
]);

// People: staff, riders and customers. Customers recorded at walk-in sales may have no password.
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    passwordHash: text("password_hash"),
    roles: roleEnum("roles").array().notNull().default(["customer"]),
    isTrusted: boolean("is_trusted").notNull().default(false),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    suspendedReason: text("suspended_reason"),
    failedLogins: integer("failed_logins").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    locationLabel: text("location_label"),
    locationLat: text("location_lat"),
    locationLng: text("location_lng"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_phone_idx").on(t.phone), uniqueIndex("users_email_idx").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    // sha256 of the cookie token; the raw token is never stored.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  batchSizeMl: integer("batch_size_ml").notNull().default(25000),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A product in one bottle size, e.g. "JonWin Bleach 5L".
export const variants = pgTable(
  "variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    sizeMl: integer("size_ml").notNull(),
    price: integer("price").notNull(),
    cost: integer("cost").notNull().default(0),
    lowStockAt: integer("low_stock_at").notNull().default(5),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [uniqueIndex("variants_product_size_idx").on(t.productId, t.sizeMl)],
);

// Append-only. Current stock = sum(delta) per variant.
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => variants.id),
    delta: integer("delta").notNull(),
    reason: stockReasonEnum("reason").notNull(),
    refId: uuid("ref_id"),
    note: text("note"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("stock_variant_idx").on(t.variantId)],
);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Client-generated id so a sale retried after a network drop is only saved once.
    clientId: text("client_id").unique(),
    receiptNo: integer("receipt_no").generatedAlwaysAsIdentity(),
    channel: saleChannelEnum("channel").notNull(),
    customerId: uuid("customer_id").references(() => users.id),
    soldBy: uuid("sold_by").references(() => users.id),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull().default(0),
    total: integer("total").notNull(),
    dueDate: date("due_date"),
    note: text("note"),
    // Sales are never deleted. A mistake is voided, which reverses stock and is logged.
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidedBy: uuid("voided_by").references(() => users.id),
    voidReason: text("void_reason"),
    soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sales_sold_at_idx").on(t.soldAt), index("sales_customer_idx").on(t.customerId)],
);

export const saleItems = pgTable(
  "sale_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => variants.id),
    qty: integer("qty").notNull(),
    unitPrice: integer("unit_price").notNull(),
    unitCost: integer("unit_cost").notNull(),
  },
  (t) => [index("sale_items_sale_idx").on(t.saleId)],
);

// Append-only. Money received against a sale (full payment, or part payments on owed sales).
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id),
    amount: integer("amount").notNull(),
    method: paymentMethodEnum("method").notNull(),
    reference: text("reference"),
    receivedBy: uuid("received_by").references(() => users.id),
    note: text("note"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_sale_idx").on(t.saleId), index("payments_paid_at_idx").on(t.paidAt)],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: expenseCategoryEnum("category").notNull(),
    amount: integer("amount").notNull(),
    note: text("note").notNull().default(""),
    spentOn: date("spent_on").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidedBy: uuid("voided_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("expenses_spent_on_idx").on(t.spentOn)],
);

// Append-only record of who changed what.
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

// One-time password reset links. Only the sha256 of the token is stored.
export const passwordResets = pgTable("password_resets", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
