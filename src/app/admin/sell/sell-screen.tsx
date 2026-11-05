"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ksh, sizeLabel } from "@/lib/format";
import { recordSaleAction } from "./actions";

export type SellProduct = {
  id: string;
  name: string;
  sizes: { variantId: string; sizeMl: number; price: number; onHand: number }[];
};

type Method = "cash" | "mpesa" | "credit";
type Line = { variantId: string; qty: number };
type Pending = { input: Record<string, unknown>; label: string };

const QUEUE_KEY = "jw_pending_sales";

function readQueue(): Pending[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writeQueue(q: Pending[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function SellScreen({ products }: { products: SellProduct[] }) {
  const [productId, setProductId] = useState<string | null>(products[0]?.id ?? null);
  const [lines, setLines] = useState<Line[]>([]);
  const [method, setMethod] = useState<Method>("cash");
  const [mpesaRef, setMpesaRef] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deposit, setDeposit] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showCustomer, setShowCustomer] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error" | "queued"; text: string } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const variantById = useMemo(() => {
    const m = new Map<string, { name: string; sizeMl: number; price: number; onHand: number }>();
    for (const p of products) for (const s of p.sizes) m.set(s.variantId, { name: p.name, ...s });
    return m;
  }, [products]);

  const total = lines.reduce((sum, l) => sum + (variantById.get(l.variantId)?.price ?? 0) * l.qty, 0);
  const current = products.find((p) => p.id === productId);

  // Send any sales saved while offline.
  const flush = useCallback(async () => {
    const queue = readQueue();
    setPendingCount(queue.length);
    if (!queue.length || !navigator.onLine) return;
    const left: Pending[] = [];
    for (const item of queue) {
      try {
        const res = await recordSaleAction(item.input);
        if (!res.ok) left.push(item); // keep it so nothing is lost; shown below
      } catch {
        left.push(item);
      }
    }
    writeQueue(left);
    setPendingCount(left.length);
  }, []);

  useEffect(() => {
    // Runs once on mount to pick up sales saved on a previous visit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [flush]);

  function add(variantId: string) {
    setMessage(null);
    setLines((ls) => {
      const found = ls.find((l) => l.variantId === variantId);
      return found ? ls.map((l) => (l.variantId === variantId ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { variantId, qty: 1 }];
    });
  }
  function setQty(variantId: string, qty: number) {
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.variantId !== variantId) : ls.map((l) => (l.variantId === variantId ? { ...l, qty } : l))));
  }

  function reset() {
    setLines([]);
    setMethod("cash");
    setMpesaRef("");
    setCustomerName("");
    setCustomerPhone("");
    setDeposit("");
    setDueDate("");
    setShowCustomer(false);
  }

  function submit() {
    if (!lines.length) return;
    if (method === "credit" && (!customerName.trim() || !customerPhone.trim())) {
      setMessage({ kind: "error", text: "Pay later needs the customer's name and phone." });
      return;
    }
    const input = {
      clientId: crypto.randomUUID(),
      items: lines,
      method,
      mpesaRef: method === "mpesa" ? mpesaRef.trim().toUpperCase() || undefined : undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      deposit: method === "credit" && deposit ? Math.max(0, Math.round(Number(deposit))) : undefined,
      dueDate: method === "credit" && dueDate ? dueDate : undefined,
    };
    const label = `${ksh(total)} · ${lines.length} item(s)`;

    const queueIt = () => {
      writeQueue([...readQueue(), { input, label }]);
      setPendingCount(readQueue().length);
      setMessage({ kind: "queued", text: `No network. Sale saved on this phone (${label}) and will be sent automatically.` });
      reset();
    };

    if (!navigator.onLine) return queueIt();
    startTransition(async () => {
      try {
        const res = await recordSaleAction(input);
        if (res.ok) {
          setMessage({ kind: "ok", text: `Sale saved. Receipt #${res.receiptNo} · ${ksh(total)}` });
          reset();
        } else {
          setMessage({ kind: "error", text: res.error });
        }
      } catch {
        queueIt();
      }
    });
  }

  if (!products.length) {
    return <p className="card">No products yet. Add them in Products.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sell</h1>
        <Link href="/admin/sales" className="text-sm text-brand-700 underline">
          Today&apos;s sales
        </Link>
      </div>

      {pendingCount > 0 && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          ⚠️ {pendingCount} sale(s) saved on this phone, waiting for network.{" "}
          <button type="button" className="underline" onClick={flush}>
            Send now
          </button>
        </p>
      )}

      {/* 1. Product */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === productId}
            onClick={() => setProductId(p.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
              p.id === productId ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white"
            }`}
          >
            {p.name.replace(/^JonWin\s+/, "")}
          </button>
        ))}
      </div>

      {/* 2. Size */}
      <div className="grid grid-cols-3 gap-2">
        {current?.sizes.map((s) => {
          const noPrice = s.price <= 0;
          const inCart = lines.find((l) => l.variantId === s.variantId)?.qty ?? 0;
          return (
            <button
              key={s.variantId}
              type="button"
              disabled={noPrice}
              onClick={() => add(s.variantId)}
              className="relative rounded-2xl border border-line bg-white p-3 text-left active:scale-[0.98] disabled:opacity-40"
            >
              <span className="block text-lg font-bold">{sizeLabel(s.sizeMl)}</span>
              <span className="block text-sm">{noPrice ? "No price set" : ksh(s.price)}</span>
              <span className={`block text-xs ${s.onHand <= 0 ? "text-red-600" : "text-muted"}`}>{s.onHand} in stock</span>
              {inCart > 0 && (
                <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {inCart}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Cart */}
      {lines.length > 0 && (
        <section className="card space-y-3" aria-label="This sale">
          <ul className="divide-y divide-line">
            {lines.map((l) => {
              const v = variantById.get(l.variantId)!;
              return (
                <li key={l.variantId} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {v.name.replace(/^JonWin\s+/, "")} {sizeLabel(v.sizeMl)}
                    </p>
                    <p className="text-xs text-muted">
                      {ksh(v.price)} each{l.qty > v.onHand && <span className="text-amber-700"> · only {v.onHand} in stock</span>}
                    </p>
                  </div>
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
          </ul>
          <p className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{ksh(total)}</span>
          </p>

          {/* 4. Payment */}
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
                className={`rounded-xl border px-2 py-3 text-sm font-semibold ${method === m ? "border-brand-600 bg-brand-50 text-brand-900" : "border-line"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {method === "mpesa" && (
            <input className="input uppercase" placeholder="M-Pesa code (optional)" value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} maxLength={30} />
          )}

          {method === "credit" && (
            <p className="rounded-xl bg-surface px-3 py-2 text-xs text-muted">
              Recorded in Owed money. Customer&apos;s name and phone are required.
            </p>
          )}

          {(method === "credit" || showCustomer) && (
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={80} />
              <input className="input" placeholder="Phone 07…" inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} maxLength={20} />
              {method === "credit" && (
                <>
                  <input className="input" placeholder="Paid now (optional)" inputMode="numeric" value={deposit} onChange={(e) => setDeposit(e.target.value.replace(/\D/g, ""))} />
                  <label className="text-xs text-muted">
                    Promised to pay by
                    <input className="input mt-1" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </label>
                </>
              )}
            </div>
          )}
          {method !== "credit" && !showCustomer && (
            <button type="button" className="text-sm text-brand-700 underline" onClick={() => setShowCustomer(true)}>
              + Add customer (optional)
            </button>
          )}

          <button type="button" className="btn-primary w-full text-lg" disabled={isPending} onClick={submit}>
            {isPending ? "Saving…" : `Save sale · ${ksh(total)}`}
          </button>
          <button type="button" className="w-full text-sm text-muted underline" onClick={reset}>
            Clear
          </button>
        </section>
      )}

      {message && (
        <p
          role="status"
          className={`rounded-xl px-3 py-2 text-sm ${
            message.kind === "ok" ? "bg-brand-50 text-brand-900" : message.kind === "queued" ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
