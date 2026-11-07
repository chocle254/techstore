import "server-only";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb, schema } from "@/db";

const { products, variants, deliveryAreas, orders, sales, saleItems, payments, ratings } = schema;

export type CatalogSize = { variantId: string; sizeMl: number; price: number };
export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  sizes: CatalogSize[];
};

/** Products and sizes a customer can see. Sizes with no price yet are listed with price 0 and can't be bought. */
async function loadCatalog(): Promise<CatalogProduct[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      // Uploaded photos live in the row as data URLs; hand out a short cacheable link instead of the bytes.
      imageUrl: sql<string | null>`case when ${products.imageUrl} like 'data:%' then '/shop-img/' || ${products.id} || '?v=' || left(md5(${products.imageUrl}), 10) else ${products.imageUrl} end`,
      variantId: variants.id,
      sizeMl: variants.sizeMl,
      price: variants.price,
    })
    .from(products)
    .innerJoin(variants, eq(variants.productId, products.id))
    .where(and(eq(products.isActive, true), eq(variants.isActive, true)))
    .orderBy(asc(products.createdAt), asc(products.name), asc(variants.sizeMl));

  const map = new Map<string, CatalogProduct>();
  for (const r of rows) {
    let p = map.get(r.id);
    if (!p) {
      p = { id: r.id, slug: r.slug, name: r.name, description: r.description, imageUrl: r.imageUrl, sizes: [] };
      map.set(r.id, p);
    }
    p.sizes.push({ variantId: r.variantId, sizeMl: r.sizeMl, price: r.price });
  }
  return [...map.values()];
}

export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  return (await getCatalog()).find((p) => p.slug === slug) ?? null;
}

export type RatingSummary = Record<string, { avg: number; count: number }>;

/** Average stars per product id, from customer ratings. */
async function loadRatingSummary(): Promise<RatingSummary> {
  const db = await getDb();
  const rows = await db
    .select({
      productId: ratings.productId,
      avg: sql<number>`avg(${ratings.stars})`.mapWith(Number),
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(ratings)
    .groupBy(ratings.productId);
  return Object.fromEntries(rows.map((r) => [r.productId, { avg: r.avg, count: r.count }]));
}

export type Area = { id: string; name: string; fee: number };

async function loadAreas(): Promise<Area[]> {
  const db = await getDb();
  return db
    .select({ id: deliveryAreas.id, name: deliveryAreas.name, fee: deliveryAreas.fee })
    .from(deliveryAreas)
    .where(eq(deliveryAreas.isActive, true))
    .orderBy(asc(deliveryAreas.fee), asc(deliveryAreas.name));
}

// Shop pages read these on every visit, so they're shared between visitors for up to a minute.
// Admin changes to products, prices, photos or delivery areas clear them at once (updateTag(SHOP_TAG)).
// Checkout never trusts these: it reads prices and fees fresh from the database.
export const SHOP_TAG = "shop";
const shared = <T,>(fn: () => Promise<T>, key: string, seconds: number) =>
  cache(unstable_cache(fn, [key], { tags: [SHOP_TAG], revalidate: seconds }));
export const getCatalog = shared(loadCatalog, "catalog", 60);
export const getAreas = shared(loadAreas, "areas", 60);
export const getRatingSummary = shared(loadRatingSummary, "ratings", 300);

export type OrderLine = { productId: string; name: string; sizeMl: number; qty: number; unitPrice: number };
export type OrderView = {
  id: string;
  orderNo: number;
  status: (typeof schema.orderStatusEnum.enumValues)[number];
  payMethod: "mpesa" | "cod";
  payRef: string | null;
  areaName: string;
  address: string;
  lat: string | null;
  lng: string | null;
  contactName: string;
  contactPhone: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paid: number;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  saleId: string;
  riderId: string | null;
  riderName: string | null;
  note: string | null;
  lines: OrderLine[];
};

async function linesFor(saleIds: string[]) {
  if (!saleIds.length) return new Map<string, OrderLine[]>();
  const db = await getDb();
  const rows = await db
    .select({
      saleId: saleItems.saleId,
      productId: products.id,
      name: products.name,
      sizeMl: variants.sizeMl,
      qty: saleItems.qty,
      unitPrice: saleItems.unitPrice,
    })
    .from(saleItems)
    .innerJoin(variants, eq(variants.id, saleItems.variantId))
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(saleItems.saleId, saleIds))
    .orderBy(asc(products.name), asc(variants.sizeMl));
  const map = new Map<string, OrderLine[]>();
  for (const r of rows) {
    const list = map.get(r.saleId) ?? [];
    list.push({ productId: r.productId, name: r.name, sizeMl: r.sizeMl, qty: r.qty, unitPrice: r.unitPrice });
    map.set(r.saleId, list);
  }
  return map;
}

const orderSelect = {
  id: orders.id,
  orderNo: sales.receiptNo,
  status: orders.status,
  payMethod: orders.payMethod,
  payRef: orders.payRef,
  areaName: orders.areaName,
  address: orders.address,
  lat: orders.lat,
  lng: orders.lng,
  contactName: orders.contactName,
  contactPhone: orders.contactPhone,
  subtotal: sales.subtotal,
  deliveryFee: sales.deliveryFee,
  total: sales.total,
  paid: sql<number>`coalesce((select sum(${payments.amount}) from ${payments} where ${payments.saleId} = ${sales.id}), 0)`.mapWith(Number),
  createdAt: orders.createdAt,
  updatedAt: orders.updatedAt,
  customerId: orders.customerId,
  saleId: orders.saleId,
  riderId: orders.riderId,
  riderName: sql<string | null>`(select u.name from users u where u.id = ${orders.riderId})`,
  note: orders.note,
};

/** Orders, newest first. Pass a customer or rider id to see only theirs, or statuses to filter. */
export async function listOrders(
  opts: { customerId?: string; riderId?: string; statuses?: OrderView["status"][]; limit?: number; oldestFirst?: boolean } = {},
): Promise<OrderView[]> {
  const db = await getDb();
  const where = and(
    opts.customerId ? eq(orders.customerId, opts.customerId) : undefined,
    opts.riderId ? eq(orders.riderId, opts.riderId) : undefined,
    opts.statuses?.length ? inArray(orders.status, opts.statuses) : undefined,
  );
  const rows = await db
    .select(orderSelect)
    .from(orders)
    .innerJoin(sales, eq(sales.id, orders.saleId))
    .where(where)
    .orderBy(opts.oldestFirst ? asc(orders.createdAt) : desc(orders.createdAt))
    .limit(opts.limit ?? 100);
  const lines = await linesFor(rows.map((r) => r.saleId));
  return rows.map((r) => ({ ...r, lines: lines.get(r.saleId) ?? [] }));
}

export async function getOrder(id: string): Promise<OrderView | null> {
  const db = await getDb();
  const [row] = await db.select(orderSelect).from(orders).innerJoin(sales, eq(sales.id, orders.saleId)).where(eq(orders.id, id));
  if (!row) return null;
  const lines = await linesFor([row.saleId]);
  return { ...row, lines: lines.get(row.saleId) ?? [] };
}

/** The customer's last delivered order, with the products they haven't rated yet. */
export async function pendingRatings(customerId: string) {
  const db = await getDb();
  const [last] = await db
    .select({ id: orders.id, saleId: orders.saleId, orderNo: sales.receiptNo, createdAt: orders.createdAt })
    .from(orders)
    .innerJoin(sales, eq(sales.id, orders.saleId))
    .where(and(eq(orders.customerId, customerId), eq(orders.status, "delivered"), isNull(sales.voidedAt)))
    .orderBy(desc(orders.createdAt))
    .limit(1);
  if (!last) return null;
  const done = await db.select({ productId: ratings.productId }).from(ratings).where(eq(ratings.orderId, last.id));
  const rated = new Set(done.map((d) => d.productId));
  const lines = (await linesFor([last.saleId])).get(last.saleId) ?? [];
  const seen = new Set<string>();
  const toRate = lines.filter((l) => !rated.has(l.productId) && !seen.has(l.productId) && seen.add(l.productId));
  if (!toRate.length) return null;
  return { orderId: last.id, orderNo: last.orderNo, products: toRate.map((l) => ({ id: l.productId, name: l.name })) };
}

/** Money in and out on the customer's online and walk-in purchases. Append-only, newest first. */
export async function customerLedger(customerId: string) {
  const db = await getDb();
  return db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      note: payments.note,
      paidAt: payments.paidAt,
      receiptNo: sales.receiptNo,
    })
    .from(payments)
    .innerJoin(sales, eq(sales.id, payments.saleId))
    .where(eq(sales.customerId, customerId))
    .orderBy(desc(payments.paidAt))
    .limit(200);
}

export const STATUS_LABELS: Record<OrderView["status"], string> = {
  pending: "Waiting for payment",
  paid: "Paid, being made",
  ready: "Ready, waiting for a rider",
  assigned: "Rider assigned",
  out_for_delivery: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Staff who can take deliveries (rider role, not suspended). */
export async function listRiders() {
  const db = await getDb();
  return db
    .select({ id: schema.users.id, name: schema.users.name })
    .from(schema.users)
    .where(and(sql`'rider' = any(${schema.users.roles})`, isNull(schema.users.suspendedAt)))
    .orderBy(asc(schema.users.name));
}
