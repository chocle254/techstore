"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormMessage, SubmitButton } from "@/components/form";
import { ksh, sizeLabel } from "@/lib/format";
import { bookOrderAction, cancelScheduledAction, completeOrderAction, rescheduleAction } from "./actions";

export type PickProduct = { id: string; name: string; sizes: { variantId: string; sizeMl: number; price: number }[] };

const short = (name: string) => name.replace(/^JonWin\s+/, "");

/** Book an order for a day: customer, date, what they want. */
export function BookForm({ products, defaultDate }: { products: PickProduct[]; defaultDate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [lines, setLines] = useState<{ variantId: string; qty: number }[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>();
  const [pending, start] = useTransition();

  const byId = useMemo(() => {
    const m = new Map<string, { name: string; sizeMl: number; price: number }>();
    for (const p of products) for (const s of p.sizes) m.set(s.variantId, { name: p.name, ...s });
    return m;
  }, [products]);
  const total = lines.reduce((s, l) => s + (byId.get(l.variantId)?.price ?? 0) * l.qty, 0);
  const current = products.find((p) => p.id === productId);

  function setQty(variantId: string, qty: number) {
    setLines((ls) => {
      if (qty <= 0) return ls.filter((l) => l.variantId !== variantId);
      return ls.some((l) => l.variantId === variantId) ? ls.map((l) => (l.variantId === variantId ? { ...l, qty } : l)) : [...ls, { variantId, qty }];
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(undefined);
    start(async () => {
      const res = await bookOrderAction({
        customerName: name,
        customerPhone: phone.trim() || undefined,
        dueDate: date,
        note: note.trim() || undefined,
        items: lines,
      });
      if (!res.ok) return setMsg({ error: res.error });
      setLines([]);
      setName("");
      setPhone("");
      setNote("");
      setOpen(false);
      setMsg({ ok: "Order booked." });
      router.refresh();
    });
  }

  if (!open)
    return (
      <div className="space-y-2">
        <button type="button" className="btn-primary w-full text-lg" onClick={() => (setOpen(true), setMsg(undefined))}>
          + Book an order
        </button>
        <FormMessage state={msg} />
      </div>
    );

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="text-lg font-semibold">New order</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input" placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
        <input className="input" placeholder="Phone 07… (optional)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
      </div>
      <label className="block">
        <span className="label">When</span>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === productId}
            onClick={() => setProductId(p.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${p.id === productId ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-card"}`}
          >
            {short(p.name)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {current?.sizes.map((s) => {
          const n = lines.find((l) => l.variantId === s.variantId)?.qty ?? 0;
          return (
            <button
              key={s.variantId}
              type="button"
              onClick={() => setQty(s.variantId, n + 1)}
              className="relative rounded-2xl border border-line bg-card p-3 text-left active:scale-[0.98]"
            >
              <span className="block text-lg font-bold">{sizeLabel(s.sizeMl)}</span>
              <span className="block text-sm">{s.price > 0 ? ksh(s.price) : "No price yet"}</span>
              {n > 0 && (
                <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {lines.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line px-3">
          {lines.map((l) => {
            const v = byId.get(l.variantId)!;
            return (
              <li key={l.variantId} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {short(v.name)} {sizeLabel(v.sizeMl)}
                </span>
                <button type="button" className="btn-secondary size-11 p-0" onClick={() => setQty(l.variantId, l.qty - 1)} aria-label="One less">
                  −
                </button>
                <input
                  className="input w-14 px-1 text-center"
                  inputMode="numeric"
                  value={l.qty}
                  onChange={(e) => setQty(l.variantId, Math.min(1000, Number(e.target.value.replace(/\D/g, "")) || 0))}
                  aria-label="Quantity"
                />
                <button type="button" className="btn-secondary size-11 p-0" onClick={() => setQty(l.variantId, l.qty + 1)} aria-label="One more">
                  +
                </button>
              </li>
            );
          })}
          <li className="flex justify-between py-2 font-semibold">
            <span>About</span>
            <span>{ksh(total)}</span>
          </li>
        </ul>
      )}

      <input className="input" placeholder="Note (optional), e.g. deliver to the school gate" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      <FormMessage state={msg} />
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={pending || lines.length === 0}>
          {pending ? "Saving…" : "Book order"}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    </form>
  );
}

/** Delivered or collected: choose how they paid and it becomes a sale. */
export function DoneForm({ id, total, hasPhone }: { id: string; total: number; hasPhone: boolean }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"cash" | "mpesa" | "credit">("cash");
  const [state, action] = useActionState(completeOrderAction, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  if (!open)
    return (
      <button type="button" className="btn-primary flex-1" onClick={() => setOpen(true)}>
        ✓ Done
      </button>
    );
  return (
    <form action={action} className="w-full space-y-2 rounded-xl bg-surface p-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="method" value={method} />
      <p className="text-sm font-medium">How did they pay? ({ksh(total)})</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment">
        {(
          [
            ["cash", "💵 Cash"],
            ["mpesa", "📱 M-Pesa"],
            ["credit", "⏳ Pay later"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={method === m}
            onClick={() => setMethod(m)}
            className={`rounded-xl border px-2 py-3 text-sm font-semibold ${method === m ? "border-brand-600 bg-brand-50 text-brand-900" : "border-line bg-card"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {method === "mpesa" && <input className="input uppercase" name="mpesaRef" placeholder="M-Pesa code (optional)" maxLength={30} />}
      {method === "credit" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {!hasPhone && <p className="text-sm text-red-700 sm:col-span-2">Pay later needs a phone number. Cancel and book again with their phone.</p>}
          <input className="input" name="deposit" placeholder="Paid now (optional)" inputMode="numeric" pattern="\d*" />
          <label className="text-xs text-muted">
            Promised to pay by
            <input className="input mt-1" type="date" name="promisedBy" />
          </label>
        </div>
      )}
      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton className="btn-primary flex-1" pendingText="Saving…">
          Save sale
        </SubmitButton>
        <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
          Back
        </button>
      </div>
    </form>
  );
}

export function MoveDateForm({ id, dueDate }: { id: string; dueDate: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(rescheduleAction, undefined);
  if (!open)
    return (
      <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(true)}>
        Change date
      </button>
    );
  return (
    <form action={action} className="flex w-full flex-wrap gap-2">
      <input type="hidden" name="id" value={id} />
      <input className="input min-w-0 flex-1" type="date" name="dueDate" defaultValue={dueDate} required aria-label="New date" />
      <SubmitButton className="btn-primary" pendingText="Saving…">
        Save
      </SubmitButton>
      <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
        Back
      </button>
      <div className="w-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function CancelScheduledForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(cancelScheduledAction, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  if (!open)
    return (
      <button type="button" className="text-sm text-red-700 underline" onClick={() => setOpen(true)}>
        Cancel order
      </button>
    );
  return (
    <form action={action} className="w-full space-y-2">
      <input type="hidden" name="id" value={id} />
      <input className="input" name="reason" placeholder="Why? e.g. customer changed their mind" required minLength={3} maxLength={200} />
      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton className="btn-danger flex-1" pendingText="Cancelling…">
          Cancel order
        </SubmitButton>
        <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
          Keep it
        </button>
      </div>
    </form>
  );
}
