"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { recordPaymentAction, voidSaleAction } from "./actions";

export function VoidSaleForm({ saleId }: { saleId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(voidSaleAction, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  if (!open)
    return (
      <button type="button" className="text-xs text-red-700 underline" onClick={() => setOpen(true)}>
        Void sale
      </button>
    );
  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="saleId" value={saleId} />
      <input className="input" name="reason" placeholder="Why? e.g. entered twice" required minLength={3} maxLength={200} />
      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton className="btn-danger flex-1" pendingText="Voiding…">
          Void
        </SubmitButton>
        <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PaymentForm({ saleId, balance }: { saleId: string; balance: number }) {
  const [state, action] = useActionState(recordPaymentAction, undefined);
  const [method, setMethod] = useState("cash");
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="saleId" value={saleId} />
      <div className="flex gap-2">
        <input className="input flex-1" name="amount" inputMode="numeric" pattern="\d+" defaultValue={balance} required aria-label="Amount received" />
        <select className="input w-28" name="method" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Paid by">
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
        </select>
      </div>
      {method === "mpesa" && <input className="input uppercase" name="reference" placeholder="M-Pesa code (optional)" maxLength={30} />}
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Saving…">
        Record payment
      </SubmitButton>
    </form>
  );
}
