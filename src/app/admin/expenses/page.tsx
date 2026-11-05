import { and, between, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasRole, requireUser } from "@/lib/auth/guard";
import { EXPENSE_LABELS, fmtDate, ksh, ymdNairobi } from "@/lib/format";
import { voidExpenseAction } from "./actions";
import { ExpenseForm } from "./expense-form";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage({ searchParams }: PageProps<"/admin/expenses">) {
  const user = await requireUser("boss", "helper");
  const sp = await searchParams;
  const today = ymdNairobi();
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();

  const db = await getDb();
  const list = await db
    .select({
      id: schema.expenses.id,
      category: schema.expenses.category,
      amount: schema.expenses.amount,
      note: schema.expenses.note,
      spentOn: schema.expenses.spentOn,
      voidedAt: schema.expenses.voidedAt,
      by: schema.users.name,
    })
    .from(schema.expenses)
    .leftJoin(schema.users, eq(schema.users.id, schema.expenses.createdBy))
    .where(and(between(schema.expenses.spentOn, `${month}-01`, `${month}-${String(last).padStart(2, "0")}`)))
    .orderBy(desc(schema.expenses.spentOn), desc(schema.expenses.createdAt));

  const total = list.filter((e) => !e.voidedAt).reduce((s, e) => s + e.amount, 0);
  const isBoss = hasRole(user, "boss");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <form className="flex gap-2">
          <input type="month" name="month" defaultValue={month} className="input w-auto" aria-label="Month" />
          <button className="btn-secondary">Show</button>
        </form>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_20rem]">
        <section className="card space-y-2">
          <p className="flex justify-between font-semibold">
            <span>Total this month</span>
            <span>{ksh(total)}</span>
          </p>
          {list.length === 0 && <p className="text-sm text-muted">No expenses this month.</p>}
          <ul className="divide-y divide-line text-sm">
            {list.map((e) => (
              <li key={e.id} className={`flex items-start justify-between gap-3 py-2 ${e.voidedAt ? "line-through opacity-50" : ""}`}>
                <span>
                  <b>{EXPENSE_LABELS[e.category]}</b>
                  {e.note && ` · ${e.note}`}
                  <span className="block text-xs text-muted">
                    {fmtDate(e.spentOn)} · {e.by ?? "—"}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="font-semibold tabular-nums">{ksh(e.amount)}</span>
                  {isBoss && !e.voidedAt && (
                    <form action={voidExpenseAction}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="text-xs text-red-700 underline">Void</button>
                    </form>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2 className="mb-3 font-semibold">Add expense</h2>
          <ExpenseForm today={today} />
        </section>
      </div>
    </div>
  );
}
