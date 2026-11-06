import Link from "next/link";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasRole, homeFor, requireUser } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/auth/actions";
import { customerLedger, getAreas, listOrders, STATUS_LABELS } from "@/lib/shop";
import { fmtDate, ksh, METHOD_LABELS } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { ShopFooter, ShopHeader } from "@/components/shop/chrome";
import { LocationForm } from "./location-form";

export const metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const db = await getDb();
  const [orders, ledger, areas, [me], [totals]] = await Promise.all([
    listOrders({ customerId: user.id, limit: 50 }),
    customerLedger(user.id),
    getAreas(),
    db
      .select({ areaId: schema.users.areaId, address: schema.users.locationLabel, lat: schema.users.locationLat, lng: schema.users.locationLng })
      .from(schema.users)
      .where(eq(schema.users.id, user.id)),
    db
      .select({
        spent: sql<number>`coalesce(sum(${schema.sales.total}), 0)`.mapWith(Number),
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.sales)
      .where(and(eq(schema.sales.customerId, user.id), isNull(schema.sales.voidedAt))),
  ]);
  const isStaff = hasRole(user, "boss", "helper", "cook", "rider");

  return (
    <>
      <ShopHeader />
      <main className="mx-3 mt-3 grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="bg-jw-paper px-5 py-12 sm:px-10 lg:px-14 lg:py-16">
          <h1 className="text-[length:var(--step-head)]">Hello, {user.name.split(" ")[0]}</h1>
          <p className="mt-4 text-jw-soft">
            {formatPhone(user.phone)}
            {user.email ? ` · ${user.email}` : ""}
          </p>
          {isStaff && (
            <p className="mt-6">
              <Link href={homeFor(user)} className="jw-link">
                Go to my work page
              </Link>
            </p>
          )}

          <section aria-labelledby="orders-title" className="mt-14">
            <h2 id="orders-title" className="text-[length:var(--step-lead)]">
              My orders
            </h2>
            {orders.length === 0 ? (
              <p className="mt-5">
                No orders yet.{" "}
                <Link href="/#products" className="jw-link">
                  See the price list
                </Link>
              </p>
            ) : (
              <ul className="mt-5 space-y-2">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/orders/${o.id}`} className="group grid grid-cols-[1fr_auto] gap-x-4 bg-jw-ground/10 px-4 py-3 transition-colors hover:bg-jw-ground/25">
                      <span className="font-medium">
                        Order <span className="tabular-nums">{o.orderNo}</span>
                      </span>
                      <span className="text-right font-medium tabular-nums">{ksh(o.total)}</span>
                      <span className="text-jw-soft">
                        {fmtDate(o.createdAt)} · {o.lines.reduce((s, l) => s + l.qty, 0)} bottles
                      </span>
                      <span className="text-right text-jw-soft">
                        {o.status === "pending" && o.payMethod === "cod" ? "Order received" : STATUS_LABELS[o.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="money-title" className="mt-14">
            <h2 id="money-title" className="text-[length:var(--step-lead)]">
              Payments
            </h2>
            <p className="mt-3 text-jw-soft">
              Every shilling paid on your orders, including shop visits. Records are never changed; a correction appears as a new line.
            </p>
            {ledger.length === 0 ? (
              <p className="mt-5">No payments yet.</p>
            ) : (
              <table className="mt-5 w-full text-left tabular-nums">
                <thead className="text-[length:var(--step-small)] text-jw-soft">
                  <tr>
                    <th className="py-2 pr-3 pl-2 font-normal">Date</th>
                    <th className="py-2 pr-3 font-normal">Receipt</th>
                    <th className="py-2 pr-3 font-normal">How</th>
                    <th className="py-2 pr-2 text-right font-normal">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((p) => (
                    <tr key={p.id} className="align-top odd:bg-jw-ground/10">
                      <td className="py-2 pr-3 pl-2">{fmtDate(p.paidAt)}</td>
                      <td className="py-2 pr-3">{p.receiptNo}</td>
                      <td className="py-2 pr-3">
                        {METHOD_LABELS[p.method] ?? p.method}
                        {p.reference ? ` ${p.reference}` : ""}
                        {p.note && <span className="block text-[length:var(--step-small)] text-jw-soft">{p.note}</span>}
                      </td>
                      <td className="py-2 pr-2 text-right">{ksh(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <aside className="space-y-3">
          <section aria-labelledby="total-title" className="bg-jw-ink px-5 py-12 text-jw-paper sm:px-10 lg:px-14">
            <h2 id="total-title" className="text-[length:var(--step-lead)]">
              Bought from us so far
            </h2>
            <p className="mt-4 text-[length:var(--step-display)] leading-none font-medium text-jw-ground tabular-nums">{ksh(totals?.spent ?? 0)}</p>
            <p className="mt-3">
              Across {totals?.count ?? 0} {totals?.count === 1 ? "purchase" : "purchases"}.
              {user.isTrusted && " You can pay cash on delivery."}
            </p>
          </section>

          <section aria-labelledby="loc-title" className="bg-jw-paper px-5 py-12 sm:px-10 lg:px-14">
            <h2 id="loc-title" className="text-[length:var(--step-lead)]">
              Delivery location
            </h2>
            <LocationForm areas={areas} saved={me ?? null} />
          </section>

          <section aria-labelledby="settings-title" className="bg-jw-paper px-5 py-12 sm:px-10 lg:px-14">
            <h2 id="settings-title" className="text-[length:var(--step-lead)]">
              Settings
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/account/password" className="jw-btn-quiet border-2 border-jw-ink">
                Change password
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="jw-btn">
                  Log out
                </button>
              </form>
            </div>
          </section>
        </aside>
      </main>
      <ShopFooter />
    </>
  );
}
