import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

// All reports group by Nairobi local time.
const TZ = "Africa/Nairobi";

export type Range = { from: string; to: string }; // inclusive YYYY-MM-DD
export type Bucket = "day" | "week" | "month" | "year";

async function rows<T>(q: ReturnType<typeof sql>): Promise<T[]> {
  const db = await getDb();
  const res = (await db.execute(q)) as unknown as { rows: T[] };
  return res.rows;
}

const inRange = (col: ReturnType<typeof sql>, r: Range) =>
  sql`(${col} at time zone ${TZ})::date between ${r.from}::date and ${r.to}::date`;

export async function summary(r: Range) {
  const [s] = await rows<{ revenue: string; cogs: string; sales_count: string; litres_ml: string }>(sql`
    select coalesce(sum(i.qty * i.unit_price), 0) as revenue,
           coalesce(sum(i.qty * i.unit_cost), 0) as cogs,
           count(distinct s.id) as sales_count,
           coalesce(sum(i.qty * v.size_ml), 0) as litres_ml
    from sales s
    join sale_items i on i.sale_id = s.id
    join variants v on v.id = i.variant_id
    where s.voided_at is null and ${inRange(sql`s.sold_at`, r)}`);
  const [e] = await rows<{ total: string }>(sql`
    select coalesce(sum(amount), 0) as total from expenses
    where voided_at is null and spent_on between ${r.from}::date and ${r.to}::date`);
  const [p] = await rows<{ total: string }>(sql`
    select coalesce(sum(amount), 0) as total from payments where ${inRange(sql`paid_at`, r)}`);
  const owed = await owedTotal();
  const revenue = Number(s.revenue);
  const cogs = Number(s.cogs);
  const expenses = Number(e.total);
  return {
    revenue,
    cogs,
    grossProfit: revenue - cogs,
    expenses,
    netProfit: revenue - cogs - expenses,
    salesCount: Number(s.sales_count),
    litres: Number(s.litres_ml) / 1000,
    cashIn: Number(p.total),
    owed,
  };
}

export async function salesSeries(r: Range, bucket: Bucket) {
  const unit = sql.raw(`'${bucket}'`);
  const sales = await rows<{ bucket: string; revenue: string; cogs: string }>(sql`
    select to_char(date_trunc(${unit}, s.sold_at at time zone ${TZ}), 'YYYY-MM-DD') as bucket,
           sum(i.qty * i.unit_price) as revenue, sum(i.qty * i.unit_cost) as cogs
    from sales s join sale_items i on i.sale_id = s.id
    where s.voided_at is null and ${inRange(sql`s.sold_at`, r)}
    group by 1 order by 1`);
  const exp = await rows<{ bucket: string; total: string }>(sql`
    select to_char(date_trunc(${unit}, spent_on::timestamp), 'YYYY-MM-DD') as bucket, sum(amount) as total
    from expenses where voided_at is null and spent_on between ${r.from}::date and ${r.to}::date
    group by 1 order by 1`);
  const keys = [...new Set([...sales.map((x) => x.bucket), ...exp.map((x) => x.bucket)])].sort();
  return keys.map((k) => {
    const s = sales.find((x) => x.bucket === k);
    const e = exp.find((x) => x.bucket === k);
    const revenue = Number(s?.revenue ?? 0);
    const expenses = Number(e?.total ?? 0);
    return { bucket: k, revenue, expenses, profit: revenue - Number(s?.cogs ?? 0) - expenses };
  });
}

export async function topProducts(r: Range) {
  return (
    await rows<{ name: string; revenue: string; litres_ml: string }>(sql`
      select p.name, sum(i.qty * i.unit_price) as revenue, sum(i.qty * v.size_ml) as litres_ml
      from sales s join sale_items i on i.sale_id = s.id
      join variants v on v.id = i.variant_id join products p on p.id = v.product_id
      where s.voided_at is null and ${inRange(sql`s.sold_at`, r)}
      group by p.name order by 2 desc`)
  ).map((x) => ({ name: x.name, revenue: Number(x.revenue), litres: Number(x.litres_ml) / 1000 }));
}

export async function topSizes(r: Range) {
  return (
    await rows<{ size_ml: number; qty: string; revenue: string }>(sql`
      select v.size_ml, sum(i.qty) as qty, sum(i.qty * i.unit_price) as revenue
      from sales s join sale_items i on i.sale_id = s.id join variants v on v.id = i.variant_id
      where s.voided_at is null and ${inRange(sql`s.sold_at`, r)}
      group by v.size_ml order by v.size_ml`)
  ).map((x) => ({ sizeMl: Number(x.size_ml), qty: Number(x.qty), revenue: Number(x.revenue) }));
}

export async function expensesByCategory(r: Range) {
  return (
    await rows<{ category: string; total: string }>(sql`
      select category, sum(amount) as total from expenses
      where voided_at is null and spent_on between ${r.from}::date and ${r.to}::date
      group by category order by 2 desc`)
  ).map((x) => ({ category: x.category, total: Number(x.total) }));
}

export async function paymentSplit(r: Range) {
  return (
    await rows<{ method: string; total: string }>(sql`
      select payment_method as method, sum(total) as total from sales
      where voided_at is null and ${inRange(sql`sold_at`, r)}
      group by 1 order by 2 desc`)
  ).map((x) => ({ method: x.method, total: Number(x.total) }));
}

export type StockRow = {
  variantId: string;
  productId: string;
  product: string;
  sizeMl: number;
  price: number;
  cost: number;
  lowStockAt: number;
  isActive: boolean;
  onHand: number;
};

export async function stockLevels(): Promise<StockRow[]> {
  return (
    await rows<{
      variant_id: string;
      product_id: string;
      product: string;
      size_ml: number;
      price: number;
      cost: number;
      low_stock_at: number;
      is_active: boolean;
      on_hand: string;
    }>(sql`
      select v.id as variant_id, p.id as product_id, p.name as product, v.size_ml, v.price, v.cost,
             v.low_stock_at, (v.is_active and p.is_active) as is_active,
             coalesce((select sum(delta) from stock_movements m where m.variant_id = v.id), 0) as on_hand
      from variants v join products p on p.id = v.product_id
      order by p.name, v.size_ml`)
  ).map((x) => ({
    variantId: x.variant_id,
    productId: x.product_id,
    product: x.product,
    sizeMl: Number(x.size_ml),
    price: Number(x.price),
    cost: Number(x.cost),
    lowStockAt: Number(x.low_stock_at),
    isActive: x.is_active,
    onHand: Number(x.on_hand),
  }));
}

export type OwedRow = {
  saleId: string;
  receiptNo: number;
  customerId: string | null;
  customer: string;
  phone: string;
  total: number;
  paid: number;
  balance: number;
  soldAt: string;
  dueDate: string | null;
};

const OWED_SQL = sql`
  select s.id as sale_id, s.receipt_no, s.customer_id, coalesce(u.name, 'Unknown') as customer, coalesce(u.phone, '') as phone,
         s.total, coalesce(sum(pay.amount), 0) as paid, s.sold_at, s.due_date
  from sales s
  left join users u on u.id = s.customer_id
  left join payments pay on pay.sale_id = s.id
  where s.voided_at is null and s.payment_method = 'credit'
  group by s.id, u.name, u.phone
  having s.total - coalesce(sum(pay.amount), 0) > 0`;

export async function owedList(): Promise<OwedRow[]> {
  return (
    await rows<{
      sale_id: string;
      receipt_no: number;
      customer_id: string | null;
      customer: string;
      phone: string;
      total: number;
      paid: string;
      sold_at: Date;
      due_date: string | null;
    }>(sql`${OWED_SQL} order by s.sold_at`)
  ).map((x) => ({
    saleId: x.sale_id,
    receiptNo: Number(x.receipt_no),
    customerId: x.customer_id,
    customer: x.customer,
    phone: x.phone,
    total: Number(x.total),
    paid: Number(x.paid),
    balance: Number(x.total) - Number(x.paid),
    soldAt: new Date(x.sold_at).toISOString(),
    dueDate: x.due_date ? String(x.due_date).slice(0, 10) : null,
  }));
}

export async function owedTotal(): Promise<number> {
  const [r] = await rows<{ total: string }>(sql`select coalesce(sum(o.total - o.paid), 0) as total from (${OWED_SQL}) o`);
  return Number(r.total);
}

// ---------- Online shop ----------

/** Live counts of online orders that need someone to act. Not tied to the date filter. */
export async function orderQueue() {
  const [r] = await rows<{ check_pay: string; to_make: string; ready: string; on_road: string; oldest: Date | null }>(sql`
    select count(*) filter (where status = 'pending' and pay_method = 'mpesa') as check_pay,
           count(*) filter (where status = 'paid' or (status = 'pending' and pay_method = 'cod')) as to_make,
           count(*) filter (where status = 'ready') as ready,
           count(*) filter (where status in ('assigned', 'out_for_delivery')) as on_road,
           min(created_at) filter (where status in ('pending', 'paid', 'ready')) as oldest
    from orders`);
  return {
    checkPay: Number(r.check_pay),
    toMake: Number(r.to_make),
    ready: Number(r.ready),
    onRoad: Number(r.on_road),
    oldestWaiting: r.oldest ? new Date(r.oldest) : null,
  };
}

/** Product sales (delivery fees left out) split into shop counter and online. */
export async function channelSplit(r: Range) {
  return (
    await rows<{ channel: string; revenue: string; sales_count: string }>(sql`
      select s.channel, sum(i.qty * i.unit_price) as revenue, count(distinct s.id) as sales_count
      from sales s join sale_items i on i.sale_id = s.id
      where s.voided_at is null and ${inRange(sql`s.sold_at`, r)}
      group by 1 order by 2 desc`)
  ).map((x) => ({ channel: x.channel as "walk_in" | "online", revenue: Number(x.revenue), count: Number(x.sales_count) }));
}

/** Online orders per delivery area, cancelled ones left out. */
export async function ordersByArea(r: Range) {
  return (
    await rows<{ area: string; orders: string; fees: string }>(sql`
      select area_name as area, count(*) as orders, sum(delivery_fee) as fees
      from orders
      where status <> 'cancelled' and ${inRange(sql`created_at`, r)}
      group by 1 order by 2 desc, 1`)
  ).map((x) => ({ area: x.area, orders: Number(x.orders), fees: Number(x.fees) }));
}

/** Average customer star rating per product, all time. */
export async function productRatings() {
  return (
    await rows<{ name: string; avg: string; n: string }>(sql`
      select p.name, avg(r.stars) as avg, count(*) as n
      from ratings r join products p on p.id = r.product_id
      group by p.name order by 2 desc, 3 desc`)
  ).map((x) => ({ name: x.name, avg: Number(x.avg), count: Number(x.n) }));
}
