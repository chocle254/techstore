import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { hasRole, requireUser } from "@/lib/auth/guard";
import { fmtDate, ksh } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { setTrustedAction } from "../staff/actions";
import { AccountControls } from "../staff/forms";

export const metadata = { title: "Customers" };

type Row = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  is_trusted: boolean;
  suspended_at: Date | null;
  has_password: boolean;
  spent: string;
  owed: string;
  orders: string;
  last_at: Date | null;
};

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const user = await requireUser("boss", "helper");
  const isBoss = hasRole(user, "boss");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const like = `%${q.replace(/[%_\\]/g, (c) => "\\" + c)}%`;
  const digits = q.replace(/\D/g, "").replace(/^0/, "");

  const db = await getDb();
  const { rows } = (await db.execute(sql`
    with s as (
      select s.customer_id, s.total, s.sold_at,
             s.total - coalesce((select sum(amount) from payments p where p.sale_id = s.id), 0) as unpaid,
             s.payment_method
      from sales s where s.voided_at is null and s.customer_id is not null
    )
    select u.id, u.name, u.phone, u.email, u.is_trusted, u.suspended_at, (u.password_hash is not null) as has_password,
           coalesce(sum(s.total), 0) as spent,
           coalesce(sum(case when s.payment_method = 'credit' and s.unpaid > 0 then s.unpaid else 0 end), 0) as owed,
           count(s.*) as orders, max(s.sold_at) as last_at
    from users u left join s on s.customer_id = u.id
    where 'customer' = any(u.roles)
      and (${q} = '' or u.name ilike ${like} or (${digits} <> '' and u.phone like ${"%" + digits + "%"}))
    group by u.id
    order by max(s.sold_at) desc nulls last, u.name
    limit 100`)) as unknown as { rows: Row[] };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Customers</h1>
      <form className="flex gap-2">
        <input className="input" name="q" defaultValue={q} placeholder="Search name or phone" aria-label="Search" />
        <button className="btn-secondary">Search</button>
      </form>
      {isBoss && (
        <p className="text-sm text-muted">
          <b>Trusted</b> customers can choose cash on delivery in the online shop. Everyone else must pay first.
        </p>
      )}
      {rows.length === 0 && <p className="card text-muted">No customers found.</p>}
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id} className={`card space-y-2 ${c.suspended_at ? "border-red-200 bg-red-50/40" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {c.name}
                  {c.is_trusted && <span className="badge ml-2 bg-brand-50 text-brand-700">✓ Trusted</span>}
                  {c.suspended_at && <span className="badge ml-2 bg-red-100 text-red-700">Suspended</span>}
                </p>
                <a href={`tel:+${c.phone}`} className="text-sm text-brand-700 underline">
                  {formatPhone(c.phone)}
                </a>
              </div>
              <div className="text-right text-sm">
                <p>
                  Bought <b>{ksh(Number(c.spent))}</b> in {c.orders} sale(s)
                </p>
                {Number(c.owed) > 0 && <p className="text-amber-700">Owes {ksh(Number(c.owed))}</p>}
                {c.last_at && <p className="text-xs text-muted">Last: {fmtDate(c.last_at)}</p>}
              </div>
            </div>
            {isBoss && (
              <details>
                <summary className="cursor-pointer text-sm text-brand-700 underline">Manage</summary>
                <div className="mt-2 space-y-2">
                  <form action={setTrustedAction}>
                    <input type="hidden" name="userId" value={c.id} />
                    <input type="hidden" name="trusted" value={c.is_trusted ? "0" : "1"} />
                    <button className="btn-secondary min-h-9 px-3 py-1 text-sm">
                      {c.is_trusted ? "Remove trusted" : "Mark as trusted (allow cash on delivery)"}
                    </button>
                  </form>
                  <AccountControls userId={c.id} suspended={!!c.suspended_at} hasPassword={c.has_password} />
                </div>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
