import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { hasRole, requireUser } from "@/lib/auth/guard";
import { getOrder, STATUS_LABELS } from "@/lib/shop";
import { getGateway } from "@/lib/payments";
import { formatPhone } from "@/lib/phone";
import { fmtDateTime, ksh, sizeLabel } from "@/lib/format";
import { ShopFooter, ShopHeader, StepBar } from "@/components/shop/chrome";
import { Icon } from "@/components/shop/icons";
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-6 sm:px-4">
        {isNew && <StepBar at={order.payMethod === "mpesa" && balance > 0 ? 2 : 3} />}
        <div className={`grid gap-4 lg:grid-cols-[1fr_24rem] lg:items-start ${isNew ? "mt-8" : ""}`}>
        <div className="jw-clay p-5 sm:p-8">
          {isNew && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-jw-mpesa/10 px-3 py-1 text-sm font-semibold text-jw-mpesa">
              <Icon name="check" className="h-4 w-4" /> Order placed
            </p>
          )}
          <h1 className="text-[length:var(--step-head)]">
            {isNew ? "Thank you! Order " : "Order "}
            <span className="tabular-nums">#{order.orderNo}</span>
          </h1>
          <p className="mt-1 text-sm text-jw-soft">Placed {fmtDateTime(order.createdAt)}</p>

          <section aria-labelledby="status-title" className="jw-well mt-6 p-4 sm:p-5">
            <h2 id="status-title" className="sr-only">
              Status
            </h2>
            {order.riderName && (order.status === "assigned" || order.status === "out_for_delivery") && (
              <p className="mb-4 flex items-center gap-2 font-semibold">
                <Icon name="truck" className="h-5 w-5 text-jw-deep" />
                {order.status === "out_for_delivery" ? `${order.riderName.split(" ")[0]} is on the way with your order.` : `${order.riderName.split(" ")[0]} will bring your order.`}
              </p>
            )}
            {cancelled ? (
              <p className="font-semibold text-red-700">This order was cancelled. If you paid, we will refund you.</p>
            ) : (
              <ol className="grid grid-cols-4 gap-1 text-xs sm:text-sm">
                {STEPS.map((s, i) => (
                  <li key={s} className={`flex flex-col gap-2 ${i <= reached ? "" : "text-jw-soft"}`} aria-current={i === reached ? "step" : undefined}>
                    <span className="flex items-center gap-1" aria-hidden>
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${i < reached ? "bg-jw-ink text-white" : i === reached ? "bg-jw-ground text-white ring-4 ring-jw-ground/20" : "bg-jw-paper ring-1 ring-jw-ink/10"}`}
                      >
                        {i < reached && <Icon name="check" className="h-3.5 w-3.5" />}
                      </span>
                      {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded-full ${i < reached ? "bg-jw-ink" : "bg-jw-ink/10"}`} />}
                    </span>
                    <span className={i === reached ? "font-bold" : ""}>{stepLabel(s)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="items-title" className="mt-8">
            <h2 id="items-title" className="text-lg">
              Your bottles
            </h2>
            <ul className="mt-3 max-w-[32rem] space-y-2 text-sm tabular-nums">
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
              <li className="flex items-baseline justify-between gap-4 border-t border-jw-ink/5 pt-3 text-lg font-extrabold">
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

          <section aria-labelledby="to-title" className="mt-8 max-w-[40ch]">
            <h2 id="to-title" className="text-lg">
              Delivering to
            </h2>
            <p className="mt-3 text-sm">
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

        <aside
          aria-labelledby="pay-title"
          className="rounded-3xl p-6 text-white sm:p-8 lg:sticky lg:top-36"
          style={{ background: order.payMethod === "mpesa" && balance > 0 && !cancelled ? "linear-gradient(160deg, #1bb85a, #0e7a39)" : "linear-gradient(160deg, #2a2d34, #16181d)", boxShadow: "0 24px 50px -24px rgb(0 0 0 / .45)" }}
        >
          <h2 id="pay-title" className="text-2xl">
            {order.payMethod === "cod" ? "Pay on delivery" : balance > 0 && !cancelled ? "Pay by M-Pesa" : "Payment"}
          </h2>
          {cancelled ? (
            <p className="mt-6">Nothing to pay.</p>
          ) : balance === 0 ? (
            <p className="mt-6 text-base">Paid in full. Thank you.</p>
          ) : order.payMethod === "cod" ? (
            <p className="mt-6 text-base">Have {ksh(balance)} ready for the rider. We will call you before we come.</p>
          ) : (
            <>
              {pay?.kind === "till" && (
                <ol className="mt-8 list-inside list-decimal space-y-3 text-base marker:text-white/70">
                  <li>Open M-Pesa, then Lipa na M-Pesa, Buy Goods.</li>
                  <li>
                    Till number <strong className="font-semibold text-white underline decoration-white/40 underline-offset-4 tabular-nums">{pay.till}</strong>
                  </li>
                  <li>
                    Amount <strong className="font-semibold text-white underline decoration-white/40 underline-offset-4 tabular-nums">{ksh(balance)}</strong>
                  </li>
                </ol>
              )}
              {pay?.kind === "paybill" && (
                <ol className="mt-8 list-inside list-decimal space-y-3 text-base marker:text-white/70">
                  <li>Open M-Pesa, then Lipa na M-Pesa, Pay Bill.</li>
                  <li>
                    Business number <strong className="font-semibold text-white underline decoration-white/40 underline-offset-4 tabular-nums">{pay.paybill}</strong>
                  </li>
                  <li>
                    Account <strong className="font-semibold text-white">{pay.account}</strong>
                  </li>
                  <li>
                    Amount <strong className="font-semibold text-white underline decoration-white/40 underline-offset-4 tabular-nums">{ksh(balance)}</strong>
                  </li>
                </ol>
              )}
              {pay?.kind === "unset" && (
                <p className="mt-6 text-base">We will call you on {formatPhone(order.contactPhone)} with the M-Pesa details for {ksh(balance)}.</p>
              )}
              {order.customerId === user.id && order.status === "pending" && (
                <div className="mt-12">
                  {order.payRef ? (
                    <p>
                      We received your code <strong>{order.payRef}</strong> and are checking it. This page updates when
                      it is confirmed.
                    </p>
                  ) : (
                    <PayCodeForm orderId={order.id} />
                  )}
                </div>
              )}
            </>
          )}
          <p className="mt-10">
            <Link href="/account" className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/15 px-4 text-sm font-semibold hover:bg-white/25">
              All my orders <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </p>
        </aside>
        </div>
      </main>
      <ShopFooter />
    </>
  );
}
