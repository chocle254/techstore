"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { cartTotal, useCart } from "@/lib/cart";
import { formatPhone } from "@/lib/phone";
import { ksh, sizeLabel } from "@/lib/format";
import { placeOrderAction, type ShopState } from "../actions";

const MapPin = dynamic(() => import("@/components/shop/map-pin"), {
  ssr: false,
  loading: () => <p className="flex h-72 items-center justify-center bg-jw-ground/15">Loading the map…</p>,
});

const noop = () => () => {};

type Area = { id: string; name: string; fee: number };
type Props = {
  user: { name: string; phone: string; isTrusted: boolean } | null;
  areas: Area[];
  saved: { areaId: string | null; address: string | null; lat: string | null; lng: string | null } | null;
  toRate: { orderId: string; orderNo: number; products: { id: string; name: string }[] } | null;
};

function PlaceButton({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="jw-btn w-full" disabled={pending}>
      {pending ? "Placing your order…" : `Place order · ${ksh(total)}`}
    </button>
  );
}

function Stars({ name, label }: { name: string; label: string }) {
  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <legend className="float-left mr-4">{label}</legend>
      <div className="flex flex-row-reverse justify-end gap-1">
        {[5, 4, 3, 2, 1].map((n) => (
          <label key={n} className="cursor-pointer">
            <input type="radio" name={name} value={n} className="peer/star sr-only" />
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="jw-press block h-10 w-10 p-1 text-jw-ink/25 peer-checked/star:text-jw-ground peer-focus-visible/star:outline-3 peer-focus-visible/star:outline-jw-ink hover:text-jw-ground"
            >
              <path fill="currentColor" d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" />
            </svg>
            <span className="sr-only">
              {n} {n === 1 ? "star" : "stars"}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckoutForm({ user, areas, saved, toRate }: Props) {
  const lines = useCart();
  const [state, action] = useActionState<ShopState, FormData>(placeOrderAction, undefined);
  const [areaId, setAreaId] = useState(saved?.areaId && areas.some((a) => a.id === saved.areaId) ? saved.areaId : "");
  const [pin, setPin] = useState<[number, number] | null>(saved?.lat && saved?.lng ? [Number(saved.lat), Number(saved.lng)] : null);
  const [showMap, setShowMap] = useState(false);
  const [locating, setLocating] = useState(false);
  // The cart lives in the browser, so wait until we're there before showing it.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  const fee = areas.find((a) => a.id === areaId)?.fee ?? 0;
  const subtotal = cartTotal(lines);
  const total = subtotal + fee;

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPin([p.coords.latitude, p.coords.longitude]);
        setShowMap(true);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (!mounted) return <p className="mt-10">Loading your cart…</p>;
  if (!lines.length) {
    return (
      <div className="mt-10">
        <p className="text-[length:var(--step-lead)]">Your cart is empty.</p>
        <Link href="/#products" className="jw-btn mt-8">
          See the price list
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-10 grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-20">
      <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ variantId: l.variantId, qty: l.qty })))} />
      <input type="hidden" name="lat" value={pin ? pin[0].toFixed(6) : ""} />
      <input type="hidden" name="lng" value={pin ? pin[1].toFixed(6) : ""} />

      <div className="min-w-0 space-y-14">
        {toRate && (
          <section aria-labelledby="rate-title" className="bg-jw-ground/15 p-5 sm:p-7">
            <h2 id="rate-title" className="text-[length:var(--step-lead)]">
              How was order {toRate.orderNo}?
            </h2>
            <p className="mt-2">Rate each product from your last delivery. It helps us make the next batch better.</p>
            <div className="mt-5 space-y-4">
              {toRate.products.map((p) => (
                <Stars key={p.id} name={`rate:${p.id}`} label={p.name} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="where-title" className="space-y-6">
          <h2 id="where-title" className="text-[length:var(--step-lead)]">
            Where to deliver
          </h2>
          {areas.length === 0 ? (
            <p className="bg-jw-ground/15 p-4">We are still setting up delivery areas, so orders can&apos;t be placed yet. Please check back soon.</p>
          ) : (
            <label className="block">
              <span className="jw-label">Area</span>
              <select name="areaId" required value={areaId} onChange={(e) => setAreaId(e.target.value)} className="jw-input">
                <option value="" disabled>
                  Choose your area
                </option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.fee > 0 ? ksh(a.fee) : "free delivery"}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="jw-label">Directions for the rider</span>
            <textarea
              name="address"
              required
              rows={3}
              maxLength={300}
              defaultValue={saved?.address ?? ""}
              className="jw-input"
              placeholder="Estate, street, building or gate colour, a landmark"
            />
          </label>

          <div>
            <p className="jw-label">Map pin (optional)</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="jw-btn-quiet border-2 border-jw-ink" onClick={() => setShowMap((s) => !s)} aria-expanded={showMap}>
                {showMap ? "Hide map" : pin ? "Move my pin" : "Pin my gate"}
              </button>
              <button type="button" className="jw-btn-quiet border-2 border-jw-ink" onClick={locate} disabled={locating}>
                {locating ? "Finding you…" : "Use my location"}
              </button>
            </div>
            {pin && <p className="mt-3 text-jw-soft">Pin set. The rider will see it on a map.</p>}
            {showMap && (
              <div className="mt-4">
                <MapPin value={pin} onChange={setPin} />
                <p className="mt-2 text-[length:var(--step-small)] text-jw-soft">Tap the map where we should bring the bottles.</p>
              </div>
            )}
          </div>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="saveLocation" defaultChecked className="h-5 w-5 accent-jw-ink" />
            <span>Remember this for my next order</span>
          </label>
        </section>

        <section aria-labelledby="you-title" className="space-y-6">
          <h2 id="you-title" className="text-[length:var(--step-lead)]">
            Your details
          </h2>
          {!user && (
            <p>
              Ordered before?{" "}
              <Link href="/login?next=/checkout" className="jw-link">
                Log in
              </Link>{" "}
              first. New here? These details make your account, so you can follow the order.
            </p>
          )}
          <label className="block">
            <span className="jw-label">Name</span>
            <input name="contactName" required maxLength={80} autoComplete="name" defaultValue={user?.name ?? ""} className="jw-input" />
          </label>
          <label className="block">
            <span className="jw-label">Phone number</span>
            <input
              name="contactPhone"
              required
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              defaultValue={user ? formatPhone(user.phone) : ""}
              className="jw-input"
              placeholder="0712 345 678"
            />
          </label>
          {!user && (
            <>
              <label className="block">
                <span className="jw-label">Choose a password</span>
                <input name="password" type="password" required autoComplete="new-password" aria-describedby="pw-rule" className="jw-input" />
                <span id="pw-rule" className="mt-1 block text-[length:var(--step-small)] text-jw-soft">
                  At least 8 characters.
                </span>
              </label>
              <label className="block">
                <span className="jw-label">Email (optional)</span>
                <input name="email" type="email" autoComplete="email" maxLength={120} aria-describedby="email-why" className="jw-input" />
                <span id="email-why" className="mt-1 block text-[length:var(--step-small)] text-jw-soft">
                  Only used to reset your password.
                </span>
              </label>
            </>
          )}
          <label className="block">
            <span className="jw-label">Note for us (optional)</span>
            <input name="note" maxLength={300} className="jw-input" placeholder="For example: call when you reach the gate" />
          </label>
        </section>

        <section aria-labelledby="pay-title" className="space-y-4">
          <h2 id="pay-title" className="text-[length:var(--step-lead)]">
            Payment
          </h2>
          <label className="flex cursor-pointer items-start gap-3 bg-jw-ground/15 p-4">
            <input type="radio" name="payMethod" value="mpesa" defaultChecked className="mt-1.5 h-5 w-5 accent-jw-ink" />
            <span>
              <span className="font-medium">M-Pesa</span>
              <span className="block text-jw-soft">After you order, we show our till number and where to type your M-Pesa code.</span>
            </span>
          </label>
          {user?.isTrusted && (
            <label className="flex cursor-pointer items-start gap-3 bg-jw-ground/15 p-4">
              <input type="radio" name="payMethod" value="cod" className="mt-1.5 h-5 w-5 accent-jw-ink" />
              <span>
                <span className="font-medium">Cash on delivery</span>
                <span className="block text-jw-soft">Pay the rider when the bottles arrive.</span>
              </span>
            </label>
          )}
        </section>
      </div>

      <aside aria-labelledby="sum-title" className="lg:sticky lg:top-6 lg:self-start">
        <h2 id="sum-title" className="text-[length:var(--step-lead)]">
          Your bottles
        </h2>
        <ul className="mt-5 space-y-3">
          {lines.map((l) => (
            <li key={l.variantId} className="flex items-baseline justify-between gap-4 tabular-nums">
              <span>
                {l.qty} × {l.name.replace(/^JonWin\s+/, "")} {sizeLabel(l.sizeMl)}
              </span>
              <span>{ksh(l.qty * l.price)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex items-baseline justify-between gap-4 tabular-nums">
          <span>Delivery</span>
          <span>{areaId ? (fee > 0 ? ksh(fee) : "Free") : "Choose area"}</span>
        </p>
        <p className="mt-3 flex items-baseline justify-between gap-4 text-[length:var(--step-lead)] font-medium tabular-nums">
          <span>Total</span>
          <span>{ksh(total)}</span>
        </p>
        <Link href="/cart" className="jw-link mt-3 inline-block">
          Change cart
        </Link>

        {state?.error && (
          <p role="alert" className="mt-6 bg-jw-ink p-4 text-jw-paper">
            {state.error}{" "}
            {state.field === "login" && (
              <Link href="/login?next=/checkout" className="underline">
                Log in
              </Link>
            )}
          </p>
        )}
        <div className="mt-6">{areas.length > 0 && <PlaceButton total={total} />}</div>
        <p className="mt-4 text-[length:var(--step-small)] text-jw-soft">
          By ordering you agree to our{" "}
          <Link href="/terms" className="jw-link text-jw-ink">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/delivery" className="jw-link text-jw-ink">
            delivery and refund policy
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}
