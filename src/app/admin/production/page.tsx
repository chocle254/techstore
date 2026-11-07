import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { hasRole, requireUser } from "@/lib/auth/guard";
import { stockLevels } from "@/lib/queries";
import { batchesPossible, chemicalStock, qty, recipes } from "@/lib/kitchen";
import { fmtDateTime, sizeLabel } from "@/lib/format";
import { BatchForm, type BatchProduct } from "./batch-form";

export const metadata = { title: "Kitchen" };
export const dynamic = "force-dynamic";

type BatchRow = { batch: string; at: Date; product: string; lines: string; litres_ml: string; by: string | null; note: string | null };

const short = (name: string) => name.replace(/^JonWin\s+/, "");

/**
 * The cook's page. We make to order, so it shows: what open orders still need, the chemicals in the store
 * (they go down by themselves when a batch is saved), a form to save a finished batch, and past batches.
 */
export default async function KitchenPage() {
  const me = await requireUser("boss", "helper", "cook");
  const onlyMine = !hasRole(me, "boss", "helper");
  const db = await getDb();
  const [stock, productsRes, batchesRes, chems, recipeMap] = await Promise.all([
    stockLevels(),
    db.execute(sql`select id, batch_size_ml from products where is_active`) as unknown as Promise<{ rows: { id: string; batch_size_ml: number }[] }>,
    db.execute(sql`
      select coalesce(m.ref_id, m.id)::text as batch, min(m.created_at) as at, min(p.name) as product,
             string_agg(m.delta || ' × ' || case when v.size_ml < 1000 then v.size_ml || 'ml' else (v.size_ml / 1000.0)::float || 'L' end, ', ' order by v.size_ml) as lines,
             sum(m.delta * v.size_ml) as litres_ml, min(u.name) as by, min(m.note) as note
      from stock_movements m join variants v on v.id = m.variant_id join products p on p.id = v.product_id
      left join users u on u.id = m.created_by
      where m.reason = 'batch' ${onlyMine ? sql`and m.created_by = ${me.id}` : sql``}
      group by 1 order by 2 desc limit 30`) as unknown as Promise<{ rows: BatchRow[] }>,
    chemicalStock(),
    recipes(),
  ]);

  const batchSize = new Map(productsRes.rows.map((p) => [p.id, Number(p.batch_size_ml)]));
  const active = stock.filter((s) => s.isActive);
  const products = [...new Set(active.map((s) => s.productId))].map((productId) => {
    // Stock goes below zero when customers order bottles we haven't made yet: that's what to make.
    const sizes = active.filter((s) => s.productId === productId).map((s) => ({ ...s, need: Math.max(0, -s.onHand) }));
    const needMl = sizes.reduce((t, s) => t + s.need * s.sizeMl, 0);
    const size = batchSize.get(productId) ?? 0;
    const batches = size > 0 ? Math.ceil(needMl / size) : 0;
    const recipe = recipeMap.get(productId);
    const canMake = batchesPossible(recipe, chems);
    const left = new Map(chems.map((c) => [c.id, c.onHand]));
    const lacking = (recipe ?? [])
      .map((r) => ({ ...r, missing: r.amount * batches - (left.get(r.chemicalId) ?? 0) }))
      .filter((r) => r.missing > 0);
    return { productId, name: sizes[0].product, sizes, needMl, batchSizeMl: size, batches, recipe, canMake, lacking };
  });
  const todo = products.filter((p) => p.needMl > 0).sort((a, b) => b.needMl - a.needMl);

  const formProducts: BatchProduct[] = [...todo, ...products.filter((p) => p.needMl === 0)].map((p) => ({
    id: p.productId,
    name: p.name,
    batchSizeMl: p.batchSizeMl,
    sizes: p.sizes.map((s) => ({ variantId: s.variantId, sizeMl: s.sizeMl, suggest: s.need })),
    recipe: (p.recipe ?? []).map((r) => ({ name: r.name, unit: r.unit, amount: r.amount })),
  }));
  const shownChems = chems.filter((c) => c.isActive);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Kitchen</h1>

      {/* 1. What to make */}
      <section aria-labelledby="make-title" className="space-y-3">
        <h2 id="make-title" className="text-lg font-semibold">
          1. Make for orders
        </h2>
        {todo.length === 0 ? (
          <p className="card text-muted">No orders waiting to be made. New orders show up here as soon as customers place them.</p>
        ) : (
          todo.map((p) => (
            <article key={p.productId} className="card space-y-3">
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold">{short(p.name)}</h3>
                <p className="text-sm">
                  <b className="text-xl tabular-nums">{(p.needMl / 1000).toLocaleString("en-KE")} L</b>
                  {p.batches > 0 && (
                    <span className="text-muted">
                      {" "}
                      = {p.batches} batch{p.batches === 1 ? "" : "es"} of {p.batchSizeMl / 1000} L
                    </span>
                  )}
                </p>
              </header>
              <ul className="flex flex-wrap gap-2">
                {p.sizes
                  .filter((s) => s.need > 0)
                  .map((s) => (
                    <li key={s.variantId} className="rounded-full bg-surface px-3 py-1 text-sm">
                      <b className="tabular-nums">{s.need}</b> × {sizeLabel(s.sizeMl)}
                    </li>
                  ))}
              </ul>
              {p.canMake === null ? (
                <p className="text-sm text-muted">No recipe set for this product, so we can&apos;t check the chemicals.</p>
              ) : p.lacking.length === 0 ? (
                <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">✓ Enough chemicals for this.</p>
              ) : (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                  <p className="font-semibold">
                    Not enough chemicals: only enough for {p.canMake} batch{p.canMake === 1 ? "" : "es"}. Need to buy:
                  </p>
                  <ul className="mt-1 list-disc pl-5">
                    {p.lacking.map((r) => (
                      <li key={r.chemicalId}>
                        {r.name}: {qty(r.missing)} more {r.unit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))
        )}
      </section>

      {/* 2. Chemicals */}
      <section aria-labelledby="chem-title" className="card space-y-2">
        <h2 id="chem-title" className="text-lg font-semibold">
          2. Chemicals in the store
        </h2>
        {shownChems.length === 0 ? (
          <p className="text-sm text-muted">No chemicals added yet. The boss adds them under Chemicals.</p>
        ) : (
          <ul className="divide-y divide-line">
            {shownChems.map((c) => (
              <li key={c.id} className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="font-medium">{c.name}</span>
                <span className={`text-right tabular-nums ${c.onHand <= 0 ? "font-semibold text-red-700" : ""}`}>
                  <b className="text-lg">{qty(c.onHand)}</b> <span className="text-sm text-muted">{c.unit}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">These go down by themselves when you save a batch.</p>
      </section>

      {/* 3. Save a batch */}
      <section aria-labelledby="batch-title" className="card">
        <h2 id="batch-title" className="mb-3 text-lg font-semibold">
          3. Finished a batch? Save it here
        </h2>
        <BatchForm products={formProducts} />
      </section>

      {/* 4. History */}
      <section aria-labelledby="hist-title" className="card">
        <h2 id="hist-title" className="mb-2 text-lg font-semibold">
          {onlyMine ? "Your batches" : "Recent batches"}
        </h2>
        {batchesRes.rows.length === 0 ? (
          <p className="text-sm text-muted">No batches saved yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {batchesRes.rows.map((b) => (
              <li key={b.batch} className="flex justify-between gap-3 py-2">
                <span>
                  <b>{short(b.product)}</b>: {b.lines}
                  {b.note && <span className="text-muted"> · {b.note}</span>}
                  <span className="block text-xs text-muted">
                    {fmtDateTime(b.at)}
                    {!onlyMine && ` · ${b.by ?? "—"}`}
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
