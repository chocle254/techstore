"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { sizeLabel } from "@/lib/format";
import { addSizeAction, saveProductAction, updateVariantAction } from "./actions";

export function VariantRow({
  v,
  canEdit,
}: {
  v: { variantId: string; sizeMl: number; price: number; cost: number; lowStockAt: number; isActive: boolean; onHand: number };
  canEdit: boolean;
}) {
  const [state, action] = useActionState(updateVariantAction, undefined);
  const margin = v.price - v.cost;
  if (!canEdit) {
    return (
      <tr>
        <td className="font-semibold">{sizeLabel(v.sizeMl)}</td>
        <td>{v.price || "—"}</td>
        <td>{v.onHand}</td>
      </tr>
    );
  }
  return (
    <tr>
      <td colSpan={5} className="px-0">
        <form action={action} className="grid grid-cols-[3.5rem_1fr_1fr_1fr] items-end gap-2 sm:grid-cols-[4rem_1fr_1fr_1fr_auto_auto]">
          <input type="hidden" name="variantId" value={v.variantId} />
          <div className="pb-2.5">
            <p className="font-semibold">{sizeLabel(v.sizeMl)}</p>
            <p className="text-xs text-muted">{v.onHand} left</p>
          </div>
          <label className="text-xs text-muted">
            Sell price
            <input className="input mt-0.5" name="price" inputMode="numeric" pattern="\d+" defaultValue={v.price} required />
          </label>
          <label className="text-xs text-muted">
            Cost
            <input className="input mt-0.5" name="cost" inputMode="numeric" pattern="\d+" defaultValue={v.cost} required />
          </label>
          <label className="text-xs text-muted">
            Alert at
            <input className="input mt-0.5" name="lowStockAt" inputMode="numeric" pattern="\d+" defaultValue={v.lowStockAt} required />
          </label>
          <label className="col-span-2 flex items-center gap-2 pb-2.5 text-sm sm:col-span-1">
            <input type="checkbox" name="isActive" defaultChecked={v.isActive} className="size-5" /> On sale
          </label>
          <div className="col-span-2 sm:col-span-1">
            <SubmitButton className="btn-secondary w-full" pendingText="…">
              Save
            </SubmitButton>
          </div>
          <p className="col-span-full -mt-1 text-xs text-muted">
            Profit per bottle: <span className={margin < 0 ? "text-red-700" : ""}>KSh {margin}</span>
            {state && <span className={state.error ? "ml-2 text-red-700" : "ml-2 text-brand-700"}>{state.error ?? state.ok}</span>}
          </p>
        </form>
      </td>
    </tr>
  );
}

export function ProductForm({
  product,
}: {
  product?: { id: string; name: string; description: string; batchSizeMl: number; isActive: boolean };
}) {
  const [state, action] = useActionState(saveProductAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="productId" value={product?.id ?? ""} />
      <input className="input" name="name" defaultValue={product?.name} placeholder="Product name" required maxLength={60} />
      <textarea className="input" name="description" defaultValue={product?.description} placeholder="Short description for the shop" rows={2} maxLength={500} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Batch size
          <input className="input w-20" name="batchLitres" inputMode="decimal" defaultValue={(product?.batchSizeMl ?? 25000) / 1000} /> litres
        </label>
        {product && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={product.isActive} className="size-5" /> On sale
          </label>
        )}
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary">{product ? "Save product" : "Add product"}</SubmitButton>
    </form>
  );
}

const SIZE_OPTIONS = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 10000, 20000];

export function AddSizeForm({ productId, existing }: { productId: string; existing: number[] }) {
  const [state, action] = useActionState(addSizeAction, undefined);
  const options = SIZE_OPTIONS.filter((s) => !existing.includes(s));
  if (!options.length) return null;
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      <select name="sizeMl" className="input w-auto" aria-label="New size">
        {options.map((s) => (
          <option key={s} value={s}>
            {sizeLabel(s)}
          </option>
        ))}
      </select>
      <SubmitButton className="btn-secondary" pendingText="…">
        + Add size
      </SubmitButton>
      {state && <span className={`text-sm ${state.error ? "text-red-700" : "text-brand-700"}`}>{state.error ?? state.ok}</span>}
    </form>
  );
}
