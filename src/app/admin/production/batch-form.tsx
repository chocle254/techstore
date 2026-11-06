"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { sizeLabel } from "@/lib/format";
import { recordBatchAction } from "./actions";

export type BatchProduct = { id: string; name: string; batchSizeMl: number; sizes: { variantId: string; sizeMl: number; suggest: number }[] };

export function BatchForm({ products }: { products: BatchProduct[] }) {
  const [state, action] = useActionState(recordBatchAction, undefined);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState<Record<string, string>>({});
  // Clear the numbers after a save so the same batch isn't saved twice by accident.
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state?.ok) setQty({});
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
