import Link from "next/link";
import { requireUser } from "@/lib/auth/guard";
import { listOrders, listRiders, STATUS_LABELS, type OrderView } from "@/lib/shop";
import { canAssign } from "@/lib/delivery";
import { fmtDateTime, ksh, sizeLabel } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { AssignRiderForm, CancelForm, ConfirmPaidForm, StatusButtons } from "./forms";

export const metadata = { title: "Orders" };

const TABS = {
  open: { label: "To do", statuses: ["pending", "paid", "assigned", "out_for_delivery"] as OrderView["status"][] },
  done: { label: "Delivered", statuses: ["delivered"] as OrderView["status"][] },
  cancelled: { label: "Cancelled", statuses: ["cancelled"] as OrderView["status"][] },
};

function nextSteps(o: OrderView): string[] {
  const steps: string[] = [];
  if (o.status === "assigned") steps.push("out_for_delivery");
  if (["paid", "assigned", "out_for_delivery"].includes(o.status) || (o.payMethod === "cod" && o.status === "pending")) steps.push("delivered");
  return steps;
}

const BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-brand-50 text-brand-700",
  assigned: "bg-sky-100 text-sky-800",
  out_for_delivery: "bg-sky-100 text-sky-800",
  delivered: "bg-surface text-muted",
  cancelled: "bg-red-50 text-red-700",
};

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireUser("boss", "helper");
  const { show } = await searchParams;
  const tab = (typeof show === "string" && show in TABS ? show : "open") as keyof typeof TABS;
  const [orders, riders] = await Promise.all([listOrders({ statuses: TABS[tab].statuses, limit: 100 }), listRiders()]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Online orders</h1>
      <nav className="flex gap-2" aria-label="Order lists">
        {Object.entries(TABS).map(([k, t]) => (
          <Link key={k} href={`/admin/orders?show=${k}`} className={k === tab ? "btn-primary" : "btn-secondary"} aria-current={k === tab ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 && <p className="card text-muted">No orders here.</p>}

      {orders.map((o) => {
        const balance = Math.max(0, o.total - o.paid);
        const cod = o.payMethod === "cod";
        const options = nextSteps(o);
        return (
          <article key={o.id} className="card space-y-3">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">
                <Link href={`/orders/${o.id}`} className="hover:underline">
                  Order {o.orderNo}
                </Link>
              </h2>
              <span className={`badge ${BADGE[o.status]}`}>{o.status === "pending" && cod ? "New, cash on delivery" : STATUS_LABELS[o.status]}</span>
            </header>
            <p className="text-sm text-muted">
              {fmtDateTime(o.createdAt)}
              {o.riderName && (
                <>
                  {" "}
                  · Rider: <b className="text-ink">{o.riderName}</b>
                </>
              )}
            </p>
            {o.note && <p className="rounded-xl bg-surface px-3 py-2 text-sm">Note: {o.note}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-medium">{o.contactName}</p>
                <a href={`tel:+${o.contactPhone}`} className="text-brand-700 underline">
                  {formatPhone(o.contactPhone)}
                </a>
                <p className="mt-1 text-sm">
                  <b>{o.areaName}</b>: {o.address}
                </p>
                {o.lat && o.lng && (
                  <a href={`https://www.google.com/maps?q=${o.lat},${o.lng}`} className="text-sm text-brand-700 underline" rel="noopener">
                    Open pin in Google Maps
                  </a>
                )}
              </div>
              <ul className="text-sm">
                {o.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      {l.qty} × {l.name} {sizeLabel(l.sizeMl)}
                    </span>
                    <span>{ksh(l.qty * l.unitPrice)}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-2 text-muted">
                  <span>Delivery</span>
                  <span>{ksh(o.deliveryFee)}</span>
                </li>
                <li className="flex justify-between gap-2 font-semibold">
                  <span>Total {cod ? "(cash on delivery)" : "(M-Pesa)"}</span>
                  <span>{ksh(o.total)}</span>
                </li>
                {o.paid > 0 && (
                  <li className="flex justify-between gap-2 text-muted">
                    <span>Paid</span>
                    <span>{ksh(o.paid)}</span>
                  </li>
                )}
              </ul>
            </div>

            {o.status === "pending" && !cod && (
              <div className="rounded-xl bg-surface p-3">
                <p className="mb-2 text-sm">
                  {o.payRef ? (
                    <>
                      Customer sent code <b>{o.payRef}</b>. Check it in M-Pesa for {ksh(balance)}, then mark paid.
                    </>
                  ) : (
                    <>No M-Pesa code yet. If the customer paid, type the code from your M-Pesa message.</>
                  )}
                </p>
                <ConfirmPaidForm orderId={o.id} payRef={o.payRef} />
              </div>
            )}
            {canAssign(o) && <AssignRiderForm orderId={o.id} riders={riders} current={o.riderId} />}
            {options.length > 0 && <StatusButtons orderId={o.id} options={options} cod={cod} balance={balance} />}
            {o.status !== "cancelled" && o.status !== "delivered" && <CancelForm orderId={o.id} />}
          </article>
        );
      })}
    </div>
  );
}
