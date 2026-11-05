"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/form";
import { ROLE_LABELS } from "@/lib/format";
import {
  createStaffAction,
  resetPasswordForAction,
  setRolesAction,
  suspendAction,
  type TempPasswordState,
} from "./actions";

const STAFF_ROLES = ["boss", "helper", "cook", "rider"] as const;

function TempPassword({ state }: { state: TempPasswordState }) {
  if (!state?.tempPassword) return <FormMessage state={state} />;
  return (
    <div className="rounded-xl bg-brand-50 p-3 text-sm text-brand-900" role="status">
      <p>
        Temporary password for <b>{state.forName}</b>:
      </p>
      <p className="my-1 font-mono text-lg font-bold tracking-wider select-all">{state.tempPassword}</p>
      <p className="text-xs">Give it to them in person or by phone. It&apos;s shown only once, and they must change it when they log in.</p>
    </div>
  );
}

export function CreateStaffForm() {
  const [state, action] = useActionState(createStaffAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <input className="input" name="name" placeholder="Full name" required maxLength={80} />
      <input className="input" name="phone" placeholder="Phone 07…" inputMode="tel" required maxLength={20} />
      <input className="input" name="email" type="email" placeholder="Email (optional, for password resets)" maxLength={120} />
      <fieldset className="flex flex-wrap gap-3">
        <legend className="label">Roles</legend>
        {STAFF_ROLES.map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="roles" value={r} className="size-5" defaultChecked={r === "helper"} /> {ROLE_LABELS[r]}
          </label>
        ))}
      </fieldset>
      <TempPassword state={state} />
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}

export function RolesForm({ userId, roles }: { userId: string; roles: string[] }) {
  const [state, action] = useActionState(setRolesAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="userId" value={userId} />
      {STAFF_ROLES.map((r) => (
        <label key={r} className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="roles" value={r} defaultChecked={roles.includes(r)} className="size-5" /> {ROLE_LABELS[r]}
        </label>
      ))}
      <SubmitButton className="btn-secondary min-h-9 px-3 py-1 text-sm" pendingText="…">
        Save roles
      </SubmitButton>
      {state && <span className={`text-sm ${state.error ? "text-red-700" : "text-brand-700"}`}>{state.error ?? state.ok}</span>}
    </form>
  );
}

export function AccountControls({ userId, suspended, hasPassword }: { userId: string; suspended: boolean; hasPassword: boolean }) {
  const [suspendState, suspend] = useActionState(suspendAction, undefined);
  const [resetState, reset] = useActionState(resetPasswordForAction, undefined);
  const [asking, setAsking] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={reset}>
          <input type="hidden" name="userId" value={userId} />
          <SubmitButton className="btn-secondary min-h-9 px-3 py-1 text-sm" pendingText="…">
            {hasPassword ? "Reset password" : "Give login"}
          </SubmitButton>
        </form>
        {suspended ? (
          <form action={suspend}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="suspend" value="0" />
            <SubmitButton className="btn-secondary min-h-9 px-3 py-1 text-sm" pendingText="…">
              Unsuspend
            </SubmitButton>
          </form>
        ) : (
          !asking && (
            <button type="button" className="btn-secondary min-h-9 px-3 py-1 text-sm text-red-700" onClick={() => setAsking(true)}>
              Suspend
            </button>
          )
        )}
      </div>
      {asking && !suspended && (
        <form action={suspend} className="flex gap-2">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="suspend" value="1" />
          <input className="input flex-1" name="reason" placeholder="Reason" required minLength={3} maxLength={200} />
          <SubmitButton className="btn-danger" pendingText="…">
            Suspend
          </SubmitButton>
        </form>
      )}
      <FormMessage state={suspendState} />
      <TempPassword state={resetState} />
    </div>
  );
}
