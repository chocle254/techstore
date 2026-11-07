"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { assignRiderAction, cancelOrderAction, confirmPaidAction, markReadyAction, setStatusAction, unassignRiderAction } from "./actions";

export function ConfirmPaidForm({ orderId, payRef }: { orderId: string; payRef: string | null }) {
  const [state, action] = useActionState(confirmPaidAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="min-w-40 flex-1">
        <span className="label">M-Pesa code checked</span>
        <input name="ref" defaultValue={payRef ?? ""} required maxLength={12} className="input uppercase" placeholder="SGL7XK2P9Q" />
      </label>
      <SubmitButton className="btn-primary" pendingText="Saving…">
        Mark paid
      </SubmitButton>
      <div className="w-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function MarkReadyForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(markReadyAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton className="btn-primary w-full" pendingText="Saving…">
        ✓ Mark ready for delivery
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function StatusButtons({ orderId, options, cod, balance }: { orderId: string; options: string[]; cod: boolean; balance: number }) {
  const [state, action] = useActionState(setStatusAction, undefined);
  const [method, setMethod] = useState<"cash" | "mpesa">("cash");
  const collect = cod && balance > 0 && options.includes("delivered");
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      {collect && (
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex items-center gap-1">
            <input type="radio" name="method" value="cash" checked={method === "cash"} onChange={() => setMethod("cash")} /> Cash
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="method" value="mpesa" checked={method === "mpesa"} onChange={() => setMethod("mpesa")} /> M-Pesa
          </label>
          {method === "mpesa" && <input name="ref" required maxLength={12} className="input max-w-44 uppercase" placeholder="M-Pesa code" aria-label="M-Pesa code" />}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.includes("out_for_delivery") && (
          <SubmitButton name="status" value="out_for_delivery" className="btn-secondary" pendingText="Saving…" formNoValidate>
            On the way
          </SubmitButton>
        )}
        {options.includes("delivered") && (
          <SubmitButton name="status" value="delivered" className="btn-primary" pendingText="Saving…">
            Delivered{collect ? ` (${method === "cash" ? "cash" : "M-Pesa"} received)` : ""}
          </SubmitButton>
        )}
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function AssignRiderForm({ orderId, riders, current }: { orderId: string; riders: { id: string; name: string }[]; current: string | null }) {
  const [state, action] = useActionState(assignRiderAction, undefined);
  const [back, backAction] = useActionState(unassignRiderAction, undefined);
  if (!riders.length) {
    return <p className="text-sm text-muted">No riders yet. The boss can add one in Staff (role: Rider).</p>;
  }
  return (
    <div className="space-y-2">
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="orderId" value={orderId} />
        <label className="min-w-40 flex-1">
          <span className="label">{current ? "Rider" : "Give to rider"}</span>
          <select name="riderId" defaultValue={current ?? ""} required className="input">
            <option value="" disabled>
              Choose…
            </option>
            {riders.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton className="btn-secondary" pendingText="Saving…">
          {current ? "Change rider" : "Assign"}
        </SubmitButton>
      </form>
      {current && (
        <form action={backAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <SubmitButton className="text-sm text-brand-700 underline" pendingText="…">
            Take back from rider
          </SubmitButton>
        </form>
      )}
      <FormMessage state={state} />
      <FormMessage state={back} />
    </div>
  );
}

export function CancelForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(cancelOrderAction, undefined);
  return (
    <details>
      <summary className="cursor-pointer text-sm text-red-700 underline">Cancel this order</summary>
      <form action={action} className="mt-2 flex flex-wrap items-end gap-2">
        <input type="hidden" name="orderId" value={orderId} />
        <label className="min-w-48 flex-1">
          <span className="label">Reason</span>
          <input name="reason" required maxLength={200} className="input" placeholder="Customer asked, no stock…" />
        </label>
        <SubmitButton className="btn-danger" pendingText="Cancelling…">
          Cancel order
        </SubmitButton>
        <div className="w-full">
          <FormMessage state={state} />
        </div>
      </form>
    </details>
  );
}
