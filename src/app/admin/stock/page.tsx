import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/guard";
import { stockLevels } from "@/lib/queries";
import { fmtDateTime, sizeLabel } from "@/lib/format";
import { StockForm } from "./stock-form";

export const metadata = { title: "Stock" };

const REASON: Record<string, string> = {
  sale: "Sold",
  batch: "From batch",
  restock: "New bottles",
  adjustment: "Correction",
  void: "Sale voided",
};

export default async function StockPage() {
  await requireUser("boss", "helper");
  const stock = (await stockLevels()).filter((s) => s.isActive);
  const db = await getDb();
  const { rows: history } = (await db.execute(sql`
    select m.delta, m.reason, m.note, m.created_at, p.name as product, v.size_ml, u.name as by
    from stock_movements m join variants v on v.id = m.variant_id join products p on p.id = v.product_id
    left join users u on u.id = m.created_by
    where m.reason <> 'sale'
    order by m.created_at desc limit 40`)) as unknown as {
    rows: { delta: number; reason: string; note: string | null; created_at: Date; product: string; size_ml: number; by: string | null }[];
  };

  const products = [...new Set(stock.map((s) => s.product))];
  const low = stock.filter((s) => s.onHand <= s.lowStockAt);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Stock</h1>

      {low.length > 0 && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          ⚠️ Running low: {low.map((s) => `${s.product.replace(/^JonWin\s+/, "")} ${sizeLabel(s.sizeMl)} (${s.onHand})`).join(", ")}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_20rem]">
        <section className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                {[...new Set(stock.map((s) => s.sizeMl))]
                  .sort((a, b) => a - b)
                  .map((ml) => (
                    <th key={ml} className="text-right">
                      {sizeLabel(ml)}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p}>
                  <td className="font-medium whitespace-nowrap">{p.replace(/^JonWin\s+/, "")}</td>
                  {[...new Set(stock.map((s) => s.sizeMl))]
                    .sort((a, b) => a - b)
                    .map((ml) => {
                      const s = stock.find((x) => x.product === p && x.sizeMl === ml);
                      if (!s) return <td key={ml} className="text-right text-muted">—</td>;
                      const isLow = s.onHand <= s.lowStockAt;
                      return (
                        <td key={ml} className={`text-right tabular-nums ${isLow ? "font-semibold text-amber-700" : ""}`}>
                          {s.onHand}
                          {isLow && <span className="sr-only"> (low)</span>}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">Bottles in stock. Amber = at or below the alert level.</p>
        </section>

        <section className="card">
          <h2 className="mb-3 font-semibold">Add or correct stock</h2>
          <StockForm options={stock} />
        </section>
      </div>

      <section className="card">
        <h2 className="mb-2 font-semibold">Recent stock changes</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {history.map((h, i) => (
              <li key={i} className="flex justify-between gap-3 py-2">
                <span>
                  {REASON[h.reason]}: {h.product.replace(/^JonWin\s+/, "")} {sizeLabel(Number(h.size_ml))}
                  {h.note && <span className="text-muted"> · {h.note}</span>}
                  <span className="block text-xs text-muted">
                    {fmtDateTime(h.created_at)} · {h.by ?? "—"}
                  </span>
                </span>
                <span className={`font-semibold tabular-nums ${h.delta < 0 ? "text-red-700" : "text-brand-700"}`}>
                  {h.delta > 0 ? "+" : ""}
                  {h.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
