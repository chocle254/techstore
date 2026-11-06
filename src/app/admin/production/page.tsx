import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/guard";
import { stockLevels } from "@/lib/queries";
import { fmtDateTime, sizeLabel } from "@/lib/format";
import { BatchForm, type BatchProduct } from "./batch-form";

export const metadata = { title: "Production" };
export const dynamic = "force-dynamic";

type Waiting = { variant_id: string; qty: string };
type BatchRow = { batch: string; at: Date; product: string; lines: string; litres_ml: string; by: string | null; note: string | null };

const short = (name: string) => name.replace(/^JonWin\s+/, "");

export default async function ProductionPage() {
  await requireUser("boss", "helper", "cook");
  const db = await getDb();
  const [stock, waitingRes, productsRes, batchesRes] = await Promise.all([
    stockLevels(),
    // Bottles in online orders that haven't left yet. Stock was already taken off when the order came in.
    db.execute(sql`
      select i.variant_id, sum(i.qty) as qty
      from orders o join sales s on s.id = o.sale_id join sale_items i on i.sale_id = s.id
      where o.status in ('pending', 'paid', 'assigned') and s.voided_at is null
      group by i.variant_id`) as unknown as Promise<{ rows: Waiting[] }>,
    db.execute(sql`select id, batch_size_ml from products where is_active`) as unknown as Promise<{ rows: { id: string; batch_size_ml: number }[] }>,
    db.execute(sql`
      select coalesce(m.ref_id, m.id)::text as batch, min(m.created_at) as at, min(p.name) as product,
             string_agg(m.delta || ' × ' || case when v.size_ml < 1000 then v.size_ml || 'ml' else (v.size_ml / 1000.0)::float || 'L' end, ', ' order by v.size_ml) as lines,
             sum(m.delta * v.size_ml) as litres_ml, min(u.name) as by, min(m.note) as note
      from stock_movements m join variants v on v.id = m.variant_id join products p on p.id = v.product_id
      left join users u on u.id = m.created_by
      where m.reason = 'batch'
      group by 1 order by 2 desc limit 20`) as unknown as Promise<{ rows: BatchRow[] }>,
  ]);

  const waiting = new Map(waitingRes.rows.map((w) => [w.variant_id, Number(w.qty)]));
  const batchSize = new Map(productsRes.rows.map((p) => [p.id, Number(p.batch_size_ml)]));
  const active = stock.filter((s) => s.isActive);

  const plan = [...new Set(active.map((s) => s.productId))].map((productId) => {
    const sizes = active
      .filter((s) => s.productId === productId)
      .map((s) => ({
        ...s,
        waiting: waiting.get(s.variantId) ?? 0,
        // We make to order: first the bottles customers ordered that we don't have yet,
        forOrders: Math.max(0, -s.onHand),
        // then, optionally, enough to get back up to the alert level.
        fill: Math.max(0, s.lowStockAt - s.onHand),
      }));
    const fillMl = sizes.reduce((t, s) => t + s.fill * s.sizeMl, 0);
    const ordersMl = sizes.reduce((t, s) => t + s.forOrders * s.sizeMl, 0);
    const size = batchSize.get(productId) ?? 0;
    const batchesFor = (ml: number) => (size > 0 ? Math.ceil(ml / size) : 0);
    return { productId, name: sizes[0].product, sizes, fillMl, ordersMl, batchSizeMl: size, batches: batchesFor(fillMl), orderBatches: batchesFor(ordersMl) };
  });
  const shortages = plan.flatMap((p) => p.sizes.filter((s) => s.onHand < 0).map((s) => `${short(p.name)} ${sizeLabel(s.sizeMl)} (${-s.onHand})`));
  const todo = plan.filter((p) => p.fillMl > 0).sort((a, b) => b.ordersMl - a.ordersMl || b.fillMl - a.fillMl);
  const ordersTotalMl = plan.reduce((t, p) => t + p.ordersMl, 0);

  const formProducts: BatchProduct[] = [...todo, ...plan.filter((p) => p.fillMl === 0)].map((p) => ({
    id: p.productId,
    name: p.name,
    batchSizeMl: p.batchSizeMl,
    sizes: p.sizes.map((s) => ({ variantId: s.variantId, sizeMl: s.sizeMl, suggest: s.fill })),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Production</h1>

      {shortages.length > 0 && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          Orders are waiting for bottles we don&apos;t have: {shortages.join(", ")}. Fill these first.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_20rem]">
        <section className="space-y-3" aria-labelledby="plan-title">
          <h2 id="plan-title" className="font-semibold">
            What to make
          </h2>
          <p className="text-sm text-muted">
            Customers order first and we make what they ordered.{" "}
            {ordersTotalMl > 0 ? (
              <b className="text-ink">Open orders need {(ordersTotalMl / 1000).toLocaleString("en-KE")} L in total.</b>
            ) : (
              "No open orders are waiting to be made."
            )}
          </p>
          {todo.length === 0 && <p className="card text-muted">Every size is above its alert level. Nothing urgent to fill.</p>}
          {todo.map((p) => (
            <article key={p.productId} className="card space-y-2">
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">{short(p.name)}</h3>
                <span className="text-sm text-muted">
                  {p.ordersMl > 0 ? (
                    <b className="text-red-700">
                      {(p.ordersMl / 1000).toLocaleString("en-KE")} L for orders
                      {p.orderBatches > 0 && ` · ${p.orderBatches} batch${p.orderBatches === 1 ? "" : "es"} of ${p.batchSizeMl / 1000} L`}
                    </b>
                  ) : (
                    "Orders covered"
                  )}
                  {p.fillMl > p.ordersMl && ` · +${((p.fillMl - p.ordersMl) / 1000).toLocaleString("en-KE")} L to restock the shelf`}
                </span>
              </header>
              <table className="table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th className="text-right">Free in stock</th>
                    <th className="text-right">Packed for orders</th>
                    <th className="text-right">Make for orders</th>
                    <th className="text-right">Fill (with shelf)</th>
                  </tr>
                </thead>
                <tbody>
                  {p.sizes.map((s) => (
                    <tr key={s.variantId}>
                      <td>{sizeLabel(s.sizeMl)}</td>
                      <td className={`text-right tabular-nums ${s.onHand < 0 ? "font-semibold text-red-700" : s.onHand <= s.lowStockAt ? "text-amber-700" : ""}`}>
                        {s.onHand}
                      </td>
                      <td className="text-right tabular-nums">{s.waiting || "—"}</td>
                      <td className="text-right font-semibold text-red-700 tabular-nums">{s.forOrders || "—"}</td>
                      <td className="text-right font-semibold tabular-nums">{s.fill || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
          <p className="text-xs text-muted">
            &quot;Free in stock&quot; already has bottles for open orders taken off. A minus number means orders are waiting for that size. &quot;Make for
            orders&quot; is only what customers ordered. &quot;Fill&quot; also brings each size back up to its alert level; set an alert level of 0 to make
            strictly to order.
          </p>
        </section>

        <section className="card h-fit" aria-labelledby="batch-title">
          <h2 id="batch-title" className="mb-3 font-semibold">
            Record a batch
          </h2>
          <BatchForm products={formProducts} />
        </section>
      </div>

      <section className="card" aria-labelledby="hist-title">
        <h2 id="hist-title" className="mb-2 font-semibold">
          Recent batches
        </h2>
        {batchesRes.rows.length === 0 ? (
          <p className="text-sm text-muted">No batches recorded yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {batchesRes.rows.map((b) => (
              <li key={b.batch} className="flex justify-between gap-3 py-2">
                <span>
                  <b>{short(b.product)}</b>: {b.lines}
                  {b.note && <span className="text-muted"> · {b.note}</span>}
                  <span className="block text-xs text-muted">
                    {fmtDateTime(b.at)} · {b.by ?? "—"}
                  </span>
                </span>
                <span className="font-semibold whitespace-nowrap text-brand-700 tabular-nums">{(Number(b.litres_ml) / 1000).toLocaleString("en-KE")} L</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
