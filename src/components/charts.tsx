"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SERIES } from "@/lib/chart-colors";

const INK_2 = "#52514e";
const GRID = "#e8ebe9";

const kshShort = (n: number) => (Math.abs(n) >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n)));
const kshFull = (n: number) => "KSh " + Math.round(n).toLocaleString("en-KE");

const axis = { tick: { fill: INK_2, fontSize: 12 }, axisLine: false, tickLine: false } as const;

function TipBox({
  active,
  label,
  payload,
  format = kshFull,
}: {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string | number }[];
  format?: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-sm shadow-sm">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 text-ink">
          <span className="inline-block size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
          <span className="text-muted">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums">{format(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
}

function TableView({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs text-brand-700 underline">Show as table</summary>
      <div className="mt-2 max-h-64 overflow-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c} className={i ? "text-right" : ""}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j} className={j ? "text-right tabular-nums" : ""}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card min-w-0">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="grid h-40 place-items-center text-sm text-muted">No data for these dates.</p>;
}

type TrendPoint = { label: string; revenue: number; profit: number; expenses: number };

/** Sales and profit per period: grouped bars, both in shillings on one axis. */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) return <Empty />;
  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barGap={2} barCategoryGap="25%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" {...axis} minTickGap={16} />
            <YAxis {...axis} tickFormatter={kshShort} width={48} />
            <Tooltip content={<TipBox />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 13, color: INK_2 }} />
            <Bar dataKey="revenue" name={SERIES.sales.label} fill={SERIES.sales.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="profit" name={SERIES.profit.label} fill={SERIES.profit.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableView columns={["Period", "Sales", "Profit"]} rows={data.map((d) => [d.label, kshFull(d.revenue), kshFull(d.profit)])} />
    </>
  );
}

/** Money in vs money spent per period: grouped bars. */
export function IncomeExpenseChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) return <Empty />;
  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barGap={2} barCategoryGap="25%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" {...axis} minTickGap={16} />
            <YAxis {...axis} tickFormatter={kshShort} width={48} />
            <Tooltip content={<TipBox />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 13, color: INK_2 }} />
            <Bar dataKey="revenue" name={SERIES.sales.label} fill={SERIES.sales.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expenses" name={SERIES.expenses.label} fill={SERIES.expenses.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableView columns={["Period", "Sales", "Expenses"]} rows={data.map((d) => [d.label, kshFull(d.revenue), kshFull(d.expenses)])} />
    </>
  );
}

/** One series, ranked: horizontal bars with the value written at the end. */
export function RankBars({
  data,
  color = SERIES.sales.color,
  valueLabel,
  format: formatKind = "ksh",
}: {
  data: { name: string; value: number }[];
  color?: string;
  valueLabel: string;
  format?: "ksh" | "count";
}) {
  const format = formatKind === "count" ? (n: number) => n.toLocaleString("en-KE") : kshFull;
  if (!data.length) return <Empty />;
  return (
    <>
      <div style={{ height: Math.max(120, data.length * 40 + 16) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }} barCategoryGap={8}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" {...axis} width={96} />
            <Tooltip content={<TipBox format={format} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar
              dataKey="value"
              name={valueLabel}
              fill={color}
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              label={{ position: "right", fill: INK_2, fontSize: 12, formatter: (v: unknown) => format(Number(v)) }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableView columns={["", valueLabel]} rows={data.map((d) => [d.name, format(d.value)])} />
    </>
  );
}
