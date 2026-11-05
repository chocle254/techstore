import Link from "next/link";
import { requireUser } from "@/lib/auth/guard";
import { EXPENSE_LABELS, fmtDate, ksh, METHOD_LABELS, sizeLabel } from "@/lib/format";
import { expensesByCategory, paymentSplit, salesSeries, stockLevels, summary, topProducts, topSizes } from "@/lib/queries";
import { bucketLabel, PRESETS, resolveRange } from "@/lib/range";
import { ChartCard, IncomeExpenseChart, RankBars, TrendChart } from "@/components/charts";
import { SERIES } from "@/lib/chart-colors";

export const metadata = { title: "Dashboard" };

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "bad" | "warn" }) {
  return (
    <div className="card p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-0.5 text-xl font-bold tabular-nums ${tone === "bad" ? "text-red-700" : tone === "warn" ? "text-amber-700" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser("boss", "helper");
  const sp = await searchParams;
  const { range, preset, bucket } = resolveRange(sp);

  const [s, series, products, sizes, expenses, methods, stock] = await Promise.all([
    summary(range),
    salesSeries(range, bucket),
    topProducts(range),
    topSizes(range),
    expensesByCategory(range),
    paymentSplit(range),
    stockLevels(),
  ]);
  const trend = series.map((p) => ({ ...p, label: bucketLabel(p.bucket, bucket) }));
  const low = stock.filter((v) => v.isActive && v.onHand <= v.lowStockAt);
  const noPrices = stock.filter((v) => v.isActive && v.price <= 0).length;
  const qs = (extra: Record<string, string>) =>
    "?" + new URLSearchParams({ ...(preset === "custom" ? { from: range.from, to: range.to } : { p: preset }), by: bucket, ...extra }).toString();

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Hi {user.name.split(" ")[0]} 👋</h1>
        <Link href="/admin/sell" className="btn-primary">
          🧾 New sale
        </Link>
      </div>

      {noPrices > 0 && (
        <Link href="/admin/products" className="block rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          ⚠️ {noPrices} product size(s) have no price yet, so they can&apos;t be sold. Tap to set prices →
        </Link>
      )}

      {/* Filters: one row above the charts */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <Link
            key={p.key}
            href={`?p=${p.key}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${preset === p.key ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white"}`}
          >
            {p.label}
          </Link>
        ))}
        <form className="flex items-center gap-1">
          <input type="date" name="from" defaultValue={range.from} className="input w-auto py-1.5 text-sm" aria-label="From" />
          <span className="text-muted">–</span>
          <input type="date" name="to" defaultValue={range.to} className="input w-auto py-1.5 text-sm" aria-label="To" />
          <button className="btn-secondary min-h-9 px-3 py-1 text-sm">Go</button>
        </form>
      </div>
      <p className="text-sm text-muted">
        {fmtDate(range.from)} – {fmtDate(range.to)}
      </p>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Sales" value={ksh(s.revenue)} sub={`${s.salesCount} sale(s) · ${s.litres.toLocaleString("en-KE")} L`} />
        <Stat label="Profit after expenses" value={ksh(s.netProfit)} tone={s.netProfit < 0 ? "bad" : undefined} sub={`Before expenses ${ksh(s.grossProfit)}`} />
        <Stat label="Expenses" value={ksh(s.expenses)} />
        <Stat label="Money received" value={ksh(s.cashIn)} sub="Cash + M-Pesa in" />
        <Stat label="Owed to you (all time)" value={ksh(s.owed)} tone={s.owed > 0 ? "warn" : undefined} />
        <Stat label="Low stock" value={String(low.length)} tone={low.length ? "warn" : undefined} sub={low.length ? "sizes need refilling" : "All good"} />
      </div>

      <div className="flex items-center gap-1 text-sm">
        <span className="mr-1 text-muted">Group by</span>
        {(["day", "week", "month", "year"] as const).map((b) => (
          <Link key={b} href={qs({ by: b })} className={`rounded-lg px-2.5 py-1 font-medium capitalize ${bucket === b ? "bg-ink text-white" : "bg-white"}`}>
            {b}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Sales and profit">
          <TrendChart data={trend} />
        </ChartCard>
        <ChartCard title="Sales vs expenses">
          <IncomeExpenseChart data={trend} />
        </ChartCard>
        <ChartCard title="Best-selling products">
          <RankBars data={products.map((p) => ({ name: p.name.replace(/^JonWin\s+/, ""), value: p.revenue }))} valueLabel="Sales" />
        </ChartCard>
        <ChartCard title="Bottles sold by size">
          <RankBars
            data={sizes.map((x) => ({ name: sizeLabel(x.sizeMl), value: x.qty }))}
            valueLabel="Bottles"
            format="count"
          />
        </ChartCard>
        <ChartCard title="Where the money goes">
          <RankBars data={expenses.map((e) => ({ name: EXPENSE_LABELS[e.category], value: e.total }))} valueLabel="Expenses" color={SERIES.expenses.color} />
        </ChartCard>
        <ChartCard title="How customers paid">
          <RankBars data={methods.map((m) => ({ name: METHOD_LABELS[m.method], value: m.total }))} valueLabel="Sales" />
        </ChartCard>
      </div>
    </div>
  );
}
