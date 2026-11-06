"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cart, cartTotal, useCart } from "@/lib/cart";
import { ksh, sizeLabel } from "@/lib/format";
import { Bottle, liquidFor } from "@/components/shop/bottle";

export function CartView({ fresh }: { fresh: { variantId: string; price: number; name: string }[] }) {
  const lines = useCart();
  // Prices may have changed since the bottles were added.
  useEffect(() => cart.sync(fresh), [fresh]);

  if (!lines.length) {
    return (
      <div className="mt-10 max-w-[40ch]">
        <p className="text-[length:var(--step-lead)]">Nothing here yet.</p>
        <Link href="/#products" className="jw-btn mt-8">
          See the price list
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-20">
      <ul className="space-y-8">
        {lines.map((l) => (
          <li key={l.variantId} className="grid grid-cols-[4.5rem_1fr] items-end gap-x-5 gap-y-3 sm:grid-cols-[5.5rem_1fr_auto]">
            <div className="row-span-2 flex h-24 items-end justify-center sm:row-span-1">
              <Bottle sizeMl={l.sizeMl} liquid={liquidFor(l.slug)} fullHeight={96} />
            </div>
            <div>
              <Link href={`/p/${l.slug}?size=${l.sizeMl}`} className="jw-link text-[length:var(--step-lead)] leading-tight no-underline hover:underline">
                {l.name}
              </Link>
              <p className="text-jw-soft tabular-nums">
                {sizeLabel(l.sizeMl)} · {ksh(l.price)} each
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
              <div className="flex items-stretch bg-jw-ground/15" role="group" aria-label={`Quantity of ${l.name} ${sizeLabel(l.sizeMl)}`}>
                <button type="button" className="jw-press h-11 w-11 text-xl" onClick={() => cart.setQty(l.variantId, l.qty - 1)} aria-label="One fewer">
                  −
                </button>
                <span className="flex w-10 items-center justify-center tabular-nums">{l.qty}</span>
                <button type="button" className="jw-press h-11 w-11 text-xl" onClick={() => cart.setQty(l.variantId, l.qty + 1)} aria-label="One more">
                  +
                </button>
              </div>
              <span className="min-w-24 text-right font-medium tabular-nums">{ksh(l.qty * l.price)}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <h2 className="text-[length:var(--step-lead)]">Summary</h2>
        <p className="mt-4 flex items-baseline justify-between gap-4 tabular-nums">
          <span>Bottles</span>
          <span>{ksh(cartTotal(lines))}</span>
        </p>
        <p className="mt-2 flex items-baseline justify-between gap-4 text-jw-soft">
          <span>Delivery</span>
          <span>At checkout</span>
        </p>
        <Link href="/checkout" className="jw-btn mt-8 w-full">
          Checkout
        </Link>
        <Link href="/#products" className="jw-link mt-5 inline-block">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
