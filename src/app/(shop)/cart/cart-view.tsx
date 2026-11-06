"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { cart, cartCount, cartTotal, useCart } from "@/lib/cart";
import { ksh, sizeLabel } from "@/lib/format";
import { QtyStepper } from "@/components/shop/product-grid";
import { ProductPic, short, tileFor } from "@/components/shop/tiles";
import { Icon } from "@/components/shop/icons";

const noop = () => () => {};

export function CartView({
  fresh,
  deliveryFrom,
  images,
}: {
  fresh: { variantId: string; price: number; name: string }[];
  deliveryFrom: number | null;
  images: Record<string, string>;
}) {
  const lines = useCart();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  // Prices may have changed since the bottles were added.
  useEffect(() => cart.sync(fresh), [fresh]);

  if (!mounted) return <div className="jw-clay mt-6 h-48 animate-pulse" aria-label="Loading your cart" />;

  if (!lines.length) {
    return (
      <div className="jw-clay mt-6 flex flex-col items-center px-6 py-14 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-jw-ground/10 text-jw-deep">
          <Icon name="cart" className="h-10 w-10" />
        </span>
        <p className="mt-5 text-xl font-bold">Your cart is empty</p>
        <p className="mt-1 text-jw-soft">Browse our products and add what you need.</p>
        <Link href="/#shop" className="jw-btn mt-6">
          Start shopping
        </Link>
      </div>
    );
  }

  const n = cartCount(lines);
  const subtotal = cartTotal(lines);

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-start">
      <section className="jw-clay p-2 sm:p-3" aria-label="Items">
        <div className="flex items-center justify-between px-3 py-2 text-sm">
          <span className="font-semibold">
            {n} {n === 1 ? "item" : "items"}
          </span>
          <button type="button" className="text-jw-soft hover:text-jw-deep" onClick={() => confirm("Empty your cart?") && cart.clear()}>
            Remove all
          </button>
        </div>
        <ul className="divide-y divide-jw-ink/5">
          {lines.map((l) => (
            <li key={l.variantId} className="flex gap-3 p-3 sm:gap-4">
              <Link
                href={`/p/${l.slug}?size=${l.sizeMl}`}
                className="relative flex h-24 w-24 shrink-0 items-end justify-center overflow-hidden rounded-2xl pb-2 sm:h-28 sm:w-28"
                style={{ background: tileFor(l.slug) }}
                aria-hidden
                tabIndex={-1}
              >
                <ProductPic slug={l.slug} sizeMl={l.sizeMl} height={l.sizeMl >= 10000 ? 68 : 76} image={images[l.slug]} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/p/${l.slug}?size=${l.sizeMl}`} className="font-semibold hover:text-jw-deep">
                      {short(l.name)}
                    </Link>
                    <p className="text-sm text-jw-soft tabular-nums">
                      {sizeLabel(l.sizeMl)} · {ksh(l.price)} each
                    </p>
                  </div>
                  <p className="text-right font-extrabold tabular-nums">{ksh(l.qty * l.price)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <div className="w-36">
                    <QtyStepper variantId={l.variantId} qty={l.qty} label={`${short(l.name)} ${sizeLabel(l.sizeMl)}`} size="sm" />
                  </div>
                  <button
                    type="button"
                    className="flex min-h-9 items-center gap-1 rounded-full px-2 text-sm text-jw-soft hover:bg-jw-ink/5 hover:text-jw-deep"
                    onClick={() => cart.setQty(l.variantId, 0)}
                  >
                    <Icon name="trash" className="h-4 w-4" /> <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="jw-clay p-5 lg:sticky lg:top-36" aria-labelledby="sum-title">
        <h2 id="sum-title" className="text-lg">
          Order summary
        </h2>
        <dl className="mt-4 space-y-2 text-sm tabular-nums">
          <div className="flex justify-between">
            <dt className="text-jw-soft">Items ({n})</dt>
            <dd className="font-semibold">{ksh(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-jw-soft">Delivery</dt>
            <dd>{deliveryFrom === null ? "At checkout" : `From ${deliveryFrom > 0 ? ksh(deliveryFrom) : "free"}`}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-jw-ink/5 pt-4">
          <span className="font-semibold">Subtotal</span>
          <span className="text-2xl font-extrabold tabular-nums">{ksh(subtotal)}</span>
        </div>
        <Link href="/checkout" className="jw-btn mt-5 w-full">
          Checkout · {ksh(subtotal)} <Icon name="arrow" className="h-4 w-4" />
        </Link>
        <Link href="/#shop" className="jw-btn-quiet mt-3 w-full">
          Keep shopping
        </Link>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-jw-soft">
          <Icon name="shield" className="h-4 w-4 text-jw-mpesa" /> Pay by M-Pesa after you order
        </p>
      </aside>
    </div>
  );
}
