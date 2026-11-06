"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { cart } from "@/lib/cart";
import { submitPayRefAction, type ShopState } from "../../actions";

export function ClearCart() {
  useEffect(() => cart.clear(), []);
  return null;
}

function Send() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center rounded-full bg-card px-5 font-semibold text-jw-ink active:scale-95 disabled:opacity-60">
      {pending ? "Sending…" : "Send code"}
    </button>
  );
}

export function PayCodeForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState<ShopState, FormData>(submitPayRefAction, undefined);
  if (state?.ok) return <p role="status">{state.ok}</p>;
  return (
    <form action={action}>
      <input type="hidden" name="orderId" value={orderId} />
      <label className="block">
        <span className="mb-2 block font-medium">Paid? Type the M-Pesa code from your SMS</span>
        <span className="flex flex-wrap gap-3">
          <input
            name="code"
            required
            maxLength={12}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="SGL7XK2P9Q"
            className="min-w-0 flex-1 rounded-full border border-white/30 bg-white/15 px-4 py-3 text-base tracking-wider text-white uppercase outline-none placeholder:text-white/50 focus:border-white focus:bg-white/20"
          />
          <Send />
        </span>
      </label>
      {state?.error && (
        <p role="alert" className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}
