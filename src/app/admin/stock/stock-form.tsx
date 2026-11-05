"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { sizeLabel } from "@/lib/format";
import { stockChangeAction } from "./actions";

export function StockForm({ options }: { options: { variantId: string; product: string; sizeMl: number }[] }) {
  const [state, action] = useActionState(stockChangeAction, undefined);
  const [kind, setKind] = useState<"restock" | "adjustment">("restock");
  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type">
        {(
          [
            ["restock", "➕ New bottles"],
            ["adjustment", "✏️ Correction"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-xl border px-2 py-3 text-sm font-semibold ${kind === k ? "border-brand-600 bg-brand-50" : "border-line"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />
      <select name="variantId" className="input" required aria-label="Product and size">
        {options.map((o) => (
          <option key={o.variantId} value={o.variantId}>
            {o.product.replace(/^JonWin\s+/, "")} {sizeLabel(o.sizeMl)}
          </option>
        ))}
      </select>
      <input
        className="input"
        name="qty"
        inputMode="numeric"
        pattern={kind === "restock" ? "\\d+" : "-?\\d+"}
        placeholder={kind === "restock" ? "How many bottles filled" : "e.g. -2 for 2 broken, 3 if you found 3"}
        required
      />
      <input className="input" name="note" placeholder={kind === "restock" ? "Note (optional)" : "Reason (required)"} maxLength={200} required={kind === "adjustment"} />
      <FormMessage state={state} />
      <SubmitButton>Save</SubmitButton>
    </form>
  );
}
