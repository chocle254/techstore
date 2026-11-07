"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormMessage, SubmitButton } from "@/components/form";
import { deliveredAction, handBackAction, startDeliveryAction, takeOrderAction } from "./actions";

export function TakeButton({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(takeOrderAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton className="btn-primary w-full" pendingText="Saving…">
        🙋 I&apos;ll take it
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function StartButton({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(startDeliveryAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton className="btn-secondary w-full" pendingText="Saving…">
        🛵 I&apos;m leaving with it
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

/** Mark delivered. When money is still owed, the rider says how the customer paid. */
export function DeliveredForm({ orderId, collect }: { orderId: string; collect: string | null }) {
  const [state, action] = useActionState(deliveredAction, undefined);
  const [method, setMethod] = useState<"cash" | "mpesa">("cash");
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      {collect && (
        <fieldset className="space-y-2">
          <legend className="label">Customer paid {collect} by</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["cash", "mpesa"] as const).map((m) => (
              <label key={m} className={`rounded-xl border px-3 py-2 text-center font-semibold ${method === m ? "border-brand-600 bg-brand-50" : "border-line"}`}>
                <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
                {m === "cash" ? "💵 Cash" : "📱 M-Pesa"}
              </label>
            ))}
          </div>
          {method === "mpesa" && (
            <input name="ref" required maxLength={12} className="input uppercase" placeholder="M-Pesa code, e.g. SGL7XK2P9Q" aria-label="M-Pesa code" />
          )}
        </fieldset>
      )}
      <SubmitButton className="btn-primary w-full" pendingText="Saving…">
        ✅ Delivered{collect ? ` and ${collect} received` : ""}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function HandBackForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(handBackAction, undefined);
  return (
    <details>
      <summary className="cursor-pointer text-sm text-red-700 underline">Can&apos;t deliver? Hand it back</summary>
      <form action={action} className="mt-2 space-y-2">
        <input type="hidden" name="orderId" value={orderId} />
        <input name="reason" required minLength={3} maxLength={200} className="input" placeholder="e.g. customer not picking calls" aria-label="What happened" />
        <SubmitButton className="btn-danger w-full" pendingText="Saving…">
          Hand back to office
        </SubmitButton>
        <FormMessage state={state} />
      </form>
    </details>
  );
}

/** Reload the list every minute and when the phone wakes, so new orders show up without a manual refresh. */
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && router.refresh();
    const t = setInterval(tick, seconds * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, seconds]);
  return null;
}
