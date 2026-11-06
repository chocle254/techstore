"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { saveAreaAction } from "./actions";

type Area = { id: string; name: string; fee: number; isActive: boolean };

export function AreaForm({ area }: { area?: Area }) {
  const [state, action] = useActionState(saveAreaAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={area?.id ?? ""} />
      <label className="min-w-40 flex-[2]">
        <span className="label">Area name</span>
        <input name="name" required maxLength={60} defaultValue={area?.name ?? ""} className="input" placeholder="e.g. Kitengela" />
      </label>
      <label className="w-28 flex-1">
        <span className="label">Fee (KSh)</span>
        <input name="fee" type="number" min={0} step={1} required defaultValue={area?.fee ?? 0} className="input" inputMode="numeric" />
      </label>
      {area && (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={area.isActive} className="h-5 w-5" /> Active
        </label>
      )}
      <SubmitButton className="btn-primary" pendingText="Saving…">
        {area ? "Save" : "Add area"}
      </SubmitButton>
      <div className="w-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
