"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { addChemicalAction, chemicalStockAction, renameChemicalAction, setRecipeAction } from "./actions";

const Msg = ({ state }: { state?: { error?: string; ok?: string } }) =>
  state ? <span className={`text-sm ${state.error ? "text-red-700" : "text-brand-700"}`}>{state.error ?? state.ok}</span> : null;

export function AddChemicalForm() {
  const [state, action] = useActionState(addChemicalAction, undefined);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_10rem_7rem_auto] sm:items-end">
      <label className="block">
        <span className="label">Name</span>
        <input className="input" name="name" required maxLength={60} placeholder="e.g. Glycerin" />
      </label>
      <label className="block">
        <span className="label">Comes as</span>
        <input className="input" name="unit" required maxLength={30} placeholder="e.g. packet" />
      </label>
      <label className="block">
        <span className="label">Have now</span>
        <input className="input" name="have" inputMode="decimal" placeholder="0" />
      </label>
      <SubmitButton className="btn-primary" pendingText="…">
        Add
      </SubmitButton>
      <div className="sm:col-span-4">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

/** "Bought 3" adds to the store; "Counted 5" sets it to what's really there. */
export function StockForm({ chemicalId, unit }: { chemicalId: string; unit: string }) {
  const [state, action] = useActionState(chemicalStockAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="chemicalId" value={chemicalId} />
      <input className="input w-24" name="qty" inputMode="decimal" required placeholder="0" aria-label={`How many (${unit})`} />
      <button type="submit" name="mode" value="bought" className="btn-primary">
        + Bought
      </button>
      <button type="submit" name="mode" value="count" className="btn-secondary">
        Counted
      </button>
      <Msg state={state} />
    </form>
  );
}

export function EditChemicalForm({ c }: { c: { id: string; name: string; unit: string; isActive: boolean } }) {
  const [state, action] = useActionState(renameChemicalAction, undefined);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_9rem_auto_auto] sm:items-center">
      <input type="hidden" name="chemicalId" value={c.id} />
      <input className="input" name="name" defaultValue={c.name} required maxLength={60} aria-label="Name" />
      <input className="input" name="unit" defaultValue={c.unit} required maxLength={30} aria-label="Comes as" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={c.isActive} className="size-5" /> In use
      </label>
      <SubmitButton className="btn-secondary" pendingText="…">
        Save
      </SubmitButton>
      <div className="sm:col-span-4">
        <Msg state={state} />
      </div>
    </form>
  );
}

/** One line of a recipe: how much of this chemical one batch uses. 0 removes it. */
export function RecipeRow({ productId, chemicalId, name, unit, amount }: { productId: string; chemicalId: string; name: string; unit: string; amount: number }) {
  const [state, action] = useActionState(setRecipeAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2 py-1.5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="chemicalId" value={chemicalId} />
      <span className="min-w-0 flex-1 text-sm font-medium">{name}</span>
      <input className="input w-20" name="amount" inputMode="decimal" defaultValue={amount || ""} placeholder="0" aria-label={`${name} per batch`} />
      <span className="w-28 text-sm text-muted">{unit}</span>
      <SubmitButton className="btn-secondary" pendingText="…">
        Save
      </SubmitButton>
      <Msg state={state} />
    </form>
  );
}
