"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { sizeLabel } from "@/lib/format";
import { recordBatchAction } from "./actions";

export type BatchProduct = {
  id: string;
  name: string;
  batchSizeMl: number;
  sizes: { variantId: string; sizeMl: number; suggest: number }[];
  /** Chemicals one batch uses, shown so the cook sees what will be taken off. */
  recipe: { name: string; unit: string; amount: number }[];
};

const fmt = (n: number) => n.toLocaleString("en-KE", { maximumFractionDigits: 2 });

export function BatchForm({ products }: { products: BatchProduct[] }) {
  const [state, action] = useActionState(recordBatchAction, undefined);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState<Record<string, string>>({});
  const [batches, setBatches] = useState("1");
  // Clear the numbers after a save so the same batch isn't saved twice by accident.
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state?.ok) {
      setQty({});
      setBatches("1");
    }
  }
  const product = products.find((p) => p.id === productId);
  const ml = product?.sizes.reduce((t, s) => t + (Number(qty[s.variantId]) || 0) * s.sizeMl, 0) ?? 0;

  if (!products.length) return <p className="text-sm text-muted">No products for sale yet.</p>;

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="label">Product</span>
        <select
          name="productId"
          className="input"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setQty({});
          }}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name.replace(/^JonWin\s+/, "")}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Batches cooked</span>
        <input
          name="batches"
          inputMode="numeric"
          pattern="\d*"
          className="input w-24"
          value={batches}
          onChange={(e) => setBatches(e.target.value.replace(/\D/g, "").slice(0, 2))}
          required
        />
      </label>
      {product && (
        <div className="rounded-xl bg-surface px-3 py-2 text-sm">
          {product.recipe.length ? (
            <>
              <p className="font-medium">This takes from the store:</p>
              <ul className="mt-1 space-y-0.5 text-muted">
                {product.recipe.map((r) => (
                  <li key={r.name}>
                    {r.name}: <b className="text-ink">{fmt(r.amount * (Number(batches) || 1))}</b> {r.unit}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted">No recipe set for this product yet, so no chemicals will be taken off.</p>
          )}
        </div>
      )}
      <fieldset>
        <legend className="label">Bottles filled</legend>
        <div className="grid grid-cols-2 gap-2">
          {product?.sizes.map((s) => (
            <label key={s.variantId} className="block">
              <span className="text-sm text-muted">{sizeLabel(s.sizeMl)}</span>
              <input
                name={`qty:${s.variantId}`}
                inputMode="numeric"
                pattern="\d*"
                className="input"
                placeholder={s.suggest > 0 ? `need ${s.suggest}` : "0"}
                value={qty[s.variantId] ?? ""}
                onChange={(e) => setQty({ ...qty, [s.variantId]: e.target.value.replace(/\D/g, "") })}
              />
            </label>
          ))}
        </div>
      </fieldset>
      {ml > 0 && product && (
        <p className="text-sm text-muted">
          {(ml / 1000).toLocaleString("en-KE")} L in total
          {product.batchSizeMl > 0 && ml > product.batchSizeMl * 1.05 && (
            <span className="text-amber-700"> · more than one {product.batchSizeMl / 1000} L batch. Check the numbers.</span>
          )}
        </p>
      )}
      <input className="input" name="note" maxLength={200} placeholder="Note (optional), e.g. new perfume" />
      <FormMessage state={state} />
      <SubmitButton>Save batch</SubmitButton>
    </form>
  );
}
