"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { cartTotal, useCart } from "@/lib/cart";
import { formatPhone } from "@/lib/phone";
import { ksh, sizeLabel } from "@/lib/format";
import { CardBottle, short, tileFor } from "@/components/shop/tiles";
import { Icon } from "@/components/shop/icons";
import { placeOrderAction, type ShopState } from "../actions";

const MapPin = dynamic(() => import("@/components/shop/map-pin"), {
  ssr: false,
  loading: () => <p className="jw-well flex h-72 items-center justify-center text-sm text-jw-soft">Loading the map…</p>,
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
    <button type="submit" className="jw-btn w-full text-base" disabled={pending}>
      {pending ? "Placing your order…" : `Place order · ${ksh(total)}`}
    </button>
  );
}

function Stars({ name, label }: { name: string; label: string }) {
  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <legend className="float-left mr-4 font-medium">{label}</legend>
      <div className="flex flex-row-reverse justify-end gap-1">
        {[5, 4, 3, 2, 1].map((n) => (
          <label key={n} className="cursor-pointer">
            <input type="radio" name={name} value={n} className="peer/star sr-only" />
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="jw-press block h-10 w-10 p-1 text-jw-ink/15 peer-checked/star:text-amber-400 peer-focus-visible/star:outline-2 peer-focus-visible/star:outline-jw-ground hover:text-amber-300"
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

function Card({ n, title, id, children }: { n: number; title: string; id: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="jw-clay p-5 sm:p-7">
      <h2 id={id} className="flex items-center gap-3 text-lg">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-jw-ink text-sm text-white">{n}</span>
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
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

  if (!mounted) return <div className="jw-clay mt-6 h-64 animate-pulse" aria-label="Loading your cart" />;
  if (!lines.length) {
    return (
      <div className="jw-clay mt-6 flex flex-col items-center px-6 py-14 text-center">
        <p className="text-xl font-bold">Your cart is empty</p>
        <p className="mt-1 text-jw-soft">Add some products first, then come back to check out.</p>
        <Link href="/#shop" className="jw-btn mt-6">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 grid gap-4 lg:grid-cols-[1fr_24rem] lg:items-start">
      <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ variantId: l.variantId, qty: l.qty })))} />
      <input type="hidden" name="lat" value={pin ? pin[0].toFixed(6) : ""} />
      <input type="hidden" name="lng" value={pin ? pin[1].toFixed(6) : ""} />

      <div className="min-w-0 space-y-4">
        {toRate && (
          <section aria-labelledby="rate-title" className="jw-clay p-5 sm:p-7" style={{ background: "linear-gradient(160deg, #fff7ed, #ffffff)" }}>
            <h2 id="rate-title" className="text-lg">
              How was order {toRate.orderNo}?
            </h2>
            <p className="mt-1 text-sm text-jw-soft">Rate each product from your last delivery. It helps us make the next batch better.</p>
            <div className="mt-4 space-y-3">
              {toRate.products.map((p) => (
                <Stars key={p.id} name={`rate:${p.id}`} label={p.name} />
              ))}
            </div>
          </section>
        )}

        <Card n={1} title="Where to deliver" id="where-title">
          {areas.length === 0 ? (
            <p className="jw-well p-4 text-sm">We are still setting up delivery areas, so orders can&apos;t be placed yet. Please check back soon.</p>
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
            <div className="flex flex-wrap gap-2">
              <button type="button" className="jw-btn-quiet min-h-11 px-4 text-sm" onClick={() => setShowMap((s) => !s)} aria-expanded={showMap}>
                <Icon name="pin" className="h-4 w-4 text-jw-ground" />
                {showMap ? "Hide map" : pin ? "Move my pin" : "Pin my gate"}
              </button>
              <button type="button" className="jw-btn-quiet min-h-11 px-4 text-sm" onClick={locate} disabled={locating}>
                {locating ? "Finding you…" : "Use my location"}
              </button>
            </div>
            {pin && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-jw-mpesa">
                <Icon name="check" className="h-4 w-4" /> Pin set. The rider will see it on a map.
              </p>
            )}
            {showMap && (
              <div className="mt-4 overflow-hidden rounded-2xl">
                <MapPin value={pin} onChange={setPin} />
                <p className="mt-2 text-xs text-jw-soft">Tap the map where we should bring the bottles.</p>
              </div>
            )}
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="saveLocation" defaultChecked className="h-5 w-5 accent-jw-ground" />
            <span>Remember this for my next order</span>
          </label>
        </Card>

        <Card n={2} title="Your details" id="you-title">
          {!user && (
            <p className="jw-well p-4 text-sm">
              Ordered before?{" "}
              <Link href="/login?next=/checkout" className="jw-link">
                Log in
              </Link>{" "}
              first. New here? These details make your account, so you can follow the order.
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
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
          </div>
          {!user && (
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="jw-label">Choose a password</span>
                <input name="password" type="password" required autoComplete="new-password" aria-describedby="pw-rule" className="jw-input" />
                <span id="pw-rule" className="mt-1 block text-xs text-jw-soft">
                  At least 8 characters.
                </span>
              </label>
              <label className="block">
                <span className="jw-label">Email (optional)</span>
                <input name="email" type="email" autoComplete="email" maxLength={120} aria-describedby="email-why" className="jw-input" />
                <span id="email-why" className="mt-1 block text-xs text-jw-soft">
                  Only used to reset your password.
                </span>
              </label>
            </div>
          )}
          <label className="block">
            <span className="jw-label">Note for us (optional)</span>
            <input name="note" maxLength={300} className="jw-input" placeholder="For example: call when you reach the gate" />
          </label>
        </Card>

        <Card n={3} title="Payment" id="pay-title">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="relative flex cursor-pointer items-start gap-3 rounded-2xl bg-jw-well p-4 ring-2 ring-transparent transition has-[:checked]:bg-jw-paper has-[:checked]:ring-jw-mpesa has-[:focus-visible]:ring-jw-ground">
              <input type="radio" name="payMethod" value="mpesa" defaultChecked className="mt-1 h-5 w-5 accent-jw-mpesa" />
              <span>
                <span className="flex items-center gap-2 font-bold">
                  <span className="rounded-md bg-jw-mpesa px-1.5 py-0.5 text-[0.6875rem] text-white">M-PESA</span> Pay by M-Pesa
                </span>
                <span className="mt-1 block text-sm text-jw-soft">After you order, we show our till number and where to type your M-Pesa code.</span>
              </span>
            </label>
            {user?.isTrusted && (
              <label className="relative flex cursor-pointer items-start gap-3 rounded-2xl bg-jw-well p-4 ring-2 ring-transparent transition has-[:checked]:bg-jw-paper has-[:checked]:ring-jw-ground has-[:focus-visible]:ring-jw-ground">
                <input type="radio" name="payMethod" value="cod" className="mt-1 h-5 w-5 accent-jw-ground" />
                <span>
                  <span className="font-bold">Cash on delivery</span>
                  <span className="mt-1 block text-sm text-jw-soft">Pay the rider when the bottles arrive.</span>
                </span>
              </label>
            )}
          </div>
        </Card>
      </div>

      <aside aria-labelledby="sum-title" className="jw-clay p-5 lg:sticky lg:top-36">
        <div className="flex items-center justify-between">
          <h2 id="sum-title" className="text-lg">
            Your order
          </h2>
          <Link href="/cart" className="jw-link text-sm">
            Edit cart
          </Link>
        </div>
        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
          {lines.map((l) => (
            <li key={l.variantId} className="flex items-center gap-3 text-sm">
              <span className="relative flex h-14 w-14 shrink-0 items-end justify-center rounded-xl pb-1" style={{ background: tileFor(l.slug) }}>
                <CardBottle slug={l.slug} sizeMl={l.sizeMl} height={38} />
                <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-jw-ink px-1 text-[0.6875rem] font-bold text-white">{l.qty}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{short(l.name)}</span>
                <span className="text-jw-soft">{sizeLabel(l.sizeMl)}</span>
              </span>
              <span className="font-semibold tabular-nums">{ksh(l.qty * l.price)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-jw-ink/5 pt-4 text-sm tabular-nums">
          <div className="flex justify-between">
            <dt className="text-jw-soft">Items</dt>
            <dd>{ksh(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-jw-soft">Delivery</dt>
            <dd className={areaId && fee === 0 ? "font-semibold text-jw-mpesa" : ""}>{areaId ? (fee > 0 ? ksh(fee) : "Free") : "Choose area"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-jw-ink/5 pt-4">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-extrabold tabular-nums">{ksh(total)}</span>
        </div>

        {state?.error && (
          <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
            {state.error}{" "}
            {state.field === "login" && (
              <Link href="/login?next=/checkout" className="font-semibold underline">
                Log in
              </Link>
            )}
          </p>
        )}
        <div className="mt-5">{areas.length > 0 && <PlaceButton total={total} />}</div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-jw-soft">
          <Icon name="shield" className="h-4 w-4 text-jw-mpesa" /> You pay only after the order is placed
        </p>
        <p className="mt-3 text-center text-xs text-jw-soft">
          By ordering you agree to our{" "}
          <Link href="/terms" className="underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/delivery" className="underline">
            delivery and refund policy
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}
