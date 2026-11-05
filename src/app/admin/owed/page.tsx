import { requireUser } from "@/lib/auth/guard";
import { owedList } from "@/lib/queries";
import { daysBetween, fmtDate, ksh, ymdNairobi } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { PaymentForm } from "../sales/forms";

export const metadata = { title: "Owed money" };

export default async function OwedPage() {
  await requireUser("boss", "helper");
  const list = await owedList();
  const today = ymdNairobi();
  const total = list.reduce((s, r) => s + r.balance, 0);

  // Group by customer so repeat debtors are obvious.
  const byCustomer = new Map<string, { name: string; phone: string; balance: number; sales: typeof list }>();
  for (const r of list) {
    const key = r.customerId ?? r.saleId;
    const g = byCustomer.get(key) ?? { name: r.customer, phone: r.phone, balance: 0, sales: [] };
    g.balance += r.balance;
    g.sales.push(r);
    byCustomer.set(key, g);
  }
  const groups = [...byCustomer.values()].sort((a, b) => b.balance - a.balance);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Owed money</h1>
      <div className="card flex items-center justify-between">
        <span className="text-muted">
          {groups.length} customer(s), {list.length} sale(s)
        </span>
        <span className="text-xl font-bold">{ksh(total)}</span>
      </div>
      {groups.length === 0 && <p className="card text-muted">Nobody owes money. 🎉</p>}

      {groups.map((g) => (
        <section key={g.name + g.phone} className="card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{g.name}</p>
              {g.phone && (
                <a href={`tel:+${g.phone}`} className="text-sm text-brand-700 underline">
                  {formatPhone(g.phone)}
                </a>
              )}
            </div>
            <span className="font-bold">{ksh(g.balance)}</span>
          </div>
          {g.sales.map((s) => {
            const days = daysBetween(s.soldAt.slice(0, 10), today);
            const late = s.dueDate ? daysBetween(s.dueDate, today) : null;
            return (
              <details key={s.saleId} className="rounded-xl border border-line p-3">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    #{s.receiptNo} · {fmtDate(s.soldAt)} · {days} day(s) ago
                  </span>
                  <span className="flex items-center gap-2">
                    {late !== null && late > 0 && <span className="badge bg-red-100 text-red-700">⚠ {late} day(s) late</span>}
                    <span className="font-semibold">{ksh(s.balance)}</span>
                  </span>
                </summary>
                <p className="my-2 text-xs text-muted">
                  Sale {ksh(s.total)} · paid so far {ksh(s.paid)}
                  {s.dueDate && ` · promised by ${fmtDate(s.dueDate)}`}
                </p>
                <PaymentForm saleId={s.saleId} balance={s.balance} />
              </details>
            );
          })}
        </section>
      ))}
    </div>
  );
}
