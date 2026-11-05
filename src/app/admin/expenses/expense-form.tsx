"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { EXPENSE_LABELS } from "@/lib/format";
import { addExpenseAction } from "./actions";

export function ExpenseForm({ today }: { today: string }) {
  const [state, action] = useActionState(addExpenseAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <select name="category" className="input" aria-label="Category" defaultValue="transport">
        {Object.entries(EXPENSE_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input className="input" name="amount" inputMode="numeric" pattern="\d+" placeholder="Amount (KSh)" required />
        <input className="input" name="spentOn" type="date" defaultValue={today} max={today} required aria-label="Date" />
      </div>
      <input className="input" name="note" placeholder="What for? (optional)" maxLength={200} />
      <FormMessage state={state} />
      <SubmitButton>Save expense</SubmitButton>
    </form>
  );
}
