import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { hasRole, requireUser } from "@/lib/auth/guard";
import { getOrder, STATUS_LABELS } from "@/lib/shop";
import { getGateway } from "@/lib/payments";
import { formatPhone } from "@/lib/phone";
import { fmtDateTime, ksh, sizeLabel } from "@/lib/format";
import { ShopFooter, ShopHeader } from "@/components/shop/chrome";
import { ClearCart, PayCodeForm } from "./order-bits";

export const metadata = { title: "Your order" };
export const dynamic = "force-dynamic";

const STEPS = ["pending", "paid", "out_for_delivery", "delivered"] as const;

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { new: isNew } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await getOrder(id);
  const canSee = order && (order.customerId === user.id || hasRole(user, "boss", "helper") || (hasRole(user, "rider") && order.riderId === user.id));
  if (!order || !canSee) notFound();

  const balance = Math.max(0, order.total - order.paid);
  const pay = order.payMethod === "mpesa" ? getGateway().instructions(order.orderNo) : null;
  const cancelled = order.status === "cancelled";
  const reached = order.status === "assigned" ? 1 : STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const stepLabel = (s: (typeof STEPS)[number]) =>
    s === "pending" && order.payMethod === "cod" ? "Order received" : s === "pending" ? "Order placed" : STATUS_LABELS[s];

  return (
    <>
      <ShopHeader />
      {isNew && <ClearCart />}
      <main className="mx-3 mt-3 grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="bg-jw-paper px-5 py-12 sm:px-10 lg:px-14 lg:py-16">
          <h1 className="text-[length:var(--step-head)]">
            {isNew ? "Thank you. Order " : "Order "}
            <span className="tabular-nums">{order.orderNo}</span>
          </h1>
          <p className="mt-4 text-jw-soft">Placed {fmtDateTime(order.createdAt)}</p>

          <section aria-labelledby="status-title" className="mt-12">
            <h2 id="status-title" className="sr-only">
              Status
            </h2>
            {order.riderName && (order.status === "assigned" || order.status === "out_for_delivery") && (
              <p className="mb-6 text-[length:var(--step-lead)]">
                {order.status === "out_for_delivery" ? `${order.riderName.split(" ")[0]} is on the way with your order.` : `${order.riderName.split(" ")[0]} will bring your order.`}
              </p>
            )}
            {cancelled ? (
              <p className="text-[length:var(--step-lead)]">This order was cancelled. If you paid, we will refund you.</p>
            ) : (
              <ol className="grid grid-cols-4 gap-1 text-[length:var(--step-small)] sm:text-base">
                {STEPS.map((s, i) => (
                  <li key={s} className={`flex flex-col gap-2 ${i <= reached ? "" : "text-jw-soft"}`} aria-current={i === reached ? "step" : undefined}>
                    <span className={`block h-2 ${i <= reached ? "bg-jw-ink" : "bg-jw-ground/30"}`} aria-hidden />
                    <span className={i === reached ? "font-semibold" : ""}>{stepLabel(s)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="items-title" className="mt-14">
            <h2 id="items-title" className="text-[length:var(--step-lead)]">
              Your bottles
            </h2>
            <ul className="mt-5 max-w-[32rem] space-y-3 tabular-nums">
              {order.lines.map((l, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4">
                  <span>
                    {l.qty} × {l.name} {sizeLabel(l.sizeMl)}
                  </span>
                  <span>{ksh(l.qty * l.unitPrice)}</span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-4">
                <span>Delivery to {order.areaName}</span>
                <span>{order.deliveryFee > 0 ? ksh(order.deliveryFee) : "Free"}</span>
              </li>
              <li className="flex items-baseline justify-between gap-4 pt-2 text-[length:var(--step-lead)] font-medium">
                <span>Total</span>
                <span>{ksh(order.total)}</span>
              </li>
              {order.paid > 0 && (
                <li className="flex items-baseline justify-between gap-4 text-jw-soft">
                  <span>Paid</span>
                  <span>{ksh(order.paid)}</span>
                </li>
              )}
            </ul>
          </section>

          <section aria-labelledby="to-title" className="mt-14 max-w-[40ch]">
            <h2 id="to-title" className="text-[length:var(--step-lead)]">
              Delivering to
            </h2>
            <p className="mt-4">
              {order.contactName}, {formatPhone(order.contactPhone)}
              <br />
              {order.areaName}: {order.address}
              {order.lat && order.lng && (
                <>
                  <br />
                  <a href={`https://www.google.com/maps?q=${order.lat},${order.lng}`} className="jw-link" rel="noopener">
                    See the pin on a map
                  </a>
                </>
              )}
            </p>
          </section>
        </div>

        <aside aria-labelledby="pay-title" className="bg-jw-ink px-5 py-12 text-jw-paper sm:px-10 lg:px-14 lg:py-16">
          <h2 id="pay-title" className="text-[length:var(--step-head)] text-jw-ground">
            {order.payMethod === "cod" ? "Pay on delivery" : balance > 0 && !cancelled ? "Pay by M-Pesa" : "Payment"}
          </h2>
          {cancelled ? (
            <p className="mt-6">Nothing to pay.</p>
          ) : balance === 0 ? (
            <p className="mt-6 text-[length:var(--step-lead)]">Paid in full. Thank you.</p>
          ) : order.payMethod === "cod" ? (
            <p className="mt-6 text-[length:var(--step-lead)]">Have {ksh(balance)} ready for the rider. We will call you before we come.</p>
          ) : (
            <>
              {pay?.kind === "till" && (
                <ol className="mt-8 list-inside list-decimal space-y-3 text-[length:var(--step-lead)] marker:text-jw-ground">
                  <li>Open M-Pesa, then Lipa na M-Pesa, Buy Goods.</li>
                  <li>
                    Till number <strong className="font-semibold text-jw-ground tabular-nums">{pay.till}</strong>
                  </li>
                  <li>
                    Amount <strong className="font-semibold text-jw-ground tabular-nums">{ksh(balance)}</strong>
                  </li>
                </ol>
              )}
              {pay?.kind === "paybill" && (
                <ol className="mt-8 list-inside list-decimal space-y-3 text-[length:var(--step-lead)] marker:text-jw-ground">
                  <li>Open M-Pesa, then Lipa na M-Pesa, Pay Bill.</li>
                  <li>
                    Business number <strong className="font-semibold text-jw-ground tabular-nums">{pay.paybill}</strong>
                  </li>
                  <li>
                    Account <strong className="font-semibold text-jw-ground">{pay.account}</strong>
                  </li>
                  <li>
                    Amount <strong className="font-semibold text-jw-ground tabular-nums">{ksh(balance)}</strong>
                  </li>
                </ol>
              )}
              {pay?.kind === "unset" && (
                <p className="mt-6 text-[length:var(--step-lead)]">We will call you on {formatPhone(order.contactPhone)} with the M-Pesa details for {ksh(balance)}.</p>
              )}
              {order.customerId === user.id && order.status === "pending" && (
                <div className="mt-12">
                  {order.payRef ? (
                    <p>
                      We received your code <strong className="text-jw-ground">{order.payRef}</strong> and are checking it. This page updates when
                      it is confirmed.
                    </p>
                  ) : (
                    <PayCodeForm orderId={order.id} />
                  )}
                </div>
              )}
            </>
          )}
          <p className="mt-14">
            <Link href="/account" className="jw-link text-jw-paper">
              All my orders
            </Link>
          </p>
        </aside>
      </main>
      <ShopFooter />
    </>
  );
}
