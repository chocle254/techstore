import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/guard";
import { listOrders, type OrderView } from "@/lib/shop";
import { fmtDateTime, ksh, sizeLabel } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { AutoRefresh, DeliveredForm, HandBackForm, StartButton } from "./forms";

export const metadata = { title: "My deliveries" };
export const dynamic = "force-dynamic";

const TZ = "Africa/Nairobi";

function mapLink(o: OrderView) {
  const q = o.lat && o.lng ? `${o.lat},${o.lng}` : `${o.address}, ${o.areaName}, Kenya`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export default async function RiderPage() {
  const me = await requireUser("rider");
  const db = await getDb();
  const [open, recent, money] = await Promise.all([
    listOrders({ riderId: me.id, statuses: ["assigned", "out_for_delivery"], oldestFirst: true, limit: 50 }),
    listOrders({ riderId: me.id, statuses: ["delivered"], limit: 30 }),
    db.execute(sql`
      select coalesce(sum(amount) filter (where method = 'cash'), 0) as cash,
             coalesce(sum(amount) filter (where method = 'mpesa'), 0) as mpesa
      from payments
      where received_by = ${me.id} and (paid_at at time zone ${TZ})::date = (now() at time zone ${TZ})::date`) as unknown as Promise<{
      rows: { cash: string; mpesa: string }[];
    }>,
  ]);
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const doneToday = recent.filter((o) => o.updatedAt.toLocaleDateString("en-CA", { timeZone: TZ }) === todayKey);
  const cash = Number(money.rows[0]?.cash ?? 0);
  const mpesa = Number(money.rows[0]?.mpesa ?? 0);
  const toCollect = open.reduce((s, o) => s + (o.payMethod === "cod" ? Math.max(0, o.total - o.paid) : 0), 0);

  return (
    <div className="space-y-5">
      <AutoRefresh />
      <section className="grid grid-cols-3 gap-2" aria-label="Today">
        <div className="card p-3">
          <p className="text-xs text-muted">To deliver</p>
          <p className="text-xl font-bold tabular-nums">{open.length}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted">Delivered today</p>
          <p className="text-xl font-bold tabular-nums">{doneToday.length}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted">Cash on you</p>
          <p className="text-xl font-bold tabular-nums">{ksh(cash)}</p>
        </div>
      </section>
      {(cash > 0 || mpesa > 0) && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Collected today: {ksh(cash)} cash{mpesa > 0 ? ` and ${ksh(mpesa)} M-Pesa` : ""}. Hand the cash to the office at the end of the day.
        </p>
      )}

      <section aria-labelledby="todo" className="space-y-3">
        <h1 id="todo" className="text-2xl font-bold">
          To deliver
          {toCollect > 0 && <span className="ml-2 text-base font-normal text-muted">collect {ksh(toCollect)} in total</span>}
        </h1>
        {open.length === 0 && <p className="card text-muted">Nothing to deliver right now. New orders appear here when the office gives them to you.</p>}
        {open.map((o) => {
          const owed = Math.max(0, o.total - o.paid);
          const collect = o.payMethod === "cod" && owed > 0 ? ksh(owed) : null;
          return (
            <article key={o.id} className={`card space-y-3 ${o.status === "out_for_delivery" ? "border-brand-500" : ""}`}>
              <header className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">Order {o.orderNo}</h2>
                <span className={`badge ${o.status === "out_for_delivery" ? "bg-brand-50 text-brand-700" : "bg-sky-100 text-sky-800"}`}>
                  {o.status === "out_for_delivery" ? "On the way" : "Ready to go"}
                </span>
              </header>

              <div>
                <p className="font-medium">{o.contactName}</p>
                <p className="text-sm">
                  <b>{o.areaName}</b>: {o.address}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <a href={`tel:+${o.contactPhone}`} className="btn-secondary">
                    📞 {formatPhone(o.contactPhone)}
                  </a>
                  <a href={mapLink(o)} className="btn-secondary" rel="noopener" target="_blank">
                    📍 {o.lat && o.lng ? "Open pin" : "Find on map"}
                  </a>
                </div>
              </div>

              {o.note && <p className="rounded-xl bg-surface px-3 py-2 text-sm">Note: {o.note}</p>}

              <ul className="text-sm">
                {o.lines.map((l, i) => (
                  <li key={i}>
                    {l.qty} × {l.name.replace(/^JonWin\s+/, "")} {sizeLabel(l.sizeMl)}
                  </li>
                ))}
              </ul>

              <p className={`rounded-xl px-3 py-2 font-semibold ${collect ? "bg-amber-50 text-amber-900" : "bg-brand-50 text-brand-900"}`}>
                {collect ? `Collect ${collect} from the customer` : "Already paid. Collect nothing."}
              </p>

              {o.status === "assigned" && <StartButton orderId={o.id} />}
              <DeliveredForm orderId={o.id} collect={collect} />
              <HandBackForm orderId={o.id} />
            </article>
          );
        })}
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="done" className="card">
          <h2 id="done" className="mb-2 font-semibold">
            Recently delivered
          </h2>
          <ul className="divide-y divide-line text-sm">
            {recent.map((o) => (
              <li key={o.id} className="flex justify-between gap-3 py-2">
                <span>
                  Order {o.orderNo} · {o.contactName}
                  <span className="block text-xs text-muted">
                    {o.areaName} · {fmtDateTime(o.updatedAt)}
                  </span>
                </span>
                <span className="tabular-nums">{ksh(o.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
