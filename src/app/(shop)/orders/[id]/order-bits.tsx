"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cart } from "@/lib/cart";

export function ClearCart() {
  useEffect(() => cart.clear(), []);
  return null;
}

/**
 * A normal form post to /orders/[id]/pay-code that reloads the page, rather than a background request:
 * on some phone browsers a stuck background request made the whole app stop responding.
 */
export function PayCodeForm({ orderId, error }: { orderId: string; error: string | null }) {
  const [sending, setSending] = useState(false);
  // Coming back with the Back button can restore the page mid-send; make the button usable again.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setSending(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  return (
    <form method="post" action={`/orders/${orderId}/pay-code`} onSubmit={() => setSending(true)}>
      <label htmlFor="pay-code" className="mb-2 block font-medium">
        Paid? Type the M-Pesa code from your SMS
      </label>
      <span className="flex flex-wrap gap-3">
        <input
          id="pay-code"
          name="code"
          required
          maxLength={12}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="SGL7XK2P9Q"
          className="min-w-0 flex-1 rounded-full border border-white/30 bg-white/15 px-4 py-3 text-base tracking-wider text-white uppercase outline-none placeholder:text-white/50 focus:border-white focus:bg-white/20"
        />
        <button type="submit" disabled={sending} className="inline-flex min-h-12 items-center rounded-full bg-white px-5 font-semibold text-[#16181d] active:scale-95 disabled:opacity-60">
          {sending ? "Sending…" : "Send code"}
        </button>
      </span>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-sm">
          {error}
        </p>
      )}
    </form>
  );
}

/** While an M-Pesa prompt is open, reload the order every 5 seconds (for up to 2 minutes) to catch the payment. */
export function StkWaiting() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      if (++n > 24) return clearInterval(t);
      if (document.visibilityState === "visible") router.refresh();
    }, 5000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
