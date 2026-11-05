import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { hasRole, requireUser } from "@/lib/auth/guard";
import { fmtDateTime, ksh, METHOD_LABELS, ymdNairobi } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { VoidSaleForm } from "./forms";

export const metadata = { title: "Sales" };

type Row = {
  id: string;
  receipt_no: number;
  sold_at: Date;
  payment_method: string;
  total: number;
  paid: string;
  voided_at: Date | null;
  void_reason: string | null;
  seller: string | null;
  customer: string | null;
  phone: string | null;
  items: string;
};

export default async function SalesPage({ searchParams }: PageProps<"/admin/sales">) {
  const user = await requireUser("boss", "helper");
  const sp = await searchParams;
  const day = typeof sp.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.day) ? sp.day : ymdNairobi();

  const db = await getDb();
  const { rows } = (await db.execute(sql`
    select s.id, s.receipt_no, s.sold_at, s.payment_method, s.total, s.voided_at, s.void_reason,
           seller.name as seller, c.name as customer, c.phone,
           coalesce((select sum(amount) from payments p where p.sale_id = s.id), 0) as paid,
           (select string_agg(i.qty || ' × ' || replace(pr.name, 'JonWin ', '') || ' ' ||
                   case when v.size_ml < 1000 then v.size_ml || 'ml' else (v.size_ml / 1000.0)::float || 'L' end, ', ')
              from sale_items i join variants v on v.id = i.variant_id join products pr on pr.id = v.product_id
             where i.sale_id = s.id) as items
    from sales s
    left join users seller on seller.id = s.sold_by
    left join users c on c.id = s.customer_id
    where (s.sold_at at time zone 'Africa/Nairobi')::date = ${day}::date
    order by s.sold_at desc`)) as unknown as { rows: Row[] };

  const live = rows.filter((r) => !r.voided_at);
  const dayTotal = live.reduce((s, r) => s + Number(r.total), 0);
  const isBoss = hasRole(user, "boss");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Sales</h1>
        <form className="flex gap-2">
          <input type="date" name="day" defaultValue={day} className="input w-auto" aria-label="Day" />
          <button className="btn-secondary">Show</button>
        </form>
      </div>
      <div className="card flex justify-between">
        <span className="text-muted">{live.length} sale(s)</span>
        <span className="font-bold">{ksh(dayTotal)}</span>
      </div>
      {rows.length === 0 && <p className="card text-muted">No sales on this day.</p>}
      <ul className="space-y-2">
        {rows.map((r) => {
          const paid = Number(r.paid);
          const owed = Number(r.total) - paid;
          return (
            <li key={r.id} className={`card ${r.voided_at ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    #{r.receipt_no} · {ksh(Number(r.total))}
                    {r.voided_at && <span className="badge ml-2 bg-red-100 text-red-700">Voided</span>}
                  </p>
                  <p className="text-sm">{r.items}</p>
                  <p className="text-xs text-muted">
                    {fmtDateTime(r.sold_at)} · {METHOD_LABELS[r.payment_method]} · by {r.seller ?? "—"}
                    {r.customer && ` · ${r.customer} ${r.phone ? formatPhone(r.phone) : ""}`}
                  </p>
                  {r.voided_at && <p className="text-xs text-red-700">Reason: {r.void_reason}</p>}
                </div>
                {!r.voided_at && r.payment_method === "credit" && owed > 0 && (
                  <span className="badge shrink-0 bg-amber-100 text-amber-900">Owes {ksh(owed)}</span>
                )}
              </div>
              {isBoss && !r.voided_at && <VoidSaleForm saleId={r.id} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
